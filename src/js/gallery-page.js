import { initSite, esc, qs, pageHero } from "./site.js";
import { getContent, L, fmtDay } from "./shared.js";

const app = document.getElementById('app');
const albums = () => getContent('gallery').filter(a => a.published !== false && a.photos?.length).sort((a, b) => b.date.localeCompare(a.date));

const AM = {
  'gl.title': 'የፎቶ ማዕከል', 'gl.lead': 'ከቢሮው የመስክ ጉብኝቶች፣ ምረቃዎችና የማኅበረሰብ ውይይቶች የተወሰዱ ፎቶዎች።',
  'gl.photos': 'ፎቶዎች', 'gl.none': 'እስካሁን ምንም አልበም የለም።', 'gl.back': 'ወደ ሁሉም አልበሞች', 'gl.notFound': 'አልበሙ አልተገኘም', 'gl.view': 'አልበሙን ይመልከቱ'
};
const EN = {
  'gl.title': 'Photo gallery', 'gl.lead': 'Photos from the Bureau\'s field visits, inaugurations and community consultations.',
  'gl.photos': 'photos', 'gl.none': 'No albums yet.', 'gl.back': 'All albums', 'gl.notFound': 'Album not found', 'gl.view': 'View album'
};
const site = initSite({ active: 'gallery.html', am: AM, en: EN, onLang: render });
const t = k => site.t(k);

function renderAlbums() {
  const lang = site.lang, list = albums();
  document.title = `${t('gl.title')} · SETRB`;
  app.innerHTML = pageHero(t, t('gl.title'), t('gl.lead'), `<span aria-current="page">${esc(t('nav.gallery'))}</span>`) + `
    <section class="page-body"><div class="container"><div class="album-grid">${list.map(a => `
      <a class="album" href="gallery.html?album=${encodeURIComponent(a.id)}">
        <div class="album-cover"><img src="${esc(a.cover || a.photos[0].src)}" alt="" loading="lazy">
          <span class="album-count"><svg><use href="#i-cam"/></svg>${a.photos.length} ${esc(t('gl.photos'))}</span></div>
        <div class="album-body"><span class="news-date"><svg><use href="#i-cal"/></svg>${esc(fmtDay(a.date))}</span>
          <h3>${esc(L(a.title, lang))}</h3><p>${esc(L(a.description, lang))}</p>
          <span class="read-more">${esc(t('gl.view'))}<svg><use href="#i-arrow"/></svg></span></div>
      </a>`).join('') || `<div class="empty-state">${esc(t('gl.none'))}</div>`}</div></div></section>`;
}

function renderAlbum(id) {
  const lang = site.lang, a = albums().find(x => x.id === id);
  if (!a) {
    app.innerHTML = pageHero(t, t('gl.notFound'), '', `<a href="gallery.html">${esc(t('nav.gallery'))}</a>`) +
      `<section class="page-body"><div class="container"><a class="btn btn-primary" href="gallery.html">${esc(t('gl.back'))}</a></div></section>`;
    return;
  }
  document.title = `${L(a.title, lang)} · SETRB`;
  app.innerHTML = pageHero(t, L(a.title, lang), L(a.description, lang), `<a href="gallery.html">${esc(t('nav.gallery'))}</a><span>/</span><span aria-current="page">${esc(L(a.title, lang))}</span>`) + `
    <section class="page-body"><div class="container">
      <a class="back-btn" href="gallery.html"><svg><use href="#i-back"/></svg>${esc(t('gl.back'))}</a>
      <div class="photo-grid">${a.photos.map((p, i) => `
        <button class="photo-tile" data-i="${i}" aria-label="${esc(L(p.caption, lang) || 'Photo ' + (i + 1))}">
          <img src="${esc(p.src)}" alt="${esc(L(p.caption, lang))}" loading="lazy">${L(p.caption, lang) ? `<span>${esc(L(p.caption, lang))}</span>` : ''}
        </button>`).join('')}</div>
    </div></section>`;
  app.querySelector('.photo-grid').addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) openLightbox(a, +b.dataset.i); });
}

/* ---------------- lightbox ---------------- */
let lb = null;
function openLightbox(album, start) {
  const lang = site.lang;
  let i = start;
  lb = document.createElement('div');
  lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
  lb.innerHTML = `<button class="lb-close" aria-label="Close">×</button>
    <button class="lb-nav prev" aria-label="Previous">‹</button>
    <figure><img alt=""><figcaption></figcaption></figure>
    <button class="lb-nav next" aria-label="Next">›</button>`;
  document.body.appendChild(lb); document.body.style.overflow = 'hidden';
  const img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
  const show = () => {
    const p = album.photos[i];
    img.src = p.src; img.alt = L(p.caption, lang);
    cap.textContent = `${i + 1} / ${album.photos.length}${L(p.caption, lang) ? ' · ' + L(p.caption, lang) : ''}`;
  };
  const go = d => { i = (i + d + album.photos.length) % album.photos.length; show(); };
  const close = () => { lb.remove(); lb = null; document.body.style.overflow = ''; removeEventListener('keydown', key); };
  const key = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.prev').addEventListener('click', () => go(-1));
  lb.querySelector('.next').addEventListener('click', () => go(1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  let x0 = null;
  lb.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); x0 = null; });
  addEventListener('keydown', key);
  show(); lb.querySelector('.lb-close').focus();
}

function render() { const id = qs('album'); id ? renderAlbum(id) : renderAlbums(); }
site.apply();
