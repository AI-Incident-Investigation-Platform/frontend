# FE-04. Incident Detail — расследование, гипотезы, evidence и RCA

**Приоритет:** P0 · **Исполнитель:** Frontend · **Зависимости:** FE-01 + FE-03 и shared incident mock model · **Статус:** TODO.

**Figma:** https://www.figma.com/design/JFUcynM2y9vIq6vJ7efTOc?node-id=6-40

## Цель

Собрать **основную рабочую страницу продукта**: из одного инцидента пользователь видит симптомы, шаги AI-расследования, подтверждения, альтернативные причины, таймлайн и итоговый RCA. Здесь особенно важна различимость **гипотезы** и **доказательства**, а также статус human review.

## Объём работ

1. Route `/incidents/:incidentId`. При неизвестном ID — `Not found` с возвратом к списку. Не hardcode все данные под один URL, даже если основной демо-кейс `INC-1042`.
2. Header `INC-1042 / payment-service`: контекст проекта/окружения, заголовок, краткое описание, severity `Critical`, статус `Investigating`, время детекции. Действия Retry/Cancel зависят от mock run status/role.
3. **Шесть вкладок** с сохранением состояния в query parameter `?tab=...` (или другом стабильном URL state):
   - **Overview** — что произошло, affected service, detected symptoms, time window, статус и краткий вывод или `RCA pending`.
   - **Live Investigation** — шаги agent run по времени, `step 12/20`, tool names, duration/status/outcome. Пример: `search_logs`, `query_prometheus`, `get_trace`, `get_recent_deployments`, `git_diff`.
   - **Hypotheses** — top 3, причины с объяснением, `Supported`/`Rejected`/`Pending`, confidence только если mock schema действительно содержит его; никаких «95% verified» без основания.
   - **Evidence** — source `log | metric | trace | deployment | code`, id, timestamp, excerpt/summary, связанная hypothesis, mock deep-link/modal деталей; отсутствие evidence отдельным state.
   - **Timeline** — отсортированные incident/agent/deployment/user события с понятным источником; один time zone.
   - **RCA Report** — краткое резюме, вероятная root cause, evidence references, рекомендации, unknowns и human-review status: Draft/Awaiting Review/Approved/Rejected. Если отчёт не готов — без выдуманного root cause.
4. Обеспечить референциальную целостность: hypothesis.evidenceIds указывают на существующие evidence; toolEvent IDs соответствуют run; approved report не показывается при running run.
5. UI-операции `Retry`, `Cancel`, `Approve`, `Reject`: **явный demo mode** с локальным сценарием или disabled с объяснением, никакой фиктивной записи на Backend. Permission-dependent actions: Admin/Developer возможны по роли, Viewer read-only. Не считать mock RBAC обеспечением безопасности.
6. Создать mock states running/completed/failed/awaiting review с различным видимым содержимым. В running финальный RCA отсутствует или помечен draft; в failed — причина ошибки, retry UI если разрешён.
7. Привести длинный технический текст, stack traces, большие Evidence excerpts к readable overflow/collapse и keyboard-accessible interactions.
8. Не раскрывать скрытое reasoning LLM: отображать **tool event/action + краткое описательное обоснование**, не приватную chain-of-thought.

## Демонстрационный сценарий

`INC-1042` — checkout/payment HTTP 500, `payment-service`, рост ошибок PostgreSQL connection timeout, pool usage 100%, в трассе медленный acquire, недавний release v2.4.1. Допустимые гипотезы: connection leak (supported), CPU saturation (rejected), deployment regression (pending). Ссылки Evidence относятся к подготовленным mock-записям; никаких ссылок на несуществующие внутренние endpoints.

## Не входит

Реальное расследование/LLM, persisted approval, manual remediation, неподтверждённые конечные REST endpoints, прямой WebSocket к AI Backend.

## Предполагаемые зоны файлов

`src/pages/incident-detail/*`, `src/features/incident-tabs/*`, `src/entities/{incident,investigation,evidence}/*`, shared tabs/badges/modal primitives, fixtures/tests.

## Anti-AI-slop design directive

**Forensic investigation console, не AI-chat.** Никаких robots, bubbles, neon traces, «AI magic insights», oversized hypothesis tiles. Сохранять профессиональную техническую иерархию как на Figma 6:40. Evidence — проверяемый источник с конкретным ID/timestamp, hypothesis — мнение модели, human-approved RCA — отдельное решение. Минимум визуального декора, максимум проверяемых связей; использовать [DESIGN_QUALITY_GATE.md](./DESIGN_QUALITY_GATE.md).

## Критерии приёмки

1. Для `INC-1042` работают все 6 вкладок и deep-link с сохранением выбранной вкладки после reload.
2. Summary/Severity/Status/Service согласованы с FE-02/FE-03.
3. Tool steps показаны по порядку; прогресс `current/max` валиден.
4. Три hypothesis корректно связаны с evidence; открытие evidence не путает источник/ID.
5. RCA pending/ready/reviewed различаются; несуществующее RCA не подменяется сочинённым текстом.
6. Demo actions не изображают реальные API-операции; Viewer не видит доступных edit actions.
7. Проверены неизвестный ID, failed investigation, no evidence, long log excerpt, narrow viewport.
8. Component tests проверяют вкладки, связи evidence, состояния action buttons; lint/typecheck/build проходят.

## Выходной контракт

Полный mock incident investigation workspace, скриншоты всех вкладок, демо-сценарий `Overview → Incidents → INC-1042 → Hypotheses → Evidence → RCA`, чек-лист состояний и результаты проверок. **После FE-04 закрывается Gate B.**
