import axios from 'axios';
import { validateUrl } from './ssrfValidator.js';
import { isAllowedByRobots } from './robotsChecker.js';
import { extractAndRankLinks } from './linkRanker.js';
import { cleanHtml } from './pageCleaner.js';
import { config } from '../../config.js';

export async function crawlCompanySite(companyUrl) {
  const result = {
    success: false,
    pages: [],
    pagesUsed: [],
    hiringInfoFound: false,
    notes: [],
  };

  // 1. SSRF and URL validation
  const validation = validateUrl(companyUrl);
  if (!validation.valid || !validation.url) {
    result.notes.push(`Invalid or disallowed URL: ${validation.error || companyUrl}`);
    result.error = validation.error;
    return result;
  }

  const normalizedBaseUrl = validation.url.origin + validation.url.pathname;

  // 2. Fetch homepage
  let homeHtml = '';
  try {
    const robotsAllowed = await isAllowedByRobots(normalizedBaseUrl);
    if (!robotsAllowed) {
      result.notes.push(`Robots.txt disallows crawling of ${normalizedBaseUrl}. Proceeding politely.`);
    }

    const res = await axios.get(normalizedBaseUrl, {
      timeout: config.crawlerTimeoutMs,
      maxContentLength: config.maxPageBytes,
      headers: {
        'User-Agent': 'TraoInterviewPrepBot/1.0 (Educational Assessment Bot)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      validateStatus: (status) => status < 400,
    });

    homeHtml = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    const cleanedHome = cleanHtml(homeHtml, normalizedBaseUrl);
    result.pages.push(cleanedHome);
    result.pagesUsed.push(normalizedBaseUrl);
    result.success = true;
  } catch (err) {
    const errorMsg = err.code === 'ECONNABORTED'
      ? `Request timed out after ${config.crawlerTimeoutMs}ms`
      : err.response?.status
      ? `HTTP ${err.response.status}: ${err.response.statusText || 'Error'}`
      : err.message || 'Unknown network error';

    result.notes.push(`Could not fetch main company URL (${companyUrl}): ${errorMsg}`);
    result.error = errorMsg;
    return result;
  }

  // 3. Dynamic Link Ranking
  const rankedLinks = extractAndRankLinks(homeHtml, normalizedBaseUrl);

  if (rankedLinks.length === 0) {
    result.notes.push('No relevant internal hiring or about links discovered on homepage.');
    return result;
  }

  const linksToCrawl = [];
  const topHiring = rankedLinks.find((l) => l.category === 'hiring');
  if (topHiring) {
    linksToCrawl.push(topHiring.url);
  }

  const topAbout = rankedLinks.find((l) => (l.category === 'about' || l.category === 'culture') && !linksToCrawl.includes(l.url));
  if (topAbout && linksToCrawl.length < config.maxCrawlPages - 1) {
    linksToCrawl.push(topAbout.url);
  }

  for (const link of rankedLinks) {
    if (linksToCrawl.length >= config.maxCrawlPages - 1) break;
    if (!linksToCrawl.includes(link.url) && link.score >= 50) {
      linksToCrawl.push(link.url);
    }
  }

  // 4. Crawl discovered candidate pages
  for (const pageUrl of linksToCrawl) {
    try {
      const robotsAllowed = await isAllowedByRobots(pageUrl);
      if (!robotsAllowed) {
        result.notes.push(`Skipping ${pageUrl} due to robots.txt restrictions.`);
        continue;
      }

      const res = await axios.get(pageUrl, {
        timeout: Math.min(config.crawlerTimeoutMs, 6000),
        maxContentLength: config.maxPageBytes,
        headers: {
          'User-Agent': 'TraoInterviewPrepBot/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
        validateStatus: (status) => status < 400,
      });

      const pageHtml = typeof res.data === 'string' ? res.data : '';
      const cleaned = cleanHtml(pageHtml, pageUrl);
      result.pages.push(cleaned);
      result.pagesUsed.push(pageUrl);

      const lower = cleaned.content.toLowerCase();
      if (
        lower.includes('interview') ||
        lower.includes('hiring') ||
        lower.includes('take-home') ||
        lower.includes('technical screen') ||
        lower.includes('system design')
      ) {
        result.hiringInfoFound = true;
      }
    } catch (err) {
      result.notes.push(`Discovered link ${pageUrl} could not be retrieved (${err.message}). Skipping.`);
    }
  }

  return result;
}
