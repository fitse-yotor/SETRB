/* ------------------------------------------------------------------
   Shared layout for the inner public pages (news, tenders, vacancies,
   contact): icon sprite, header, footer and English / Amharic switch.
   ------------------------------------------------------------------ */
import "../css/style.css";
import { SPRITE } from "./icons.js";

export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const NAV = [
  ['index.html', 'nav.home', 'Home'], ['index.html#about', 'nav.about', 'About'], ['index.html#projects', 'nav.projects', 'Projects'],
  ['news.html', 'nav.news', 'News'], ['gallery.html', 'nav.gallery', 'Gallery'], ['tenders.html', 'nav.notices', 'Tenders'], ['vacancies.html', 'nav.vacancies', 'Vacancies'],
  ['contact.html', 'nav.contact', 'Contact']
];

const CHROME_AM = {
  'top.loc': 'ወላይታ ሶዶ፣ ደቡብ ኢትዮጵያ', 'top.hours': 'ሰኞ – አርብ · 2:30 – 11:30',
  'brand.name': 'ትራንስፖርትና መንገድ ልማት ቢሮ', 'brand.sub': 'የደቡብ ኢትዮጵያ ክልላዊ መንግሥት',
  'nav.home': 'መነሻ', 'nav.about': 'ስለ ቢሮው', 'nav.projects': 'ፕሮጀክቶች', 'nav.news': 'ዜናዎች', 'nav.notices': 'ጨረታዎች',
  'nav.vacancies': 'የሥራ ማስታወቂያ', 'nav.gallery': 'የፎቶ ማዕከል', 'nav.contact': 'ያግኙን', 'nav.report': 'ጥቆማ ያቅርቡ',
  'ft.text': 'ጥራት ባላቸው መንገዶችና አስተማማኝ ትራንስፖርት የተሳሰረች፣ ደህንነቷ የተጠበቀና የበለፀገች ደቡብ ኢትዮጵያን መገንባት።',
  'ft.quick': 'ፈጣን ማስፈንጠሪያዎች', 'ft.services': 'አገልግሎቶች', 'ft.partners': 'አጋሮች', 'ft.staff': 'የሠራተኞች መግቢያ',
  'ft.copy': 'የደቡብ ኢትዮጵያ ክልል ትራንስፖርትና መንገድ ልማት አስተዳደር ቢሮ። መብቱ በሕግ የተጠበቀ ነው።', 'ft.made': 'ወላይታ ሶዶ፣ ኢትዮጵያ',
  'crumb.home': 'መነሻ', 'common.back': 'ተመለስ', 'common.readMore': 'ተጨማሪ ያንብቡ', 'common.viewDetails': 'ዝርዝር ይመልከቱ'
};

function headerHTML(active) {
  return `
<div class="topbar"><div class="container">
  <div class="topbar-info">
    <span><svg><use href="#i-pin"/></svg><span data-i18n="top.loc">Wolaita Sodo, South Ethiopia</span></span>
    <span><svg><use href="#i-phone"/></svg>+251 46 000 0000</span>
    <span><svg><use href="#i-clock"/></svg><span data-i18n="top.hours">Mon – Fri · 8:30 – 5:30</span></span>
  </div>
  <div class="lang-switch" role="group" aria-label="Language"><button data-lang="am">አማ</button><button data-lang="en">EN</button></div>
</div></div>
<header class="header" id="header"><div class="container">
  <a href="index.html" class="brand"><img src="assets/img/logo.png" alt="Bureau emblem">
    <div class="brand-text"><strong data-i18n="brand.name">Transport & Road Development Bureau</strong><small data-i18n="brand.sub">South Ethiopia Regional State</small></div></a>
  <nav class="nav" id="nav">
    ${NAV.map(([href, key, label]) => `<a href="${href}" class="${href === active ? 'active' : ''}" data-i18n="${key}">${label}</a>`).join('')}
    <a href="index.html#report" class="btn btn-primary" data-i18n="nav.report">Report an Issue</a>
  </nav>
  <button class="menu-toggle" id="menuToggle" aria-label="Open menu"><span></span></button>
</div></header>`;
}

function footerHTML() {
  return `
<footer class="footer"><div class="container">
  <div class="footer-grid">
    <div>
      <a href="index.html" class="brand"><img src="assets/img/logo.png" alt=""><div class="brand-text"><strong data-i18n="brand.name">Transport & Road Development Bureau</strong><small>የደቡብ ኢትዮጵያ ክልል ትራንስፖርትና መንገድ ልማት አስተዳደር ቢሮ</small></div></a>
      <p data-i18n="ft.text">Building a connected, safe and prosperous South Ethiopia through quality roads and reliable transport.</p>
      <div class="socials">
        <a href="https://web.facebook.com/people/South-Ethiopia-Transport-and-Road-bureau/61562341683997/" target="_blank" rel="noopener" aria-label="Facebook"><svg><use href="#i-fb"/></svg></a>
        <a href="#" aria-label="Telegram"><svg><use href="#i-tg"/></svg></a>
        <a href="#" aria-label="YouTube"><svg><use href="#i-yt"/></svg></a>
      </div>
    </div>
    <div><h5 data-i18n="ft.quick">Quick Links</h5><ul>
      <li><a href="news.html" data-i18n="nav.news">News</a></li><li><a href="gallery.html" data-i18n="nav.gallery">Gallery</a></li><li><a href="tenders.html" data-i18n="nav.notices">Tenders</a></li>
      <li><a href="vacancies.html" data-i18n="nav.vacancies">Vacancies</a></li><li><a href="contact.html" data-i18n="nav.contact">Contact</a></li></ul></div>
    <div><h5 data-i18n="ft.services">Services</h5><ul>
      <li><a href="index.html#projects" data-i18n="nav.projects">Projects</a></li><li><a href="index.html#report" data-i18n="nav.report">Report an Issue</a></li>
      <li><a href="login.html" data-i18n="ft.staff">Staff login</a></li></ul></div>
    <div><h5 data-i18n="ft.partners">Partners</h5><ul><li>Ministry of Transport & Logistics</li><li>Ethiopian Roads Administration</li><li>Ethiopian Road Fund</li><li>South Ethiopia Regional State</li></ul></div>
  </div>
  <div class="footer-bottom"><span>© ${new Date().getFullYear()} <span data-i18n="ft.copy">South Ethiopia Regional State Transport & Road Development Bureau. All rights reserved.</span></span><span data-i18n="ft.made">Wolaita Sodo, Ethiopia</span></div>
</div><div class="flag-stripe"></div></footer>
<a href="#" class="to-top" id="toTop" aria-label="Back to top"><svg><use href="#i-up"/></svg></a>`;
}

/**
 * Build the page chrome and return translation helpers.
 * @param {{active:string, am:Object, en?:Object, onLang?:Function}} opts
 */
export function initSite({ active, am = {}, en = {}, onLang }) {
  document.body.insertAdjacentHTML('afterbegin', SPRITE + headerHTML(active));
  document.body.insertAdjacentHTML('beforeend', footerHTML());

  let lang = 'en';
  try { lang = localStorage.getItem('lang') || 'en'; } catch (e) {}
  const AM = { ...CHROME_AM, ...am };
  const EN = { 'crumb.home': 'Home', 'common.back': 'Back', 'common.readMore': 'Read more', 'common.viewDetails': 'View details', ...en };
  document.querySelectorAll('[data-i18n]').forEach(el => { EN[el.dataset.i18n] = EN[el.dataset.i18n] || el.textContent; });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { EN[el.dataset.i18nPh] = el.placeholder; });
  document.querySelectorAll('[data-i18n-opts]').forEach(el => { EN[el.dataset.i18nOpts] = [...el.options].map(o => o.text); });

  const api = {
    get lang() { return lang; },
    t: k => (lang === 'am' ? AM[k] : EN[k]) ?? EN[k] ?? k,
    apply() {
      document.documentElement.lang = lang;
      document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = api.t(el.dataset.i18n); });
      document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = api.t(el.dataset.i18nPh); });
      document.querySelectorAll('[data-i18n-opts]').forEach(el => { const o = api.t(el.dataset.i18nOpts); Array.isArray(o) && o.forEach((txt, i) => el.options[i] && (el.options[i].text = txt)); });
      document.querySelectorAll('.lang-switch button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
      onLang && onLang(lang);
    }
  };
  document.querySelectorAll('.lang-switch button').forEach(b => b.addEventListener('click', () => {
    lang = b.dataset.lang; try { localStorage.setItem('lang', lang); } catch (e) {}
    api.apply();
  }));

  const header = document.getElementById('header'), toTop = document.getElementById('toTop');
  const onScroll = () => { header.classList.toggle('scrolled', scrollY > 10); toTop.classList.toggle('show', scrollY > 600); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  toTop.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); });
  document.getElementById('menuToggle').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  return api;
}

export const qs = name => new URLSearchParams(location.search).get(name);

/** Blue page header with breadcrumb. `crumbs` is trusted HTML built by the caller (escape dynamic parts). */
export function pageHero(t, title, lead, crumbs) {
  return `<section class="page-hero"><div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">${esc(t('crumb.home'))}</a><span>/</span>${crumbs}</nav>
    <h1>${esc(title)}</h1>${lead ? `<p>${esc(lead)}</p>` : ''}</div></section>`;
}
