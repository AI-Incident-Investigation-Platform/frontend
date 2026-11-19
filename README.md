# AI Incident Investigator

Mock-only frontend foundation built with React, TypeScript, Vite, and React Router. The shared app shell provides navigation, design tokens, UI primitives, and one linked incident fixture. Feature routes show placeholders until their respective FE tasks are implemented.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Getting started

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

The root URL redirects to `/overview`. Use the sidebar to navigate between sections. At 768 px and below, open the navigation menu and press Escape to close it. Load `/incidents/INC-1042` directly to check the incident route parameter and active Incidents item. An unmatched address displays a 404 with a link back to Overview.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Use `npm run preview` to serve the production build locally.

## Structure

```text
src/
  main.tsx                Browser entry point and local Inter font
  App.tsx                 Route tree and root redirect
  App.test.tsx            Navigation, redirect, deep link, and 404 smoke tests
  styles.css              Shared base styles
  app/
    AppShell.tsx          Sidebar, workspace header, navigation drawer
    navigation.ts         Named paths and sidebar destinations
    shell.css             Layout and responsive styles
  pages/
    PlaceholderPage.tsx   Feature and incident placeholders
    NotFoundPage.tsx      Unmatched-route page
  shared/
    styles/tokens.css     Color, typography, spacing, and sizing tokens
    ui/
      controls.tsx        Button, TextInput, Select
      badges.tsx          StatusBadge, SeverityBadge
      surfaces.tsx        Panel, MetricCard, DataTable, EmptyState, LoadingState, ErrorState
      Tabs.tsx            Keyboard-operable tab list and panels
      ui.css              Shared component styles
  entities/
    investigation.ts      Local incident, investigation, and telemetry models
  mocks/
    investigation.ts      Linked INC-1042 / payment-service demo fixture in UTC
```
