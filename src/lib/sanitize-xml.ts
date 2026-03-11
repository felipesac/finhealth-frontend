/**
 * Sanitize XML content by stripping potentially dangerous patterns.
 * Defense-in-depth: React JSX auto-escapes text content, but this
 * ensures stored data is clean even if rendered unsafely later.
 */
export function sanitizeXml(xml: string): string {
  return xml
    // Remove script tags and content
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, '')
    // Remove event handler attributes
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:/gi, '')
    // Remove data: URLs in attributes
    .replace(/(href|src)\s*=\s*["']data:[^"']*["']/gi, '');
}
