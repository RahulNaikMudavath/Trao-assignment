import * as cheerio from 'cheerio';

export function cleanHtml(html, url, maxChars = 6000) {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $(
    'script, style, noscript, svg, iframe, nav, footer, header, form, button, input, select, textarea, [aria-hidden="true"]'
  ).remove();

  const title = $('title').text().trim() || '';
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    '';

  // Prefer main content container if present
  let mainText = '';
  const mainContainers = ['main', 'article', '#content', '.content', '.main', '.job-description', '.careers-body'];
  for (const selector of mainContainers) {
    if ($(selector).length > 0) {
      mainText = $(selector).text();
      break;
    }
  }

  // Fallback to body
  if (!mainText || mainText.trim().length < 100) {
    mainText = $('body').text() || '';
  }

  // Clean whitespace
  const cleanedText = mainText
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Truncate to maximum characters
  const truncated = cleanedText.length > maxChars ? cleanedText.slice(0, maxChars) + '... [truncated]' : cleanedText;

  return {
    url,
    title,
    metaDescription,
    content: truncated,
    charCount: truncated.length,
  };
}
