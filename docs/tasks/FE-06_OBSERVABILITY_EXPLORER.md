# FE-06. Observability Explorer — Service Map, Logs & Metrics, Traces

**Приоритет:** P1 · **Исполнитель:** Frontend · **Зависимости:** FE-01, shared telemetry mock model · **Статус:** TODO.

**Макеты:** [Service Map 6:30](https://www.figma.com/design/JFUcynM2y9vIq6vJ7efTOc?node-id=6-30), [Logs & Metrics 6:32](https://www.figma.com/design/JFUcynM2y9vIq6vJ7efTOc?node-id=6-32), [Traces 6:34](https://www.figma.com/design/JFUcynM2y9vIq6vJ7efTOc?node-id=6-34).

## Цель

Воссоздать три экрана технической диагностики с **осмысленной визуализацией моковых данных**, которые отражают единый инцидент и логику микросервисов. Это не реальное подключение Elasticsearch/Prometheus/Tempo.

## Дробление на подтаски / при необходимости отдельные PR

- **FE-06A:** Service Map (топология и выбор сервиса).
- **FE-06B:** Logs & Metrics (поиск и метрики).
- **FE-06C:** Traces (таблица и waterfall).

FE-06A/B/C можно выполнять последовательно с промежуточными smoke и screenshot review. Если делать параллельно, не менять одновременно общие типы/компоненты без ревью.

## FE-06A — Service Map

1. `/service-map`, App Shell и заголовок `Service dependency topology`; контекст времени `Last 24 hours`.
2. Отобразить контролируемую read-only схему из **шести сервисов**: `api-gateway`, `user-service`, `order-service`, `payment-service`, `inventory-service`, `review-service`. Зависимости — детерминированные из fixture edges, без хаотичных перекрытий.
3. Состояния узлов: healthy / warning / critical. Видимый выбранный узел и состояние keyboard focus.
4. При выборе сервиса показать панель `Selected service details`: error rate, p95 latency, restarts/24h, dependencies, open incidents. Пример `payment-service`: Critical, error 12.8%, p95 1.48s, restarts 02, dependencies 4, open incidents 1.
5. Для rendering использовать аккуратный SVG/controlled positions либо обоснованную графовую библиотеку **только если она реально нужна**. При мобильной ширине — панель детализации под графом и доступная прокрутка графового viewport.
6. Не добавлять drag-to-rewire или редактирование topology: MVP read-only.

## FE-06B — Logs & Metrics

1. `/logs-metrics` с источником Elasticsearch (как UI label) и строкой запроса, вкладкой Logs и кнопкой `Run Query`.
2. Для mock mode поддерживать **явно ограниченный набор операций**: фильтр по service, severity, keyword, time range. Не называть это полнофункциональным Elasticsearch Query DSL. Если пользователь вводит неподдерживаемое выражение — показать честное `Mock query supports ...`.
3. Результаты логов: timestamp, severity (`ERROR`/`WARN`/`INFO`), service, message, раскрытие metadata. Пример — PostgreSQL connection timeout и pool limit exceeded для `payment-service`.
4. Метрики (Prometheus, как источник на UI) должны содержать осмысленные timestamp series / snapshot: HTTP error rate 12.8%, p95 latency 1.48s, DB pool usage 100%, CPU usage 62%. При использовании chart нужны реальные datapoints из mock fixtures и читаемые оси/единицы.
5. UI-состояния: loading/zero matches/error/no metric data, невозможность построить запрос, длинные сообщения, copy log excerpt по фактическому тексту.
6. Логи и числа коррелируют с `INC-1042`; не генерировать random values на render.

## FE-06C — Traces

1. `/traces` — фильтры по service/status/min duration/time range, кнопка `Search traces`, таблица `Trace ID / Root Service / Duration / Spans / Status / Start Time`.
2. При выборе trace показать waterfall; mock example `api-gateway POST /checkout` → `order-service/process` → `payment-service/charge` → `postgres/acquire connection`, плюс inventory service.
3. Каждому span назначить `startOffsetMs` и `durationMs` в пределах root trace. X-position и width вычислять **пропорционально временной шкале**, не рисовать случайные полоски.
4. Иерархия depth, service name, status/error и длительность. Раскрой details выбранного span, не ломая границы и layout.
5. Разрешить прямой выбор trace по ID из связанных mock evidence, если совместимая ссылка уже предусмотрена.
6. Состояния без traces, trace-loading, duration filter zero-results, error span, большое число spans.

## Не входит

Реальные инструменты MCP, Elasticsearch DSL engine, real PromQL, Tempo API, редактирование dependency map, realtime updates, автоматическая корреляция root cause.

## Предполагаемые зоны файлов

`src/pages/service-map/*`, `src/pages/logs-metrics/*`, `src/pages/traces/*`, `src/entities/telemetry/*`, `src/mocks/telemetry*`, shared telemetry displays/tests.

## Anti-AI-slop design directive

Observability — это **точные данные, а не цветной арт**. Топология не должна выглядеть mind-map; логи — не карточки с giant icons; charts — только с числами и единицами; waterfall — строго по времени. Никаких декоративных wave charts, blur glow, gradient network, «AI detected» не по делу. Межпанельная иерархия и плотность — Figma B. См. [DESIGN_QUALITY_GATE.md](./DESIGN_QUALITY_GATE.md).

## Критерии приёмки

1. Три маршрута и композиции соответствуют связанным Figma nodes.
2. Service map имеет 6 узлов, корректные зависимости и информативную selected panel.
3. Logs query на mocks действительно фильтрует; unsupported syntax обозначен, empty/error работают.
4. Метрики содержат значения/единицы/период, согласуются с инцидентом.
5. Traces filtering работает; span waterfall учитывает offset/duration/root duration; tests проверяют геометрию.
6. Все экраны выдерживают длинные сообщения, narrow widths и keyboard navigation.
7. Нет real network requests, secret endpoints, фиктивного production status.
8. `lint`, `typecheck`, `test`, `build` проходят после каждой подзадачи.

## Выходной контракт

Три самостоятельных диагностических экрана на общей typed telemetry fixture, кликабельный service detail, фильтруемый журнал и корректный waterfall; скриншоты всех трёх экранов, тестовый сценарий `INC-1042 → payment-service → logs → trace` и результаты проверок.
