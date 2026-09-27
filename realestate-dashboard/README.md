# SiteFlow — Construction & Real Estate Dashboard

A dashboard covering the first three flows from the product notes:

1. **Login** — mock authentication with role detection (Admin / Site Engineer / Client)
2. **Project & Unit Management** — project list with filters, project detail with a unit table
3. **Construction Management** — currently-building / upcoming / completed task board, workforce summary, daily site log, material tracking

Built with **React 19 + Vite + react-router-dom**, styled with plain CSS driven by
custom properties (no UI framework), and mock data shaped after the fields in
`RealEstate_Construction_DB_Schema.xlsx` (projects, units, construction tasks,
workers, attendance, daily site logs, material requirements).

## Features requested

| Feature | Where it lives |
|---|---|
| Routing between pages | `src/App.jsx` (`react-router-dom` v6), `ProtectedRoute`, nested `/projects/:projectId` and `/construction/:projectId` |
| Theme switching | `src/contexts/ThemeContext.jsx` + `src/hooks/useTheme.js` — Light, Dark, and a "Blueprint" theme, all CSS-variable driven |
| Multilingual UI | `src/contexts/LanguageContext.jsx` + `src/hooks/useLanguage.js` + `src/i18n/translations.js` — English, Hindi, Tamil |
| Font switching | `src/contexts/FontContext.jsx` + `src/hooks/useFont.js` — 4 font families and 3 text sizes |
| Built with hooks | Every cross-cutting concern (auth, theme, language, font, project filtering, outside-click, localStorage) is a custom hook — see `src/hooks/` |

All three preferences (theme, language, font) are reachable from the **Preferences**
button in the top bar (and on the login screen), and persist across reloads via
`useLocalStorage`.

## Getting started

```bash
npm install
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Logging in

The login screen accepts any email containing `admin`, `site`, or `client`
(any password of 4+ characters), or you can tap one of the three demo-account
chips to autofill a sample login.

## Project structure

```
src/
  contexts/     ThemeContext, FontContext, LanguageContext, AuthContext
  hooks/        useTheme, useFont, useLanguage, useAuth, useProjects,
                useLocalStorage, useOutsideClick
  i18n/         translations.js (en / hi / ta dictionaries)
  data/         mockData.js (projects, units, tasks, workforce, materials)
  components/   DashboardLayout, PreferencesMenu, ProtectedRoute,
                StatusPill, ProgressBar, Icons
  pages/        LoginPage, ProjectsPage, ProjectDetailPage, ConstructionPage
```

## Extending

- **Add a language**: add an entry to `LANGUAGES` and a matching dictionary in
  `src/i18n/translations.js`.
- **Add a theme**: add a `[data-theme="..."]` block in `src/index.css` and an
  entry to `THEMES` in `src/contexts/ThemeContext.jsx`.
- **Add a font**: add an entry to `FONT_FAMILIES` in `src/contexts/FontContext.jsx`
  (and load the webfont in `index.html` if it isn't a system font).
- **Connect a real API**: replace the arrays in `src/data/mockData.js` and the
  mock `login()` in `src/contexts/AuthContext.jsx` with real requests — the
  page components already read through hooks, so the swap is isolated to
  those two layers.
