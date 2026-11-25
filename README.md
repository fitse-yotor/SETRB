# SETRB — South Ethiopia Transport & Road Bureau Portal

Frontend for the **South Ethiopia Regional State Transport and Road Development Bureau**
(የደቡብ ኢትዮጵያ ክልል ትራንስፖርትና መንገድ ልማት አስተዳደር ቢሮ), built with [Vite](https://vite.dev).

| Page | Description |
|---|---|
| `index.html` | Public portal: about, Bureau Head's message, services, project tracker, news, tenders, citizen issue reporting. English / Amharic. |
| `news.html`, `news-detail.html?id=` | News list with categories and search; full article page with sharing and related news. |
| `tenders.html`, `tender-detail.html?id=` | Tenders (open / closed), with reference, dates, fees, eligibility and documents; countdown to closing. |
| `vacancies.html`, `vacancy-detail.html?id=` | Job vacancies with duties, qualifications and how to apply. |
| `contact.html` | Contact form: saved to the admin inbox and emailed to the Bureau by the backend. |
| `index.html` → *Report an Issue* | Citizens submit complaints (zone, woreda, location, photo) and track them with a tracking number. |
| `login.html` | Staff sign-in for Bureau, zone, woreda, consultant and contractor accounts. |
| `admin.html` | Project monitoring dashboard: KPIs, planned vs actual progress, monthly report submission, Contractor/Woreda → Consultant → Zone → Bureau approval workflow, issues, contractor ranking, citizen complaints, account management, CSV export. |

## Accounts and permissions (demo)

All demo accounts use the password `demo123`. The login page lists them for one-click sign-in.

| Role | Example username | Sees | Can do |
|---|---|---|---|
| Bureau administrator | `admin` | Everything | Final approval of reports, handle all complaints, create any account, manage website news / tenders / vacancies, read contact messages |
| Zone office | `zone.wolaita` | Projects, reports and complaints in its zone | Approve reports at zone stage, assign complaints to woredas, create woreda accounts in its zone |
| Woreda office | `woreda.humbo` | Projects and complaints in its woreda | Submit monthly reports, resolve complaints |
| Consultant | `consultant1` | Projects it supervises | Verify reports (first review stage) |
| Contractor | `contractora` | Its own projects | Submit and resubmit monthly reports |

## Getting started

```bash
npm install
cp .env.example .env      # add your Claude API key and SMTP settings
npm run server            # backend on http://localhost:8787 (AI summaries, contact email)
npm run dev               # frontend on http://localhost:5173, /api is proxied to the backend
```

Production: `npm start` builds the site and serves it together with the API from the Node server on `PORT` (default 8787).

## Backend (`server/index.js`)

| Endpoint | Purpose |
|---|---|
| `POST /api/ai/summary` | AI summary of progress reports using the Claude API (`claude-opus-5-5`). `kind: "portfolio"` summarizes the projects in the dashboard filter; `kind: "report"` summarizes one monthly report for its reviewer. English or Amharic. If the model declines a request, the API automatically retries it on a fallback model (`fallbacks: "default"`). |
| `POST /api/contact` | Saves the message to `server/data/messages.jsonl` and emails it to `MAIL_TO` via SMTP. |
| `GET /api/health` | Shows whether AI and email are configured. |

Both POST endpoints are rate limited per IP. **Before going live, protect `/api/ai/summary` with real staff authentication**: every call costs API credits.

## Structure

```
index.html, admin.html      page entry points
src/css/                    style.css (portal), admin.css (dashboard)
src/js/data.js              portal sample content (projects, news, tenders)
src/js/admin-data.js        dashboard sample data (projects, reports, issues)
src/js/shared.js            zones/woredas, accounts, session, complaints, website content store
src/js/content-seed.js      default news, tenders, vacancies
src/js/site.js, icons.js    header/footer/language for inner public pages
src/js/*-page.js            news, tenders, vacancies, contact pages
src/js/admin-cms.js         admin: website content and messages
src/js/admin-ai.js          admin: AI summary client
server/index.js             Node backend (Claude API, SMTP, static files)
src/js/main.js, admin.js,
  login.js                  page logic
public/assets/img/          logo, director photo, placeholder illustrations
```

## Notes

- **All project, report, news and tender data is sample data.** Replace `src/js/data.js` and
  `src/js/admin-data.js` with API calls once the backend exists.
- Replace the placeholder illustrations in `public/assets/img/news/` with real photos.
- The Bureau Head's name is a placeholder (`[Bureau Head Name]`) in `index.html` / `src/js/main.js`.
- **Demo only: accounts, passwords, sessions, complaints and report changes are stored in the browser (`localStorage`).**
  This is not secure and is not shared between computers. Production needs a backend (database, hashed passwords,
  server-side sessions, role checks on every API call, photo storage, SMS notifications).
- The zone and woreda list in `src/js/shared.js` is a sample. Verify it against the official structure.
- Amharic translations should be reviewed by a native speaker.
