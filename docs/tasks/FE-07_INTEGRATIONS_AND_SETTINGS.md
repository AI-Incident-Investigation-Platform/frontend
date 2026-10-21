# FE-07. Integrations & Settings — подключения, workspace и роли

**Приоритет:** P1 · **Исполнитель:** Frontend · **Зависимости:** FE-01, shared form fields, mock environment/role models · **Статус:** TODO.

**Figma:** [Integrations 6:36](https://www.figma.com/design/JFUcynM2y9vIq6vJ7efTOc?node-id=6-36), [Settings 6:38](https://www.figma.com/design/JFUcynM2y9vIq6vJ7efTOc?node-id=6-38).

## Цель

Реализовать экраны корпоративной конфигурации, где можно понять наличие диагностических источников, увидеть их статус и безопасно открыть демонстрационные формы настройки. Реальное сохранение и проверка соединений на этой фазе отсутствуют.

## Объём FE-07A — Integrations

1. `/integrations`: заголовок, контекст проекта и кнопка `+ Add integration` как **demo** action.
2. Список шести источников Figma с назначением, статусом и краткой конфигурацией:
   - Elasticsearch — logs, stack traces, correlation IDs;
   - Prometheus — metrics/alerts/PromQL diagnostics;
   - Grafana Tempo — traces/spans;
   - GitHub — code, commits and diffs;
   - Docker diagnostics — container state/restarts/OOM;
   - Deployment API — external deployment events.
3. Status labels: Connected, Disconnected, Limited, Error — цвет + текст, не только цвет.
4. `Configure →` открывает modal/drawer с полями, соответствующими источнику; оставляет существующие значения fixtures, позволяет локально изменить черновик/отменить. `Save (demo)` меняет только mock state и обозначается как локальное действие.
5. Если есть поле credentials/token — input type password, без вывода реальных secrets, без их хранения в localStorage или logs. Не записывать настоящие tokens в mocks.
6. Empty/no-integrations, invalid endpoint, failed local validation, и responsive states.

## Объём FE-07B — Settings

1. `/settings`: заголовок и несколько инженерных блоков, как на Figma:
   - **Workspace configuration** — Workspace name, Default project, Default environment, retention (пример 90 дней).
   - **Investigation settings** — timeout 20 min, max tool calls 40, execution steps 20. Это **отображаемые согласованные лимиты MVP**, не UI-кнопка обхода лимитов.
   - **Security and access** — роли Admin, Developer, Viewer; подсказки разрешённых операций и видимости; no real authorization.
   - **AI runtime** — локальный llama.cpp, Qwen2.5-Coder-7B-Instruct, read-only diagnostic tools; пользователь не управляет моделью из браузера без контрактов.
2. При mock-переключении роли формы доступны Admin, read-only/disabled для Viewer; Developer согласно согласованной роли. Frontend RBAC **не обеспечивает** безопасность, реальный Backend должен проверять permissions.
3. Валидация формы: required workspace, корректные числовые bounds, ошибки у конкретного поля. `Save settings (demo)` изменяет только локальный fixture в рамках сессии; `Cancel/Reset` восстанавливает значения.
4. Предусмотреть открываемые empty/loading/error states и подтверждение **локального** обновления, не утверждать server success.

## Не входит

Реальная проверка соединения с внешними сервисами, сохранение credentials, production deployment configuration, настоящий user management, полноценный User Audit Log, изменения параметров AI Backend через UI.

## Предполагаемые зоны файлов

`src/pages/integrations/*`, `src/pages/settings/*`, `src/features/integration-editor/*`, `src/features/workspace-settings/*`, mock data and tests.

## Anti-AI-slop design directive

Это корпоративные настройки, а не каталог партнёров: **не** huge logo tiles, marketing icons, gradients, rounded cards вокруг каждого field. Короткие строки интеграций, спокойная типографика, ровные labels and controls, тонкие borders. Validation text возле input. Цвет — семантический. Figma B + [DESIGN_QUALITY_GATE.md](./DESIGN_QUALITY_GATE.md).

## Критерии приёмки

1. Обе страницы воспроизводят секции Figma и отображают шесть integrations.
2. `Configure` открывает рабочую локальную форму с cancel/reset/save demo.
3. Input validation и ошибки доступны и понятны; secrets не раскрываются.
4. Settings редактируются в demo session с корректной ролью; Viewer видит read-only состояния.
5. Параметры 20min/20steps/40calls отображены без несанкционированного изменения ограничения.
6. No integrations / broken mock / long provider URL и 1440/1280/768/390 проверены.
7. Tests действий формы/role states + lint/typecheck/build проходят.

## Выходной контракт

Функциональные UI-конфигурации на локальном mock layer, скриншоты двух страниц, сценарии Admin/Viewer и invalid form; готовая точка подключения будущих backend forms без фальшивого сетевого взаимодействия.
