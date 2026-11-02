import type { MailMessage } from './channels'

export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

export interface MailContent {
  title: string
  /** Display name for the greeting */
  name: string
  /** Paragraphs of the message (plain text, escaped for HTML) */
  body: string[]
  /** Button; the link is repeated as text */
  cta?: { label: string; url: string }
  /** Small print below the message */
  footer: string
}

/** Plain text and simple HTML in the house style for every e-mail the server sends */
export function renderMail(c: MailContent): Omit<MailMessage, 'to'> {
  const paragraphs = c.body.map((p) => `<p>${escapeHtml(p)}</p>`).join('\n')
  const button = c.cta
    ? `<p style="margin:24px 0"><a href="${escapeHtml(c.cta.url)}" style="background:#f59e0b;color:#1c1917;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${escapeHtml(c.cta.label)}</a></p>
<p style="font-size:12px;color:#78716c">Falls der Knopf nicht geht, öffne diesen Link: ${escapeHtml(c.cta.url)}</p>`
    : ''
  return {
    subject: c.title,
    text: `Hallo ${c.name},\n\n${c.body.join('\n\n')}\n${c.cta ? `\n${c.cta.label}: ${c.cta.url}\n` : ''}\n-- \nDominion of Steam\n${c.footer}\n`,
    html: `<!doctype html><html lang="de"><body style="font-family:Arial,sans-serif;background:#f5f5f4;color:#1c1917;padding:24px">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #d6d3d1;border-radius:8px;padding:24px">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#0f766e">Dominion of Steam</p>
<h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(c.title)}</h1>
<p>Hallo ${escapeHtml(c.name)},</p>
${paragraphs}
${button}
<p style="font-size:12px;color:#78716c">${escapeHtml(c.footer)}</p>
</div></body></html>`,
  }
}
