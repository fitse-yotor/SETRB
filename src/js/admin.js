import "../css/admin.css";
import "./admin-data.js";
(function () {
  'use strict';
  const D = window.ADMIN_DATA;
  const { MONTHS, CUR } = D;
  const STEPS = ['Contractor', 'Consultant', 'Zone office', 'Bureau'];
  const ROLE_STAGE = { consultant: 1, zone: 2, bureau: 3 };
  const STATUS_LABEL = { 'on-track': 'On track', 'at-risk': 'At risk', delayed: 'Delayed', done: 'Completed' };
  const STATUS_ICON = { 'on-track': 'i-check', 'at-risk': 'i-clock', delayed: 'i-alert', done: 'i-flag' };
  const STATUS_COLOR = { 'on-track': 'var(--st-ok)', 'at-risk': 'var(--st-warn)', delayed: 'var(--st-bad)', done: 'var(--st-done)' };
  const KEY = 'pm-demo-v1';

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
  let role = 'bureau';

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
  const allMetrics = () => D.projects.map(p => ({ p, m: metrics(p) }));

  /* ---------------- toast ---------------- */
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.querySelector('span').textContent = msg;
    t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------------- filters (dashboard) ---------------- */
  const uniq = k => [...new Set(D.projects.map(p => p[k]))].sort();
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
    const counts = { pending: 0, returned: 0, approved: 0, all: state.reports.length };
    state.reports.forEach(r => counts[r.status]++);
    $$('#rTabs button').forEach(b => { b.classList.toggle('active', b.dataset.tab === rTab); b.querySelector('.c').textContent = counts[b.dataset.tab]; });
    const rows = state.reports.filter(r => (rTab === 'all' || r.status === rTab) &&
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
    const n = state.reports.filter(r => r.status === 'pending').length;
    $('#navPending').textContent = n; $('#navPending').style.display = n ? '' : 'none';
    const iN = state.issues.filter(i => i.status === 'open').length;
    $('#navIssues').textContent = iN; $('#navIssues').style.display = iN ? '' : 'none';
  }

  /* =================================================================
     ISSUES
     ================================================================= */
  let iFilter = 'open';
  function renderIssues() {
    const sev = $('#iSev').value;
    const order = { high: 0, medium: 1, low: 2 };
    const rows = state.issues.filter(i => (iFilter === 'all' || i.status === iFilter) && (sev === 'all' || i.sev === sev)).sort((a, b) => order[a.sev] - order[b.sev]);
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

  const photoHTML = (r, p) => (r.localPhotos || r.photos.map(n => `assets/img/news/${n}.svg`)).map((src, k) =>
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
        <div><small>Zone</small><b>${esc(p.zone)}</b></div>
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
      <button class="btn btn-primary" data-new="${p.id}">${icon('i-plus')}New report</button>`;
    openDrawer(p.name, `${p.id} · ${p.zone} Zone`, body, foot);
  }

  /* ---------- report review drawer ---------- */
  function openReport(id) {
    const r = state.reports.find(x => x.id === id), p = projById(r.projectId);
    const canAct = r.status === 'pending' && ROLE_STAGE[role] === r.stage;
    const canResubmit = r.status === 'returned' && role === 'contractor';
    const body = `
      <div class="dr-sec"><h4>Approval workflow</h4>${stepper(r)}
        ${r.status === 'pending' && !canAct ? `<p style="font-size:.78rem;color:var(--muted);margin-top:8px">Waiting on <b>${esc(STEPS[r.stage])}</b>. Switch role in the top bar to act on this report.</p>` : ''}
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
  }

  const ROLE_NAME = { bureau: 'Bureau reviewer', zone: 'Zone engineer', consultant: 'Consultant', contractor: 'Contractor' };
  function act(kind, id) {
    const r = state.reports.find(x => x.id === id);
    const c = ($('#revComment') || {}).value?.trim() || '';
    if (kind === 'return' && !c) { $('#revErr').classList.add('show'); $('#revComment').focus(); return; }
    const at = `${MONTHS[CUR]} 24`;
    if (kind === 'approve') {
      r.comments.push({ by: ROLE_NAME[role], text: c || 'Verified and forwarded.', at, action: 'approved' });
      r.stage += 1;
      if (r.stage >= 4) { r.status = 'approved'; toast(`${r.id} approved. Project progress updated.`); }
      else toast(`${r.id} forwarded to ${STEPS[r.stage]}`);
    } else if (kind === 'return') {
      r.comments.push({ by: ROLE_NAME[role], text: c, at, action: 'returned' });
      r.status = 'returned'; r.stage = 0; toast(`${r.id} returned to contractor`);
    } else if (kind === 'resubmit') {
      r.comments.push({ by: 'Contractor', text: c || 'Corrected and resubmitted.', at, action: 'resubmitted' });
      r.status = 'pending'; r.stage = 1; toast(`${r.id} resubmitted to consultant`);
    }
    save(); closeDrawer(); renderAll();
  }

  /* ---------- new report drawer ---------- */
  function openNewReport(projectId) {
    const opts = D.projects.filter(p => metrics(p).status !== 'done');
    const pid = projectId || opts[0].id;
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
        status: 'pending', stage: 1, submitted: `${MONTHS[CUR]} 24`, submittedBy: p.contractor,
        weather: $('#nrWeather').value, labour: +$('#nrLabour').value || 0, equipment: +$('#nrEquip').value || 0,
        items, narrative: $('#nrNarr').value.trim() || 'No narrative provided.',
        photos: ['road-construction', 'asphalt'], localPhotos: photos.length ? photos : undefined,
        comments: existing ? [...existing.comments, { by: 'Contractor', text: 'Report revised and resubmitted.', at: `${MONTHS[CUR]} 24`, action: 'resubmitted' }] : []
      };
      if (existing) Object.assign(existing, rep); else state.reports.push(rep);
      save(); closeDrawer(); rTab = 'pending'; location.hash = '#reports'; renderAll();
      toast(`${rep.id} submitted. Waiting on consultant verification.`);
    });
    fillItems();
  }

  /* ---------------- global click delegation ---------------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (a) { act(a.dataset.act, a.dataset.id); return; }
    const n = e.target.closest('[data-new]'); if (n) { openNewReport(n.dataset.new); return; }
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
  const TITLES = {
    dashboard: ['Dashboard', `Fiscal year ${D.FY} · Reporting month: ${MONTHS[CUR]}`],
    projects: ['Projects', 'All regional road and bridge projects'],
    reports: ['Progress Reports', 'Monthly reports: review, verify and approve'],
    issues: ['Issues & Risks', 'Problems blocking project delivery'],
    contractors: ['Contractors', 'Performance across active projects']
  };
  let currentView = 'dashboard';
  function route() {
    const h = location.hash.slice(1) || 'dashboard';
    if (h === 'new') { if (!$('#drawer').classList.contains('show')) openNewReport(); return; }
    const v = TITLES[h] ? h : 'dashboard';
    currentView = v;
    $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
    $$('.sb-nav a[data-view]').forEach(a => a.classList.toggle('active', a.dataset.view === v));
    $('#viewTitle').textContent = TITLES[v][0]; $('#viewSub').textContent = TITLES[v][1];
    document.body.classList.remove('nav-open'); $('#overlay').classList.remove('show');
    renderView(v); scrollTo(0, 0);
  }
  function renderView(v) {
    ({ dashboard: renderDashboard, projects: renderProjects, reports: renderReports, issues: renderIssues, contractors: renderContractors })[v]();
  }
  function renderAll() { renderView(currentView); updateBadges(); }
  addEventListener('hashchange', route);

  /* ---------------- misc chrome ---------------- */
  $('#menuBtn').addEventListener('click', () => { document.body.classList.add('nav-open'); $('#overlay').classList.add('show'); });
  $('#roleSel').addEventListener('change', e => {
    role = e.target.value;
    $('.user strong').textContent = ROLE_NAME[role];
    $('.avatar').textContent = { bureau: 'BR', zone: 'ZE', consultant: 'CO', contractor: 'CT' }[role];
    toast(`Now acting as ${ROLE_NAME[role]}`);
    if ($('#drawer').classList.contains('show') && $('#drTitle').textContent.startsWith('MR-')) openReport($('#drTitle').textContent.split(' ')[0]);
  });
  $('#globalSearch').addEventListener('input', e => { $('#pSearch').value = e.target.value; if (currentView !== 'projects') location.hash = '#projects'; else renderProjects(); });
  $('#bellBtn').addEventListener('click', () => { location.hash = '#dashboard'; setTimeout(() => $('#alertList').scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); });
  $('#resetDemo').addEventListener('click', e => { e.preventDefault(); state = freshState(); save(); renderAll(); toast('Demo data reset'); });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => currentView === 'dashboard' && renderDashboard(), 150); });

  updateBadges();
  route();
})();
