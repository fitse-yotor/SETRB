/* ------------------------------------------------------------------
   Shared between the public portal, the login page and the dashboard:
   zones/woredas, demo accounts, session and citizen complaints.

   ⚠ DEMO ONLY: accounts, sessions and complaints are kept in the
   browser (localStorage). A real deployment must move all of this to
   a backend with hashed passwords, server-side sessions and an API.
   ------------------------------------------------------------------ */

/* Zones and woredas — sample list, verify the official structure with the Bureau. */
export const REGIONS = {
  'Wolaita':   ['Sodo Zuria', 'Humbo', 'Damot Gale', 'Boloso Sore', 'Offa', 'Kindo Koysha'],
  'Gamo':      ['Arba Minch Zuria', 'Chencha', 'Bonke', 'Dita', 'Mirab Abaya'],
  'Gofa':      ['Demba Gofa', 'Geze Gofa', 'Uba Debretsehay', 'Melokoza'],
  'South Omo': ['Debub Ari', 'Hamer', 'Bena Tsemay', 'Malle', 'Dasenech'],
  'Gedeo':     ['Dilla Zuria', 'Yirgachefe', 'Kochere', 'Wenago', 'Bule'],
  'Konso':     ['Kena', 'Segen Zuria', 'Kolme', 'Karat Zuria'],
  'Burji':     ['Soyama', 'Burji Zuria'],
  'Ale':       ['Kolango', 'Ale Zuria']
};
export const ZONE_AM = {
  'Wolaita': 'ወላይታ', 'Gamo': 'ጋሞ', 'Gofa': 'ጎፋ', 'South Omo': 'ደቡብ ኦሞ',
  'Gedeo': 'ጌዴኦ', 'Konso': 'ኮንሶ', 'Burji': 'ቡርጂ', 'Ale': 'አሌ'
};

export const ROLES = {
  bureau:     { label: 'Bureau administrator', short: 'Bureau' },
  zone:       { label: 'Zone office',          short: 'Zone' },
  woreda:     { label: 'Woreda office',        short: 'Woreda' },
  consultant: { label: 'Supervising consultant', short: 'Consultant' },
  contractor: { label: 'Contractor',           short: 'Contractor' }
};

export const COMPLAINT_TYPES = ['Road damage / pothole', 'Bridge or drainage', 'Public transport complaint', 'Service delivery complaint', 'Other'];
export const COMPLAINT_STATUS = {
  received:    { label: 'Received',    am: 'ደርሷል' },
  assigned:    { label: 'Assigned',    am: 'ተመድቧል' },
  'in-progress': { label: 'In progress', am: 'በሂደት ላይ' },
  resolved:    { label: 'Resolved',    am: 'ተፈቷል' },
  rejected:    { label: 'Not accepted', am: 'ተቀባይነት አላገኘም' }
};

const K_USERS = 'setrb-users-v1', K_SESSION = 'setrb-session-v1', K_COMPLAINTS = 'setrb-complaints-v1';

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch (e) { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
}

/* ---------------- accounts ---------------- */
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
function seedUsers() {
  const u = [{ id: 'u1', username: 'admin', name: 'Bureau Administrator', role: 'bureau', phone: '+251 46 000 0000', active: true }];
  Object.keys(REGIONS).forEach(z => u.push({ id: 'z-' + slug(z), username: 'zone.' + slug(z), name: `${z} Zone Transport & Road Department`, role: 'zone', zone: z, phone: '', active: true }));
  [['Wolaita', 'Humbo'], ['Wolaita', 'Damot Gale'], ['Gamo', 'Chencha'], ['Gedeo', 'Dilla Zuria'], ['South Omo', 'Hamer'], ['Konso', 'Kena']]
    .forEach(([z, w]) => u.push({ id: 'w-' + slug(w), username: 'woreda.' + slug(w), name: `${w} Woreda Transport Office`, role: 'woreda', zone: z, woreda: w, phone: '', active: true }));
  ['1', '2', '3', '4'].forEach(n => u.push({ id: 'c' + n, username: 'consultant' + n, name: 'Consultant ' + n, org: 'Consultant ' + n, role: 'consultant', phone: '', active: true }));
  'ABCDEFGH'.split('').forEach(l => u.push({ id: 'k' + l, username: 'contractor' + l.toLowerCase(), name: 'Contractor ' + l, org: 'Contractor ' + l, role: 'contractor', phone: '', active: true }));
  return u.map(x => ({ ...x, password: 'demo123', createdAt: '2026-07-08' }));
}
export function getUsers() {
  let u = read(K_USERS, null);
  if (!Array.isArray(u) || !u.length) { u = seedUsers(); write(K_USERS, u); }
  return u;
}
export function saveUsers(u) { write(K_USERS, u); }

export function login(username, password) {
  const u = getUsers().find(x => x.username.toLowerCase() === String(username).trim().toLowerCase());
  if (!u || u.password !== password) return { error: 'Incorrect username or password.' };
  if (!u.active) return { error: 'This account has been deactivated. Contact the Bureau.' };
  write(K_SESSION, { userId: u.id, at: Date.now() });
  return { user: u };
}
export function currentUser() {
  const s = read(K_SESSION, null);
  if (!s) return null;
  const u = getUsers().find(x => x.id === s.userId);
  return u && u.active ? u : null;
}
export function logout() { try { localStorage.removeItem(K_SESSION); } catch (e) {} }

export function scopeLabel(u) {
  if (!u) return '';
  if (u.role === 'zone') return `${u.zone} Zone`;
  if (u.role === 'woreda') return `${u.woreda} Woreda · ${u.zone}`;
  if (u.role === 'bureau') return 'All zones';
  return u.org || '';
}

/* ---------------- complaints ---------------- */
function seedComplaints() {
  const mk = (id, daysAgo, o) => {
    const at = new Date(Date.now() - daysAgo * 864e5).toISOString();
    return { id, createdAt: at, photo: null, assignedTo: null, ...o,
      history: [{ at, by: 'Citizen', status: 'received', note: 'Complaint submitted through the public portal.', public: true }, ...(o.history || [])] };
  };
  const later = (d, h) => new Date(Date.now() - d * 864e5 + h * 36e5).toISOString();
  return [
    mk('SE-2026-418230', 9, { name: 'Abebe K.', phone: '0911 000 001', type: COMPLAINT_TYPES[0], zone: 'Wolaita', woreda: 'Humbo', location: 'Humbo town, near the market', description: 'Large potholes on the main road make it dangerous for minibuses during rain.', status: 'in-progress', assignedTo: 'Humbo',
      history: [{ at: later(8, 2), by: 'Wolaita Zone Transport & Road Department', status: 'assigned', note: 'Assigned to Humbo Woreda Transport Office for site inspection.', public: true },
                { at: later(6, 4), by: 'Humbo Woreda Transport Office', status: 'in-progress', note: 'Site inspected. Maintenance crew scheduled for next week.', public: true }] }),
    mk('SE-2026-552901', 5, { name: 'Tigist M.', phone: '0922 000 002', type: COMPLAINT_TYPES[1], zone: 'Gamo', woreda: 'Chencha', location: 'Kebele 03 culvert crossing', description: 'The culvert is blocked and water is flooding the road.', status: 'assigned', assignedTo: 'Chencha',
      history: [{ at: later(4, 3), by: 'Gamo Zone Transport & Road Department', status: 'assigned', note: 'Forwarded to Chencha Woreda office.', public: true }] }),
    mk('SE-2026-603117', 3, { name: 'Daniel T.', phone: '0933 000 003', type: COMPLAINT_TYPES[2], zone: 'Gedeo', woreda: 'Dilla Zuria', location: 'Dilla – Yirgachefe route', description: 'Minibus operators are charging more than the approved tariff.', status: 'received' }),
    mk('SE-2026-377045', 14, { name: 'Marta A.', phone: '0944 000 004', type: COMPLAINT_TYPES[0], zone: 'Konso', woreda: 'Kena', location: 'Karat – Kena junction', description: 'Road edge collapsed after heavy rain.', status: 'resolved', assignedTo: 'Kena',
      history: [{ at: later(13, 2), by: 'Konso Zone Transport & Road Department', status: 'assigned', note: 'Assigned to Kena Woreda.', public: true },
                { at: later(7, 5), by: 'Kena Woreda Transport Office', status: 'resolved', note: 'Road edge repaired and gabions installed. Thank you for reporting.', public: true }] }),
    mk('SE-2026-690552', 1, { name: 'Samuel B.', phone: '0955 000 005', type: COMPLAINT_TYPES[3], zone: 'South Omo', woreda: 'Hamer', location: 'Turmi', description: 'Freight licence renewal has been pending for three weeks without an answer.', status: 'received' })
  ];
}
export function getComplaints() {
  let c = read(K_COMPLAINTS, null);
  if (!Array.isArray(c)) { c = seedComplaints(); write(K_COMPLAINTS, c); }
  return c;
}
export function saveComplaints(c) { return write(K_COMPLAINTS, c); }
export function addComplaint(data) {
  const list = getComplaints();
  let id;
  do { id = 'SE-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000); } while (list.some(c => c.id === id));
  const at = new Date().toISOString();
  const c = { id, createdAt: at, status: 'received', assignedTo: null, ...data,
    history: [{ at, by: 'Citizen', status: 'received', note: 'Complaint submitted through the public portal.', public: true }] };
  list.unshift(c);
  if (!saveComplaints(list)) {            // storage full (large photo) — retry without the photo
    c.photo = null; saveComplaints(list);
  }
  return c;
}
export function findComplaint(id) {
  return getComplaints().find(c => c.id.toUpperCase() === String(id).trim().toUpperCase()) || null;
}
export function resetShared() {
  try { [K_USERS, K_COMPLAINTS].forEach(k => localStorage.removeItem(k)); } catch (e) {}
}

export const fmtDate = iso => {
  const d = new Date(iso);
  return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

/* Resize an uploaded image to a small JPEG data URL so it fits in storage. */
export function shrinkImage(file, max = 900, q = .7) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not read image')); };
    img.src = url;
  });
}
