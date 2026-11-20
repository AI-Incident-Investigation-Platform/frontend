# AI Incident Investigator

Mock-only frontend built with React, TypeScript, Vite, and React Router. The shared app shell provides navigation, design tokens, and UI primitives. Overview displays operational metrics and recent incidents from a linked demo snapshot.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Getting started

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

The root URL redirects to `/overview`. Click incident `INC-1042` to open Incident Detail. Service links open the selected node on Service Map via the `serviceId` query parameter. At 768 px and below, open the navigation menu and press Escape to close it. An unmatched address displays a 404 with a link back to Overview.

## Overview demo fixtures

- `/overview` displays the default UTC snapshot. Incident and service KPI counts come from the full demo inventory. The table displays the five most recent incidents. The workspace p95 is a fixed snapshot of 892 ms versus 709 ms one hour earlier.
- `/overview?demo=loading` displays the loading state.
- `/overview?demo=empty` displays an empty incident dataset while retaining the service signals.
- `/overview?demo=error` displays a local fixture error with a link to the default demo.
- `/overview?demo=long` adds an incident with a long ID for testing the table.

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
    PlaceholderPage.tsx   Future feature placeholders
    NotFoundPage.tsx      Unmatched-route page
    overview/             Operational metrics, incident table, and service signals
    incident-detail/      Investigation tabs, evidence and RCA review
    investigations/      Run selection, progress and chronological tool activity
  features/
    run-viewer/          Run progress and tool event projection
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
    incidentDetail.ts     Investigation, timeline and RCA snapshots
    runs.ts               Recorded runs and deterministic playback scenarios
    overview.ts           Typed inventory, demo states, and derived Overview metrics
```

## Incidents demo

Open `/incidents` to review all 13 records of the shared Overview and Incidents snapshot. Detected times and relative ranges use the workspace snapshot in UTC.

1. Search for `inc-1042`. The registry displays the canonical payment incident.
2. Search for `PAYMENT`, or search by title with `HTTP 500`. Both find the same incident.
3. Clear search, choose **Critical** and **Investigating**, then select **E-commerce**. The combined filters show `INC-1042`.
4. Reset, then choose **Last 6 hours**. Five records remain. Use the **Detected UTC** column to toggle sort direction.
5. Search for `no matching incident`. The empty result offers filter reset. **Reset filters** restores all records and focuses search.

Click `INC-1042` to open Incident Detail. Use `?demo=loading`, `?demo=empty`, `?demo=error`, and `?demo=long` to check additional registry states.

## Incident Detail demo

1. Open `/overview`, choose **Incidents** in the sidebar, find `INC-1042` and open it. The same incident also opens directly from Overview.
2. In **Hypotheses**, follow an evidence reference. The URL retains the Evidence tab and selected record after reload. Open **Source excerpt** on the log record to inspect the stack trace.
3. Open **RCA report** to check the default pending state. At `/incidents/INC-1042?tab=rca&demo=awaiting-review&role=admin`, **Approve** and **Reject** switch between local review snapshots.

The `demo` parameter accepts `failed`, `cancelled`, `completed`, `awaiting-review`, `approved`, `rejected`, or `no-evidence`. The default is the running snapshot. A demo Developer or Admin can use Retry and Cancel when the run state allows it. Set `role=viewer` to check read-only access. In an incident without a linked run, the record and detection timeline remain available.

## Live Investigations demo

Open `/investigations` to inspect four runs and their tool results. Choose **Pending (queued)**, **Running**, and **Awaiting review** in **Demo scenario** to follow `RUN-1042-01` from step 0 to 12 to 20. **Open INC-1042** retains the selected scenario on Incident Detail. Choosing another run in **Recent Agent Runs** switches the activity in place.

Choose **Failed tool call**, **No live runs**, **Empty run list**, or **Repeated event / long outcome** to inspect those fixtures. The projector in `src/features/run-viewer/projectRuns.ts` accepts a typed run snapshot and additional tool events for the same run. All playback uses local fixtures.

## Observability Explorer demo

1. Open `/incidents/INC-1042` and follow **payment-service on Service Map**. The six read-only nodes use a 24-hour window. The selected payment node shows 12.8% errors, 1.48 s p95, two restarts and four dependencies.
2. Follow **View service logs**. Submit `service:payment-service level:ERROR keyword:"connection timeout"` with **Run query**. Expand the matching log, check metadata and use **Copy log excerpt**. The demo accepts `service`, `level` and `keyword` terms and combines them with the time range.
3. Click **Open trace** and select **postgres / acquire connection** in the waterfall. The span starts 131 ms into the 1480 ms trace and lasts 1310 ms. The same trace opens from the Incident Detail Evidence record `EVD-1042-TRACE`.

Metrics are a fixed six-hour snapshot for `payment-service` as of 14:40 UTC. CPU usage (host) and the process CPU measurements in Incident Detail describe separate metrics. Use `/logs-metrics?demo=loading`, `?demo=error` or `?demo=no-metrics` to inspect those states. Use `/traces?demo=loading`, `?demo=empty` or `?demo=many` for the trace fixtures. Enter a minimum duration above 1480 ms to get no trace matches in the default dataset.
