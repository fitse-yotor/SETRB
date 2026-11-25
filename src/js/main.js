import "../css/style.css";
import "./data.js";
import { REGIONS, ZONE_AM, COMPLAINT_TYPES, COMPLAINT_STATUS, addComplaint, findComplaint, fmtDate, shrinkImage } from "./shared.js";
(function () {
  const D = window.PORTAL_DATA;
  let lang = 'en';
  try { lang = localStorage.getItem('lang') || 'en'; } catch (e) {}

  /* ---------------- Translations ---------------- */
  const AM = {
    'top.loc':'ወላይታ ሶዶ፣ ደቡብ ኢትዮጵያ','top.hours':'ሰኞ – አርብ · 2:30 – 11:30',
    'brand.name':'ትራንስፖርትና መንገድ ልማት ቢሮ','brand.sub':'የደቡብ ኢትዮጵያ ክልላዊ መንግሥት',
    'nav.home':'መነሻ','nav.about':'ስለ ቢሮው','nav.services':'አገልግሎቶች','nav.projects':'ፕሮጀክቶች','nav.news':'ዜናዎች','nav.notices':'ጨረታዎች','nav.contact':'ያግኙን','nav.report':'ጥቆማ ያቅርቡ',
    'hero.badge1':'ይፋዊ','hero.badge2':'South Ethiopia Transport & Road Bureau',
    'hero.title':'ማኅበረሰብን የሚያገናኙ፣ <em>የደቡብ ኢትዮጵያን መንገዶች</em> እየገነባን ነው',
    'hero.lead':'የክልሉን የመንገድ ግንባታ ሂደት በቀጥታ ይከታተሉ፣ የትራንስፖርት አገልግሎቶችን በኦንላይን ያግኙ፣ እንዲሁም የቢሮውን ወቅታዊ ዜናዎችና ማስታወቂያዎች ይመልከቱ።',
    'hero.cta1':'የመንገድ ፕሮጀክቶችን ይከታተሉ','hero.cta2':'አገልግሎቶቻችን','hero.f1':'በግንባታ ላይ ያሉ መንገዶች','hero.f2':'አማካይ የአካላዊ አፈፃፀም',
    'stat.1':'በሥራ ላይ ያሉ ፕሮጀክቶች','stat.2':'በግንባታ ላይ ያሉ መንገዶች','stat.3':'ድልድዮችና ስትራክቸሮች','stat.4':'ዞኖችና ልዩ ወረዳዎች',
    'about.badge':'ከአዲሱ የደቡብ ኢትዮጵያ ክልል ጋር የተቋቋመ','about.eyebrow':'ስለ ቢሮው',
    'about.title':'ለሁሉም ማኅበረሰብ ደህንነቱ የተጠበቀ፣ ተደራሽና ዘመናዊ ትራንስፖርት',
    'about.text':'ቢሮው የክልሉን የመንገድ መረብ ያቅዳል፣ ይገነባል፣ ይጠግናል፤ የሕዝብና የጭነት ትራንስፖርትን ይቆጣጠራል፤ ከዞኖችና ወረዳዎች ጋር በመሆን ለገጠሩ ማኅበረሰብ ዓመቱን ሙሉ የመንገድ ተደራሽነት ያረጋግጣል።',
    'about.vision':'ራዕይ','about.visionText':'ደህንነቱ በተጠበቀ፣ ቀልጣፋና ዘላቂ የመንገድና ትራንስፖርት መረብ የተሳሰረ ክልል ማየት።',
    'about.mission':'ተልዕኮ','about.missionText':'በመልካም አስተዳደር፣ በቴክኖሎጂና በሕዝብ ተሳትፎ ጥራት ያላቸው መንገዶችንና አስተማማኝ የትራንስፖርት አገልግሎት መስጠት።',
    'val.1':'ግልፅነት','val.2':'ተጠያቂነት','val.3':'ጥራት','val.4':'ሕዝባዊ አገልግሎት','val.5':'ፈጠራ',
    'dir.eyebrow':'የቢሮ ኃላፊው መልዕክት','dir.quote':'የምንገነባው እያንዳንዱ መንገድ ለገበያ፣ ለትምህርት ቤት፣ ለጤና ተቋምና ለዕድል በር ይከፍታል።',
    'dir.text':'ይህ ፖርታል የግልፅነት ቁርጠኝነታችን አካል ነው። ዜጎች፣ ተቋራጮችና አጋሮች የእያንዳንዱን የክልል መንገድ ፕሮጀክት ሂደት መከታተል፣ አገልግሎቶቻችንን ማግኘትና አስተያየታቸውን በቀጥታ ለቢሮው ማድረስ ይችላሉ።',
    'dir.name':'[የቢሮ ኃላፊ ስም]','dir.role':'ኃላፊ፣ ትራንስፖርትና መንገድ ልማት ቢሮ',
    'svc.eyebrow':'የምንሰራው','svc.title':'ለዜጎች፣ ለኦፕሬተሮችና ለአጋሮች የሚሰጡ አገልግሎቶች','svc.text':'ከመንገድ ግንባታ ክትትል እስከ ትራንስፖርት ፈቃድ — የቢሮውን ዋና ዋና አገልግሎቶች በአንድ ቦታ ያግኙ።',
    's1.t':'የመንገድ ግንባታና ማሻሻያ','s1.d':'የክልል የአስፋልትና የጠጠር መንገዶች ዕቅድ፣ ዲዛይንና የግንባታ ቁጥጥር።',
    's2.t':'የገጠር መንገዶችና ድልድዮች','s2.d':'ከዞኖችና ወረዳዎች ጋር በመተባበር ዓመቱን ሙሉ የሚያገለግሉ የገጠር መንገዶችና ድልድዮች።',
    's3.t':'የሕዝብ ትራንስፖርት','s3.d':'የመስመር ፈቃድ፣ የታሪፍ ተመን፣ የአውቶቡስ መናኸሪያዎችና የኦፕሬተር ማኅበራት ምዝገባ።',
    's4.t':'የጭነት ኦፕሬተር ፈቃድ','s4.d':'ለጭነት ኦፕሬተሮች አዲስ ፈቃድ፣ እድሳት፣ የድጋፍ ደብዳቤና ስረዛ።',
    's5.t':'የአሽከርካሪና ተሽከርካሪ አገልግሎት','s5.d':'የአሽከርካሪ ማሰልጠኛ ተቋማት፣ የፈተና ቀጠሮና የተሽከርካሪ ምርመራ ማዕከላት።',
    's6.t':'የመንገድ ደህንነት','s6.d':'የአደጋ መረጃ፣ የመንገድ ደህንነት ዘመቻዎችና አደገኛ የመንገድ ሁኔታዎችን ጥቆማ።','more':'ተጨማሪ',
    'proj.eyebrow':'የፕሮጀክት ክትትል','proj.title':'የክልሉን የመንገድ ፕሮጀክቶች ሂደት ይከታተሉ','proj.text':'የአካላዊና የፋይናንስ አፈፃፀም በቢሮው ከፀደቁ ወርሃዊ የሳይት ሪፖርቶች ይዘምናል።',
    'f.all':'ሁሉም','f.on':'በዕቅድ መሠረት','f.risk':'ስጋት ያለበት','f.delay':'የዘገየ','f.done':'የተጠናቀቀ','f.search':'በመንገድ ወይም በዞን ይፈልጉ…',
    'proj.demo':'ለማሳያ የቀረበ ናሙና መረጃ — ከክትትል ሲስተሙ በሚመጣ ቀጥታ መረጃ ይተካል።',
    'p.phys':'አካላዊ አፈፃፀም','p.fin':'የፋይናንስ አፈፃፀም','p.end':'ማጠናቀቂያ','p.empty':'ምንም ፕሮጀክት አልተገኘም።',
    'news.eyebrow':'ወቅታዊ ዜናዎች','news.title':'ከቢሮው የተገኙ ዜናዎችና መረጃዎች',
    'tn.title':'ጨረታዎችና ግዢ','an.title':'ማስታወቂያዎች',
    'rp.eyebrow':'የዜጎች አስተያየት','rp.title':'የመንገድ ችግር አይተዋል? ለቢሮው ያሳውቁ።','rp.text':'ጉድጓዶች፣ የተጎዱ ድልድዮች፣ የተዘጉ የውሃ መውረጃዎች፣ ፍትሐዊ ያልሆነ ታሪፍ ወይም የአገልግሎት ቅሬታ — እያንዳንዱ ጥቆማ የመከታተያ ቁጥር ይሰጠዋል።',
    'rp.l1':'የመከታተያ ቁጥር ወዲያውኑ ያግኙ','rp.l2':'ለሚመለከተው የዞንና የወረዳ ጽ/ቤት ይተላለፋል','rp.l3':'በመከታተያ ቁጥርዎ ምላሹን በኦንላይን ይከታተሉ',
    'rp.name':'ሙሉ ስም','rp.phone':'ስልክ','rp.type':'የችግሩ አይነት','rp.zone':'ዞን / ወረዳ','rp.desc':'ዝርዝር መግለጫ','rp.submit':'ጥቆማ ይላኩ',
    'rp.types':['የመንገድ ብልሽት / ጉድጓድ','ድልድይ ወይም የውሃ መውረጃ','የሕዝብ ትራንስፖርት ቅሬታ','የአገልግሎት አሰጣጥ ቅሬታ','ሌላ'],
    'rp.ok':'ጥቆማዎ ደርሷል። የመከታተያ ቁጥርዎ፡ ',
    'rp.tabSubmit':'ቅሬታ ያቅርቡ','rp.tabTrack':'ቅሬታዬን ልከታተል','rp.zoneL':'ዞን','rp.woredaL':'ወረዳ','rp.loc':'ትክክለኛ ቦታ (ቀበሌ፣ መንገድ፣ መለያ ምልክት)',
    'rp.photo':'ፎቶ (አማራጭ)','rp.photoHint':'የችግሩን ፎቶ ለማያያዝ ይጫኑ','rp.trackL':'የመከታተያ ቁጥር','rp.trackBtn':'ሁኔታውን ይመልከቱ',
    'rp.req':'እባክዎ ሁሉንም አስፈላጊ መረጃዎች ይሙሉ።','rp.badPhone':'እባክዎ ትክክለኛ የስልክ ቁጥር ያስገቡ።','rp.keep':'ይህን ቁጥር ይያዙ — ሂደቱን ለመከታተል ይጠቀሙበት።',
    'rp.notFound':'በዚህ ቁጥር የተመዘገበ ቅሬታ አልተገኘም። ቁጥሩን አረጋግጠው እንደገና ይሞክሩ።','rp.selZone':'ዞን ይምረጡ','rp.submitted':'የቀረበበት ቀን','rp.assigned':'የተመደበለት',
    'rp.woredaOffice':'ወረዳ ትራንስፖርት ጽ/ቤት','rp.updates':'ሂደቶች','rp.sending':'በመላክ ላይ…','rp.photoAdded':'ፎቶ ተያይዟል',
    'ct.eyebrow':'ያግኙን','ct.title':'ቢሮውን ያነጋግሩ','ct.addr':'አድራሻ','ct.phone':'ስልክ','ct.email':'ኢሜይል','ct.hours':'የሥራ ሰዓት',
    'ft.text':'ጥራት ባላቸው መንገዶችና አስተማማኝ ትራንስፖርት የተሳሰረች፣ ደህንነቷ የተጠበቀና የበለፀገች ደቡብ ኢትዮጵያን መገንባት።',
    'ft.quick':'ፈጣን ማስፈንጠሪያዎች','ft.services':'አገልግሎቶች','ft.partners':'አጋሮች',
    'ft.copy':'የደቡብ ኢትዮጵያ ክልል ትራንስፖርትና መንገድ ልማት አስተዳደር ቢሮ። መብቱ በሕግ የተጠበቀ ነው።','ft.made':'ወላይታ ሶዶ፣ ኢትዮጵያ'
  };
  const EN_EXTRA = { 'p.phys':'Physical progress','p.fin':'Financial progress','p.end':'Completion','p.empty':'No projects match your search.','rp.ok':'Thank you — your complaint was received. Tracking number: ',
    'rp.req':'Please fill in all required fields.','rp.badPhone':'Please enter a valid phone number.','rp.keep':'Keep this number — use it in “Track my complaint” to follow the response.',
    'rp.notFound':'No complaint found with this tracking number. Please check it and try again.','rp.selZone':'Select zone','rp.submitted':'Submitted','rp.assigned':'Assigned to',
    'rp.woredaOffice':'Woreda Transport Office','rp.updates':'Updates','rp.sending':'Sending…','rp.photoAdded':'Photo attached' };
  const EN = {};
  const STATUS = { 'on-track':{en:'On track',am:'በዕቅድ መሠረት'}, 'at-risk':{en:'At risk',am:'ስጋት ያለበት'}, 'delayed':{en:'Delayed',am:'የዘገየ'}, 'done':{en:'Completed',am:'የተጠናቀቀ'} };

  // capture English defaults from the markup
  document.querySelectorAll('[data-i18n]').forEach(el => { EN[el.dataset.i18n] = EN[el.dataset.i18n] || el.textContent; });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { EN[el.dataset.i18nHtml] = el.innerHTML; });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { EN[el.dataset.i18nPh] = el.placeholder; });
  document.querySelectorAll('[data-i18n-opts]').forEach(el => { EN[el.dataset.i18nOpts] = [...el.options].map(o => o.text); });
  Object.assign(EN, EN_EXTRA);
  const t = k => (lang === 'am' ? AM[k] : EN[k]) ?? EN[k] ?? k;

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
    document.querySelectorAll('[data-i18n-html]').forEach(el => el.innerHTML = t(el.dataset.i18nHtml));
    document.querySelectorAll('[data-i18n-ph]').forEach(el => el.placeholder = t(el.dataset.i18nPh));
    document.querySelectorAll('[data-i18n-opts]').forEach(el => t(el.dataset.i18nOpts).forEach((txt, i) => el.options[i] && (el.options[i].text = txt)));
    document.querySelectorAll('.lang-switch button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    renderProjects(); renderNews(); renderNotices(); fillZones(); if (lastTrack) showTrack(lastTrack);
  }
  document.querySelectorAll('.lang-switch button').forEach(b => b.addEventListener('click', () => {
    lang = b.dataset.lang; try { localStorage.setItem('lang', lang); } catch (e) {}
    applyLang();
  }));

  /* ---------------- Projects ---------------- */
  let filter = 'all', query = '';
  const grid = document.getElementById('projGrid');
  function renderProjects() {
    const q = query.toLowerCase();
    const list = D.projects.filter(p => (filter === 'all' || p.status === filter) &&
      (!q || [p.name.en, p.name.am, p.zone.en, p.zone.am].join(' ').toLowerCase().includes(q)));
    grid.innerHTML = list.length ? list.map(p => `
      <article class="proj">
        <div class="proj-img"><img src="${p.img}" alt=""><span class="status ${p.status}"><i></i>${STATUS[p.status][lang]}</span></div>
        <div class="proj-body">
          <div class="proj-meta">
            <span><svg><use href="#i-pin"/></svg>${p.zone[lang]}</span>
            <span><svg><use href="#i-ruler"/></svg>${p.km} km</span>
            <span><svg><use href="#i-road"/></svg>${p.type[lang]}</span>
          </div>
          <h3>${p.name[lang]}</h3>
          <div class="bar-row"><div class="lbl"><span>${t('p.phys')}</span><span>${p.physical}%</span></div><div class="bar phys"><span data-w="${p.physical}"></span></div></div>
          <div class="bar-row"><div class="lbl"><span>${t('p.fin')}</span><span>${p.financial}%</span></div><div class="bar fin"><span data-w="${p.financial}"></span></div></div>
          <div class="proj-foot"><span>${p.contractor}</span><span>${t('p.end')}: <b>${p.end}</b></span></div>
        </div>
      </article>`).join('') : `<div class="empty">${t('p.empty')}</div>`;
    requestAnimationFrame(() => setTimeout(() => grid.querySelectorAll('.bar span').forEach(s => s.style.width = s.dataset.w + '%'), 60));
  }
  document.getElementById('filters').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    filter = b.dataset.filter;
    document.querySelectorAll('#filters button').forEach(x => x.classList.toggle('active', x === b));
    renderProjects();
  });
  document.getElementById('projSearch').addEventListener('input', e => { query = e.target.value; renderProjects(); });

  /* ---------------- News ---------------- */
  const cal = '<svg><use href="#i-cal"/></svg>';
  function renderNews() {
    const [f, ...rest] = D.news;
    document.getElementById('newsGrid').innerHTML = `
      <a href="#news" class="news-feature reveal in">
        <img src="${f.img}" alt="">
        <div class="body"><span class="tag ${f.tag}">${f.cat[lang]}</span><h3>${f.title[lang]}</h3><p>${f.text[lang]}</p><span class="news-date">${cal}${f.date}</span></div>
      </a>
      <div class="news-list">${rest.map(n => `
        <a href="#news" class="news-item reveal in">
          <div class="thumb"><img src="${n.img}" alt=""></div>
          <div><span class="tag ${n.tag}">${n.cat[lang]}</span><h4>${n.title[lang]}</h4><span class="news-date">${cal}${n.date}</span></div>
        </a>`).join('')}
      </div>`;
  }

  /* ---------------- Notices ---------------- */
  const noticeHTML = arr => arr.map(n => `
    <div class="notice"><div class="d"><b>${n.d}</b><small>${n.m}</small></div>
      <div><h4>${n.title[lang]}</h4><p>${n.sub[lang]}</p></div>
      <a href="#notices" class="dl" aria-label="Download"><svg><use href="#i-download"/></svg></a></div>`).join('');
  function renderNotices() {
    document.getElementById('tenderList').innerHTML = noticeHTML(D.tenders);
    document.getElementById('announceList').innerHTML = noticeHTML(D.announcements);
  }

  /* ---------------- Header / menu ---------------- */
  const header = document.getElementById('header'), toTop = document.getElementById('toTop');
  const onScroll = () => { header.classList.toggle('scrolled', scrollY > 10); toTop.classList.toggle('show', scrollY > 600); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  document.getElementById('menuToggle').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

  // active nav link on scroll
  const links = [...document.querySelectorAll('.nav a:not(.btn)')];
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(l => { const s = document.querySelector(l.getAttribute('href')); s && secObs.observe(s); });

  /* ---------------- Reveal + counters ---------------- */
  const revObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-count]').forEach(countUp);
    revObs.unobserve(e.target);
  }), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));
  function countUp(el) {
    const end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1600;
    const step = now => { const p = Math.min((now - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = v.toLocaleString() + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---------------- Complaints: submit & track ---------------- */
  const $id = x => document.getElementById(x);
  const escH = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let photoData = null, lastTrack = null;

  function fillZones() {
    const z = $id('rpZone'), cur = z.value;
    z.innerHTML = `<option value="">${escH(t('rp.selZone'))}</option>` + Object.keys(REGIONS).map(k =>
      `<option value="${escH(k)}" ${k === cur ? 'selected' : ''}>${escH(lang === 'am' ? ZONE_AM[k] || k : k)}</option>`).join('');
    fillWoredas();
  }
  function fillWoredas() {
    const z = $id('rpZone').value, w = $id('rpWoreda'), cur = w.value;
    w.innerHTML = (REGIONS[z] || []).map(k => `<option ${k === cur ? 'selected' : ''}>${escH(k)}</option>`).join('');
    w.disabled = !z;
  }
  $id('rpZone').addEventListener('change', fillWoredas);

  document.querySelectorAll('[data-ftab]').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('[data-ftab]').forEach(x => x.classList.toggle('active', x === b));
    $id('reportForm').classList.toggle('hidden', b.dataset.ftab !== 'submit');
    $id('trackForm').classList.toggle('hidden', b.dataset.ftab !== 'track');
  }));

  $id('rpPhoto').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      photoData = await shrinkImage(f);
      $id('rpPhotoTxt').innerHTML = `<img src="${photoData}" alt=""> ${escH(t('rp.photoAdded'))}`;
    } catch (err) { photoData = null; }
  });

  $id('reportForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = id => $id(id).value.trim();
    const err = $id('rpErr');
    if (!v('rpName') || !v('rpPhone') || !v('rpZone') || !v('rpWoreda') || !v('rpLoc') || !v('rpDesc')) {
      err.textContent = t('rp.req'); err.classList.add('show'); return;
    }
    if (!/^\+?[0-9 ]{9,15}$/.test(v('rpPhone'))) { err.textContent = t('rp.badPhone'); err.classList.add('show'); return; }
    err.classList.remove('show');
    const c = addComplaint({
      name: v('rpName'), phone: v('rpPhone'), type: COMPLAINT_TYPES[$id('rpType').selectedIndex] || COMPLAINT_TYPES[4],
      zone: v('rpZone'), woreda: v('rpWoreda'), location: v('rpLoc'), description: v('rpDesc'), photo: photoData
    });
    const msg = $id('formMsg');
    msg.innerHTML = `${escH(t('rp.ok'))}<b>${escH(c.id)}</b><br><small>${escH(t('rp.keep'))}</small>`;
    msg.classList.add('show');
    e.target.reset(); photoData = null; $id('rpPhotoTxt').textContent = t('rp.photoHint'); fillZones();
    $id('trackId').value = c.id;
  });

  function showTrack(id) {
    const c = findComplaint(id), box = $id('trackResult');
    lastTrack = id;
    if (!c) { box.innerHTML = `<div class="t-none">${escH(t('rp.notFound'))}</div>`; return; }
    const st = s => `<span class="t-status ${s}">${escH(lang === 'am' ? COMPLAINT_STATUS[s].am : COMPLAINT_STATUS[s].label)}</span>`;
    const steps = c.history.filter(h => h.public).slice().reverse();
    box.innerHTML = `<div class="track-card">
      <div class="th"><b>${escH(c.id)}</b>${st(c.status)}</div>
      <div class="meta">${escH(c.type)} · ${escH(c.woreda)}, ${escH(lang === 'am' ? ZONE_AM[c.zone] || c.zone : c.zone)}<br>${escH(t('rp.submitted'))}: ${escH(fmtDate(c.createdAt))}${c.assignedTo ? ` · ${escH(t('rp.assigned'))}: ${escH(c.assignedTo)} ${escH(t('rp.woredaOffice'))}` : ''}</div>
      <ul class="t-steps">${steps.map(h => `<li><b>${st(h.status)}</b> ${escH(h.note)}<br><small>${escH(fmtDate(h.at))}</small></li>`).join('')}</ul>
    </div>`;
  }
  $id('trackForm').addEventListener('submit', e => { e.preventDefault(); if ($id('trackId').value.trim()) showTrack($id('trackId').value); });

  document.getElementById('year').textContent = new Date().getFullYear();
  applyLang();
})();
