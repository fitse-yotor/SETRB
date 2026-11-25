import "../css/admin.css";
import "./admin-data.js";
import { createCMS } from "./admin-cms.js";
import { requestSummary, mdToHtml } from "./admin-ai.js";
import { currentUser, logout, getUsers, saveUsers, getComplaints, saveComplaints, REGIONS, ROLES, COMPLAINT_TYPES, COMPLAINT_STATUS, scopeLabel, resetShared, fmtDate } from "./shared.js";
(function () {
  'use strict';
  const ME = currentUser();
  if (!ME) { location.replace('login.html'); return; }
  const D = window.ADMIN_DATA;
  const { MONTHS, CUR } = D;
  const STEPS = ['Contractor / Woreda', 'Consultant', 'Zone office', 'Bureau'];
  const ROLE_STAGE = { consultant: 1, zone: 2, bureau: 3 };
  const STATUS_LABEL = { 'on-track': 'On track', 'at-risk': 'At risk', delayed: 'Delayed', done: 'Completed' };
  const STATUS_ICON = { 'on-track': 'i-check', 'at-risk': 'i-clock', delayed: 'i-alert', done: 'i-flag' };
  const STATUS_COLOR = { 'on-track': 'var(--st-ok)', 'at-risk': 'var(--st-warn)', delayed: 'var(--st-bad)', done: 'var(--st-done)' };
  const KEY = 'pm-demo-v2';

  /* ---------------- helpers ---------------- */
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls = 'i') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
  const pct = v => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '') + '%';
  const etb = m => m >= 1000 ? (m / 1000).toFixed(2) + ' B ETB' : m.toLocaleString() + ' M ETB';
  const birr = n => 'ETB ' + Math.round(n).toLocaleString();
  const r1 = v => Math.round(v * 10) / 10;

  /* ---------------- state ---------------- */
  let state;
  function freshState() { return { reports: structuredClone(D.reports), issues: structuredClone(D.issues) }; }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.reports) return s; } catch (e) {}
    return freshState();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ reports: state.reports.map(r => ({ ...r, localPhotos: undefined })), issues: state.issues })); } catch (e) {}
  }
  state = load();
  const role = ME.role;
  const SUBMITTERS = ['contractor', 'woreda'];
  const canSubmit = SUBMITTERS.includes(role);

  /* ---------------- scope: what this account may see ---------------- */
  const inScope = p => role === 'bureau' ||
    (role === 'zone' && p.zone === ME.zone) ||
    (role === 'woreda' && p.zone === ME.zone && p.woreda === ME.woreda) ||
    (role === 'consultant' && p.consultant === ME.org) ||
    (role === 'contractor' && p.contractor === ME.org);
  const PROJECTS = D.projects.filter(inScope);
  const visible = id => PROJECTS.some(p => p.id === id);
  const myReports = () => state.reports.filter(r => visible(r.projectId));
  const complaintInScope = c => role === 'bureau' || (role === 'zone' && c.zone === ME.zone) || (role === 'woreda' && c.zone === ME.zone && c.woreda === ME.woreda);
  const canComplaints = ['bureau', 'zone', 'woreda'].includes(role);
  const canAccounts = ['bureau', 'zone'].includes(role);
  const canCMS = role === 'bureau';

  /* ---------------- derived project metrics ---------------- */
  const projById = id => D.projects.find(p => p.id === id);
  function metrics(p) {
    const reps = state.reports.filter(r => r.projectId === p.id);
    const approved = reps.filter(r => r.status === 'approved').sort((a, b) => b.month - a.month);
    const last = approved[0];
    const physical = last ? last.physCum : p.actual[0];
    const financial = last ? last.finCum : physical;
    const lastMonth = last ? last.month : 0;
    const planned = p.plan[lastMonth];
    const variance = r1(physical - planned);
    let status = physical >= 100 ? 'done' : variance >= -3 ? 'on-track' : variance >= -8 ? 'at-risk' : 'delayed';
    const current = reps.find(r => r.month === CUR);
    // actual series: approved values, carried forward where the current month isn't approved yet
    const series = MONTHS.slice(0, CUR + 1).map((_, m) => {
      const a = approved.find(r => r.month === m);
      if (a) return a.physCum;
      if (m <= lastMonth) return p.actual[m];
      return physical;
    });
    return { physical, financial, planned, variance, status, last, current, lastMonth, series };
  }
  const allMetrics = () => PROJECTS.map(p => ({ p, m: metrics(p) }));

  /* ---------------- toast ---------------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.querySelector('span').textContent = msg;
    t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------------- filters (dashboard) ---------------- */
  const uniq = k => [...new Set(PROJECTS.map(p => p[k]))].sort();
  function fillSelect(sel, label, vals) {
    sel.innerHTML = `<option value="all">All ${label}</option>` + vals.map(v => `<option>${esc(v)}</option>`).join('');
  }
  fillSelect($('#fZone'), 'zones', uniq('zone'));
  fillSelect($('#fFund'), 'funding sources', uniq('fund'));
  fillSelect($('#fType'), 'project types', uniq('type'));
  fillSelect($('#pZone'), 'zones', uniq('zone'));
  ['#fZone', '#fFund', '#fType'].forEach(s => $(s).addEventListener('change', renderDashboard));

  function filtered() {
    const z = $('#fZone').value, f = $('#fFund').value, t = $('#fType').value;
    return allMetrics().filter(({ p }) => (z === 'all' || p.zone === z) && (f === 'all' || p.fund === f) && (t === 'all' || p.type === t));
  }

  /* =================================================================
     DASHBOARD
     ================================================================= */
  function renderDashboard() {
    const list = filtered();
    const totalV = list.reduce((s, x) => s + x.p.value, 0) || 1;
    const wAvg = k => list.reduce((s, x) => s + x.m[k] * x.p.value, 0) / totalV;
    const pending = state.reports.filter(r => r.status === 'pending' && list.some(x => x.p.id === r.projectId));
    const delayed = list.filter(x => x.m.status === 'delayed').length;
    const km = list.reduce((s, x) => s + x.p.km, 0);

    $('#kpis').innerHTML = [
      ['Active projects', list.filter(x => x.m.status !== 'done').length, `${r1(km)} km · ${etb(totalV)}`, 'i-road', 'k-blue'],
      ['Avg physical progress', pct(wAvg('physical')), `Plan: ${pct(wAvg('planned'))} · value-weighted`, 'i-chart', 'k-green'],
      ['Avg financial progress', pct(wAvg('financial')), 'Paid against contract value', 'i-money', 'k-navy'],
      ['Delayed projects', delayed, 'More than 8 pts behind plan', 'i-alert', 'k-red'],
      ['Reports pending', pending.length, `For ${MONTHS[CUR]} ${D.FY}`, 'i-doc', 'k-gold']
    ].map(([l, v, s, ic, c]) => `<div class="kpi"><div class="k-top">${esc(l)}<span class="k-ic ${c}">${icon(ic)}</span></div><strong class="num">${esc(v)}</strong><span class="k-sub">${esc(s)}</span></div>`).join('');

    renderSCurve(list);
    renderStatus(list);
    renderZoneChart(list);

    // pending list
    $('#pendingList').innerHTML = pending.length ? pending.slice(0, 5).map(r => {
      const p = projById(r.projectId);
      return `<div class="list-item" data-report="${r.id}" style="cursor:pointer">
        <span class="li-ic k-gold">${icon('i-doc')}</span>
        <div><h4>${esc(p.name)}</h4><p>${esc(r.id)} · ${esc(MONTHS[r.month])} · waiting on ${esc(STEPS[r.stage])}</p></div>
        <div class="right"><b class="num">+${pct(r.physThis)}</b></div></div>`;
    }).join('') : '<div class="empty">No reports waiting. All caught up.</div>';

    // alerts
    const alerts = [];
    list.filter(x => x.m.status === 'delayed').forEach(x => alerts.push(['i-alert', 'k-red', `${x.p.name} is ${Math.abs(x.m.variance)} pts behind plan`, `${x.p.zone} · ${x.p.contractor}`]));
    state.reports.filter(r => r.status === 'returned' && list.some(x => x.p.id === r.projectId)).forEach(r => alerts.push(['i-undo', 'k-gold', `${r.id} returned, awaiting resubmission`, projById(r.projectId).name]));
    state.issues.filter(i => i.status === 'open' && i.sev === 'high' && list.some(x => x.p.id === i.projectId)).forEach(i => alerts.push(['i-flag', 'k-red', i.title, `${projById(i.projectId).name} · due ${i.due}`]));
    list.filter(x => x.m.financial - x.m.physical > 8).forEach(x => alerts.push(['i-money', 'k-navy', `Payments ahead of physical progress by ${r1(x.m.financial - x.m.physical)} pts`, x.p.name]));
    $('#alertList').innerHTML = alerts.length ? alerts.slice(0, 6).map(([ic, c, t, s]) =>
      `<div class="list-item"><span class="li-ic ${c}">${icon(ic)}</span><div><h4>${esc(t)}</h4><p>${esc(s)}</p></div></div>`).join('') : '<div class="empty">No alerts for this selection.</div>';

    // most delayed
    const worst = [...list].filter(x => x.m.status !== 'done').sort((a, b) => a.m.variance - b.m.variance).slice(0, 5);
    $('#delayedList').innerHTML = worst.map(x => `
      <div class="list-item" data-project="${x.p.id}" style="cursor:pointer">
        <div style="flex:1;min-width:0"><h4>${esc(x.p.name)}</h4><p>${esc(x.p.zone)} · actual ${pct(x.m.physical)} vs plan ${pct(x.m.planned)}</p></div>
        <div class="right"><span class="${x.m.variance < 0 ? 'var-neg' : 'var-pos'} num">${x.m.variance > 0 ? '+' : ''}${x.m.variance}</span>${statusPill(x.m.status)}</div>
      </div>`).join('') || '<div class="empty">No projects.</div>';
  }

  const statusPill = s => `<span class="pill ${s}">${icon(STATUS_ICON[s])}${STATUS_LABEL[s]}</span>`;

  /* ---------------- tooltip helper ---------------- */
  function tipFor(container) {
    let t = container.querySelector('.tip');
    if (!t) { t = document.createElement('div'); t.className = 'tip'; container.appendChild(t); }
    return {
      show(x, y, head, rows) {
        t.innerHTML = '';
        const h = document.createElement('div'); h.className = 't-h'; h.textContent = head; t.appendChild(h);
        rows.forEach(([color, val, name, dash]) => {
          const r = document.createElement('div'); r.className = 't-r';
          const i = document.createElement('i'); i.style.borderColor = color; if (dash) i.style.borderTopStyle = 'dashed';
          const b = document.createElement('b'); b.textContent = val;
          const s = document.createElement('span'); s.textContent = name;
          r.append(i, b, s); t.appendChild(r);
        });
        const cw = container.clientWidth, tw = t.offsetWidth;
        t.style.left = Math.max(0, Math.min(cw - tw, x + 14)) + 'px';
        t.style.top = Math.max(0, y - 10) + 'px';
        t.classList.add('show');
      },
      hide() { t.classList.remove('show'); }
    };
  }

  /* ---------------- S-curve ---------------- */
  function renderSCurve(list) {
    const el = $('#sCurve');
    const W = Math.max(300, el.clientWidth), H = W < 500 ? 220 : 270;
    const pad = { l: 36, r: 64, t: 14, b: 28 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const totalV = list.reduce((s, x) => s + x.p.value, 0) || 1;
    const plan = MONTHS.map((_, m) => list.reduce((s, x) => s + x.p.plan[m] * x.p.value, 0) / totalV);
    const actual = MONTHS.slice(0, CUR + 1).map((_, m) => list.reduce((s, x) => s + x.m.series[m] * x.p.value, 0) / totalV);
    const x = i => pad.l + (iw * i) / 11;
    const y = v => pad.t + ih - (ih * v) / 100;
    const path = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const short = W < 560;
    let g = '';
    [0, 25, 50, 75, 100].forEach(v => { g += `<line class="grid-line" x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-text" x="${pad.l - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; });
    MONTHS.forEach((m, i) => { if (!short || i % 2 === 0) g += `<text class="axis-text" x="${x(i)}" y="${H - 8}" text-anchor="middle">${short ? m.slice(0, 3) : m}</text>`; });
    const area = `${path(actual)}L${x(CUR)},${y(0)}L${x(0)},${y(0)}Z`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Planned versus actual cumulative physical progress">
      ${g}
      <path d="${area}" fill="var(--s-actual)" opacity=".08"/>
      <path d="${path(plan)}" fill="none" stroke="var(--s-plan)" stroke-width="2" stroke-dasharray="6 5"/>
      <path d="${path(actual)}" fill="none" stroke="var(--s-actual)" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="${x(CUR)}" cy="${y(actual[CUR])}" r="5" fill="var(--s-actual)" stroke="#fff" stroke-width="2"/>
      <text class="lbl" x="${x(11) + 8}" y="${y(plan[11]) + 4}">Plan ${Math.round(plan[11])}%</text>
      <text class="lbl" x="${x(CUR) + 10}" y="${y(actual[CUR]) + 16}">Actual ${Math.round(actual[CUR])}%</text>
      <line id="sc-x" x1="0" x2="0" y1="${pad.t}" y2="${pad.t + ih}" stroke="#9aa6b8" stroke-width="1" opacity="0"/>
      <rect class="hit" x="${pad.l}" y="${pad.t}" width="${iw}" height="${ih}"/>
    </svg>`;
    const tip = tipFor(el), hair = el.querySelector('#sc-x'), hit = el.querySelector('.hit');
    const move = e => {
      const rect = el.querySelector('svg').getBoundingClientRect();
      const px = (e.clientX - rect.left) * (W / rect.width);
      const i = Math.max(0, Math.min(11, Math.round(((px - pad.l) / iw) * 11)));
      hair.setAttribute('x1', x(i)); hair.setAttribute('x2', x(i)); hair.setAttribute('opacity', 1);
      const rows = [['var(--s-plan)', pct(plan[i]), 'Planned', true]];
      if (i <= CUR) rows.unshift(['var(--s-actual)', pct(actual[i]), 'Actual']);
      if (i <= CUR) rows.push(['transparent', (actual[i] - plan[i] > 0 ? '+' : '') + r1(actual[i] - plan[i]) + ' pts', 'Variance']);
      tip.show(x(i) * rect.width / W, (y(Math.max(plan[i], i <= CUR ? actual[i] : 0))) * rect.height / H, `${MONTHS[i]} ${D.FY}`, rows);
    };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerleave', () => { tip.hide(); hair.setAttribute('opacity', 0); });
  }

  /* ---------------- Status breakdown ---------------- */
  function renderStatus(list) {
    const order = ['on-track', 'at-risk', 'delayed', 'done'];
    const counts = order.map(s => [s, list.filter(x => x.m.status === s).length]);
    const n = list.length || 1;
    $('#statusSub').textContent = `${list.length} projects in selection`;
    $('#statusBar').innerHTML = counts.filter(c => c[1]).map(([s, c]) =>
      `<div style="flex:${c};background:${STATUS_COLOR[s]}" title="${STATUS_LABEL[s]}: ${c}" data-status="${s}"></div>`).join('');
    $('#statusList').innerHTML = counts.map(([s, c]) =>
      `<div class="row">${statusPill(s)}<span style="color:var(--muted);font-size:.78rem">${Math.round(c / n * 100)}%</span><b class="num">${c}</b></div>`).join('');
    $$('#statusBar div').forEach(d => d.addEventListener('click', () => {
      $('#pStatus').value = d.dataset.status; location.hash = '#projects';
    }));
  }

  /* ---------------- Zone chart (grouped horizontal bars) ---------------- */
  function renderZoneChart(list) {
    const el = $('#zoneChart');
    const zones = [...new Set(list.map(x => x.p.zone))];
    const data = zones.map(z => {
      const ps = list.filter(x => x.p.zone === z), v = ps.reduce((s, x) => s + x.p.value, 0) || 1;
      return { z, n: ps.length, phys: ps.reduce((s, x) => s + x.m.physical * x.p.value, 0) / v, fin: ps.reduce((s, x) => s + x.m.financial * x.p.value, 0) / v };
    }).sort((a, b) => b.phys - a.phys);
    const W = Math.max(300, el.clientWidth), labelW = W < 500 ? 78 : 100, pad = { r: 44, t: 4, b: 22 };
    const bh = 10, gap = 2, rowH = bh * 2 + gap + 16;
    const H = pad.t + data.length * rowH + pad.b;
    const iw = W - labelW - pad.r;
    const x = v => labelW + iw * v / 100;
    const bar = (yy, v, color, cls) => {
      const w = Math.max(2, iw * v / 100);
      // 4px rounded data-end, square at the baseline
      return `<path class="bar ${cls}" d="M${labelW},${yy}h${w - 4}a4,4 0 0 1 4,4v${bh - 8}a4,4 0 0 1 -4,4h${-(w - 4)}z" fill="${color}"/>`;
    };
    let s = '';
    [0, 25, 50, 75, 100].forEach(v => { s += `<line class="grid-line" x1="${x(v)}" x2="${x(v)}" y1="${pad.t}" y2="${H - pad.b}"/><text class="axis-text" x="${x(v)}" y="${H - 6}" text-anchor="middle">${v}</text>`; });
    data.forEach((d, i) => {
      const y0 = pad.t + i * rowH + 6;
      s += `<g data-i="${i}">
        <text class="axis-text" x="${labelW - 10}" y="${y0 + bh + 4}" text-anchor="end" style="fill:var(--ink);font-weight:600">${esc(d.z)}</text>
        ${bar(y0, d.phys, 'var(--s-phys)', '')}${bar(y0 + bh + gap, d.fin, 'var(--s-fin)', '')}
        <text class="lbl" x="${x(d.phys) + 6}" y="${y0 + 9}">${Math.round(d.phys)}%</text>
        <rect class="hit" x="0" y="${y0 - 6}" width="${W}" height="${rowH}"/></g>`;
    });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Average physical and financial progress by zone">${s}</svg>`;
    const tip = tipFor(el);
    el.querySelectorAll('g[data-i]').forEach(g => {
      const d = data[+g.dataset.i];
      const hit = g.querySelector('.hit');
      hit.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.querySelectorAll('.bar').forEach(b => b.classList.toggle('dim', !g.contains(b)));
        tip.show(e.clientX - r.left, e.clientY - r.top, `${d.z} · ${d.n} project${d.n > 1 ? 's' : ''}`,
          [['var(--s-phys)', pct(d.phys), 'Physical'], ['var(--s-fin)', pct(d.fin), 'Financial']]);
      });
      hit.addEventListener('pointerleave', () => { tip.hide(); el.querySelectorAll('.bar').forEach(b => b.classList.remove('dim')); });
    });
  }

  /* =================================================================
     PROJECTS TABLE
     ================================================================= */
  let sortKey = 'variance', sortDir = 1;
  function renderProjects() {
    const q = ($('#pSearch').value || '').toLowerCase(), z = $('#pZone').value, st = $('#pStatus').value;
    let rows = allMetrics().filter(({ p, m }) =>
      (z === 'all' || p.zone === z) && (st === 'all' || m.status === st) &&
      (!q || [p.name, p.zone, p.contractor, p.id].join(' ').toLowerCase().includes(q)));
    const val = ({ p, m }) => ({ name: p.name, zone: p.zone, value: p.value, physical: m.physical, financial: m.financial, variance: m.variance, status: m.status, last: m.lastMonth })[sortKey];
    rows.sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sortDir);
    $$('#projTable th').forEach(th => th.querySelector('.arr').textContent = th.dataset.sort === sortKey ? (sortDir > 0 ? '▲' : '▼') : '');
    $('#projTable tbody').innerHTML = rows.map(({ p, m }) => `
      <tr data-project="${p.id}">
        <td><span class="name">${esc(p.name)}</span><span class="sub">${esc(p.id)} · ${esc(p.type)} · ${esc(p.contractor)}</span></td>
        <td>${esc(p.zone)}</td>
        <td class="num">${etb(p.value)}</td>
        <td>${mini(m.physical, 'var(--s-phys)')}</td>
        <td>${mini(m.financial, 'var(--s-fin)')}</td>
        <td class="num ${m.variance < 0 ? 'var-neg' : 'var-pos'}">${m.variance > 0 ? '+' : ''}${m.variance} pts</td>
        <td>${statusPill(m.status)}</td>
        <td><span class="sub">${esc(MONTHS[m.lastMonth])}</span>${m.current && m.current.status !== 'approved' ? `<br><span class="pill ${m.current.status}">${m.current.status === 'pending' ? 'Hidar pending' : 'Returned'}</span>` : ''}</td>
      </tr>`).join('') || `<tr><td colspan="8" class="empty">No projects match.</td></tr>`;
  }
  const mini = (v, c) => `<div class="mini"><div class="track"><span style="width:${Math.min(100, v)}%;background:${c}"></span></div><b class="num">${Math.round(v)}%</b></div>`;
  $$('#projTable th[data-sort]').forEach(th => th.addEventListener('click', () => {
    if (sortKey === th.dataset.sort) sortDir *= -1; else { sortKey = th.dataset.sort; sortDir = 1; }
    renderProjects();
  }));
  ['#pSearch', '#pZone', '#pStatus'].forEach(s => $(s).addEventListener('input', renderProjects));

  /* =================================================================
     REPORTS
     ================================================================= */
  let rTab = 'pending';
  function renderReports() {
    const q = ($('#rSearch').value || '').toLowerCase();
    const mine = myReports();
    const counts = { pending: 0, returned: 0, approved: 0, all: mine.length };
    mine.forEach(r => counts[r.status]++);
    $$('#rTabs button').forEach(b => { b.classList.toggle('active', b.dataset.tab === rTab); b.querySelector('.c').textContent = counts[b.dataset.tab]; });
    const rows = mine.filter(r => (rTab === 'all' || r.status === rTab) &&
      (!q || [r.id, projById(r.projectId).name, r.submittedBy].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => b.month - a.month || (a.status === 'pending' ? -1 : 1));
    $('#repTable tbody').innerHTML = rows.map(r => {
      const p = projById(r.projectId);
      return `<tr data-report="${r.id}">
        <td><span class="name">${esc(r.id)}</span><span class="sub">${esc(r.submittedBy)}</span></td>
        <td><span class="name" style="font-weight:500">${esc(p.name)}</span><span class="sub">${esc(p.zone)}</span></td>
        <td>${esc(MONTHS[r.month])}</td>
        <td class="num"><b>+${pct(r.physThis)}</b></td>
        <td>${mini(r.physCum, 'var(--s-phys)')}</td>
        <td>${r.status === 'approved' ? '<span class="sub">Complete</span>' : r.status === 'returned' ? '<span class="sub">With contractor</span>' : `<span class="sub">${esc(STEPS[r.stage])}</span>`}</td>
        <td><span class="pill ${r.status}">${r.status[0].toUpperCase() + r.status.slice(1)}</span></td>
        <td class="sub">${esc(r.submitted)}</td></tr>`;
    }).join('') || `<tr><td colspan="8" class="empty">No reports in this list.</td></tr>`;
    updateBadges();
  }
  $('#rTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { rTab = b.dataset.tab; renderReports(); } });
  $('#rSearch').addEventListener('input', renderReports);

  function updateBadges() {
    const n = myReports().filter(r => r.status === 'pending' && (role === 'bureau' || ROLE_STAGE[role] === r.stage || role === 'woreda' || role === 'contractor')).length;
    $('#navPending').textContent = n; $('#navPending').style.display = n ? '' : 'none';
    const iN = state.issues.filter(i => i.status === 'open' && visible(i.projectId)).length;
    const cN = canComplaints ? getComplaints().filter(c => complaintInScope(c) && ['received', 'assigned'].includes(c.status)).length : 0;
    $('#navComplaints').textContent = cN; $('#navComplaints').style.display = cN ? '' : 'none';
    const mN = canCMS ? CMS.unread() : 0;
    $('#navMessages').textContent = mN; $('#navMessages').style.display = mN ? '' : 'none';
    $('#navIssues').textContent = iN; $('#navIssues').style.display = iN ? '' : 'none';
  }

  /* =================================================================
     ISSUES
     ================================================================= */
  let iFilter = 'open';
  function renderIssues() {
    const sev = $('#iSev').value;
    const order = { high: 0, medium: 1, low: 2 };
    const rows = state.issues.filter(i => visible(i.projectId) && (iFilter === 'all' || i.status === iFilter) && (sev === 'all' || i.sev === sev)).sort((a, b) => order[a.sev] - order[b.sev]);
    $('#issueTable tbody').innerHTML = rows.map(i => `
      <tr data-project="${i.projectId}">
        <td><span class="name">${esc(i.title)}</span><span class="sub">${esc(i.id)}</span></td>
        <td class="sub">${esc(projById(i.projectId).name)}</td>
        <td>${esc(i.cat)}</td>
        <td><span class="pill ${i.sev}">${i.sev[0].toUpperCase() + i.sev.slice(1)}</span></td>
        <td>${esc(i.owner)}</td>
        <td class="num">${esc(i.due)}</td>
        <td><span class="pill ${i.status === 'open' ? 'pending' : 'resolved'}">${i.status === 'open' ? 'Open' : 'Resolved'}</span></td>
        <td>${i.status === 'open' ? `<button class="btn btn-light btn-sm" data-resolve="${i.id}">${icon('i-check')}Resolve</button>` : ''}</td>
      </tr>`).join('') || `<tr><td colspan="8" class="empty">No issues.</td></tr>`;
  }
  $('#iSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; iFilter = b.dataset.f; $$('#iSeg button').forEach(x => x.classList.toggle('active', x === b)); renderIssues(); });
  $('#iSev').addEventListener('change', renderIssues);
  $('#issueTable').addEventListener('click', e => {
    const b = e.target.closest('[data-resolve]'); if (!b) return;
    e.stopPropagation();
    state.issues.find(i => i.id === b.dataset.resolve).status = 'resolved';
    save(); renderIssues(); updateBadges(); toast('Issue marked as resolved');
  });

  /* =================================================================
     CONTRACTORS
     ================================================================= */
  function renderContractors() {
    const by = {};
    allMetrics().forEach(({ p, m }) => { (by[p.contractor] = by[p.contractor] || []).push({ p, m }); });
    const rows = Object.entries(by).map(([c, xs]) => {
      const reps = state.reports.filter(r => xs.some(x => x.p.id === r.projectId));
      const onTime = reps.filter(r => r.status !== 'returned').length / (reps.length || 1);
      const avgVar = xs.reduce((s, x) => s + x.m.variance, 0) / xs.length;
      return { c, n: xs.length, value: xs.reduce((s, x) => s + x.p.value, 0), phys: xs.reduce((s, x) => s + x.m.physical, 0) / xs.length, avgVar: r1(avgVar), onTime };
    }).sort((a, b) => b.avgVar - a.avgVar);
    $('#conTable tbody').innerHTML = rows.map((r, i) => {
      const stars = r.avgVar >= -3 ? 5 : r.avgVar >= -8 ? 4 : r.avgVar >= -15 ? 3 : r.avgVar >= -25 ? 2 : 1;
      return `<tr style="cursor:default">
        <td class="num"><b>${i + 1}</b></td>
        <td><span class="name">${esc(r.c)}</span></td>
        <td class="num">${r.n}</td>
        <td class="num">${etb(r.value)}</td>
        <td>${mini(r.phys, 'var(--s-phys)')}</td>
        <td class="num ${r.avgVar < 0 ? 'var-neg' : 'var-pos'}">${r.avgVar > 0 ? '+' : ''}${r.avgVar} pts</td>
        <td class="num">${Math.round(r.onTime * 100)}%</td>
        <td aria-label="${stars} of 5"><span style="color:var(--gold);letter-spacing:2px">${'★'.repeat(stars)}</span><span style="color:#d5dbe5;letter-spacing:2px">${'★'.repeat(5 - stars)}</span></td>
      </tr>`;
    }).join('');
  }

  /* =================================================================
     DRAWER
     ================================================================= */
  function openDrawer(title, sub, body, foot) {
    $('#drTitle').textContent = title; $('#drSub').textContent = sub;
    $('#drBody').innerHTML = body; $('#drFoot').innerHTML = foot || '';
    $('#drFoot').style.display = foot ? '' : 'none';
    $('#drawer').classList.add('show'); $('#overlay').classList.add('show');
    $('#drBody').scrollTop = 0;
  }
  function closeDrawer() {
    $('#drawer').classList.remove('show'); $('#overlay').classList.remove('show');
    document.body.classList.remove('nav-open');
    if (location.hash === '#new') history.replaceState(null, '', '#' + (currentView || 'dashboard'));
  }
  $('#drClose').addEventListener('click', closeDrawer);
  $('#overlay').addEventListener('click', closeDrawer);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  const photoHTML = (r, p) => (r.localPhotos || r.photos.map(n => `assets/img/news/${n}.jpg`)).map((src, k) =>
    `<div class="photo"><img src="${esc(src)}" alt="Site photo ${k + 1}"><span class="geo">${icon('i-pin')}${p.lat}, ${p.lng} · ${esc(MONTHS[r.month])}</span></div>`).join('');

  function stepper(r) {
    return `<div class="stepper">${STEPS.map((s, i) => {
      let c = '';
      if (r.status === 'approved' || i < r.stage) c = 'done';
      else if (r.status === 'returned' && i === 0) c = 'rejected';
      else if (i === r.stage) c = 'current';
      return `<div class="step ${c}"><div class="dot">${c === 'done' ? '✓' : c === 'rejected' ? '!' : i + 1}</div>${s}</div>`;
    }).join('')}</div>`;
  }

  /* ---------- project drawer ---------- */
  function openProject(id) {
    const p = projById(id), m = metrics(p);
    const reps = state.reports.filter(r => r.projectId === id).sort((a, b) => b.month - a.month);
    const lastItems = (m.last || reps[0]).items;
    const issues = state.issues.filter(i => i.projectId === id);
    const body = `
      <div class="dr-sec">${statusPill(m.status)}</div>
      <div class="dr-sec"><div class="info-grid">
        <div><small>Zone / Woreda</small><b>${esc(p.zone)} · ${esc(p.woreda)}</b></div>
        <div><small>Type</small><b>${esc(p.type)}</b></div>
        <div><small>Length</small><b>${p.km} km</b></div>
        <div><small>Contract value</small><b>${etb(p.value)}</b></div>
        <div><small>Funding</small><b>${esc(p.fund)}</b></div>
        <div><small>Completion</small><b>${esc(p.end)}</b></div>
        <div><small>Contractor</small><b>${esc(p.contractor)}</b></div>
        <div><small>Consultant</small><b>${esc(p.consultant)}</b></div>
        <div><small>Location</small><b>${p.lat}, ${p.lng}</b></div>
      </div></div>
      <div class="dr-sec"><h4>Progress (as of ${esc(MONTHS[m.lastMonth])})</h4><div class="big-bars">
        <div><div class="lbl"><span>Physical</span><span class="num">${pct(m.physical)}</span></div><div class="track"><span style="width:${m.physical}%;background:var(--s-phys)"></span><em style="left:${m.planned}%" title="Planned"></em></div><small>Planned ${pct(m.planned)} (black marker) · variance ${m.variance > 0 ? '+' : ''}${m.variance} pts</small></div>
        <div><div class="lbl"><span>Financial</span><span class="num">${pct(m.financial)}</span></div><div class="track"><span style="width:${m.financial}%;background:var(--s-fin)"></span></div><small>${birr(p.value * 1e6 * m.financial / 100)} paid of ${etb(p.value)}</small></div>
      </div></div>
      <div class="dr-sec"><h4>Work items (cumulative)</h4>
        <table class="wi-table"><thead><tr><th>Item</th><th>Weight</th><th>Progress</th></tr></thead><tbody>
        ${lastItems.map(it => `<tr><td>${esc(it.name)}</td><td class="num">${it.weight}%</td><td>${mini(it.now, 'var(--s-phys)')}</td></tr>`).join('')}
        </tbody></table></div>
      <div class="dr-sec"><h4>Report history</h4><div class="timeline">
        ${reps.map(r => `<div class="tl ${r.status === 'approved' ? 'ok' : r.status === 'returned' ? 'bad' : ''}"><b>${esc(r.id)} · ${esc(MONTHS[r.month])}</b> <span class="pill ${r.status}">${r.status}</span><p>+${pct(r.physThis)} this month · cumulative ${pct(r.physCum)} · submitted ${esc(r.submitted)}</p></div>`).join('')}
      </div></div>
      <div class="dr-sec"><h4>Issues</h4>${issues.length ? issues.map(i => `<div class="list-item"><span class="li-ic ${i.sev === 'high' ? 'k-red' : i.sev === 'medium' ? 'k-gold' : 'k-blue'}">${icon('i-flag')}</span><div><h4>${esc(i.title)}</h4><p>${esc(i.owner)} · due ${esc(i.due)}</p></div><div class="right"><span class="pill ${i.status === 'open' ? i.sev : 'resolved'}">${i.status}</span></div></div>`).join('') : '<p class="sub" style="color:var(--muted)">No issues logged.</p>'}</div>
      <div class="dr-sec"><h4>Latest site photos</h4><div class="photos">${photoHTML(reps[0], p)}</div></div>`;
    const foot = `${m.current && m.current.status !== 'approved' ? `<button class="btn btn-light" data-report="${m.current.id}">${icon('i-doc')}Open ${esc(MONTHS[CUR])} report</button>` : ''}
      ${canSubmit ? `<button class="btn btn-primary" data-new="${p.id}">${icon('i-plus')}New report</button>` : ''}`;
    openDrawer(p.name, `${p.id} · ${p.woreda} Woreda · ${p.zone} Zone`, body, foot.trim());
  }

  /* ---------- report review drawer ---------- */
  function openReport(id) {
    const r = state.reports.find(x => x.id === id), p = projById(r.projectId);
    const canAct = r.status === 'pending' && ROLE_STAGE[role] === r.stage;
    const canResubmit = r.status === 'returned' && canSubmit;
    const body = `
      <div class="dr-sec"><button class="btn btn-light btn-sm" id="aiReportBtn">${icon('i-spark')}Summarize with AI</button><div id="aiReportOut" class="ai-out hidden" style="margin-top:12px"></div></div>
      <div class="dr-sec"><h4>Approval workflow</h4>${stepper(r)}
        ${r.status === 'pending' && !canAct ? `<p style="font-size:.78rem;color:var(--muted);margin-top:8px">Waiting on <b>${esc(STEPS[r.stage])}</b>. Only that office can act on this report now.</p>` : ''}
      </div>
      <div class="dr-sec"><div class="info-grid">
        <div><small>This month</small><b class="num">+${pct(r.physThis)}</b></div>
        <div><small>Cumulative physical</small><b class="num">${pct(r.physCum)}</b></div>
        <div><small>Cumulative financial</small><b class="num">${pct(r.finCum)}</b></div>
        <div><small>Amount certified</small><b class="num">${birr(r.certified)}</b></div>
        <div><small>Planned to date</small><b class="num">${pct(p.plan[r.month])}</b></div>
        <div><small>Variance</small><b class="num ${r.physCum - p.plan[r.month] < 0 ? 'var-neg' : 'var-pos'}">${r1(r.physCum - p.plan[r.month])} pts</b></div>
        <div><small>Weather</small><b>${esc(r.weather)}</b></div>
        <div><small>Labour on site</small><b class="num">${r.labour}</b></div>
        <div><small>Equipment</small><b class="num">${r.equipment} units</b></div>
      </div></div>
      <div class="dr-sec"><h4>Work items</h4>
        <table class="wi-table"><thead><tr><th>Item</th><th>Weight</th><th>Previous</th><th>This month</th><th>Cumulative</th></tr></thead><tbody>
        ${r.items.map(it => `<tr><td>${esc(it.name)}</td><td class="num">${it.weight}%</td><td class="num">${pct(it.prev)}</td><td class="num"><b>+${pct(r1(it.now - it.prev))}</b></td><td>${mini(it.now, 'var(--s-phys)')}</td></tr>`).join('')}
        </tbody></table></div>
      <div class="dr-sec"><h4>Contractor's narrative</h4><p style="font-size:.88rem">${esc(r.narrative)}</p></div>
      <div class="dr-sec"><h4>Site photos (geotagged)</h4><div class="photos">${photoHTML(r, p)}</div></div>
      <div class="dr-sec"><h4>Comments</h4>
        ${r.comments.length ? `<div class="timeline">${r.comments.map(c => `<div class="tl ${c.action === 'approved' ? 'ok' : c.action === 'returned' || !c.action ? 'bad' : ''}"><b>${esc(c.by)}</b><p>${esc(c.text)} · ${esc(c.at)}</p></div>`).join('')}</div>` : '<p style="font-size:.84rem;color:var(--muted)">No comments yet.</p>'}
        ${canAct || canResubmit ? `<div class="comment-box" style="margin-top:12px"><textarea id="revComment" placeholder="${canResubmit ? 'Describe what was corrected…' : 'Add a review comment (required when returning)…'}"></textarea><div class="err" id="revErr">Please add a comment explaining why the report is returned.</div></div>` : ''}
      </div>`;
    let foot = '';
    if (canAct) foot = `<button class="btn btn-red" data-act="return" data-id="${r.id}">${icon('i-undo')}Return for correction</button><button class="btn btn-green" data-act="approve" data-id="${r.id}">${icon('i-check')}${r.stage === 3 ? 'Final approve' : 'Verify & forward'}</button>`;
    else if (canResubmit) foot = `<button class="btn btn-primary" data-act="resubmit" data-id="${r.id}">${icon('i-upload')}Resubmit report</button>`;
    openDrawer(`${r.id} · ${MONTHS[r.month]} report`, p.name, body, foot);
    $('#aiReportBtn').addEventListener('click', () => runAI($('#aiReportBtn'), $('#aiReportOut'), 'report', {
      project: { id: p.id, name: p.name, zone: p.zone, woreda: p.woreda, type: p.type, lengthKm: p.km, contractor: p.contractor, consultant: p.consultant, contractValueMillionETB: p.value, completionDate: p.end, plannedPhysicalToDate: p.plan[r.month] },
      report: { id: r.id, period: `${MONTHS[r.month]} ${D.FY}`, status: r.status, waitingOn: r.status === 'pending' ? STEPS[r.stage] : null,
        physicalThisMonth: r.physThis, physicalCumulative: r.physCum, financialCumulative: r.finCum, amountCertifiedETB: r.certified,
        weather: r.weather, labourOnSite: r.labour, equipmentUnits: r.equipment,
        workItems: r.items.map(it => ({ item: it.name, weightPct: it.weight, previousPct: it.prev, cumulativePct: it.now })),
        narrative: r.narrative, comments: r.comments.map(c => ({ by: c.by, text: c.text })) },
      openIssues: state.issues.filter(i => i.projectId === p.id && i.status === 'open').map(i => ({ title: i.title, severity: i.sev, owner: i.owner, due: i.due }))
    }, 'en'));
  }

  function act(kind, id) {
    const r = state.reports.find(x => x.id === id);
    const c = ($('#revComment') || {}).value?.trim() || '';
    if (kind === 'return' && !c) { $('#revErr').classList.add('show'); $('#revComment').focus(); return; }
    const at = `${MONTHS[CUR]} 24`;
    if (kind === 'approve') {
      r.comments.push({ by: ME.name, text: c || 'Verified and forwarded.', at, action: 'approved' });
      r.stage += 1;
      if (r.stage >= 4) { r.status = 'approved'; toast(`${r.id} approved. Project progress updated.`); }
      else toast(`${r.id} forwarded to ${STEPS[r.stage]}`);
    } else if (kind === 'return') {
      r.comments.push({ by: ME.name, text: c, at, action: 'returned' });
      r.status = 'returned'; r.stage = 0; toast(`${r.id} returned to the submitter`);
    } else if (kind === 'resubmit') {
      r.comments.push({ by: ME.name, text: c || 'Corrected and resubmitted.', at, action: 'resubmitted' });
      r.status = 'pending'; r.stage = 1; toast(`${r.id} resubmitted to consultant`);
    }
    save(); closeDrawer(); renderAll();
  }

  /* ---------- new report drawer ---------- */
  function openNewReport(projectId) {
    if (!canSubmit) { toast('Only contractors and woreda offices submit monthly reports'); return; }
    const opts = PROJECTS.filter(p => metrics(p).status !== 'done');
    if (!opts.length) { toast('No active projects assigned to your account'); return; }
    const pid = opts.some(p => p.id === projectId) ? projectId : opts[0].id;
    const body = `
      <div class="form-grid">
        <div class="field full"><label>Project</label><select id="nrProject">${opts.map(p => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${esc(p.name)} (${esc(p.zone)})</option>`).join('')}</select></div>
        <div class="field"><label>Reporting period</label><select id="nrMonth"><option value="${CUR}">${MONTHS[CUR]} ${D.FY}</option></select></div>
        <div class="field"><label>Weather / working days</label><input id="nrWeather" value="Dry · 24 working days"></div>
        <div class="field"><label>Labour on site</label><input id="nrLabour" type="number" min="0" value="80"></div>
        <div class="field"><label>Equipment units</label><input id="nrEquip" type="number" min="0" value="10"></div>
      </div>
      <div class="dr-sec" style="margin-top:22px"><h4>Work item progress: enter cumulative %</h4>
        <table class="wi-table"><thead><tr><th>Item</th><th>Weight</th><th>Previous</th><th>Cumulative now</th></tr></thead><tbody id="nrItems"></tbody></table>
        <div class="err" id="nrErr"></div>
        <div class="calc"><div><small>Physical this month</small><b id="nrThis" class="num">0%</b></div><div><small>Cumulative physical</small><b id="nrCum" class="num">0%</b></div></div>
      </div>
      <div class="form-grid">
        <div class="field"><label>Cumulative financial progress (%)</label><input id="nrFin" type="number" min="0" max="100" step="0.1"></div>
        <div class="field"><label>Amount certified this month (ETB)</label><input id="nrAmt" type="number" min="0" value="0"></div>
        <div class="field full"><label>Narrative, problems & next month's plan</label><textarea id="nrNarr" placeholder="Works carried out, problems encountered, mitigation, plan for next month…"></textarea></div>
        <div class="field full"><label>Site photos</label>
          <label class="drop">${icon('i-upload')}<div>Click to upload site photos. GPS location and date are attached.</div><input type="file" id="nrPhotos" accept="image/*" multiple></label>
          <div class="photos" id="nrPreview" style="margin-top:10px"></div></div>
      </div>`;
    const foot = `<button class="btn btn-light" id="nrCancel">Cancel</button><button class="btn btn-primary" id="nrSubmit">${icon('i-upload')}Submit report</button>`;
    openDrawer('Submit monthly progress report', `${MONTHS[CUR]} ${D.FY} · goes to Consultant → Zone office → Bureau`, body, foot);

    let photos = [];
    const fillItems = () => {
      const p = projById($('#nrProject').value), m = metrics(p);
      const base = (m.last || state.reports.find(r => r.projectId === p.id)).items;
      $('#nrItems').innerHTML = base.map((it, k) => `<tr><td>${esc(it.name)}</td><td class="num">${it.weight}%</td><td class="num">${pct(it.now)}</td>
        <td><input class="wi-input field-in" data-k="${k}" data-prev="${it.now}" type="number" min="0" max="100" step="0.1" value="${Math.min(100, r1(it.now + 2))}" style="border:1px solid var(--line);border-radius:8px;background:var(--bg)"></td></tr>`).join('');
      $('#nrFin').value = r1(m.financial + 2);
      $('#nrItems').dataset.prevCum = m.physical;
      recalc();
    };
    const recalc = () => {
      const p = projById($('#nrProject').value);
      const base = (metrics(p).last || state.reports.find(r => r.projectId === p.id)).items;
      let cum = 0, err = '';
      $$('#nrItems input').forEach(inp => {
        const k = +inp.dataset.k, v = +inp.value, prev = +inp.dataset.prev;
        if (v < prev) err = `"${base[k].name}" cannot be lower than its previous value (${prev}%).`;
        if (v > 100) err = `"${base[k].name}" cannot exceed 100%.`;
        cum += v * base[k].weight / 100;
      });
      cum = r1(Math.min(100, cum));
      const prevCum = +$('#nrItems').dataset.prevCum;
      $('#nrCum').textContent = pct(cum); $('#nrThis').textContent = '+' + pct(r1(Math.max(0, cum - prevCum)));
      $('#nrErr').textContent = err; $('#nrErr').classList.toggle('show', !!err);
      return { cum, err, prevCum, base };
    };
    $('#nrProject').addEventListener('change', fillItems);
    $('#nrItems').addEventListener('input', recalc);
    $('#nrPhotos').addEventListener('change', e => {
      [...e.target.files].slice(0, 8).forEach(f => photos.push(URL.createObjectURL(f)));
      $('#nrPreview').innerHTML = photos.map(src => `<div class="photo"><img src="${src}" alt=""><span class="geo">${icon('i-pin')}GPS attached</span></div>`).join('');
    });
    $('#nrCancel').addEventListener('click', closeDrawer);
    $('#nrSubmit').addEventListener('click', () => {
      const { cum, err, prevCum, base } = recalc();
      if (err) return;
      const pidNow = $('#nrProject').value, p = projById(pidNow);
      const items = base.map((it, k) => ({ name: it.name, weight: it.weight, prev: it.now, now: +$(`#nrItems input[data-k="${k}"]`).value }));
      const existing = state.reports.find(r => r.projectId === pidNow && r.month === CUR && r.status !== 'approved');
      const rep = {
        id: existing ? existing.id : 'MR-' + (2000 + state.reports.length + 1 + Math.floor(Math.random() * 900)),
        projectId: pidNow, month: CUR, physThis: r1(Math.max(0, cum - prevCum)), physCum: cum,
        finCum: Math.min(100, +$('#nrFin').value || 0), certified: +$('#nrAmt').value || 0,
        status: 'pending', stage: 1, submitted: `${MONTHS[CUR]} 24`, submittedBy: ME.name,
        weather: $('#nrWeather').value, labour: +$('#nrLabour').value || 0, equipment: +$('#nrEquip').value || 0,
        items, narrative: $('#nrNarr').value.trim() || 'No narrative provided.',
        photos: ['road-inspection', 'road-consultation'], localPhotos: photos.length ? photos : undefined,
        comments: existing ? [...existing.comments, { by: ME.name, text: 'Report revised and resubmitted.', at: `${MONTHS[CUR]} 24`, action: 'resubmitted' }] : []
      };
      if (existing) Object.assign(existing, rep); else state.reports.push(rep);
      save(); closeDrawer(); rTab = 'pending'; location.hash = '#reports'; renderAll();
      toast(`${rep.id} submitted. Waiting on consultant verification.`);
    });
    fillItems();
  }

  /* =================================================================
     COMPLAINTS (citizen submissions from the public portal)
     ================================================================= */
  let cFilter = 'open';
  const C_FILTERS = [['open', 'Open', c => ['received', 'assigned', 'in-progress'].includes(c.status)], ['received', 'New', c => c.status === 'received'],
    ['in-progress', 'In progress', c => c.status === 'in-progress' || c.status === 'assigned'], ['resolved', 'Resolved', c => c.status === 'resolved'], ['all', 'All', () => true]];
  const cPill = st => `<span class="pill ${st}">${esc(COMPLAINT_STATUS[st].label)}</span>`;
  if (canComplaints) {
    $('#cType').innerHTML = '<option value="all">All types</option>' + COMPLAINT_TYPES.map(t => `<option>${esc(t)}</option>`).join('');
    const zones = role === 'bureau' ? Object.keys(REGIONS) : [];
    const wor = role === 'zone' ? REGIONS[ME.zone] : [];
    $('#cZone').innerHTML = role === 'bureau' ? '<option value="all">All zones</option>' + zones.map(z => `<option>${esc(z)}</option>`).join('')
      : role === 'zone' ? '<option value="all">All woredas</option>' + wor.map(w => `<option>${esc(w)}</option>`).join('') : '';
    $('#cZone').classList.toggle('hidden', role === 'woreda');
    ['#cSearch', '#cType', '#cZone'].forEach(id => $(id).addEventListener('input', renderComplaints));
    $('#cChips').addEventListener('click', e => { const b = e.target.closest('[data-cf]'); if (b) { cFilter = b.dataset.cf; renderComplaints(); } });
  }
  function myComplaints() { return getComplaints().filter(complaintInScope); }
  function renderComplaints() {
    const all = myComplaints();
    $('#cChips').innerHTML = C_FILTERS.map(([k, l, f]) => `<button class="stat-chip ${cFilter === k ? 'active' : ''}" data-cf="${k}"><b class="num">${all.filter(f).length}</b><span>${l}</span></button>`).join('');
    const q = $('#cSearch').value.toLowerCase(), t = $('#cType').value, z = $('#cZone').value;
    const f = C_FILTERS.find(x => x[0] === cFilter)[2];
    const rows = all.filter(c => f(c) && (t === 'all' || c.type === t) &&
      (!z || z === 'all' || (role === 'bureau' ? c.zone === z : c.woreda === z)) &&
      (!q || [c.id, c.name, c.location, c.description, c.woreda, c.zone].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    $('#cTable tbody').innerHTML = rows.map(c => `
      <tr data-complaint="${esc(c.id)}">
        <td><span class="name num">${esc(c.id)}</span><span class="sub">${esc(c.name)}</span></td>
        <td><span class="name" style="font-weight:500">${esc(c.type)}</span><span class="sub">${esc(c.description.length > 70 ? c.description.slice(0, 70) + '…' : c.description)}</span></td>
        <td><span class="name" style="font-weight:500">${esc(c.woreda)}</span><span class="sub">${esc(c.zone)} Zone</span></td>
        <td class="sub">${c.assignedTo ? esc(c.assignedTo) + ' Woreda' : '—'}</td>
        <td>${cPill(c.status)}</td>
        <td class="sub">${esc(fmtDate(c.createdAt))}</td>
      </tr>`).join('') || `<tr><td colspan="6" class="empty">No complaints in this list.</td></tr>`;
    updateBadges();
  }

  function openComplaint(id) {
    const c = getComplaints().find(x => x.id === id);
    if (!c || !complaintInScope(c)) return;
    const canAssign = role === 'bureau' || role === 'zone';
    const statuses = Object.keys(COMPLAINT_STATUS);
    const body = `
      <div class="dr-sec">${cPill(c.status)}</div>
      <div class="dr-sec"><div class="info-grid">
        <div><small>Type</small><b>${esc(c.type)}</b></div>
        <div><small>Zone</small><b>${esc(c.zone)}</b></div>
        <div><small>Woreda</small><b>${esc(c.woreda)}</b></div>
        <div><small>Citizen</small><b>${esc(c.name)}</b></div>
        <div><small>Phone</small><b class="num">${esc(c.phone)}</b></div>
        <div><small>Submitted</small><b>${esc(fmtDate(c.createdAt))}</b></div>
      </div></div>
      <div class="dr-sec"><h4>Location</h4><p style="font-size:.9rem">${esc(c.location || '—')}</p></div>
      <div class="dr-sec"><h4>Description</h4><p style="font-size:.9rem">${esc(c.description)}</p></div>
      ${c.photo ? `<div class="dr-sec"><h4>Photo from citizen</h4><div class="complaint-photo"><img src="${esc(c.photo)}" alt="Photo attached to complaint"></div></div>` : ''}
      <div class="dr-sec"><h4>History</h4><div class="timeline">
        ${c.history.map(h => `<div class="tl ${h.status === 'resolved' ? 'ok' : h.status === 'rejected' ? 'bad' : ''}"><b>${esc(h.by)}</b> ${cPill(h.status)}${h.public ? '' : ' <span class="pill inactive">internal</span>'}<p>${esc(h.note)} · ${esc(fmtDate(h.at))}</p></div>`).join('')}
      </div></div>
      <div class="dr-sec"><h4>Update complaint</h4>
        <div class="form-grid">
          <div class="field"><label>Status</label><select id="cuStatus">${statuses.map(st => `<option value="${st}" ${st === c.status ? 'selected' : ''}>${esc(COMPLAINT_STATUS[st].label)}</option>`).join('')}</select></div>
          ${canAssign ? `<div class="field"><label>Assign to woreda office</label><select id="cuAssign"><option value="">Not assigned</option>${REGIONS[c.zone].map(w => `<option ${w === c.assignedTo ? 'selected' : ''}>${esc(w)}</option>`).join('')}</select></div>` : '<div></div>'}
          <div class="field full"><label>Response / note</label><textarea id="cuNote" placeholder="What was done, or what happens next…"></textarea></div>
          <label class="field full" style="display:flex;gap:8px;align-items:center;font-size:.84rem"><input type="checkbox" id="cuPublic" checked style="width:auto"> Show this note to the citizen on the tracking page</label>
        </div>
        <div class="err" id="cuErr"></div>
      </div>`;
    openDrawer(`Complaint ${c.id}`, `${c.type} · ${c.woreda}, ${c.zone}`, body,
      `<button class="btn btn-light" id="cuCancel">Close</button><button class="btn btn-primary" id="cuSave">${icon('i-check')}Save update</button>`);
    $('#cuCancel').addEventListener('click', closeDrawer);
    $('#cuSave').addEventListener('click', () => {
      const list = getComplaints(), cc = list.find(x => x.id === id);
      let st = $('#cuStatus').value;
      const note = $('#cuNote').value.trim(), assign = canAssign ? $('#cuAssign').value : cc.assignedTo;
      const assignChanged = canAssign && assign !== (cc.assignedTo || '');
      if (!note && !assignChanged && st === cc.status) { $('#cuErr').textContent = 'Nothing to save. Change the status, assign a woreda or add a note.'; $('#cuErr').classList.add('show'); return; }
      if ((st === 'resolved' || st === 'rejected') && !note) { $('#cuErr').textContent = 'Please explain the resolution to the citizen.'; $('#cuErr').classList.add('show'); $('#cuNote').focus(); return; }
      if (assignChanged && assign && st === 'received') st = 'assigned';
      cc.assignedTo = assign || null; cc.status = st;
      cc.history.push({ at: new Date().toISOString(), by: ME.name, status: st,
        note: note || (assignChanged && assign ? `Assigned to ${assign} Woreda Transport Office.` : `Status changed to ${COMPLAINT_STATUS[st].label}.`),
        public: $('#cuPublic').checked });
      saveComplaints(list); closeDrawer(); renderComplaints(); toast(`Complaint ${id} updated`);
    });
  }

  /* =================================================================
     ACCOUNTS
     ================================================================= */
  const ROLE_CHOICES = role === 'bureau' ? Object.keys(ROLES) : ['woreda'];
  if (canAccounts) {
    $('#aRole').innerHTML = '<option value="all">All roles</option>' + ROLE_CHOICES.map(r => `<option value="${r}">${esc(ROLES[r].label)}</option>`).join('');
    $('#aZone').innerHTML = role === 'bureau' ? '<option value="all">All zones</option>' + Object.keys(REGIONS).map(z => `<option>${esc(z)}</option>`).join('') : '';
    $('#aZone').classList.toggle('hidden', role !== 'bureau');
    ['#aSearch', '#aRole', '#aZone'].forEach(id => $(id).addEventListener('input', renderAccounts));
    $('#newAccountBtn').addEventListener('click', openNewAccount);
  }
  const accountInScope = u => role === 'bureau' || (role === 'zone' && u.role === 'woreda' && u.zone === ME.zone);
  function renderAccounts() {
    const q = $('#aSearch').value.toLowerCase(), r = $('#aRole').value, z = $('#aZone').value;
    const order = Object.keys(ROLES);
    const rows = getUsers().filter(u => accountInScope(u) && (r === 'all' || u.role === r) && (!z || z === 'all' || u.zone === z) &&
      (!q || [u.name, u.username, u.zone, u.woreda].join(' ').toLowerCase().includes(q)))
      .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role) || (a.zone || '').localeCompare(b.zone || '') || a.name.localeCompare(b.name));
    $('#aTable tbody').innerHTML = rows.map(u => `
      <tr style="cursor:default">
        <td><span class="name">${esc(u.name)}</span>${u.id === ME.id ? '<span class="sub">You</span>' : ''}</td>
        <td class="num">${esc(u.username)}</td>
        <td><span class="pill role">${esc(ROLES[u.role].short)}</span></td>
        <td>${u.zone ? esc(u.zone) + (u.woreda ? ' · ' + esc(u.woreda) : '') : '<span class="sub">—</span>'}</td>
        <td class="sub num">${esc(u.phone || '—')}</td>
        <td><label class="switch" title="${u.active ? 'Active' : 'Inactive'}"><input type="checkbox" data-toggle="${u.id}" ${u.active ? 'checked' : ''} ${u.id === ME.id ? 'disabled' : ''}><span></span></label></td>
        <td><button class="btn btn-light btn-sm" data-resetpw="${u.id}">${icon('i-key')}Reset password</button></td>
      </tr>`).join('') || `<tr><td colspan="7" class="empty">No accounts.</td></tr>`;
  }
  $('#aTable').addEventListener('change', e => {
    const t = e.target.closest('[data-toggle]'); if (!t) return;
    const users = getUsers(), u = users.find(x => x.id === t.dataset.toggle);
    if (!u || !accountInScope(u) || u.id === ME.id) return;
    u.active = t.checked; saveUsers(users); toast(`${u.username} ${u.active ? 'activated' : 'deactivated'}`);
  });
  $('#aTable').addEventListener('click', e => {
    const b = e.target.closest('[data-resetpw]'); if (!b) return;
    const users = getUsers(), u = users.find(x => x.id === b.dataset.resetpw);
    if (!u || !accountInScope(u)) return;
    u.password = 'demo123'; saveUsers(users); toast(`Password for ${u.username} reset to the default`);
  });

  function openNewAccount() {
    const zones = role === 'bureau' ? Object.keys(REGIONS) : [ME.zone];
    const body = `
      <div class="form-grid">
        <div class="field"><label>Account type</label><select id="naRole">${ROLE_CHOICES.map(r => `<option value="${r}">${esc(ROLES[r].label)}</option>`).join('')}</select></div>
        <div class="field" id="naZoneF"><label>Zone</label><select id="naZone">${zones.map(z => `<option>${esc(z)}</option>`).join('')}</select></div>
        <div class="field" id="naWoredaF"><label>Woreda</label><select id="naWoreda"></select></div>
        <div class="field full"><label>Office / full name</label><input id="naName" placeholder="e.g. Humbo Woreda Transport Office"></div>
        <div class="field"><label>Username</label><input id="naUser" placeholder="e.g. woreda.humbo" autocomplete="off"></div>
        <div class="field"><label>Phone</label><input id="naPhone" type="tel" placeholder="09xx xxx xxx"></div>
        <div class="field"><label>Temporary password</label><input id="naPass" value="demo123"></div>
      </div>
      <p class="note" style="margin-top:14px">The office signs in with this username and sees only the projects, reports and complaints for its ${role === 'zone' ? 'woreda' : 'zone or woreda'}.</p>
      <div class="err" id="naErr"></div>`;
    openDrawer('New account', role === 'zone' ? `Woreda office in ${ME.zone} Zone` : 'Create a staff or partner account', body,
      `<button class="btn btn-light" id="naCancel">Cancel</button><button class="btn btn-primary" id="naSave">${icon('i-plus')}Create account</button>`);
    const sync = () => {
      const r = $('#naRole').value, z = $('#naZone').value;
      $('#naZoneF').classList.toggle('hidden', !['zone', 'woreda'].includes(r));
      $('#naWoredaF').classList.toggle('hidden', r !== 'woreda');
      const prev = $('#naWoreda').value;
      $('#naWoreda').innerHTML = REGIONS[z].map(w => `<option ${w === prev ? 'selected' : ''}>${esc(w)}</option>`).join('');
      const w = $('#naWoreda').value, sl = x => x.toLowerCase().replace(/[^a-z0-9]+/g, '');
      const sugName = r === 'zone' ? `${z} Zone Transport & Road Department` : r === 'woreda' ? `${w} Woreda Transport Office` : '';
      const sugUser = r === 'zone' ? 'zone.' + sl(z) : r === 'woreda' ? 'woreda.' + sl(w) : '';
      if (!$('#naName').dataset.touched) $('#naName').value = sugName;
      if (!$('#naUser').dataset.touched) $('#naUser').value = sugUser;
    };
    ['#naName', '#naUser'].forEach(id => $(id).addEventListener('input', e => { e.target.dataset.touched = '1'; }));
    ['#naRole', '#naZone', '#naWoreda'].forEach(id => $(id).addEventListener('change', sync));
    sync();
    $('#naCancel').addEventListener('click', closeDrawer);
    $('#naSave').addEventListener('click', () => {
      const users = getUsers(), r = $('#naRole').value;
      const u = { id: 'u' + Date.now().toString(36), role: r, name: $('#naName').value.trim(), username: $('#naUser').value.trim().toLowerCase(),
        phone: $('#naPhone').value.trim(), password: $('#naPass').value, active: true, createdAt: new Date().toISOString().slice(0, 10) };
      if (['zone', 'woreda'].includes(r)) u.zone = $('#naZone').value;
      if (r === 'woreda') u.woreda = $('#naWoreda').value;
      if (['consultant', 'contractor'].includes(r)) u.org = u.name;
      const err = !u.name ? 'Enter the office or person name.' : !/^[a-z0-9._-]{3,}$/.test(u.username) ? 'Username: at least 3 characters, letters, numbers, dots or dashes.'
        : users.some(x => x.username === u.username) ? 'That username is already taken.' : u.password.length < 6 ? 'Password must be at least 6 characters.'
        : (r === 'woreda' && role === 'zone' && u.zone !== ME.zone) ? 'You can only create accounts in your zone.' : '';
      if (err) { $('#naErr').textContent = err; $('#naErr').classList.add('show'); return; }
      users.push(u); saveUsers(users); closeDrawer(); renderAccounts(); toast(`Account ${u.username} created`);
    });
  }

  /* ---------------- user menu ---------------- */
  const initials = n => n.split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';
  $('#avatar').textContent = initials(ME.name);
  $('#userName').textContent = ME.name.length > 26 ? ME.name.slice(0, 24) + '…' : ME.name;
  $('#userRole').textContent = ROLES[role].label;
  $('#ddName').textContent = ME.name; $('#ddScope').textContent = `${ROLES[role].label} · ${scopeLabel(ME)}`;
  $('#scopeChip span').textContent = scopeLabel(ME);
  $('#userBtn').addEventListener('click', e => { e.stopPropagation(); $('#userDropdown').classList.toggle('show'); });
  document.addEventListener('click', e => { if (!e.target.closest('.user-menu')) $('#userDropdown').classList.remove('show'); });
  $('#logoutBtn').addEventListener('click', () => { logout(); location.replace('login.html'); });
  $('#ddPassword').addEventListener('click', () => {
    $('#userDropdown').classList.remove('show');
    openDrawer('Change password', ME.username, `<div class="form-grid">
      <div class="field full"><label>Current password</label><input id="pwOld" type="password" autocomplete="current-password"></div>
      <div class="field"><label>New password</label><input id="pwNew" type="password" autocomplete="new-password"></div>
      <div class="field"><label>Confirm new password</label><input id="pwNew2" type="password" autocomplete="new-password"></div></div><div class="err" id="pwErr"></div>`,
      `<button class="btn btn-light" id="pwCancel">Cancel</button><button class="btn btn-primary" id="pwSave">${icon('i-check')}Update password</button>`);
    $('#pwCancel').addEventListener('click', closeDrawer);
    $('#pwSave').addEventListener('click', () => {
      const users = getUsers(), u = users.find(x => x.id === ME.id);
      const err = $('#pwOld').value !== u.password ? 'Current password is incorrect.' : $('#pwNew').value.length < 6 ? 'New password must be at least 6 characters.' : $('#pwNew').value !== $('#pwNew2').value ? 'Passwords do not match.' : '';
      if (err) { $('#pwErr').textContent = err; $('#pwErr').classList.add('show'); return; }
      u.password = $('#pwNew').value; saveUsers(users); closeDrawer(); toast('Password updated');
    });
  });

  /* ---------------- role-based navigation ---------------- */
  [['#sbAdminLabel', canAccounts], ['#sbAdminNav', canAccounts], ['#sbWebLabel', canCMS], ['#sbWebNav', canCMS], ['#sbCitizenLabel', canComplaints], ['#navComplaints', canComplaints], ['#sbActionsLabel', canSubmit], ['#sbActionsNav', canSubmit]]
    .forEach(([sel, show]) => { if (!show) $(sel).classList.add('hidden'); });
  if (!canComplaints) $('a[data-view="complaints"]').classList.add('hidden');
  $$('a[href="#new"]').forEach(a => a.classList.toggle('hidden', !canSubmit));
  if (role === 'zone' || role === 'woreda') { $('#fZone').disabled = true; $('#pZone').disabled = true; }

  /* =================================================================
     AI SUMMARY (backend → Claude API)
     ================================================================= */
  async function runAI(btn, out, kind, data, lang) {
    btn.disabled = true;
    out.classList.remove('hidden');
    out.innerHTML = '<div class="ai-loading"><span class="spinner"></span>Writing the summary… this can take up to a minute.</div>';
    try {
      const r = await requestSummary(kind, data, lang);
      out.innerHTML = mdToHtml(r.summary) + `<div class="ai-meta"><span>AI-generated from ${kind === 'report' ? 'this report' : 'the projects in the current filter'} · ${esc(r.model || '')} · ${esc(new Date().toLocaleString('en-GB'))}${r.truncated ? ' · cut short' : ''}</span>
        <button class="btn btn-light btn-sm ai-copy">${icon('i-copy')}Copy</button></div>`;
      out.querySelector('.ai-copy').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(r.summary); toast('Summary copied'); } catch (e) { toast('Copy failed'); }
      });
    } catch (e) {
      out.innerHTML = `<div class="ai-error">${esc(e.message)}</div>`;
    } finally { btn.disabled = false; }
  }
  function portfolioData() {
    const list = filtered();
    const totalV = list.reduce((s, x) => s + x.p.value, 0) || 1;
    const wAvg = k => r1(list.reduce((s, x) => s + x.m[k] * x.p.value, 0) / totalV);
    const ids = new Set(list.map(x => x.p.id));
    const reps = state.reports.filter(r => ids.has(r.projectId));
    return {
      fiscalYear: D.FY, reportingMonth: MONTHS[CUR], preparedFor: `${ME.name} (${scopeLabel(ME)})`,
      filters: { zone: $('#fZone').value, funding: $('#fFund').value, type: $('#fType').value },
      totals: { projects: list.length, lengthKm: r1(list.reduce((s, x) => s + x.p.km, 0)), contractValueMillionETB: totalV,
        avgPhysicalPct: wAvg('physical'), avgPlannedPct: wAvg('planned'), avgFinancialPct: wAvg('financial'),
        byStatus: Object.fromEntries(Object.keys(STATUS_LABEL).map(k => [STATUS_LABEL[k], list.filter(x => x.m.status === k).length])) },
      projects: list.map(({ p, m }) => ({ name: p.name, zone: p.zone, woreda: p.woreda, type: p.type, contractor: p.contractor, valueMillionETB: p.value,
        physicalPct: m.physical, plannedPct: m.planned, variancePts: m.variance, financialPct: m.financial, status: STATUS_LABEL[m.status],
        lastApprovedMonth: MONTHS[m.lastMonth], currentMonthReport: m.current ? m.current.status : 'not submitted' })),
      reports: { pending: reps.filter(r => r.status === 'pending').length, returned: reps.filter(r => r.status === 'returned').length },
      openIssues: state.issues.filter(i => ids.has(i.projectId) && i.status === 'open').map(i => ({ title: i.title, project: projById(i.projectId).name, severity: i.sev, owner: i.owner, due: i.due }))
    };
  }
  $('#aiBtn').addEventListener('click', () => runAI($('#aiBtn'), $('#aiOut'), 'portfolio', portfolioData(), $('#aiLang').value));

  /* ---------------- global click delegation ---------------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (a) { act(a.dataset.act, a.dataset.id); return; }
    const n = e.target.closest('[data-new]'); if (n) { openNewReport(n.dataset.new); return; }
    const cm = e.target.closest('[data-complaint]'); if (cm) { openComplaint(cm.dataset.complaint); return; }
    const r = e.target.closest('[data-report]'); if (r) { openReport(r.dataset.report); return; }
    const p = e.target.closest('[data-project]'); if (p && !e.target.closest('button')) { openProject(p.dataset.project); return; }
  });

  /* ---------------- CSV export ---------------- */
  function exportCSV() {
    const head = ['ID', 'Project', 'Zone', 'Type', 'Funding', 'Contractor', 'Contract value (M ETB)', 'Physical %', 'Planned %', 'Variance', 'Financial %', 'Status', 'Last approved month'];
    const rows = allMetrics().map(({ p, m }) => [p.id, p.name, p.zone, p.type, p.fund, p.contractor, p.value, m.physical, m.planned, m.variance, m.financial, STATUS_LABEL[m.status], MONTHS[m.lastMonth]]);
    const csv = [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `project-progress-${MONTHS[CUR]}.csv` });
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Project progress exported');
  }
  $('#exportBtn').addEventListener('click', exportCSV);
  $('#exportBtn2').addEventListener('click', exportCSV);

  /* ---------------- routing ---------------- */
  const CMS = createCMS({ $, esc, icon, openDrawer, closeDrawer, toast });
  CMS.onChange(updateBadges);
  const TITLES = {
    dashboard: ['Dashboard', `Fiscal year ${D.FY} · Reporting month: ${MONTHS[CUR]}`],
    projects: ['Projects', 'All regional road and bridge projects'],
    reports: ['Progress Reports', 'Monthly reports: review, verify and approve'],
    issues: ['Issues & Risks', 'Problems blocking project delivery'],
    contractors: ['Contractors', 'Performance across active projects'],
    complaints: ['Complaints', 'Citizen complaints from the public portal'],
    ...Object.fromEntries(Object.entries(CMS.views).map(([k, v]) => [k, [v.title, v.sub]])),
    accounts: ['Accounts', role === 'zone' ? `Woreda office accounts in ${ME.zone} Zone` : 'Bureau, zone, woreda, consultant and contractor accounts']
  };
  let currentView = 'dashboard';
  function route() {
    const h = location.hash.slice(1) || 'dashboard';
    if (h === 'new') { if (!$('#drawer').classList.contains('show')) openNewReport(); return; }
    let v = TITLES[h] ? h : 'dashboard';
    if ((v === 'complaints' && !canComplaints) || (v === 'accounts' && !canAccounts) || (CMS.views[v] && !canCMS)) v = 'dashboard';
    currentView = v;
    $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
    $$('.sb-nav a[data-view]').forEach(a => a.classList.toggle('active', a.dataset.view === v));
    $('#viewTitle').textContent = TITLES[v][0]; $('#viewSub').textContent = TITLES[v][1];
    document.body.classList.remove('nav-open'); $('#overlay').classList.remove('show');
    renderView(v); scrollTo(0, 0);
  }
  function renderView(v) {
    if (CMS.views[v]) return CMS.render(v);
    ({ dashboard: renderDashboard, projects: renderProjects, reports: renderReports, issues: renderIssues, contractors: renderContractors, complaints: renderComplaints, accounts: renderAccounts })[v]();
  }
  function renderAll() { renderView(currentView); updateBadges(); }
  addEventListener('hashchange', route);

  /* ---------------- misc chrome ---------------- */
  $('#menuBtn').addEventListener('click', () => { document.body.classList.add('nav-open'); $('#overlay').classList.add('show'); });

  $('#globalSearch').addEventListener('input', e => { $('#pSearch').value = e.target.value; if (currentView !== 'projects') location.hash = '#projects'; else renderProjects(); });
  $('#bellBtn').addEventListener('click', () => { location.hash = '#dashboard'; setTimeout(() => $('#alertList').scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); });
  $('#resetDemo').addEventListener('click', e => { e.preventDefault(); state = freshState(); save(); resetShared(); location.reload(); });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => currentView === 'dashboard' && renderDashboard(), 150); });

  updateBadges();
  route();
})();
