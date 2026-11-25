/* ------------------------------------------------------------------
   Website content management for the admin dashboard:
   news, tenders, vacancies and contact messages (Bureau role only).
   ------------------------------------------------------------------ */
import { getContent, saveContent, getMessages, saveMessages, L, fmtDay, fmtDate, isOpen, newId, shrinkImage } from "./shared.js";

const LIBRARY = ['road-inspection', 'bridge-site-visit', 'project-inauguration', 'head-field-visit', 'road-consultation'].map(n => `assets/img/news/${n}.jpg`);
const lines = v => String(v || '').split('\n').map(s => s.trim()).filter(Boolean);
const toLocalDT = iso => (iso || '').slice(0, 16);

export function createCMS({ $, esc, icon, openDrawer, closeDrawer, toast }) {
  const field = (id, label, value = '', opts = {}) => {
    const { type = 'text', full = false, area = false, rows = 4, hint = '', required = false } = opts;
    const input = area
      ? `<textarea id="${id}" rows="${rows}">${esc(value)}</textarea>`
      : `<input id="${id}" type="${type}" value="${esc(value)}">`;
    return `<div class="field ${full ? 'full' : ''}"><label for="${id}">${esc(label)}${required ? ' *' : ''}</label>${input}${hint ? `<small class="hint">${esc(hint)}</small>` : ''}</div>`;
  };
  const val = id => ($('#' + id)?.value ?? '').trim();
  const showErr = msg => { const e = $('#cmsErr'); e.textContent = msg; e.classList.add('show'); e.scrollIntoView({ block: 'nearest' }); };
  const footer = (saveLabel = 'Save') => `<button class="btn btn-light" id="cmsCancel">Cancel</button><button class="btn btn-primary" id="cmsSave">${icon('i-check')}${saveLabel}</button>`;
  const wire = onSave => { $('#cmsCancel').addEventListener('click', closeDrawer); $('#cmsSave').addEventListener('click', onSave); };
  const toolbar = (id, placeholder, btn) => `<div class="filter-row"><input type="search" id="${id}" placeholder="${esc(placeholder)}"><div class="spacer"></div>
    <button class="btn btn-primary" data-cms-new="${btn}">${icon('i-plus')}Add ${esc(btn)}</button></div>`;

  /* =============================== NEWS =============================== */
  function renderNews(root) {
    const q = (root.querySelector('#cnQ')?.value || '').toLowerCase();
    if (!root.querySelector('#cnQ')) {
      root.innerHTML = toolbar('cnQ', 'Search news…', 'news') + `<div class="card"><div class="table-wrap"><table><thead><tr><th>Article</th><th>Category</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody id="cnBody"></tbody></table></div></div>`;
      root.querySelector('#cnQ').addEventListener('input', () => renderNews(root));
    }
    const rows = getContent('news').filter(n => !q || [n.title.en, n.title.am, n.cat.en].join(' ').toLowerCase().includes(q)).sort((a, b) => b.date.localeCompare(a.date));
    root.querySelector('#cnBody').innerHTML = rows.map(n => `
      <tr data-edit-news="${esc(n.id)}">
        <td><div style="display:flex;gap:12px;align-items:center"><img src="${esc(n.img)}" alt="" style="width:64px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0"><span class="name">${esc(n.title.en)}</span></div></td>
        <td>${esc(n.cat.en)}</td><td class="num">${esc(fmtDay(n.date))}</td>
        <td><span class="pill ${n.published !== false ? 'approved' : 'inactive'}">${n.published !== false ? 'Published' : 'Draft'}</span></td>
        <td><a class="btn btn-light btn-sm" href="news-detail.html?id=${encodeURIComponent(n.id)}" target="_blank" rel="noopener" data-stop>View</a></td>
      </tr>`).join('') || '<tr><td colspan="5" class="empty">No news yet.</td></tr>';
  }
  function editNews(id) {
    const list = getContent('news'), n = list.find(x => x.id === id) || { id: '', date: new Date().toISOString().slice(0, 10), tag: 'blue', img: LIBRARY[0], published: true, cat: { en: 'Projects', am: 'ፕሮጀክቶች' }, title: {}, summary: {}, body: {} };
    let img = n.img;
    const body = `
      <div class="form-grid">
        ${field('nTitleEn', 'Title (English)', n.title.en, { full: true, required: true })}
        ${field('nTitleAm', 'Title (Amharic)', n.title.am, { full: true })}
        ${field('nCatEn', 'Category (English)', n.cat.en, { required: true })}
        ${field('nCatAm', 'Category (Amharic)', n.cat.am)}
        ${field('nDate', 'Date', n.date, { type: 'date', required: true })}
        <div class="field"><label for="nTag">Label colour</label><select id="nTag">${[['blue', 'Blue'], ['green', 'Green'], ['red', 'Red']].map(([v, l]) => `<option value="${v}" ${n.tag === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field full"><label>Cover photo</label>
          <div class="img-pick" id="nImgs">${LIBRARY.map(src => `<button type="button" data-img="${esc(src)}" class="${src === img ? 'sel' : ''}"><img src="${esc(src)}" alt=""></button>`).join('')}
            <label class="img-up">${icon('i-upload')}<span>Upload</span><input type="file" id="nUpload" accept="image/*"></label></div>
          <div class="img-preview"><img id="nPrev" src="${esc(img)}" alt=""></div></div>
        ${field('nSumEn', 'Summary (English)', n.summary.en, { full: true, area: true, rows: 2, required: true, hint: 'One or two sentences shown on cards and at the top of the article.' })}
        ${field('nSumAm', 'Summary (Amharic)', n.summary.am, { full: true, area: true, rows: 2 })}
        ${field('nBodyEn', 'Article text (English)', n.body.en, { full: true, area: true, rows: 9, required: true, hint: 'Separate paragraphs with an empty line.' })}
        ${field('nBodyAm', 'Article text (Amharic)', n.body.am, { full: true, area: true, rows: 6 })}
        <label class="field full" style="display:flex;gap:8px;align-items:center;font-size:.86rem"><input type="checkbox" id="nPub" ${n.published !== false ? 'checked' : ''} style="width:auto"> Published (visible on the website)</label>
      </div>
      <div class="err" id="cmsErr"></div>
      ${n.id ? `<div class="danger-zone"><button class="btn btn-red btn-sm" id="cmsDelete">Delete this article</button></div>` : ''}`;
    openDrawer(n.id ? 'Edit news article' : 'Add news article', n.id ? n.id : 'New article', body, footer(n.id ? 'Save changes' : 'Publish'));
    $('#nImgs').addEventListener('click', e => {
      const b = e.target.closest('[data-img]'); if (!b) return;
      img = b.dataset.img; $('#nPrev').src = img;
      $('#nImgs').querySelectorAll('[data-img]').forEach(x => x.classList.toggle('sel', x === b));
    });
    $('#nUpload').addEventListener('change', async e => {
      const f = e.target.files[0]; if (!f) return;
      try { img = await shrinkImage(f, 1400, .78); $('#nPrev').src = img; $('#nImgs').querySelectorAll('[data-img]').forEach(x => x.classList.remove('sel')); }
      catch (err) { showErr('Could not read that image.'); }
    });
    if (n.id) $('#cmsDelete').addEventListener('click', () => {
      if (!confirm('Delete this article from the website?')) return;
      saveContent('news', getContent('news').filter(x => x.id !== n.id)); closeDrawer(); refresh(); toast('Article deleted');
    });
    wire(() => {
      if (!val('nTitleEn') || !val('nCatEn') || !val('nDate') || !val('nSumEn') || !val('nBodyEn')) return showErr('Fill in the English title, category, date, summary and article text.');
      const item = { ...n, id: n.id || newId('n'), date: val('nDate'), tag: $('#nTag').value, img, published: $('#nPub').checked,
        cat: { en: val('nCatEn'), am: val('nCatAm') }, title: { en: val('nTitleEn'), am: val('nTitleAm') },
        summary: { en: val('nSumEn'), am: val('nSumAm') }, body: { en: val('nBodyEn'), am: val('nBodyAm') } };
      const all = getContent('news').filter(x => x.id !== item.id); all.push(item);
      if (!saveContent('news', all)) return showErr('Storage is full. Use a smaller photo or one from the library.');
      closeDrawer(); refresh(); toast(n.id ? 'Article updated' : 'Article published');
    });
  }

  /* =============================== TENDERS =============================== */
  function renderTenders(root) {
    const q = (root.querySelector('#ctQ')?.value || '').toLowerCase();
    if (!root.querySelector('#ctQ')) {
      root.innerHTML = toolbar('ctQ', 'Search by reference or title…', 'tender') + `<div class="card"><div class="table-wrap"><table><thead><tr><th>Tender</th><th>Type</th><th>Published</th><th>Closing</th><th>Status</th><th></th></tr></thead><tbody id="ctBody"></tbody></table></div></div>`;
      root.querySelector('#ctQ').addEventListener('input', () => renderTenders(root));
    }
    const rows = getContent('tenders').filter(x => !q || [x.ref, x.title.en, x.type].join(' ').toLowerCase().includes(q)).sort((a, b) => b.published.localeCompare(a.published));
    root.querySelector('#ctBody').innerHTML = rows.map(x => {
      const st = x.active === false ? ['inactive', 'Hidden'] : isOpen(x.closing) ? ['approved', 'Open'] : ['resolved', 'Closed'];
      return `<tr data-edit-tender="${esc(x.id)}"><td><span class="name">${esc(x.title.en)}</span><span class="sub num">${esc(x.ref)}</span></td><td>${esc(x.type)}</td>
        <td class="num">${esc(fmtDay(x.published))}</td><td class="num">${esc(fmtDate(x.closing))}</td><td><span class="pill ${st[0]}">${st[1]}</span></td>
        <td><a class="btn btn-light btn-sm" href="tender-detail.html?id=${encodeURIComponent(x.id)}" target="_blank" rel="noopener" data-stop>View</a></td></tr>`;
    }).join('') || '<tr><td colspan="6" class="empty">No tenders yet.</td></tr>';
  }
  function editTender(id) {
    const x = getContent('tenders').find(y => y.id === id) || { id: '', type: 'Works', method: 'Open national competitive bidding', published: new Date().toISOString().slice(0, 10), closing: '', opening: '', bidFee: '', bidSecurity: '', location: '', active: true, title: {}, description: {}, eligibility: [], submission: '', documents: [] };
    const body = `
      <div class="form-grid">
        ${field('tRef', 'Reference number', x.ref, { required: true })}
        <div class="field"><label for="tType">Type</label><select id="tType">${['Works', 'Goods', 'Consultancy', 'Services'].map(v => `<option ${x.type === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        ${field('tTitleEn', 'Title (English)', x.title.en, { full: true, required: true })}
        ${field('tTitleAm', 'Title (Amharic)', x.title.am, { full: true })}
        ${field('tMethod', 'Procurement method', x.method)}
        ${field('tLoc', 'Location', x.location)}
        ${field('tPub', 'Published', x.published, { type: 'date', required: true })}
        ${field('tClose', 'Closing date & time', toLocalDT(x.closing), { type: 'datetime-local', required: true })}
        ${field('tOpen', 'Bid opening date & time', toLocalDT(x.opening), { type: 'datetime-local' })}
        ${field('tFee', 'Bid document fee', x.bidFee)}
        ${field('tSec', 'Bid security', x.bidSecurity)}
        ${field('tDescEn', 'Description (English)', x.description.en, { full: true, area: true, rows: 4, required: true })}
        ${field('tDescAm', 'Description (Amharic)', x.description.am, { full: true, area: true, rows: 3 })}
        ${field('tElig', 'Eligibility requirements', (x.eligibility || []).join('\n'), { full: true, area: true, rows: 5, hint: 'One requirement per line.' })}
        ${field('tSubmit', 'Obtaining documents and submission', x.submission, { full: true, area: true, rows: 3 })}
        ${field('tDocs', 'Tender documents', (x.documents || []).join('\n'), { full: true, area: true, rows: 3, hint: 'One document name per line.' })}
        <label class="field full" style="display:flex;gap:8px;align-items:center;font-size:.86rem"><input type="checkbox" id="tActive" ${x.active !== false ? 'checked' : ''} style="width:auto"> Visible on the website</label>
      </div>
      <div class="err" id="cmsErr"></div>
      ${x.id ? `<div class="danger-zone"><button class="btn btn-red btn-sm" id="cmsDelete">Delete this tender</button></div>` : ''}`;
    openDrawer(x.id ? 'Edit tender' : 'Add tender', x.ref || 'New tender', body, footer(x.id ? 'Save changes' : 'Publish tender'));
    if (x.id) $('#cmsDelete').addEventListener('click', () => {
      if (!confirm('Delete this tender?')) return;
      saveContent('tenders', getContent('tenders').filter(y => y.id !== x.id)); closeDrawer(); refresh(); toast('Tender deleted');
    });
    wire(() => {
      if (!val('tRef') || !val('tTitleEn') || !val('tPub') || !val('tClose') || !val('tDescEn')) return showErr('Fill in the reference, English title, dates and description.');
      if (val('tOpen') && val('tOpen') < val('tClose')) return showErr('Bid opening cannot be before the closing time.');
      const item = { ...x, id: x.id || newId('t'), ref: val('tRef'), type: $('#tType').value, method: val('tMethod'), location: val('tLoc'),
        published: val('tPub'), closing: val('tClose'), opening: val('tOpen'), bidFee: val('tFee'), bidSecurity: val('tSec'),
        title: { en: val('tTitleEn'), am: val('tTitleAm') }, description: { en: val('tDescEn'), am: val('tDescAm') },
        eligibility: lines(val('tElig')), submission: val('tSubmit'), documents: lines(val('tDocs')), active: $('#tActive').checked };
      const all = getContent('tenders').filter(y => y.id !== item.id); all.push(item);
      saveContent('tenders', all); closeDrawer(); refresh(); toast(x.id ? 'Tender updated' : 'Tender published');
    });
  }

  /* =============================== VACANCIES =============================== */
  function renderVacancies(root) {
    const q = (root.querySelector('#cvQ')?.value || '').toLowerCase();
    if (!root.querySelector('#cvQ')) {
      root.innerHTML = toolbar('cvQ', 'Search vacancies…', 'vacancy') + `<div class="card"><div class="table-wrap"><table><thead><tr><th>Position</th><th>Department</th><th>Positions</th><th>Deadline</th><th>Status</th><th></th></tr></thead><tbody id="cvBody"></tbody></table></div></div>`;
      root.querySelector('#cvQ').addEventListener('input', () => renderVacancies(root));
    }
    const rows = getContent('vacancies').filter(x => !q || [x.title.en, x.dept].join(' ').toLowerCase().includes(q)).sort((a, b) => b.deadline.localeCompare(a.deadline));
    root.querySelector('#cvBody').innerHTML = rows.map(x => {
      const st = x.active === false ? ['inactive', 'Hidden'] : isOpen(x.deadline + 'T23:59') ? ['approved', 'Open'] : ['resolved', 'Closed'];
      return `<tr data-edit-vacancy="${esc(x.id)}"><td><span class="name">${esc(x.title.en)}</span><span class="sub">${esc(x.employment)}</span></td><td>${esc(x.dept)}</td>
        <td class="num">${esc(x.positions)}</td><td class="num">${esc(fmtDay(x.deadline))}</td><td><span class="pill ${st[0]}">${st[1]}</span></td>
        <td><a class="btn btn-light btn-sm" href="vacancy-detail.html?id=${encodeURIComponent(x.id)}" target="_blank" rel="noopener" data-stop>View</a></td></tr>`;
    }).join('') || '<tr><td colspan="6" class="empty">No vacancies yet.</td></tr>';
  }
  function editVacancy(id) {
    const x = getContent('vacancies').find(y => y.id === id) || { id: '', dept: '', location: 'Bureau head office', positions: 1, employment: 'Permanent', grade: '', salary: 'As per the civil service scale', deadline: '', active: true, title: {}, summary: {}, duties: [], qualifications: [], experience: '', howToApply: '' };
    const body = `
      <div class="form-grid">
        ${field('vTitleEn', 'Job title (English)', x.title.en, { required: true })}
        ${field('vTitleAm', 'Job title (Amharic)', x.title.am)}
        ${field('vDept', 'Department', x.dept, { required: true })}
        ${field('vLoc', 'Work place', x.location)}
        ${field('vPos', 'Number of positions', x.positions, { type: 'number' })}
        ${field('vEmp', 'Employment type', x.employment)}
        ${field('vGrade', 'Grade', x.grade)}
        ${field('vSalary', 'Salary', x.salary)}
        ${field('vDeadline', 'Application deadline', x.deadline, { type: 'date', required: true })}
        <div></div>
        ${field('vSumEn', 'About the role (English)', x.summary.en, { full: true, area: true, rows: 3, required: true })}
        ${field('vSumAm', 'About the role (Amharic)', x.summary.am, { full: true, area: true, rows: 2 })}
        ${field('vDuties', 'Main duties', (x.duties || []).join('\n'), { full: true, area: true, rows: 4, hint: 'One duty per line.' })}
        ${field('vQuals', 'Qualifications', (x.qualifications || []).join('\n'), { full: true, area: true, rows: 3, hint: 'One per line.' })}
        ${field('vExp', 'Experience', x.experience, { full: true })}
        ${field('vApply', 'How to apply', x.howToApply, { full: true, area: true, rows: 3, required: true })}
        <label class="field full" style="display:flex;gap:8px;align-items:center;font-size:.86rem"><input type="checkbox" id="vActive" ${x.active !== false ? 'checked' : ''} style="width:auto"> Visible on the website</label>
      </div>
      <div class="err" id="cmsErr"></div>
      ${x.id ? `<div class="danger-zone"><button class="btn btn-red btn-sm" id="cmsDelete">Delete this vacancy</button></div>` : ''}`;
    openDrawer(x.id ? 'Edit vacancy' : 'Add vacancy', x.dept || 'New vacancy', body, footer(x.id ? 'Save changes' : 'Publish vacancy'));
    if (x.id) $('#cmsDelete').addEventListener('click', () => {
      if (!confirm('Delete this vacancy?')) return;
      saveContent('vacancies', getContent('vacancies').filter(y => y.id !== x.id)); closeDrawer(); refresh(); toast('Vacancy deleted');
    });
    wire(() => {
      if (!val('vTitleEn') || !val('vDept') || !val('vDeadline') || !val('vSumEn') || !val('vApply')) return showErr('Fill in the English title, department, deadline, role description and how to apply.');
      const pos = Math.max(1, parseInt(val('vPos'), 10) || 1);
      const item = { ...x, id: x.id || newId('v'), dept: val('vDept'), location: val('vLoc'), positions: pos, employment: val('vEmp'), grade: val('vGrade'), salary: val('vSalary'),
        deadline: val('vDeadline'), title: { en: val('vTitleEn'), am: val('vTitleAm') }, summary: { en: val('vSumEn'), am: val('vSumAm') },
        duties: lines(val('vDuties')), qualifications: lines(val('vQuals')), experience: val('vExp'), howToApply: val('vApply'), active: $('#vActive').checked };
      const all = getContent('vacancies').filter(y => y.id !== item.id); all.push(item);
      saveContent('vacancies', all); closeDrawer(); refresh(); toast(x.id ? 'Vacancy updated' : 'Vacancy published');
    });
  }

  /* =============================== MESSAGES =============================== */
  let mFilter = 'all';
  function renderMessages(root) {
    if (!root.querySelector('#cmBody')) {
      root.innerHTML = `<div class="filter-row"><div class="seg" id="cmSeg"><button data-f="all" class="active">All</button><button data-f="unread">Unread</button></div><input type="search" id="cmQ" placeholder="Search name, email or text…"></div>
        <div class="card"><div class="table-wrap"><table><thead><tr><th>From</th><th>Subject</th><th>Message</th><th>Received</th></tr></thead><tbody id="cmBody"></tbody></table></div>
        <p class="demo-note" style="text-align:left">Messages sent from the Contact page. When the backend is running with SMTP settings, each message is also emailed to the Bureau inbox.</p></div>`;
      root.querySelector('#cmSeg').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; mFilter = b.dataset.f; root.querySelectorAll('#cmSeg button').forEach(x => x.classList.toggle('active', x === b)); renderMessages(root); });
      root.querySelector('#cmQ').addEventListener('input', () => renderMessages(root));
    }
    const q = root.querySelector('#cmQ').value.toLowerCase();
    const rows = getMessages().filter(m => (mFilter === 'all' || !m.read) && (!q || [m.name, m.email, m.subject, m.message].join(' ').toLowerCase().includes(q))).sort((a, b) => b.at.localeCompare(a.at));
    root.querySelector('#cmBody').innerHTML = rows.map(m => `
      <tr data-msg="${esc(m.id)}" style="${m.read ? '' : 'font-weight:600'}">
        <td><span class="name">${m.read ? '' : '<span class="unread-dot"></span>'}${esc(m.name)}</span><span class="sub">${esc(m.email)}</span></td>
        <td>${esc(m.subject)}</td><td class="sub" style="max-width:360px">${esc(m.message.length > 90 ? m.message.slice(0, 90) + '…' : m.message)}</td>
        <td class="sub">${esc(fmtDate(m.at))}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No messages.</td></tr>';
  }
  function openMessage(id) {
    const all = getMessages(), m = all.find(x => x.id === id); if (!m) return;
    if (!m.read) { m.read = true; saveMessages(all); refresh(); }
    const mailto = `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('Re: ' + m.subject)}&body=${encodeURIComponent(`\n\n---\nOn ${fmtDate(m.at)}, ${m.name} wrote:\n${m.message}`)}`;
    openDrawer(m.subject, `From ${m.name}`, `
      <div class="dr-sec"><div class="info-grid">
        <div><small>Name</small><b>${esc(m.name)}</b></div><div><small>Email</small><b>${esc(m.email)}</b></div><div><small>Phone</small><b>${esc(m.phone || '—')}</b></div>
        <div><small>Subject</small><b>${esc(m.subject)}</b></div><div><small>Received</small><b>${esc(fmtDate(m.at))}</b></div></div></div>
      <div class="dr-sec"><h4>Message</h4><p style="white-space:pre-wrap;font-size:.92rem;line-height:1.7">${esc(m.message)}</p></div>`,
      `<button class="btn btn-red" id="msgDel">Delete</button><button class="btn btn-light" id="msgUnread">Mark as unread</button><a class="btn btn-primary" href="${mailto}">${icon('i-out')}Reply by email</a>`);
    $('#msgDel').addEventListener('click', () => { if (!confirm('Delete this message?')) return; saveMessages(getMessages().filter(x => x.id !== id)); closeDrawer(); refresh(); toast('Message deleted'); });
    $('#msgUnread').addEventListener('click', () => { const a = getMessages(); a.find(x => x.id === id).read = false; saveMessages(a); closeDrawer(); refresh(); });
  }

  /* =============================== wiring =============================== */
  const views = {
    'web-news': { title: 'News', sub: 'Articles shown on the public website', render: renderNews },
    'web-tenders': { title: 'Tenders', sub: 'Procurement notices on the public website', render: renderTenders },
    'web-vacancies': { title: 'Vacancies', sub: 'Job announcements on the public website', render: renderVacancies },
    'messages': { title: 'Messages', sub: 'Messages from the website contact form', render: renderMessages }
  };
  let current = null;
  function refresh() { if (current) views[current].render(document.getElementById('view-' + current)); onChange && onChange(); }
  let onChange = null;

  document.addEventListener('click', e => {
    if (e.target.closest('[data-stop]')) return;
    const n = e.target.closest('[data-cms-new]');
    if (n) { ({ news: () => editNews(), tender: () => editTender(), vacancy: () => editVacancy() })[n.dataset.cmsNew](); return; }
    const a = e.target.closest('[data-edit-news]'); if (a) return editNews(a.dataset.editNews);
    const b = e.target.closest('[data-edit-tender]'); if (b) return editTender(b.dataset.editTender);
    const c = e.target.closest('[data-edit-vacancy]'); if (c) return editVacancy(c.dataset.editVacancy);
    const m = e.target.closest('[data-msg]'); if (m) return openMessage(m.dataset.msg);
  });

  return {
    views,
    render(v) { current = v; views[v].render(document.getElementById('view-' + v)); },
    unread: () => getMessages().filter(m => !m.read).length,
    onChange(fn) { onChange = fn; }
  };
}
