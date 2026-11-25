import "../css/admin.css";
import { getUsers, login, currentUser, ROLES, scopeLabel } from "./shared.js";

if (currentUser()) location.replace('admin.html');

const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function go(username, password) {
  const r = login(username, password);
  if (r.error) { $('#loginErr').textContent = r.error; $('#loginErr').classList.add('show'); return; }
  location.href = 'admin.html';
}

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!$('#user').value.trim() || !$('#pass').value) {
    $('#loginErr').textContent = 'Enter your username and password.'; $('#loginErr').classList.add('show'); return;
  }
  go($('#user').value, $('#pass').value);
});

// one-click demo accounts, a few per role
const users = getUsers().filter(u => u.active);
const pick = { bureau: 1, zone: 3, woreda: 3, consultant: 1, contractor: 1 };
$('#demoAccounts').innerHTML = Object.keys(pick).map(role => {
  const list = users.filter(u => u.role === role).slice(0, pick[role]);
  return `<div class="demo-group"><span class="demo-role">${esc(ROLES[role].label)}</span>${list.map(u =>
    `<button type="button" class="demo-acc" data-u="${esc(u.username)}"><b>${esc(u.username)}</b><small>${esc(scopeLabel(u))}</small></button>`).join('')}</div>`;
}).join('');
$('#demoAccounts').addEventListener('click', e => {
  const b = e.target.closest('[data-u]'); if (!b) return;
  $('#user').value = b.dataset.u; $('#pass').value = 'demo123';
  go(b.dataset.u, 'demo123');
});
