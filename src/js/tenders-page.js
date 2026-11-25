import { initSite, esc, qs, pageHero } from "./site.js";
import { getContent, L, fmtDay, isOpen, daysLeft } from "./shared.js";

const page = document.body.dataset.page;
const app = document.getElementById('app');
const tenders = () => getContent('tenders').filter(x => x.active !== false).sort((a, b) => b.published.localeCompare(a.published));
const fmtDT = iso => { const d = new Date(iso); return isNaN(d) ? '' : fmtDay(iso) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };

const AM = {
  'tn.title': 'ጨረታዎችና ግዢ', 'tn.lead': 'ቢሮው ያወጣቸው የግንባታ፣ የዕቃ አቅርቦትና የአማካሪ አገልግሎት ጨረታዎች።',
  'tn.all': 'ሁሉም', 'tn.open': 'ክፍት', 'tn.closed': 'የተዘጋ', 'tn.search': 'ጨረታ ይፈልጉ…', 'tn.none': 'ምንም ጨረታ አልተገኘም።',
  'tn.closes': 'የሚዘጋበት', 'tn.daysLeft': 'ቀናት ቀርተዋል', 'tn.closesToday': 'ዛሬ ይዘጋል', 'tn.closedOn': 'ተዘግቷል',
  'tn.ref': 'የጨረታ ቁጥር', 'tn.type': 'አይነት', 'tn.method': 'የግዢ ዘዴ', 'tn.published': 'የወጣበት ቀን', 'tn.closing': 'የሚዘጋበት ቀንና ሰዓት', 'tn.opening': 'የሚከፈትበት ቀንና ሰዓት',
  'tn.fee': 'የሰነድ ዋጋ', 'tn.security': 'የጨረታ ማስከበሪያ', 'tn.location': 'ቦታ', 'tn.desc': 'የጨረታው መግለጫ', 'tn.elig': 'የብቃት መስፈርቶች', 'tn.submit': 'የጨረታ ሰነድ አገዛዝና አቀራረብ',
  'tn.docs': 'የጨረታ ሰነዶች', 'tn.docNote': 'ሰነዶቹን ከቢሮው የግዢ ክፍል ማግኘት ይቻላል', 'tn.ask': 'ጥያቄ አለዎት?', 'tn.askText': 'ስለዚህ ጨረታ ጥያቄ ካለዎት የግዢ ክፍሉን ያነጋግሩ።', 'tn.contact': 'ያግኙን',
  'tn.notFound': 'ጨረታው አልተገኘም', 'tn.back': 'ወደ ሁሉም ጨረታዎች', 'tn.keyFacts': 'ዋና መረጃዎች'
};
const EN = {
  'tn.title': 'Tenders & procurement', 'tn.lead': 'Works, goods and consultancy tenders announced by the Bureau.',
  'tn.all': 'All', 'tn.open': 'Open', 'tn.closed': 'Closed', 'tn.search': 'Search tenders…', 'tn.none': 'No tenders found.',
  'tn.closes': 'Closes', 'tn.daysLeft': 'days left', 'tn.closesToday': 'Closes today', 'tn.closedOn': 'Closed',
  'tn.ref': 'Reference no.', 'tn.type': 'Type', 'tn.method': 'Procurement method', 'tn.published': 'Published', 'tn.closing': 'Closing date & time', 'tn.opening': 'Bid opening',
  'tn.fee': 'Bid document fee', 'tn.security': 'Bid security', 'tn.location': 'Location', 'tn.desc': 'Description', 'tn.elig': 'Eligibility requirements', 'tn.submit': 'Obtaining documents and submission',
  'tn.docs': 'Tender documents', 'tn.docNote': 'Available at the Bureau procurement office', 'tn.ask': 'Have a question?', 'tn.askText': 'Contact the procurement office about this tender.', 'tn.contact': 'Contact us',
  'tn.notFound': 'Tender not found', 'tn.back': 'All tenders', 'tn.keyFacts': 'Key facts'
};
const TYPE_AM = { Works: 'ግንባታ', Goods: 'ዕቃ አቅርቦት', Consultancy: 'የአማካሪ አገልግሎት' };

let filter = 'open', q = '';
const site = initSite({ active: 'tenders.html', am: AM, en: EN, onLang: render });
const t = k => site.t(k);
const typeL = ty => site.lang === 'am' ? TYPE_AM[ty] || ty : ty;
function statusBadge(x) {
  if (!isOpen(x.closing)) return `<span class="st-badge closed">${esc(t('tn.closed'))}</span>`;
  const d = daysLeft(x.closing);
  return `<span class="st-badge ${d <= 5 ? 'soon' : 'open'}">${esc(t('tn.open'))}</span>`;
}
function left(x) {
  if (!isOpen(x.closing)) return `${t('tn.closedOn')} ${fmtDay(x.closing)}`;
  const d = daysLeft(x.closing);
  return d <= 0 ? t('tn.closesToday') : `${d} ${t('tn.daysLeft')}`;
}

function renderList() {
  const lang = site.lang, ql = q.toLowerCase();
  const list = tenders().filter(x => (filter === 'all' || (filter === 'open') === isOpen(x.closing)) &&
    (!ql || [x.ref, L(x.title, lang), x.title.en, x.type, x.location].join(' ').toLowerCase().includes(ql)));
  document.title = `${t('tn.title')} · SETRB`;
  app.innerHTML = pageHero(t, t('tn.title'), t('tn.lead'), `<span aria-current="page">${esc(t('nav.notices'))}</span>`) + `
    <section class="page-body"><div class="container">
      <div class="toolbar">
        <div class="chips" id="f">${['open', 'closed', 'all'].map(k => `<button data-f="${k}" class="${filter === k ? 'active' : ''}">${esc(t('tn.' + k))}</button>`).join('')}</div>
        <label class="search"><svg><use href="#i-search"/></svg><input id="q" type="search" value="${esc(q)}" placeholder="${esc(t('tn.search'))}"></label>
      </div>
      <div class="listing">${list.map(x => `
        <a class="l-item" href="tender-detail.html?id=${encodeURIComponent(x.id)}">
          <div class="ic ic-blue"><svg><use href="#i-doc"/></svg></div>
          <div>
            <span class="ref">${esc(x.ref)}</span>
            <h3>${esc(L(x.title, lang))}</h3>
            <div class="sub"><span><svg><use href="#i-brief"/></svg>${esc(typeL(x.type))}</span><span><svg><use href="#i-pin"/></svg>${esc(x.location)}</span><span><svg><use href="#i-cal"/></svg>${esc(t('tn.closes'))}: ${esc(fmtDT(x.closing))}</span></div>
          </div>
          <div class="right">${statusBadge(x)}<small>${esc(left(x))}</small></div>
        </a>`).join('') || `<div class="empty-state">${esc(t('tn.none'))}</div>`}</div>
    </div></section>`;
  app.querySelector('#f').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; renderList(); } });
  const inp = app.querySelector('#q');
  inp.addEventListener('input', () => { q = inp.value; const p = inp.selectionStart; renderList(); const n = app.querySelector('#q'); n.focus(); n.setSelectionRange(p, p); });
}

function renderDetail() {
  const lang = site.lang, x = tenders().find(y => y.id === qs('id'));
  if (!x) {
    app.innerHTML = pageHero(t, t('tn.notFound'), '', `<a href="tenders.html">${esc(t('nav.notices'))}</a>`) +
      `<section class="page-body"><div class="container"><a class="btn btn-primary" href="tenders.html">${esc(t('tn.back'))}</a></div></section>`;
    return;
  }
  const open = isOpen(x.closing), d = daysLeft(x.closing);
  document.title = `${L(x.title, lang)} · SETRB`;
  app.innerHTML = pageHero(t, L(x.title, lang), x.ref, `<a href="tenders.html">${esc(t('nav.notices'))}</a><span>/</span><span aria-current="page">${esc(x.ref)}</span>`) + `
    <section class="page-body"><div class="container">
      <a class="back-btn" href="tenders.html"><svg><use href="#i-back"/></svg>${esc(t('tn.back'))}</a>
      <div class="detail-wrap">
        <div>
          <div class="panel"><h2>${esc(t('tn.desc'))}</h2><p>${esc(L(x.description, lang))}</p></div>
          ${x.eligibility?.length ? `<div class="panel"><h2>${esc(t('tn.elig'))}</h2><ul class="ticks">${x.eligibility.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
          ${x.submission ? `<div class="panel"><h2>${esc(t('tn.submit'))}</h2><p>${esc(x.submission)}</p></div>` : ''}
          ${x.documents?.length ? `<div class="panel"><h2>${esc(t('tn.docs'))}</h2><div class="doc-list">${x.documents.map(doc => `<div class="doc"><svg><use href="#i-doc"/></svg><span>${esc(doc)}</span><small>${esc(t('tn.docNote'))}</small></div>`).join('')}</div></div>` : ''}
        </div>
        <aside class="sticky">
          <div class="countdown ${open ? '' : 'closed'}"><b>${open ? Math.max(0, d) : '—'}</b><span>${esc(open ? (d <= 0 ? t('tn.closesToday') : t('tn.daysLeft')) : t('tn.closedOn') + ' ' + fmtDay(x.closing))}</span></div>
          <div class="panel"><h2>${esc(t('tn.keyFacts'))}</h2><div class="facts">
            <div><small>${esc(t('tn.ref'))}</small><b class="ref">${esc(x.ref)}</b></div>
            <div><small>${esc(t('tn.type'))}</small><b>${esc(typeL(x.type))}</b></div>
            <div><small>${esc(t('tn.method'))}</small><b>${esc(x.method)}</b></div>
            <div><small>${esc(t('tn.location'))}</small><b>${esc(x.location)}</b></div>
            <div><small>${esc(t('tn.published'))}</small><b>${esc(fmtDay(x.published))}</b></div>
            <div><small>${esc(t('tn.closing'))}</small><b>${esc(fmtDT(x.closing))}</b></div>
            <div><small>${esc(t('tn.opening'))}</small><b>${esc(fmtDT(x.opening))}</b></div>
            <div><small>${esc(t('tn.fee'))}</small><b>${esc(x.bidFee)}</b></div>
            <div><small>${esc(t('tn.security'))}</small><b>${esc(x.bidSecurity)}</b></div>
          </div></div>
          <div class="panel"><h2>${esc(t('tn.ask'))}</h2><p style="margin-bottom:14px">${esc(t('tn.askText'))}</p>
            <a class="btn btn-primary" href="contact.html?subject=Tender&ref=${encodeURIComponent(x.ref)}">${esc(t('tn.contact'))}<svg><use href="#i-arrow"/></svg></a></div>
        </aside>
      </div>
    </div></section>`;
}

function render() { page === 'tender-detail' ? renderDetail() : renderList(); }
site.apply();
