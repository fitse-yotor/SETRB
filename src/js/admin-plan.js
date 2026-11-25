/* ------------------------------------------------------------------
   Annual plan: Bureau → zones → woredas, with quarterly achievement.

   Bureau   prepares the regional plan (indicators + targets), splits
            each target across zones and sends it.
   Zone     acknowledges, splits its targets across its woredas, sends.
   Woreda   acknowledges and reports achievement every quarter.

   Ethiopian fiscal year quarters: Q1 Hamle–Meskerem, Q2 Tikimt–Tahsas,
   Q3 Tir–Megabit, Q4 Miyazya–Sene.
   DEMO: stored in the browser (localStorage) like the rest of the demo.
   ------------------------------------------------------------------ */
import { REGIONS } from "./shared.js";

const KEY = 'setrb-plans-v1';
const QUARTERS = [
  { q: 1, label: 'Q1', months: 'Hamle – Meskerem' }, { q: 2, label: 'Q2', months: 'Tikimt – Tahsas' },
  { q: 3, label: 'Q3', months: 'Tir – Megabit' }, { q: 4, label: 'Q4', months: 'Miyazya – Sene' }
];
const ZONES = Object.keys(REGIONS);

/* split `total` across weights into whole numbers that add up exactly (largest remainder) */
function split(total, weights) {
  const W = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map(w => total * w / W), base = raw.map(Math.floor);
  let rest = Math.round(total - base.reduce((a, b) => a + b, 0));
  raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest-- > 0) base[i]++; });
  return base;
}
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };

/* ---------------- sample data ---------------- */
function seed() {
  const indicators = [
    { id: 'i1', name: 'Asphalt road construction', unit: 'km', target: 120 },
    { id: 'i2', name: 'Gravel road construction', unit: 'km', target: 260 },
    { id: 'i3', name: 'Rural road (URRAP) construction', unit: 'km', target: 420 },
    { id: 'i4', name: 'Bridges completed', unit: 'number', target: 18 },
    { id: 'i5', name: 'Road maintenance', unit: 'km', target: 900 },
    { id: 'i6', name: 'Road safety awareness campaigns', unit: 'number', target: 48 },
    { id: 'i7', name: 'Public transport routes licensed', unit: 'number', target: 60 },
    { id: 'i8', name: 'Capital budget utilised', unit: 'million ETB', target: 3200 }
  ];
  const zones = {};
  const weights = ZONES.map(z => REGIONS[z].length);
  const perInd = Object.fromEntries(indicators.map(ind => [ind.id, split(ind.target, weights)]));
  ZONES.forEach((z, zi) => {
    const targets = Object.fromEntries(indicators.map(ind => [ind.id, perInd[ind.id][zi]]));
    zones[z] = { targets, ack: null, sentToWoredasAt: null, woredas: {} };
  });
  const day = (d, h = 9) => `2026-07-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:00:00`;
  // zones that have acknowledged and distributed to their woredas
  [['Wolaita', 21, 24], ['Gamo', 22, 27], ['Gedeo', 23, 29], ['Konso', 24, null], ['Gofa', 28, null]].forEach(([z, ackD, sentD]) => {
    zones[z].ack = { at: day(ackD, 10), by: `${z} Zone Transport & Road Department` };
    if (sentD) {
      zones[z].sentToWoredasAt = day(sentD, 14);
      const ws = REGIONS[z];
      indicators.forEach(ind => {
        const parts = split(zones[z].targets[ind.id], ws.map(() => 1));
        ws.forEach((w, wi) => { (zones[z].woredas[w] ??= { targets: {}, ack: null }).targets[ind.id] = parts[wi]; });
      });
      ws.forEach((w, wi) => { if (wi % 3 !== 2) zones[z].woredas[w].ack = { at: day(Math.min(31, sentD + 1 + wi), 11), by: `${w} Woreda Transport Office` }; });
    }
  });
  const plan = {
    id: 'p-2019', fy: '2019 E.C.', title: 'Regional road and transport annual plan', status: 'sent',
    objectives: 'Expand all-weather road access to rural kebeles, complete ongoing asphalt and bridge projects on time, keep the existing network in good condition and improve road safety and public transport services.',
    createdAt: '2026-07-10T09:00:00', sentAt: '2026-07-20T09:00:00', indicators: indicators.map(({ target, ...r }) => r),
    region: Object.fromEntries(indicators.map(i => [i.id, i.target])), zones
  };
  // achievements: Q1 reported by woredas that acknowledged, Q2 partly reported
  const ach = {}, subs = {};
  Object.entries(zones).forEach(([z, zd]) => Object.entries(zd.woredas).forEach(([w, wd]) => {
    if (!wd.ack) return;
    [1, 2].forEach(q => {
      if (q === 2 && hash(w) < .45) return;
      indicators.forEach(ind => {
        const tgt = wd.targets[ind.id] || 0;
        const share = q === 1 ? .12 + hash(w + ind.id) * .2 : .08 + hash(ind.id + w) * .22;
        const v = ind.unit === 'number' ? Math.round(tgt * share) : Math.round(tgt * share * 10) / 10;
        ach[`${plan.id}|${z}|${w}|${ind.id}|${q}`] = v;
      });
      subs[`${plan.id}|${z}|${w}|${q}`] = { at: q === 1 ? '2026-10-08T10:00:00' : '2026-11-20T10:00:00', by: `${w} Woreda Transport Office` };
    });
  }));
  return { plans: [plan], ach, subs };
}

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.plans)) return s; } catch (e) {}
  const s = seed(); save(s); return s;
}
function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

export function resetPlans() { try { localStorage.removeItem(KEY); } catch (e) {} }

/* =================================================================== */
export function createPlans({ $, esc, icon, openDrawer, closeDrawer, toast, ME, CUR }) {
  const role = ME.role;
  const curQ = Math.floor(CUR / 3) + 1;
  let st = load();
  let planId = null, tab = 'targets';
  const plan = () => st.plans.find(p => p.id === planId) || st.plans.slice().sort((a, b) => b.fy.localeCompare(a.fy))[0];
  const commit = () => { save(st); onChange && onChange(); };
  let onChange = null;
  const fmt = (v, unit) => (v == null || v === '' ? '—' : (+v).toLocaleString(undefined, { maximumFractionDigits: 1 })) + (unit && unit !== 'number' ? '' : '');
  const date = iso => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  // colour against what should be done by the end of the current quarter (25% per quarter)
  const expected = () => curQ * 25;
  const pctCls = p => p >= 100 ? 'pc-done' : p >= expected() ? 'pc-good' : p >= expected() * .6 ? 'pc-mid' : 'pc-low';

  /* ---- achievement helpers ---- */
  const achW = (p, z, w, ind, q) => st.ach[`${p.id}|${z}|${w}|${ind}|${q}`];
  const totalW = (p, z, w, ind) => QUARTERS.reduce((s, Q) => s + (+achW(p, z, w, ind, Q.q) || 0), 0);
  const totalZ = (p, z, ind) => Object.keys(p.zones[z].woredas).reduce((s, w) => s + totalW(p, z, w, ind), 0);
  const totalR = (p, ind) => ZONES.reduce((s, z) => s + (p.zones[z] ? totalZ(p, z, ind) : 0), 0);
  const pct = (a, t) => t ? Math.round(a / t * 100) : 0;
  const avgPct = (pairs) => { const v = pairs.filter(([, t]) => t > 0); return v.length ? Math.round(v.reduce((s, [a, t]) => s + Math.min(100, a / t * 100), 0) / v.length) : 0; };
  const bar = (p) => `<div class="mini"><div class="track"><span style="width:${Math.min(100, p)}%;background:${p >= expected() ? 'var(--s-fin)' : p >= expected() * .6 ? 'var(--gold)' : 'var(--st-bad)'}"></span></div><b class="num">${p}%</b></div>`;

  /* ---- status of a zone / woreda ---- */
  function zoneStatus(p, z) {
    const zd = p.zones[z];
    if (p.status !== 'sent') return ['inactive', 'Draft'];
    if (zd.sentToWoredasAt) return ['approved', 'Sent to woredas'];
    if (zd.ack) return ['assigned', 'Acknowledged'];
    return ['pending', 'Received, not acknowledged'];
  }
  function woredaStatus(p, z, w) {
    const wd = p.zones[z].woredas[w];
    if (!p.zones[z].sentToWoredasAt || !wd) return ['inactive', 'Not sent'];
    if (st.subs[`${p.id}|${z}|${w}|${curQ}`]) return ['approved', `Q${curQ} reported`];
    if (wd.ack) return ['assigned', 'Acknowledged'];
    return ['pending', 'Not acknowledged'];
  }

  /* ---- badge count for the sidebar ---- */
  function pending() {
    const p = plan(); if (!p || p.status !== 'sent') return 0;
    if (role === 'zone') { const zd = p.zones[ME.zone]; return zd && (!zd.ack || !zd.sentToWoredasAt) ? 1 : 0; }
    if (role === 'woreda') {
      const zd = p.zones[ME.zone]; const wd = zd?.woredas[ME.woreda];
      if (!zd?.sentToWoredasAt || !wd) return 0;
      return (!wd.ack || !st.subs[`${p.id}|${ME.zone}|${ME.woreda}|${curQ}`]) ? 1 : 0;
    }
    return 0;
  }

  /* =============================== RENDER =============================== */
  function render(root) {
    st = load();
    const p = plan();
    if (!p) {
      root.innerHTML = `<div class="card"><div class="empty">No annual plan yet.${role === 'bureau' ? `<br><br><button class="btn btn-primary" data-plan="new">${icon('i-plus')}Create annual plan</button>` : ''}</div></div>`;
      return;
    }
    const head = headerHTML(p);
    let body = '';
    if (role === 'bureau') body = tab === 'targets' ? bureauTargets(p) : bureauProgress(p);
    else if (role === 'zone') body = tab === 'targets' ? zoneTargets(p) : zoneProgress(p);
    else if (role === 'woreda') body = woredaView(p);
    root.innerHTML = head + body;
  }

  function headerHTML(p) {
    const years = st.plans.slice().sort((a, b) => b.fy.localeCompare(a.fy));
    let banner = '', actions = '';
    if (role === 'bureau') {
      if (p.status === 'draft') {
        const ok = p.indicators.every(i => remainingR(p, i.id) === 0) && p.indicators.length;
        actions = `<button class="btn btn-light" data-plan="edit">${icon('i-doc')}Edit plan</button>
          <button class="btn btn-light" data-plan="auto-zones">Split by zone size</button>
          <button class="btn btn-primary" data-plan="send-zones" ${ok ? '' : 'disabled title="Allocate every target fully first"'}>${icon('i-send')}Send to zones</button>`;
      } else actions = `<button class="btn btn-light" data-plan="export">${icon('i-download')}Export CSV</button>
          ${!st.plans.some(x => x.status === 'draft') ? `<button class="btn btn-light" data-plan="new">${icon('i-plus')}New plan</button>` : ''}`;
    }
    if (role === 'zone' && p.status === 'sent') {
      const zd = p.zones[ME.zone];
      banner = `<div class="plan-banner">${icon('i-bell')}<div><b>Annual plan received from the Bureau</b><span>Sent ${esc(date(p.sentAt))}${zd.ack ? ` · acknowledged ${esc(date(zd.ack.at))}` : ''}${zd.sentToWoredasAt ? ` · sent to woredas ${esc(date(zd.sentToWoredasAt))}` : ''}</span></div>
        ${!zd.ack ? `<button class="btn btn-green" data-plan="ack-zone">${icon('i-check')}Acknowledge receipt</button>` : ''}</div>`;
      if (zd.ack && !zd.sentToWoredasAt) {
        const ok = p.indicators.every(i => remainingZ(p, ME.zone, i.id) === 0);
        actions = `<button class="btn btn-light" data-plan="auto-woredas">Split evenly</button>
          <button class="btn btn-primary" data-plan="send-woredas" ${ok ? '' : 'disabled title="Allocate every target fully first"'}>${icon('i-send')}Send to woredas</button>`;
      }
      actions += `<button class="btn btn-light" data-plan="export">${icon('i-download')}Export CSV</button>`;
    }
    if (role === 'woreda' && p.status === 'sent') {
      const zd = p.zones[ME.zone], wd = zd?.woredas[ME.woreda];
      if (zd?.sentToWoredasAt && wd) banner = `<div class="plan-banner">${icon('i-bell')}<div><b>Annual targets received from ${esc(ME.zone)} Zone</b><span>Sent ${esc(date(zd.sentToWoredasAt))}${wd.ack ? ` · acknowledged ${esc(date(wd.ack.at))}` : ''}</span></div>
        ${!wd.ack ? `<button class="btn btn-green" data-plan="ack-woreda">${icon('i-check')}Acknowledge receipt</button>` : ''}</div>`;
    }
    const showTabs = role === 'bureau' || (role === 'zone' && p.status === 'sent');
    return `
      <div class="card plan-head">
        <div class="ph-top">
          <div>
            <div class="ph-eyebrow">${icon('i-target')} Annual plan · ${esc(p.fy)}</div>
            <h2>${esc(p.title)}</h2>
            <p>${esc(p.objectives || '')}</p>
          </div>
          <div class="ph-side">
            ${years.length > 1 ? `<select id="planYear" aria-label="Fiscal year">${years.map(x => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>${esc(x.fy)}${x.status === 'draft' ? ' (draft)' : ''}</option>`).join('')}</select>` : ''}
            <span class="pill ${p.status === 'sent' ? 'approved' : 'inactive'}">${p.status === 'sent' ? `Sent to zones · ${esc(date(p.sentAt))}` : 'Draft, not sent'}</span>
          </div>
        </div>
        ${banner}
        <div class="ph-bar">
          ${showTabs ? `<div class="seg" id="planTabs"><button data-tab="targets" class="${tab === 'targets' ? 'active' : ''}">${role === 'bureau' ? 'Targets by zone' : 'Targets by woreda'}</button><button data-tab="progress" class="${tab === 'progress' ? 'active' : ''}">Progress</button></div>` : '<span></span>'}
          <div class="ph-actions">${actions}</div>
        </div>
      </div>`;
  }

  /* ---------------- Bureau ---------------- */
  const remainingR = (p, ind) => (+p.region[ind] || 0) - ZONES.reduce((s, z) => s + (+p.zones[z]?.targets[ind] || 0), 0);
  function bureauTargets(p) {
    const edit = p.status === 'draft';
    return `<div class="card"><div class="table-wrap"><table class="plan-table">
      <thead><tr><th>Indicator</th><th class="r">Region target</th>${ZONES.map(z => `<th class="r">${esc(z)}</th>`).join('')}<th class="r">Unallocated</th></tr></thead>
      <tbody>${p.indicators.map(i => {
        const rem = remainingR(p, i.id);
        return `<tr><td><span class="name">${esc(i.name)}</span><span class="sub">${esc(i.unit)}</span></td>
          <td class="r num"><b>${fmt(p.region[i.id])}</b></td>
          ${ZONES.map(z => `<td class="r">${edit ? `<input class="cell" type="number" min="0" step="any" data-zt="${esc(z)}" data-ind="${i.id}" value="${p.zones[z].targets[i.id] ?? ''}">` : `<span class="num">${fmt(p.zones[z].targets[i.id])}</span>`}</td>`).join('')}
          <td class="r num ${rem === 0 ? 'var-pos' : 'var-neg'}">${rem === 0 ? '✓' : fmt(rem)}</td></tr>`;
      }).join('')}</tbody>
      <tfoot><tr><td colspan="2" class="sub">Zone status</td>${ZONES.map(z => { const [c, l] = zoneStatus(p, z); return `<td class="r"><span class="pill ${c}">${esc(l)}</span></td>`; }).join('')}<td></td></tr></tfoot>
    </table></div>
    ${edit ? '<p class="demo-note" style="text-align:left">Enter each zone\'s share. "Send to zones" becomes available when every target is fully allocated.</p>' : ''}</div>`;
  }
  function bureauProgress(p) {
    const zonePct = z => avgPct(p.indicators.map(i => [totalZ(p, z, i.id), +p.zones[z].targets[i.id] || 0]));
    const overall = avgPct(p.indicators.map(i => [totalR(p, i.id), +p.region[i.id] || 0]));
    const reported = ZONES.flatMap(z => Object.keys(p.zones[z].woredas).map(w => !!st.subs[`${p.id}|${z}|${w}|${curQ}`]));
    return `
      <div class="kpis plan-kpis">
        <div class="kpi"><div class="k-top">Overall achievement</div><strong class="num">${overall}%</strong><span class="k-sub">Average across indicators, Q1–Q${curQ}</span></div>
        <div class="kpi"><div class="k-top">Expected by end of Q${curQ}</div><strong class="num">${curQ * 25}%</strong><span class="k-sub">If work is spread evenly over the year</span></div>
        <div class="kpi"><div class="k-top">Zones sent to woredas</div><strong class="num">${ZONES.filter(z => p.zones[z].sentToWoredasAt).length} / ${ZONES.length}</strong><span class="k-sub">${ZONES.filter(z => p.zones[z].ack).length} acknowledged</span></div>
        <div class="kpi"><div class="k-top">Q${curQ} woreda reports</div><strong class="num">${reported.filter(Boolean).length} / ${reported.length}</strong><span class="k-sub">From woredas that received targets</span></div>
      </div>
      <div class="grid g-2-1">
        <div class="card"><div class="card-head"><div><h3>Achievement by indicator</h3><p>Reported by woredas, all zones</p></div></div>
          <table class="plan-table"><thead><tr><th>Indicator</th><th class="r">Target</th><th class="r">Achieved</th><th style="width:34%">Progress</th></tr></thead>
          <tbody>${p.indicators.map(i => { const a = totalR(p, i.id); return `<tr><td><span class="name">${esc(i.name)}</span><span class="sub">${esc(i.unit)}</span></td><td class="r num">${fmt(p.region[i.id])}</td><td class="r num"><b>${fmt(a)}</b></td><td>${bar(pct(a, p.region[i.id]))}</td></tr>`; }).join('')}</tbody></table></div>
        <div class="card"><div class="card-head"><div><h3>Zones</h3><p>Average achievement and plan status</p></div></div>
          ${ZONES.map(z => { const [c, l] = zoneStatus(p, z); return `<div class="list-item"><div style="flex:1;min-width:0"><h4>${esc(z)}</h4><p><span class="pill ${c}">${esc(l)}</span></p></div><div style="width:150px">${bar(zonePct(z))}</div></div>`; }).join('')}
        </div>
      </div>
      <div class="card"><div class="card-head"><div><h3>Achievement by zone and indicator</h3><p>% of each zone's annual target · green: on schedule (≥ ${expected()}% by end of Q${curQ}), amber: slightly behind, red: well behind</p></div></div>
        <div class="table-wrap"><table class="plan-table heat"><thead><tr><th>Indicator</th>${ZONES.map(z => `<th class="r">${esc(z)}</th>`).join('')}</tr></thead>
        <tbody>${p.indicators.map(i => `<tr><td><span class="name">${esc(i.name)}</span></td>${ZONES.map(z => { const v = pct(totalZ(p, z, i.id), p.zones[z].targets[i.id]); return `<td class="r"><span class="heat-cell ${p.zones[z].sentToWoredasAt ? pctCls(v) : 'pc-none'}">${p.zones[z].sentToWoredasAt ? v + '%' : '—'}</span></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="demo-note" style="text-align:left">— means the zone has not yet sent targets to its woredas, so nothing has been reported.</p></div>`;
  }

  /* ---------------- Zone ---------------- */
  const remainingZ = (p, z, ind) => (+p.zones[z].targets[ind] || 0) - REGIONS[z].reduce((s, w) => s + (+p.zones[z].woredas[w]?.targets[ind] || 0), 0);
  function zoneTargets(p) {
    if (p.status !== 'sent') return `<div class="card"><div class="empty">The Bureau has not sent this year's plan yet.</div></div>`;
    const z = ME.zone, zd = p.zones[z], ws = REGIONS[z];
    const edit = zd.ack && !zd.sentToWoredasAt;
    return `<div class="card">
      ${!zd.ack ? '<p class="note" style="margin-bottom:14px">Acknowledge receipt of the plan first, then divide your zone\'s targets among your woredas.</p>' : ''}
      <div class="table-wrap"><table class="plan-table">
      <thead><tr><th>Indicator</th><th class="r">${esc(z)} target</th>${ws.map(w => `<th class="r">${esc(w)}</th>`).join('')}<th class="r">Unallocated</th></tr></thead>
      <tbody>${p.indicators.map(i => {
        const rem = remainingZ(p, z, i.id);
        return `<tr><td><span class="name">${esc(i.name)}</span><span class="sub">${esc(i.unit)}</span></td><td class="r num"><b>${fmt(zd.targets[i.id])}</b></td>
          ${ws.map(w => `<td class="r">${edit ? `<input class="cell" type="number" min="0" step="any" data-wt="${esc(w)}" data-ind="${i.id}" value="${zd.woredas[w]?.targets[i.id] ?? ''}">` : `<span class="num">${fmt(zd.woredas[w]?.targets[i.id])}</span>`}</td>`).join('')}
          <td class="r num ${rem === 0 ? 'var-pos' : 'var-neg'}">${rem === 0 ? '✓' : fmt(rem)}</td></tr>`;
      }).join('')}</tbody>
      ${zd.sentToWoredasAt ? `<tfoot><tr><td colspan="2" class="sub">Woreda status</td>${ws.map(w => { const [c, l] = woredaStatus(p, z, w); return `<td class="r"><span class="pill ${c}">${esc(l)}</span></td>`; }).join('')}<td></td></tr></tfoot>` : ''}
    </table></div></div>`;
  }
  function zoneProgress(p) {
    const z = ME.zone, zd = p.zones[z], ws = REGIONS[z];
    if (!zd.sentToWoredasAt) return `<div class="card"><div class="empty">Send the targets to your woredas to start receiving quarterly reports.</div></div>`;
    return `<div class="card"><div class="card-head"><div><h3>${esc(z)} Zone: achievement by woreda</h3><p>% of each woreda's annual target, Q1–Q${curQ}</p></div></div>
      <div class="table-wrap"><table class="plan-table heat"><thead><tr><th>Indicator</th><th class="r">Zone</th>${ws.map(w => `<th class="r">${esc(w)}</th>`).join('')}</tr></thead>
      <tbody>${p.indicators.map(i => `<tr><td><span class="name">${esc(i.name)}</span><span class="sub">${fmt(totalZ(p, z, i.id))} of ${fmt(zd.targets[i.id])} ${esc(i.unit)}</span></td>
        <td class="r">${bar(pct(totalZ(p, z, i.id), zd.targets[i.id]))}</td>
        ${ws.map(w => { const v = pct(totalW(p, z, w, i.id), zd.woredas[w]?.targets[i.id]); return `<td class="r"><span class="heat-cell ${pctCls(v)}">${v}%</span></td>`; }).join('')}</tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="2" class="sub">Q${curQ} report</td>${ws.map(w => { const [c, l] = woredaStatus(p, z, w); return `<td class="r"><span class="pill ${c}">${esc(l)}</span></td>`; }).join('')}</tr></tfoot></table></div></div>`;
  }

  /* ---------------- Woreda ---------------- */
  function woredaView(p) {
    const z = ME.zone, w = ME.woreda, zd = p.zones[z], wd = zd?.woredas[w];
    if (p.status !== 'sent' || !zd?.sentToWoredasAt || !wd) return `<div class="card"><div class="empty">Your zone has not sent this year's targets yet. You will see them here once they are sent.</div></div>`;
    const sub = st.subs[`${p.id}|${z}|${w}|${curQ}`];
    return `<div class="card">
      <div class="card-head"><div><h3>${esc(w)} Woreda: annual targets and quarterly achievement</h3><p>Enter what was achieved in each quarter (not the running total). Current quarter: <b>Q${curQ} (${QUARTERS[curQ - 1].months})</b>.</p></div>
        ${sub ? `<span class="pill approved">Q${curQ} report submitted ${esc(date(sub.at))}</span>` : `<span class="pill pending">Q${curQ} report not submitted</span>`}</div>
      ${!wd.ack ? '<p class="note" style="margin-bottom:14px">Acknowledge receipt of your targets before reporting.</p>' : ''}
      <div class="table-wrap"><table class="plan-table">
        <thead><tr><th>Indicator</th><th class="r">Annual target</th>${QUARTERS.map(Q => `<th class="r" title="${Q.months}">${Q.label}<span class="sub">${Q.months}</span></th>`).join('')}<th class="r">Total</th><th style="width:16%">Progress</th></tr></thead>
        <tbody>${p.indicators.map(i => {
          const tgt = wd.targets[i.id] || 0, tot = totalW(p, z, w, i.id);
          return `<tr><td><span class="name">${esc(i.name)}</span><span class="sub">${esc(i.unit)}</span></td><td class="r num"><b>${fmt(tgt)}</b></td>
            ${QUARTERS.map(Q => `<td class="r">${Q.q <= curQ && wd.ack ? `<input class="cell" type="number" min="0" step="any" data-q="${Q.q}" data-ind="${i.id}" value="${achW(p, z, w, i.id, Q.q) ?? ''}">` : `<span class="num sub">${achW(p, z, w, i.id, Q.q) ?? '—'}</span>`}</td>`).join('')}
            <td class="r num"><b>${fmt(tot)}</b></td><td>${bar(pct(tot, tgt))}</td></tr>`;
        }).join('')}</tbody>
      </table></div>
      ${wd.ack ? `<div style="display:flex;justify-content:flex-end;margin-top:16px"><button class="btn btn-primary" data-plan="submit-q">${icon('i-send')}Submit Q${curQ} report to ${esc(z)} Zone</button></div>` : ''}
    </div>`;
  }

  /* ---------------- plan editor (Bureau) ---------------- */
  function editPlan(isNew) {
    const base = plan();
    const p = isNew
      ? { id: 'p-' + Date.now().toString(36), fy: nextFY(base?.fy), title: base?.title || 'Regional road and transport annual plan', objectives: base?.objectives || '', status: 'draft', createdAt: new Date().toISOString(), sentAt: null,
          indicators: (base?.indicators || []).map(i => ({ ...i })), region: Object.fromEntries((base?.indicators || []).map(i => [i.id, ''])), zones: {} }
      : JSON.parse(JSON.stringify(base));
    let rows = p.indicators.map(i => ({ ...i, target: p.region[i.id] ?? '' }));
    const draw = () => {
      $('#peRows').innerHTML = rows.map((r, k) => `<div class="pe-row">
        <input data-k="${k}" data-f="name" placeholder="Indicator, e.g. Gravel road construction" value="${esc(r.name)}">
        <input data-k="${k}" data-f="unit" placeholder="Unit" value="${esc(r.unit)}">
        <input data-k="${k}" data-f="target" type="number" min="0" step="any" placeholder="Region target" value="${esc(r.target)}">
        <button type="button" class="btn btn-light btn-sm" data-del="${k}" aria-label="Remove">×</button></div>`).join('');
    };
    openDrawer(isNew ? 'New annual plan' : 'Edit annual plan', 'Prepared by the Bureau, then sent to zones', `
      <div class="form-grid">
        <div class="field"><label for="peFy">Fiscal year</label><input id="peFy" value="${esc(p.fy)}"></div>
        <div class="field"><label for="peTitle">Plan title</label><input id="peTitle" value="${esc(p.title)}"></div>
        <div class="field full"><label for="peObj">Objectives</label><textarea id="peObj" rows="3">${esc(p.objectives)}</textarea></div>
      </div>
      <div class="dr-sec" style="margin-top:18px"><h4>Indicators and regional targets</h4>
        <div class="pe-row pe-head"><span>Indicator</span><span>Unit</span><span>Region target</span><span></span></div>
        <div id="peRows"></div>
        <button type="button" class="btn btn-light btn-sm" id="peAdd" style="margin-top:10px">${icon('i-plus')}Add indicator</button></div>
      <div class="err" id="peErr"></div>`,
      `<button class="btn btn-light" id="peCancel">Cancel</button><button class="btn btn-primary" id="peSave">${icon('i-check')}Save draft</button>`);
    draw();
    $('#peRows').addEventListener('input', e => { const k = e.target.dataset.k; if (k !== undefined) rows[+k][e.target.dataset.f] = e.target.value; });
    $('#peRows').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (b) { rows.splice(+b.dataset.del, 1); draw(); } });
    $('#peAdd').addEventListener('click', () => { rows.push({ id: 'i' + Date.now().toString(36) + rows.length, name: '', unit: 'km', target: '' }); draw(); });
    $('#peCancel').addEventListener('click', closeDrawer);
    $('#peSave').addEventListener('click', () => {
      const err = m => { $('#peErr').textContent = m; $('#peErr').classList.add('show'); };
      const fy = $('#peFy').value.trim();
      if (!fy || !$('#peTitle').value.trim()) return err('Enter the fiscal year and plan title.');
      if (st.plans.some(x => x.fy === fy && x.id !== p.id)) return err(`A plan for ${fy} already exists.`);
      rows = rows.filter(r => r.name.trim());
      if (!rows.length) return err('Add at least one indicator.');
      if (rows.some(r => r.target === '' || +r.target < 0 || isNaN(+r.target))) return err('Enter a regional target (0 or more) for every indicator.');
      p.fy = fy; p.title = $('#peTitle').value.trim(); p.objectives = $('#peObj').value.trim();
      p.indicators = rows.map(r => ({ id: r.id, name: r.name.trim(), unit: r.unit.trim() || 'number' }));
      p.region = Object.fromEntries(rows.map(r => [r.id, +r.target]));
      ZONES.forEach(z => {
        p.zones[z] ??= { targets: {}, ack: null, sentToWoredasAt: null, woredas: {} };
        p.zones[z].targets = Object.fromEntries(p.indicators.map(i => [i.id, p.zones[z].targets[i.id] ?? '']));
      });
      st.plans = st.plans.filter(x => x.id !== p.id).concat(p); planId = p.id; tab = 'targets';
      commit(); closeDrawer(); refresh(); toast('Plan saved as draft');
    });
  }
  const nextFY = fy => { const n = parseInt(fy, 10); return isNaN(n) ? '' : `${n + 1} E.C.`; };

  /* ---------------- CSV ---------------- */
  function exportCSV() {
    const p = plan(), rows = [];
    if (role === 'bureau') {
      rows.push(['Indicator', 'Unit', 'Region target', ...ZONES.flatMap(z => [`${z} target`, `${z} achieved`]), 'Region achieved']);
      p.indicators.forEach(i => rows.push([i.name, i.unit, p.region[i.id], ...ZONES.flatMap(z => [p.zones[z].targets[i.id], totalZ(p, z, i.id)]), totalR(p, i.id)]));
    } else {
      const z = ME.zone, ws = REGIONS[z];
      rows.push(['Indicator', 'Unit', 'Zone target', ...ws.flatMap(w => [`${w} target`, `${w} achieved`])]);
      p.indicators.forEach(i => rows.push([i.name, i.unit, p.zones[z].targets[i.id], ...ws.flatMap(w => [p.zones[z].woredas[w]?.targets[i.id] ?? '', totalW(p, z, w, i.id)])]));
    }
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: `annual-plan-${p.fy.replace(/\W+/g, '-')}${role === 'zone' ? '-' + ME.zone : ''}.csv` }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------------- events ---------------- */
  let root = null;
  function refresh() { if (root) render(root); }
  function bind(r) {
    root = r;
    r.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]'); if (t && t.closest('#planTabs')) { tab = t.dataset.tab; return refresh(); }
      const b = e.target.closest('[data-plan]'); if (!b || b.disabled) return;
      const p = plan(), now = new Date().toISOString(), a = b.dataset.plan;
      if (a === 'new') return editPlan(true);
      if (a === 'edit') return editPlan(false);
      if (a === 'export') return exportCSV();
      if (a === 'auto-zones') {
        const weights = ZONES.map(z => REGIONS[z].length);
        p.indicators.forEach(i => split(+p.region[i.id] || 0, weights).forEach((v, k) => { p.zones[ZONES[k]].targets[i.id] = v; }));
        commit(); refresh(); return toast('Targets split by number of woredas in each zone');
      }
      if (a === 'send-zones') {
        if (!confirm(`Send the ${p.fy} plan to all ${ZONES.length} zones? Targets can no longer be changed after sending.`)) return;
        p.status = 'sent'; p.sentAt = now; commit(); refresh(); return toast(`Plan sent to ${ZONES.length} zones`);
      }
      if (a === 'ack-zone') { p.zones[ME.zone].ack = { at: now, by: ME.name }; commit(); refresh(); return toast('Receipt acknowledged'); }
      if (a === 'auto-woredas') {
        const z = ME.zone, ws = REGIONS[z];
        p.indicators.forEach(i => split(+p.zones[z].targets[i.id] || 0, ws.map(() => 1)).forEach((v, k) => { (p.zones[z].woredas[ws[k]] ??= { targets: {}, ack: null }).targets[i.id] = v; }));
        commit(); refresh(); return toast('Targets split evenly across woredas');
      }
      if (a === 'send-woredas') {
        if (!confirm(`Send the targets to ${REGIONS[ME.zone].length} woredas in ${ME.zone} Zone?`)) return;
        p.zones[ME.zone].sentToWoredasAt = now; commit(); refresh(); return toast(`Targets sent to ${REGIONS[ME.zone].length} woredas`);
      }
      if (a === 'ack-woreda') { p.zones[ME.zone].woredas[ME.woreda].ack = { at: now, by: ME.name }; commit(); refresh(); return toast('Receipt acknowledged'); }
      if (a === 'submit-q') {
        st.subs[`${p.id}|${ME.zone}|${ME.woreda}|${curQ}`] = { at: now, by: ME.name };
        commit(); refresh(); return toast(`Q${curQ} report submitted to ${ME.zone} Zone`);
      }
    });
    r.addEventListener('change', e => {
      const el = e.target; const p = plan();
      if (el.id === 'planYear') { planId = el.value; tab = 'targets'; return refresh(); }
      if (!el.classList.contains('cell')) return;
      const v = el.value === '' ? '' : Math.max(0, +el.value);
      if (el.dataset.zt !== undefined && p.status === 'draft') p.zones[el.dataset.zt].targets[el.dataset.ind] = v;
      else if (el.dataset.wt !== undefined) (p.zones[ME.zone].woredas[el.dataset.wt] ??= { targets: {}, ack: null }).targets[el.dataset.ind] = v;
      else if (el.dataset.q !== undefined) {
        const k = `${p.id}|${ME.zone}|${ME.woreda}|${el.dataset.ind}|${el.dataset.q}`;
        if (v === '') delete st.ach[k]; else st.ach[k] = v;
      } else return;
      commit(); refresh();
    });
  }

  return {
    view: { title: 'Annual plan', sub: role === 'bureau' ? 'Prepare the regional plan and send targets to zones' : role === 'zone' ? `Plan from the Bureau and targets for ${ME.zone} Zone woredas` : `Targets and quarterly reporting for ${ME.woreda} Woreda` },
    render(r) { if (root !== r) bind(r); render(r); },
    pending,
    onChange(fn) { onChange = fn; }
  };
}
