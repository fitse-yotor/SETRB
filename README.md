# SETRB — South Ethiopia Transport & Road Bureau Portal

Frontend for the **South Ethiopia Regional State Transport and Road Development Bureau**
(የደቡብ ኢትዮጵያ ክልል ትራንስፖርትና መንገድ ልማት አስተዳደር ቢሮ), built with [Vite](https://vite.dev).

| Page | Description |
|---|---|
| `index.html` | Public portal: about, Bureau Head's message, services, project tracker, news, tenders, citizen issue reporting. English / Amharic. |
| `admin.html` | Project monitoring dashboard: KPIs, planned vs actual progress, monthly report submission, Contractor → Consultant → Zone → Bureau approval workflow, issues, contractor ranking, CSV export. |

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173  (admin: /admin.html)
npm run build     # production build in dist/
npm run preview   # serve the build locally
```

## Structure

```
index.html, admin.html      page entry points
src/css/                    style.css (portal), admin.css (dashboard)
src/js/data.js              portal sample content (projects, news, tenders)
src/js/admin-data.js        dashboard sample data (projects, reports, issues)
src/js/main.js, admin.js    page logic
public/assets/img/          logo, director photo, placeholder illustrations
```

## Notes

- **All project, report, news and tender data is sample data.** Replace `src/js/data.js` and
  `src/js/admin-data.js` with API calls once the backend exists.
- Replace the placeholder illustrations in `public/assets/img/news/` with real photos.
- The Bureau Head's name is a placeholder (`[Bureau Head Name]`) in `index.html` / `src/js/main.js`.
- Dashboard changes are stored in the browser (`localStorage`) for demo purposes only.
- Amharic translations should be reviewed by a native speaker.
