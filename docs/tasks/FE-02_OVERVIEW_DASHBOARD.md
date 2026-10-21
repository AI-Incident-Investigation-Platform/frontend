# FE-02. Overview — Operational Dashboard

**Приоритет:** P0 · **Исполнитель:** Frontend · **Зависимости:** FE-01 merged · **Статус:** TODO.

**Figma:** https://www.figma.com/design/JFUcynM2y9vIq6vJ7efTOc?node-id=6-24

## Цель

Главная operational-панель, где пользователь за несколько секунд понимает **масштаб инцидентов, активность расследования и проблемные сервисы**. Пользователь должен иметь возможность перейти к конкретному инциденту или сервису.

## Объём работ

1. Страница `/overview` в существующем App Shell. Header: `Service observability` + короткое техническое описание, контекст проекта/окружения.
2. Четыре KPI в компактной сетке как в Figma:
   - **Active Incidents** — общее число и подстрока критических;
   - **Investigating** — текущее число и состояние AI-agent runs;
   - **P95 Latency** — значение в ms и осмысленное отклонение за интервал;
   - **Healthy Services** — `healthy / total` и количество нуждающихся во внимании.
3. **Recent Incidents**: compact table `Incident / Service / Severity / Status / Detected`, данные для минимум 5 элементов; ID и строка — переход в `/incidents/:incidentId`.
4. **Services Requiring Attention**: 3 сервиса в mock case `payment-service` (5xx 12.8%), `order-service` (p95 1.4s), `review-service` (consumer lag 1.2k). Показывать severity + реальный для fixtures численный сигнал.
5. Централизовать derived values: KPI должны вычисляться из typed mock model либо иметь явно документированный snapshot; противоречий со списком инцидентов не допускается.
6. Сделать локальные кликабельные переходы к incidents и service map, не создавая несуществующий API. При отсутствии поддерживаемого route показать явный интерфейсный placeholder.
7. Поддержать состояния: normal / loading / empty (нет инцидентов) / error (ошибка mock adapter), и длинные идентификаторы.
8. Доступность: метрика читается как число + единицы; цвет дополнен текстом; hover/focus row.

## Mock-сценарий

Канонический `INC-1042`: `payment-service`, `Critical`, `Investigating`, замечен всплеск 5xx/DB connection timeout. Все ссылки ведут к FE-04. Приращение KPI не должно происходить рандомно при каждом render.

## Не входит

Реальный refresh, новые charts ради заполнения экрана, прямые вызовы Prometheus, графики без данных, полноценные формы создания инцидента.

## Предполагаемые зоны файлов

`src/pages/overview/*`, shared `MetricCard`, `IncidentTable`, `ServiceHealthRow`, centralized `src/mocks/*`, tests overview.

## Anti-AI-slop design directive

**Следовать Figma 6:24 буквально по композиции:** 4 небольшие KPI + 2 нижние панели. Не добавлять decorative area chart, emoji в каждой метрике, radial glow, gradient cards, иллюстрации роботов. Не превращать инженерную таблицу в огромную сетку tiles. Использовать спокойные разделители, точные выравнивания и информативность; ориентироваться на [DESIGN_QUALITY_GATE.md](./DESIGN_QUALITY_GATE.md).

## Критерии приёмки

1. Визуальное соответствие макету на 1440 px: позиции, плотность, типографика, строки и карточки.
2. Все четыре KPI представлены и численно согласованы с mock dataset.
3. 5+ строк Recent Incidents и 3 строки Services Requiring Attention видны и кликабельны.
4. Клик по `INC-1042` открывает правильный Incident Detail; по service — карту/соответствующий маршрут.
5. Loading/empty/error states видимы через переключаемые fixtures или тесты.
6. Нет runtime errors на 1440/1280/768/390; нет случайных переносов колонок или переполнения shell.
7. Проверены `lint`, `typecheck`, `test`, `build`.

## Выходной контракт

Работающий `/overview` и короткий walkthrough `Overview → INC-1042`, скриншоты desktop/mobile, проверенные состояния и фактические результаты тестов. На основе этого экрана принимается визуальная планка всей платформы.
