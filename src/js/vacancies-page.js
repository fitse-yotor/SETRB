import { initSite, esc, qs, pageHero } from "./site.js";
import { getContent, L, fmtDay, isOpen, daysLeft } from "./shared.js";

const page = document.body.dataset.page;
const app = document.getElementById('app');
const vacancies = () => getContent('vacancies').filter(x => x.active !== false).sort((a, b) => b.deadline.localeCompare(a.deadline));

const AM = {
  'vc.title': 'የሥራ ማስታወቂያዎች', 'vc.lead': 'በቢሮው ክፍት የሆኑ የሥራ መደቦች።', 'vc.open': 'ክፍት', 'vc.closed': 'የተዘጋ', 'vc.all': 'ሁሉም',
  'vc.none': 'በአሁኑ ጊዜ ክፍት የሥራ ቦታ የለም።', 'vc.deadline': 'የማመልከቻ ማብቂያ', 'vc.positions': 'ብዛት', 'vc.dept': 'የሥራ ክፍል', 'vc.location': 'የሥራ ቦታ',
  'vc.employment': 'የቅጥር ሁኔታ', 'vc.grade': 'ደረጃ', 'vc.salary': 'ደመወዝ', 'vc.duties': 'ዋና ዋና ተግባራት', 'vc.quals': 'የትምህርት ዝግጅት', 'vc.exp': 'የሥራ ልምድ',
  'vc.apply': 'እንዴት ማመልከት ይቻላል', 'vc.daysLeft': 'ቀናት ቀርተዋል', 'vc.closedOn': 'ተዘግቷል', 'vc.back': 'ወደ ሁሉም የሥራ ማስታወቂያዎች', 'vc.notFound': 'የሥራ ማስታወቂያው አልተገኘም',
  'vc.summary': 'የሥራው ማጠቃለያ', 'vc.ask': 'ጥያቄ አለዎት?', 'vc.askText': 'ስለዚህ የሥራ መደብ ጥያቄ ካለዎት የሰው ሀብት ክፍሉን ያነጋግሩ።', 'vc.contact': 'ያግኙን', 'vc.keyFacts': 'ዋና መረጃዎች'
};
const EN = {
  'vc.title': 'Vacancies', 'vc.lead': 'Open positions at the Bureau.', 'vc.open': 'Open', 'vc.closed': 'Closed', 'vc.all': 'All',
  'vc.none': 'There are no vacancies in this list.', 'vc.deadline': 'Application deadline', 'vc.positions': 'Positions', 'vc.dept': 'Department', 'vc.location': 'Work place',
  'vc.employment': 'Employment type', 'vc.grade': 'Grade', 'vc.salary': 'Salary', 'vc.duties': 'Main duties', 'vc.quals': 'Qualifications', 'vc.exp': 'Experience',
  'vc.apply': 'How to apply', 'vc.daysLeft': 'days left', 'vc.closedOn': 'Closed', 'vc.back': 'All vacancies', 'vc.notFound': 'Vacancy not found',
  'vc.summary': 'About the role', 'vc.ask': 'Have a question?', 'vc.askText': 'Contact the Human Resource office about this position.', 'vc.contact': 'Contact us', 'vc.keyFacts': 'Key facts'
};

let filter = 'open';
const site = initSite({ active: 'vacancies.html', am: AM, en: EN, onLang: render });
const t = k => site.t(k);
const open = x => isOpen(x.deadline + 'T23:59');
const badge = x => `<span class="st-badge ${open(x) ? (daysLeft(x.deadline + 'T23:59') <= 5 ? 'soon' : 'open') : 'closed'}">${esc(t(open(x) ? 'vc.open' : 'vc.closed'))}</span>`;

function renderList() {
  const lang = site.lang;
  const list = vacancies().filter(x => filter === 'all' || (filter === 'open') === open(x));
  document.title = `${t('vc.title')} · SETRB`;
  app.innerHTML = pageHero(t, t('vc.title'), t('vc.lead'), `<span aria-current="page">${esc(t('nav.vacancies'))}</span>`) + `
    <section class="page-body"><div class="container">
      <div class="toolbar"><div class="chips" id="f">${['open', 'closed', 'all'].map(k => `<button data-f="${k}" class="${filter === k ? 'active' : ''}">${esc(t('vc.' + k))}</button>`).join('')}</div></div>
      <div class="listing">${list.map(x => `
        <a class="l-item" href="vacancy-detail.html?id=${encodeURIComponent(x.id)}">
          <div class="ic ic-green"><svg><use href="#i-brief"/></svg></div>
          <div>
            <span class="ref">${esc(x.dept)}</span>
            <h3>${esc(L(x.title, lang))}</h3>
            <div class="sub"><span><svg><use href="#i-users"/></svg>${esc(t('vc.positions'))}: ${esc(x.positions)}</span><span><svg><use href="#i-pin"/></svg>${esc(x.location)}</span><span><svg><use href="#i-cal"/></svg>${esc(t('vc.deadline'))}: ${esc(fmtDay(x.deadline))}</span></div>
          </div>
          <div class="right">${badge(x)}<small>${esc(x.employment)}</small></div>
        </a>`).join('') || `<div class="empty-state">${esc(t('vc.none'))}</div>`}</div>
    </div></section>`;
  app.querySelector('#f').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; renderList(); } });
}

function renderDetail() {
  const lang = site.lang, x = vacancies().find(y => y.id === qs('id'));
  if (!x) {
    app.innerHTML = pageHero(t, t('vc.notFound'), '', `<a href="vacancies.html">${esc(t('nav.vacancies'))}</a>`) +
      `<section class="page-body"><div class="container"><a class="btn btn-primary" href="vacancies.html">${esc(t('vc.back'))}</a></div></section>`;
    return;
  }
  const isO = open(x), d = daysLeft(x.deadline + 'T23:59');
  document.title = `${L(x.title, lang)} · SETRB`;
  app.innerHTML = pageHero(t, L(x.title, lang), x.dept, `<a href="vacancies.html">${esc(t('nav.vacancies'))}</a><span>/</span><span aria-current="page">${esc(L(x.title, lang))}</span>`) + `
    <section class="page-body"><div class="container">
      <a class="back-btn" href="vacancies.html"><svg><use href="#i-back"/></svg>${esc(t('vc.back'))}</a>
      <div class="detail-wrap">
        <div>
          <div class="panel"><h2>${esc(t('vc.summary'))}</h2><p>${esc(L(x.summary, lang))}</p></div>
          ${x.duties?.length ? `<div class="panel"><h2>${esc(t('vc.duties'))}</h2><ul class="ticks">${x.duties.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
          <div class="panel"><h2>${esc(t('vc.quals'))}</h2><ul class="ticks">${(x.qualifications || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul>
            ${x.experience ? `<h2 style="margin-top:22px">${esc(t('vc.exp'))}</h2><p>${esc(x.experience)}</p>` : ''}</div>
          <div class="panel"><h2>${esc(t('vc.apply'))}</h2><p>${esc(x.howToApply)}</p></div>
        </div>
        <aside class="sticky">
          <div class="countdown ${isO ? '' : 'closed'}"><b>${isO ? Math.max(0, d) : '—'}</b><span>${esc(isO ? t('vc.daysLeft') : t('vc.closedOn') + ' ' + fmtDay(x.deadline))}</span></div>
          <div class="panel"><h2>${esc(t('vc.keyFacts'))}</h2><div class="facts">
            <div><small>${esc(t('vc.dept'))}</small><b>${esc(x.dept)}</b></div>
            <div><small>${esc(t('vc.positions'))}</small><b>${esc(x.positions)}</b></div>
            <div><small>${esc(t('vc.employment'))}</small><b>${esc(x.employment)}</b></div>
            <div><small>${esc(t('vc.grade'))}</small><b>${esc(x.grade)}</b></div>
            <div><small>${esc(t('vc.salary'))}</small><b>${esc(x.salary)}</b></div>
            <div><small>${esc(t('vc.location'))}</small><b>${esc(x.location)}</b></div>
            <div><small>${esc(t('vc.deadline'))}</small><b>${esc(fmtDay(x.deadline))}</b></div>
          </div></div>
          <div class="panel"><h2>${esc(t('vc.ask'))}</h2><p style="margin-bottom:14px">${esc(t('vc.askText'))}</p>
            <a class="btn btn-primary" href="contact.html?subject=Vacancy&ref=${encodeURIComponent(x.title.en)}">${esc(t('vc.contact'))}<svg><use href="#i-arrow"/></svg></a></div>
        </aside>
      </div>
    </div></section>`;
}

function render() { page === 'vacancy-detail' ? renderDetail() : renderList(); }
site.apply();
