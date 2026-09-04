/**
 * Converts Azure DevOps HTML formatted Acceptance Criteria, descriptions,
 * and test steps into clean, readable Markdown/plain text.
 */
export function htmlToText(html: string = ''): string {
  if (!html) return '';

  let text = html;

  // Unescape common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Headers
  text = text.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n### $1\n\n');

  // Paragraphs and divisions
  text = text.replace(/<p[^>]*>/gi, '\n\n').replace(/<\/p>/gi, '');
  text = text.replace(/<div[^>]*>/gi, '\n').replace(/<\/div>/gi, '');

  // Line breaks
  text = text.replace(/<br\s*[\/]?>/gi, '\n');

  // Lists
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n* $1');
  text = text.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');

  // Bold and Italics
  text = text.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '**$2**');
  text = text.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '*$2*');

  // Code snippets
  text = text.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '\n```\n$1\n```\n');
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // Links
  text = text.replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Normalize consecutive spaces and newlines
  text = text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}
