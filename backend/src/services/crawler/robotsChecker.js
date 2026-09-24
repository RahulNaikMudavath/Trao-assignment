import axios from 'axios';
import robotsParser from 'robots-parser';
import { config } from '../../config.js';

// Cache robots parser instances per origin
const robotsCache = new Map();

export async function isAllowedByRobots(targetUrl, userAgent = 'TraoInterviewPrepBot/1.0') {
  try {
    const parsed = new URL(targetUrl);
    const robotsUrl = `${parsed.origin}/robots.txt`;

    if (robotsCache.has(parsed.origin)) {
      const robots = robotsCache.get(parsed.origin);
      if (!robots) return true; // Cached as unavailable, assume allowed
      return robots.isAllowed(targetUrl, userAgent) ?? true;
    }

    try {
      const res = await axios.get(robotsUrl, {
        timeout: Math.min(config.crawlerTimeoutMs, 4000),
        headers: { 'User-Agent': userAgent },
        validateStatus: (status) => status === 200,
      });

      const robots = robotsParser(robotsUrl, res.data);
      robotsCache.set(parsed.origin, robots);
      return robots.isAllowed(targetUrl, userAgent) ?? true;
    } catch {
      // If 404 or failed to fetch robots.txt, default to allowed
      robotsCache.set(parsed.origin, null);
      return true;
    }
  } catch {
    return true;
  }
}
