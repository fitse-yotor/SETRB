import { initSite, esc, qs } from "./site.js";
import { getContent, L, fmtDay } from "./shared.js";

const page = document.body.dataset.page;
const app = document.getElementById('app');
const all = () => getContent('news').filter(n => n.published !== false).sort((a, b) => b.date.localeCompare(a.date));
const arrow = '<svg><use href="#i-arrow"/></svg>';
const cal = '<svg><use href="#i-cal"/></svg>';

const AM = {
  'nw.title': 'ዜናዎችና መረጃዎች', 'nw.lead': 'ከቢሮው የተገኙ ወቅታዊ ዜናዎች፣ የፕሮጀክት ሂደቶችና ማስታወቂያዎች።',
  'nw.all': 'ሁሉም', 'nw.search': 'ዜና ይፈልጉ…', 'nw.none': 'ምንም ዜና አልተገኘም።', 'nw.latest': 'ሌሎች ዜናዎች',
  'nw.share': 'ያጋሩ', 'nw.copied': 'ማስፈንጠሪያው ተቀድቷል', 'nw.notFound': 'ዜናው አልተገኘም', 'nw.notFoundText': 'የፈለጉት ዜና ተሰርዟል ወይም አልተገኘም።', 'nw.allNews': 'ሁሉንም ዜናዎች ይመልከቱ'
};
const EN = {
  'nw.title': 'News & updates', 'nw.lead': 'The latest news, project updates and announcements from the Bureau.',
  'nw.all': 'All', 'nw.search': 'Search news…', 'nw.none': 'No news found.', 'nw.latest': 'More news',
  'nw.share': 'Share', 'nw.copied': 'Link copied', 'nw.notFound': 'News not found', 'nw.notFoundText': 'The article you are looking for was removed or does not exist.', 'nw.allNews': 'View all news'
};

let cat = 'all', q = '';
const site = initSite({ active: 'news.html', am: AM, en: EN, onLang: render });
const t = k => site.t(k);

function hero(title, lead, crumbs) {
  return `<section class="page-hero"><div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">${esc(t('crumb.home'))}</a><span>/</span>${crumbs}</nav>
    <h1>${esc(title)}</h1>${lead ? `<p>${esc(lead)}</p>` : ''}</div></section>`;
}

function renderList() {
  const lang = site.lang, items = all();
  const cats = [...new Map(items.map(n => [n.cat.en, n.cat])).values()];
  const ql = q.toLowerCase();
  const list = items.filter(n => (cat === 'all' || n.cat.en === cat) &&
    (!ql || [L(n.title, lang), L(n.summary, lang), n.title.en].join(' ').toLowerCase().includes(ql)));
  document.title = `${t('nw.title')} · SETRB`;
  app.innerHTML = hero(t('nw.title'), t('nw.lead'), `<span aria-current="page">${esc(t('nav.news'))}</span>`) + `
    <section class="page-body"><div class="container">
      <div class="toolbar">
        <div class="chips" id="cats"><button class="${cat === 'all' ? 'active' : ''}" data-cat="all">${esc(t('nw.all'))}</button>${cats.map(c =>
          `<button class="${cat === c.en ? 'active' : ''}" data-cat="${esc(c.en)}">${esc(L(c, lang))}</button>`).join('')}</div>
        <label class="search"><svg><use href="#i-search"/></svg><input id="q" type="search" value="${esc(q)}" placeholder="${esc(t('nw.search'))}"></label>
      </div>
      <div class="news-cards">${list.map(n => `
        <a class="n-card" href="news-detail.html?id=${encodeURIComponent(n.id)}">
          <div class="img"><img src="${esc(n.img)}" alt="" loading="lazy"></div>
          <div class="b">
            <div class="row"><span class="tag ${esc(n.tag)}">${esc(L(n.cat, lang))}</span><span class="news-date">${cal}${esc(fmtDay(n.date))}</span></div>
            <h3>${esc(L(n.title, lang))}</h3>
            <p>${esc(L(n.summary, lang))}</p>
            <span class="read-more">${esc(t('common.readMore'))}${arrow}</span>
          </div>
        </a>`).join('') || `<div class="empty-state">${esc(t('nw.none'))}</div>`}</div>
    </div></section>`;
  app.querySelector('#cats').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { cat = b.dataset.cat; renderList(); } });
  const inp = app.querySelector('#q');
  inp.addEventListener('input', () => { q = inp.value; const pos = inp.selectionStart; renderList(); const n = app.querySelector('#q'); n.focus(); n.setSelectionRange(pos, pos); });
}

function renderDetail() {
  const lang = site.lang, id = qs('id'), items = all(), n = items.find(x => x.id === id);
  if (!n) {
    app.innerHTML = hero(t('nw.notFound'), t('nw.notFoundText'), `<a href="news.html">${esc(t('nav.news'))}</a>`) +
      `<section class="page-body"><div class="container"><a class="btn btn-primary" href="news.html">${esc(t('nw.allNews'))}</a></div></section>`;
    return;
  }
  const title = L(n.title, lang);
  document.title = `${title} · SETRB`;
  const url = location.href;
  const body = L(n.body, lang).split(/\n\s*\n/).map(p => `<p>${esc(p.trim())}</p>`).join('');
  const others = items.filter(x => x.id !== n.id).slice(0, 4);
  app.innerHTML = hero(title, '', `<a href="news.html">${esc(t('nav.news'))}</a><span>/</span><span aria-current="page">${esc(L(n.cat, lang))}</span>`) + `
    <section class="page-body"><div class="container">
      <a class="back-btn" href="news.html"><svg><use href="#i-back"/></svg>${esc(t('nw.allNews'))}</a>
      <div class="article-wrap">
        <article class="article">
          <div class="cover"><img src="${esc(n.img)}" alt=""></div>
          <div class="content">
            <div class="meta"><span class="tag ${esc(n.tag)}">${esc(L(n.cat, lang))}</span><span class="news-date">${cal}${esc(fmtDay(n.date))}</span></div>
            <p class="lead">${esc(L(n.summary, lang))}</p>
            <div class="text">${body}</div>
            <div class="share">${esc(t('nw.share'))}:
              <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="Facebook"><svg><use href="#i-fb"/></svg></a>
              <a href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}" target="_blank" rel="noopener" aria-label="Telegram"><svg><use href="#i-tg"/></svg></a>
              <button type="button" id="copyLink" aria-label="Copy link"><svg><use href="#i-link"/></svg></button>
              <span id="copied" style="display:none;color:var(--green)">${esc(t('nw.copied'))}</span>
            </div>
          </div>
        </article>
        <aside class="side-box"><h4>${esc(t('nw.latest'))}</h4>${others.map(o => `
          <a class="side-news" href="news-detail.html?id=${encodeURIComponent(o.id)}"><img src="${esc(o.img)}" alt="" loading="lazy">
            <div><b>${esc(L(o.title, lang))}</b><small>${esc(fmtDay(o.date))}</small></div></a>`).join('')}
          <a class="read-more" href="news.html" style="margin-top:12px">${esc(t('nw.allNews'))}${arrow}</a>
        </aside>
      </div>
    </div></section>`;
  app.querySelector('#copyLink').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(url); } catch (e) {}
    app.querySelector('#copied').style.display = 'inline';
  });
}

function render() { page === 'news-detail' ? renderDetail() : renderList(); }
site.apply();
