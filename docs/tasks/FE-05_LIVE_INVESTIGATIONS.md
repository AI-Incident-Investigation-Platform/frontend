# FE-05. Live Investigations — мониторинг исполнения AI-агента

**Приоритет:** P1 · **Исполнитель:** Frontend · **Зависимости:** FE-01, общие `Incident` / `InvestigationRun` / `ToolEvent` модели (желательно после Gate B) · **Статус:** TODO.

**Figma:** https://www.figma.com/design/JFUcynM2y9vIq6vJ7efTOc?node-id=6-28

## Цель

Собрать экран наблюдения за AI-расследованиями: инженер должен понимать **какая проверка выполняется, что уже найдено, каков прогресс и требуется ли его review**. Это execution monitor, **не чат**.

## Объём работ

1. Создать страницу `/investigations` в App Shell. Заголовок и описание — как на Figma `Active and historical agent executions with tool-by-tool progress`.
2. Верхний ряд из трёх компактных metric panels: `RUNNING`, `AWAITING REVIEW`, `COMPLETED / 24H` (значения берутся из mock runs, а не рандомизируются).
3. **Recent Agent Runs** — минимум 4 запуска с `incidentId`, service, status `Running`/`Completed`/`Failed`/`Awaiting Review`, датами и текущим шагом. Выбор запуска меняет detail справа/снизу; переход ведёт к Incident Detail.
4. **Live Tool Activity** — непрерывная последовательность tool calls с timestamp, tool name, outcome, status, duration/error. Примеры Figma: `search_logs` (124 connection timeout errors), `query_prometheus` (pool 100%), `get_trace` (slow DB acquisition), `get_recent_deployments` (release), `git_diff` (connection cleanup).
5. Показать текущий шаг в формате `STEP 12 / 20`; не выводить 21/20. Состояния running, pending, completed, cancelled, failed, awaiting review — отображать допустимые наборы событий и действий.
6. Встроить **демо-режим воспроизведения**: выбор преднастроенного сценария меняет состояние/отрисовку ленты. Если есть кнопка Play/Advance mock events, она явно обозначена demo и не тянет backend. Не устраивать бесконечную анимацию.
7. Подготовить легковесный presentation adapter для будущих WebSocket events **от Main Backend**; сейчас live data не нужны.
8. Учитывать empty list, no live runs, failed tool call, long response, repeated event ID (deduplicate при локальной mock-проекции).

## Не входит

Реальный WebSocket; внутреннее reasoning/chain-of-thought; прямой AI Backend; реальные MCP tool invocations; полный audit log пользователя.

## Предполагаемые зоны файлов

`src/pages/investigations/*`, `src/entities/investigation/*`, `src/features/run-viewer/*`, `src/mocks/runs*`, tests.

## Anti-AI-slop design directive

**Стиль execution log / CI pipeline / distributed trace**, никаких чат-пузырей, аватара агента, магических частиц, flashing chips и декоративных progress кругов. Визуальный акцент только на ошибках и актуальном статусе. Временные метки, tool names и outcomes выровнены и читаются с первого взгляда. Следовать [DESIGN_QUALITY_GATE.md](./DESIGN_QUALITY_GATE.md).

## Критерии приёмки

1. Отрисованы три KPI, Recent Runs и Live Tool Activity согласно Figma.
2. Выбор run меняет ленту без полного page reload, переход к правильному incident работает.
3. Running/completed/failed/awaiting review видны в разных mock fixtures, progress корректен.
4. Tool events имеют timestamp, tool, status/result и порядковость; нет скрытого reasoning.
5. Демо-режим подписан и не создаёт иллюзию backend операции.
6. Empty/no-run/tool-failure states и 1440/1280/768/390 responsive проверены.
7. Tests основного переключения/статусов + lint/typecheck/build проходят.

## Выходной контракт

Функциональная на mocks operational timeline, связанная с Incident Detail; скриншоты, один пошаговый демо-сценарий run progression и результаты проверок. Готовая точка замены mock events будущим WS adapter.
