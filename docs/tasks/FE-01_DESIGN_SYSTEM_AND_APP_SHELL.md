# FE-01. Frontend Foundation: Design System, App Shell и routing

**Приоритет:** P0 · **Исполнитель:** Frontend (Расул + Claude Code) · **Зависимости:** инициализация пустого `frontend`-репозитория · **Статус:** TODO.

## Цель

Получить запускаемую архитектурную основу React-приложения с единым визуальным языком **Figma B**, навигацией и тестируемыми UI-примитивами. Все следующие экраны используют эту основу, а не клонируют sidebar, badges и mock-модели.

**Figma:** https://www.figma.com/design/JFUcynM2y9vIq6vJ7efTOc?node-id=6-2

## Объём работ

1. Провести read-only аудит текущего репозитория: existing files, package manager, configs, AGENTS.md. Если он пуст — React + TypeScript + Vite; React Router; CSS variables + согласованный способ стилизации, ESLint, TypeScript strict, Vitest/Testing Library (без тяжёлого UI kit).
2. Создать чистые зоны `app`/`pages`/`shared`/`entities`/`features`/`mocks`/`services` там, где они оправданы работающими файлами. Разделить entrypoint, router, layout, presentation и данные.
3. Реализовать App Shell: sidebar ~207 px на desktop; бренд, пункты Overview, Incidents, Live Investigations, Service Map, Logs & Metrics, Traces, Integrations, Settings; активный пункт; header с именем workspace/project и окружением; content region.
4. Завести маршруты `/overview`, `/incidents`, `/incidents/:incidentId`, `/investigations`, `/service-map`, `/logs-metrics`, `/traces`, `/integrations`, `/settings`; redirect `/` → `/overview` и 404. Placeholder-страницы разрешены только для ещё не реализованных stories, но должны быть аккуратно обозначены.
5. Ввести общие design tokens: background `#0D151E`, sidebar `#111C28`, panel `#131E2A`, raised `#192736`, border `#2B3A49`, white-ish `#F2F5F8`, secondary `#9CAFC0`, muted `#758B9E`, amber `#E9A968`, green `#79CDA9`, critical `#ED9394`, warning `#E7B67D`, blue `#93B5E8`, шрифт Inter.
6. Компоненты: `Button`, `StatusBadge`, `SeverityBadge`, `Panel`, `MetricCard`, `DataTable`/табличные primitives, `Tabs`, `TextInput`, `Select`, `EmptyState`, `LoadingState`, `ErrorState`. Не делать universal mega-component со множеством флагов.
7. Определить typed mock interfaces и одну согласованную subject area: `Incident`, `InvestigationRun`, `Service`, `ToolEvent`, `Evidence`, `Hypothesis`, `RcaReport`, `Trace`. Сами подробные mock fixtures могут расширяться в FE-02..06; **один идентификатор = одна сущность**.
8. Обеспечить desktop и небольшие экраны: Sidebar collapsing/drawer с управлением с клавиатуры; горизонтальный scroll только внутри широких таблиц; focus states, labels, semantic landmarks.
9. Добавить README запуска, `.gitignore`, примеры проверок и хотя бы smoke tests App Shell/route active.

## Не входит

- Реальный Backend, REST/WebSocket, настоящий auth, API contracts не заменять выдуманными.
- Реальный LangGraph/MCP/LLM, визуализация агента, детальные экраны FE-02..08.
- Большие монорепо-преобразования и «платформенная» архитектура ради архитектуры.

## Предполагаемые зоны файлов

`src/app/*`, `src/shared/ui/*`, `src/shared/styles/*`, `src/entities/*`, `src/mocks/*`, `src/pages/*`, `src/main.tsx`, `tests/*`, `package.json`, `README.md`. Сохранить имена существующего приложения, если они уже согласованы.

## Design / Anti-AI-slop directive

Прочитать [DESIGN_QUALITY_GATE.md](./DESIGN_QUALITY_GATE.md). Профессиональная плотная SRE-панель: аккуратные отступы, тонкие линии, restrained badges. **Не** использовать glow, градиентный фиолетовый, glassmorphism, robot icons, огромные закругления, decorative cards, маркетинговые заголовки. Именно Figma определяет размеры и ритм. Проверить скриншот 1440×940 и responsive состояния.

## Критерии приёмки

1. Приложение локально запускается; `npm run dev` или фактическая команда из README документирована.
2. Все девять product routes открываются; `/` и 404 корректны, active nav меняется.
3. Sidebar и Header единые для всех страниц и не копируются.
4. Настроены общие токены; нет десятков hard-coded цветов и конфликтующей типографики.
5. Responsive проверен 1440/1280/768/390; клавиатурная навигация рабочая.
6. `typecheck`, `lint`, `test`, `build` выполняются и проходят (или точно документирована инфраструктурная блокировка).
7. Smoke tests проверяют sidebar navigation и redirect.
8. Нет настоящих credentials, fake integrations и неожиданных новых зависимостей.

## Выходной контракт / Deliverables

Запускаемый frontend foundation, дерево файлов, список реально созданных компонентов, команды запуска, скриншоты desktop/mobile, фактические результаты проверок. **Gate A:** следующие задачи можно начать только после слияния и проверки этого фундамента.
