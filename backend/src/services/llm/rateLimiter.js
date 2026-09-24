export class RateLimiter {
  constructor(minIntervalMs = 1200) {
    this.lastRequestTime = 0;
    this.minIntervalMs = minIntervalMs;
  }

  // Ensures minimum spacing between outgoing requests to avoid bursting RPM limits
  async waitBeforeNext() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      const waitTime = this.minIntervalMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  // Executes an async function with exponential backoff and jitter
  async executeWithRetry(operation, operationName = 'LLM operation', options = {}) {
    const maxRetries = options.maxRetries ?? 5;
    let delay = options.initialDelayMs ?? 2000;
    const maxDelay = options.maxDelayMs ?? 30000;
    const factor = options.backoffFactor ?? 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.waitBeforeNext();
        return await operation();
      } catch (err) {
        const isRateLimit =
          err?.status === 429 ||
          err?.statusCode === 429 ||
          err?.message?.includes('429') ||
          err?.message?.toLowerCase().includes('rate limit') ||
          err?.message?.toLowerCase().includes('quota exceeded') ||
          err?.message?.toLowerCase().includes('resource has been exhausted') ||
          err?.message?.toLowerCase().includes('slow down');

        const isTransient =
          isRateLimit ||
          err?.status >= 500 ||
          err?.code === 'ECONNRESET' ||
          err?.code === 'ETIMEDOUT';

        if (!isTransient || attempt === maxRetries) {
          console.error(`[RateLimiter] ${operationName} failed permanently on attempt ${attempt}:`, err?.message || err);
          throw err;
        }

        const jitter = Math.floor(Math.random() * 500);
        const sleepTime = Math.min(delay + jitter, maxDelay);

        console.warn(
          `[RateLimiter] ${operationName} hit rate limit / transient error on attempt ${attempt}/${maxRetries}. Backing off for ${sleepTime}ms... (Error: ${err?.message?.slice(0, 100)})`
        );

        await new Promise((resolve) => setTimeout(resolve, sleepTime));
        delay = Math.min(delay * factor, maxDelay);
      }
    }

    throw new Error(`[RateLimiter] ${operationName} failed after ${maxRetries} attempts.`);
  }
}

export const globalRateLimiter = new RateLimiter(1500);
