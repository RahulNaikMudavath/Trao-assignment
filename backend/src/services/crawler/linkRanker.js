import * as cheerio from 'cheerio';

const HIRING_KEYWORDS = [
  'interview process', 'interview guide', 'how we hire', 'hiring process',
  'interview', 'interviewing', 'careers', 'career', 'jobs', 'job',
  'open positions', 'open roles', 'join us', 'join our team', 'work with us',
  'we are hiring', "we're hiring", 'vacancies', 'engineering blog', 'handbook'
];

const CULTURE_KEYWORDS = [
  'culture', 'values', 'life at', 'team', 'mission', 'about us', 'about',
  'who we are', 'our story', 'company'
];

const DISQUALIFIERS = [
  'login', 'signin', 'sign-in', 'sign-up', 'signup', 'register',
  'terms', 'privacy', 'policy', 'cookie', 'cookies', 'gdpr',
  'cart', 'checkout', 'pricing', 'support', 'help', 'docs',
  'documentation', 'status', 'api', 'feed', 'rss', 'mailto:',
  'tel:', 'javascript:', 'wp-content', 'wp-includes'
];

const FILE_EXTENSIONS_TO_IGNORE = [
  '.pdf', '.zip', '.tar', '.gz', '.png', '.jpg', '.jpeg', '.gif',
  '.svg', '.webp', '.mp4', '.mp3', '.css', '.js'
];

export function extractAndRankLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const seenUrls = new Set();
  const rankedLinks = [];

  $('a[href]').each((_, el) => {
    const rawHref = $(el).attr('href')?.trim();
    const linkText = $(el).text().trim().toLowerCase();

    if (!rawHref) return;

    // Skip empty, anchors, mailto, tel
    if (rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) {
      return;
    }

    let resolvedUrl;
    try {
      resolvedUrl = new URL(rawHref, baseUrl);
    } catch {
      return; // Malformed
    }

    // Must be HTTP/HTTPS
    if (resolvedUrl.protocol !== 'http:' && resolvedUrl.protocol !== 'https:') {
      return;
    }

    // Ensure link is on the same domain or relevant subdomain
    const isSameHost = resolvedUrl.hostname === base.hostname;
    const isSubdomain = resolvedUrl.hostname.endsWith(`.${base.hostname}`) || base.hostname.endsWith(`.${resolvedUrl.hostname}`);
    if (!isSameHost && !isSubdomain) {
      return;
    }

    // Remove hash and trailing slash for normalization
    resolvedUrl.hash = '';
    let normalizedUrl = resolvedUrl.toString();
    if (normalizedUrl.endsWith('/') && normalizedUrl.length > 8) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    if (normalizedUrl === baseUrl || seenUrls.has(normalizedUrl)) {
      return;
    }

    const pathAndQuery = (resolvedUrl.pathname + resolvedUrl.search).toLowerCase();

    // Check extensions
    if (FILE_EXTENSIONS_TO_IGNORE.some((ext) => pathAndQuery.endsWith(ext))) {
      return;
    }

    // Check disqualifiers
    if (DISQUALIFIERS.some((d) => pathAndQuery.includes(d) || linkText.includes(d))) {
      return;
    }

    let score = 0;
    let category = 'general';

    // 1. Scoring based on link text
    for (const kw of HIRING_KEYWORDS) {
      if (linkText.includes(kw)) {
        score += 80;
        category = 'hiring';
        break;
      }
    }

    for (const kw of CULTURE_KEYWORDS) {
      if (linkText.includes(kw)) {
        score += 45;
        if (category === 'general') category = 'culture';
        break;
      }
    }

    // 2. Scoring based on URL pathname
    if (pathAndQuery.includes('interview') || pathAndQuery.includes('hiring-process') || pathAndQuery.includes('how-we-hire')) {
      score += 100;
      category = 'hiring';
    } else if (pathAndQuery.includes('career') || pathAndQuery.includes('job') || pathAndQuery.includes('join')) {
      score += 70;
      category = 'hiring';
    } else if (pathAndQuery.includes('handbook') || pathAndQuery.includes('engineering')) {
      score += 50;
      category = 'hiring';
    } else if (pathAndQuery.includes('about') || pathAndQuery.includes('team') || pathAndQuery.includes('culture')) {
      score += 40;
      if (category === 'general') category = 'about';
    }

    if (score > 0) {
      seenUrls.add(normalizedUrl);
      rankedLinks.push({
        url: normalizedUrl,
        text: linkText || resolvedUrl.pathname,
        score,
        category,
      });
    }
  });

  // Sort descending by score
  rankedLinks.sort((a, b) => b.score - a.score);

  return rankedLinks;
}
