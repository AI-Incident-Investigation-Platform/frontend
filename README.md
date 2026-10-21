# AI Incident Investigator

Minimal frontend foundation built with React, TypeScript, Vite, and React Router. The application currently has only a start page; backend integration and feature screens will be added later.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Getting started

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run preview` to serve the production build locally.

## Structure

- `src/main.tsx` mounts the application and browser router.
- `src/App.tsx` defines routes for current and future pages.
- `src/pages/` contains route pages.
