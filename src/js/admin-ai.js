/* AI summary client: calls the backend (server/index.js), which calls the Claude API. */

export async function requestSummary(kind, data, lang = 'en') {
  let res;
  try {
    res = await fetch('/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, data, lang })
    });
  } catch (e) {
    throw new Error('Cannot reach the backend. Start it with "npm run server".');
  }
  let body = {};
  try { body = await res.json(); } catch (e) {
    throw new Error(res.status === 404 ? 'The AI backend is not running. Start it with "npm run server".' : 'Unexpected response from the backend.');
  }
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Minimal, safe Markdown → HTML (headings, bullets, numbered lists, bold). Input is escaped first. */
export function mdToHtml(md) {
  const out = []; let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const inline = s => escape(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  for (const raw of String(md).split('\n')) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { close(); continue; }
    if ((m = line.match(/^#{1,4}\s+(.*)$/))) { close(); out.push(`<h5>${inline(m[1])}</h5>`); continue; }
    if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    close(); out.push(`<p>${inline(line)}</p>`);
  }
  close();
  return out.join('');
}
