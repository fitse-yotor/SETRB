import { initSite, esc, qs, pageHero } from "./site.js";
import { addMessage } from "./shared.js";

const app = document.getElementById('app');
const SUBJECTS = ['General inquiry', 'Tender', 'Vacancy', 'Project information', 'Media', 'Other'];
const AM = {
  'ct.title': 'ያግኙን', 'ct.lead': 'ጥያቄ፣ አስተያየት ወይም መረጃ ለማግኘት መልዕክት ይላኩልን። በሥራ ቀናት ምላሽ እንሰጣለን።',
  'ct.addr': 'አድራሻ', 'ct.phone': 'ስልክ', 'ct.email': 'ኢሜይል', 'ct.hours': 'የሥራ ሰዓት', 'ct.hoursV': 'ሰኞ – አርብ · 2:30 – 11:30', 'ct.loc': 'ወላይታ ሶዶ፣ ደቡብ ኢትዮጵያ',
  'ct.formTitle': 'መልዕክት ይላኩ', 'ct.name': 'ሙሉ ስም', 'ct.mail': 'ኢሜይል', 'ct.tel': 'ስልክ (አማራጭ)', 'ct.subject': 'ርዕስ', 'ct.msg': 'መልዕክት', 'ct.send': 'መልዕክት ይላኩ',
  'ct.sending': 'በመላክ ላይ…', 'ct.ok': 'እናመሰግናለን! መልዕክትዎ ደርሶናል። በኢሜይል ወይም በስልክ ምላሽ እንሰጥዎታለን።', 'ct.req': 'እባክዎ ስም፣ ትክክለኛ ኢሜይልና መልዕክት ያስገቡ።',
  'ct.complaint': 'የመንገድ ችግር ወይም ቅሬታ ለማቅረብ', 'ct.complaintLink': 'የቅሬታ ቅጹን ይጠቀሙ',
  'ct.subjects': ['አጠቃላይ ጥያቄ', 'ጨረታ', 'የሥራ ማስታወቂያ', 'የፕሮጀክት መረጃ', 'ሚዲያ', 'ሌላ']
};
const EN = {
  'ct.title': 'Contact us', 'ct.lead': 'Send us a question, feedback or a request for information. We reply on working days.',
  'ct.addr': 'Address', 'ct.phone': 'Phone', 'ct.email': 'Email', 'ct.hours': 'Working hours', 'ct.hoursV': 'Mon – Fri · 8:30 – 5:30', 'ct.loc': 'Wolaita Sodo, South Ethiopia',
  'ct.formTitle': 'Send a message', 'ct.name': 'Full name', 'ct.mail': 'Email', 'ct.tel': 'Phone (optional)', 'ct.subject': 'Subject', 'ct.msg': 'Message', 'ct.send': 'Send message',
  'ct.sending': 'Sending…', 'ct.ok': 'Thank you! Your message has been received. We will reply by email or phone.', 'ct.req': 'Please enter your name, a valid email address and a message.',
  'ct.complaint': 'Reporting a road problem or a complaint?', 'ct.complaintLink': 'Use the complaint form',
  'ct.subjects': SUBJECTS
};

const site = initSite({ active: 'contact.html', am: AM, en: EN, onLang: render });
const t = k => site.t(k);
let draft = { name: '', email: '', phone: '', subject: SUBJECTS.includes(qs('subject')) ? qs('subject') : SUBJECTS[0], message: qs('ref') ? `Regarding: ${qs('ref')}\n\n` : '' };
let sent = false;

function render() {
  document.title = `${t('ct.title')} · SETRB`;
  const subs = t('ct.subjects');
  app.innerHTML = pageHero(t, t('ct.title'), t('ct.lead'), `<span aria-current="page">${esc(t('nav.contact'))}</span>`) + `
    <section class="page-body"><div class="container contact-wrap">
      <div class="c-info">
        <div class="c-row"><div class="ic ic-blue"><svg><use href="#i-pin"/></svg></div><div><h4>${esc(t('ct.addr'))}</h4><p>${esc(t('ct.loc'))}</p></div></div>
        <div class="c-row"><div class="ic ic-green"><svg><use href="#i-phone"/></svg></div><div><h4>${esc(t('ct.phone'))}</h4><p>+251 46 000 0000</p></div></div>
        <div class="c-row"><div class="ic ic-red"><svg><use href="#i-mail"/></svg></div><div><h4>${esc(t('ct.email'))}</h4><p>info@setrb.gov.et</p></div></div>
        <div class="c-row"><div class="ic ic-navy"><svg><use href="#i-clock"/></svg></div><div><h4>${esc(t('ct.hours'))}</h4><p>${esc(t('ct.hoursV'))}</p></div></div>
        <div class="c-row"><div class="ic ic-red"><svg><use href="#i-alert"/></svg></div><div><h4>${esc(t('ct.complaint'))}</h4><p><a class="read-more" href="index.html#report">${esc(t('ct.complaintLink'))}<svg><use href="#i-arrow"/></svg></a></p></div></div>
      </div>
      <form class="c-form" id="cf" novalidate>
        <h2>${esc(t('ct.formTitle'))}</h2>
        <div class="row">
          <div><label for="cName">${esc(t('ct.name'))}</label><input id="cName" autocomplete="name" value="${esc(draft.name)}" required></div>
          <div><label for="cEmail">${esc(t('ct.mail'))}</label><input id="cEmail" type="email" autocomplete="email" value="${esc(draft.email)}" required></div>
        </div>
        <div class="row">
          <div><label for="cPhone">${esc(t('ct.tel'))}</label><input id="cPhone" type="tel" autocomplete="tel" value="${esc(draft.phone)}"></div>
          <div><label for="cSubject">${esc(t('ct.subject'))}</label><select id="cSubject">${SUBJECTS.map((s, i) => `<option value="${esc(s)}" ${s === draft.subject ? 'selected' : ''}>${esc(subs[i] || s)}</option>`).join('')}</select></div>
        </div>
        <div><label for="cMsg">${esc(t('ct.msg'))}</label><textarea id="cMsg" required>${esc(draft.message)}</textarea></div>
        <div class="form-err" id="cErr"></div>
        <button class="btn btn-primary" type="submit" id="cSend"><span>${esc(t('ct.send'))}</span><svg><use href="#i-send"/></svg></button>
        <div class="ok-box ${sent ? 'show' : ''}" id="cOk">${esc(t('ct.ok'))}</div>
      </form>
    </div></section>`;
  const f = app.querySelector('#cf');
  f.addEventListener('input', () => {
    draft = { name: f.cName.value, email: f.cEmail.value, phone: f.cPhone.value, subject: f.cSubject.value, message: f.cMsg.value };
  });
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const d = { name: f.cName.value.trim(), email: f.cEmail.value.trim(), phone: f.cPhone.value.trim(), subject: f.cSubject.value, message: f.cMsg.value.trim() };
    const err = app.querySelector('#cErr');
    if (!d.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || d.message.length < 5) { err.textContent = t('ct.req'); err.classList.add('show'); return; }
    err.classList.remove('show');
    const btn = app.querySelector('#cSend'); btn.disabled = true; btn.querySelector('span').textContent = t('ct.sending');
    // 1) keep a copy for the admin inbox (demo storage)
    addMessage(d);
    // 2) ask the backend to email the Bureau (works when the server is running)
    try {
      await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    } catch (ex) { /* backend not running: message is still in the admin inbox */ }
    sent = true; draft = { name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' };
    render();
  });
}
site.apply();
