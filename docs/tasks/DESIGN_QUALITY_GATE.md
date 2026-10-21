# Anti-AI-slop Design Gate — обязательные правила всех FE Stories

> Этот документ — **проектная дизайн-директива для Claude Code**, а не попытка обойти системные инструкции инструмента. Применять при реализации и визуальном ревью каждой FE-задачи.

## 1. Продуктовая эстетика

Мы проектируем **dark-mode engineering observability console** для SRE/DevOps, а не AI-стартап-лендинг. Примеры визуальной дисциплины: Grafana, Datadog, Linear — не копировать брендинг и отдельные чужие интерфейсы. **Наша каноническая композиция — Figma B.**

Токены (базовый ориентир Figma; проверить нюансы в кадре):

| Токен | HEX | Назначение |
|---|---|---|
| background | `#0D151E` | фон приложения |
| sidebar | `#111C28` | навигация |
| panel | `#131E2A` | поверхности |
| raised | `#192736` | активные/приподнятые элементы |
| border | `#2B3A49` | тонкие разделители |
| text-primary | `#F2F5F8` | основной текст |
| text-secondary | `#9CAFC0` | подписи |
| text-muted | `#758B9E` | метаданные |
| accent-amber | `#E9A968` | акцент |
| positive | `#79CDA9` | healthy/success |
| negative | `#ED9394` | critical/failure |
| warning | `#E7B67D` | caution |
| accent-blue | `#93B5E8` | ссылки / выбор |

Шрифт — Inter; для timestamps, IDs, технических фрагментов допустим моноширинный. Базовый reference desktop — 1440×940 с Sidebar ~207 px. Используй CSS variables, а не 100 копий hex.

## 2. Запрещённые шаблонные приёмы

- Фиолетово-синие градиенты, neon/glow, glassmorphism, случайные overlay blur, декоративная «AI сеть» и роботы.
- Огромные пустые карточки с гигантскими числами/иконками; одинаковое окружение каждого элемента box-shadow + radius.
- Лишние маркетинговые заголовки («Unlock insights», «Magic AI») вместо технических данных.
- Неработающие декоративные кнопки и фильтры.
- Выдуманные графики и красивые волнушки без количественного смысла; произвольный waterfall.
- Слишком много равновесных акцентных цветов; критичность и статус не должны определяться только цветом.
- Стандартные пустые «Your data is waiting» с иллюстрациями; показывай предметный empty state и действие.
- Иконка напротив каждой строки журнала, крупные логотипы в интеграциях, искусственные анимации и вращающиеся индикаторы там, где данные статичны.

## 3. Что делать вместо этого

- **Information density:** интерфейс должен быстро сканироваться, особенно таблицы, технические логи, events и spans.
- **Hierarchy:** типографика, отступы, выравнивание, тонкие разделители и ясные столбцы, а не декоративная палитра.
- **Numeric integrity:** все цифры, длительности, таймстемпы, статусы и прогресс берутся из typed mocks, не расставляются «на глаз».
- **Semantics:** distinguish open/investigating/awaiting review/resolved; running/completed/failed; evidence/hypothesis/approved RCA.
- **Consistency:** единые высоты control, spacing scale, severity/status badges, focus rings, tab styles.
- **Access:** keyboard navigation, видимый focus, readable contrast, labels, aria where appropriate, no hover-only actions.
- **Responsive:** на 1440/1280/768/390 страницы без поломок; tables могут горизонтально скроллиться в отдельном viewport, shell в целом — нет.
- **Restraint:** animation only to communicate interaction/state, respect reduced-motion.

## 4. Проверка перед PR

| Check | Что проверить |
|---|---|
| Figma fidelity | Сопоставь базовые размеры, панели, типографику и порядок секций конкретного node |
| Visual hierarchy | За 5 секунд понятен статус страницы и главная рабочая операция |
| Data credibility | Все цифры и события согласуются внутри incident mock scenario |
| Density | Нет гигантских пустот и случайных маркетинговых карточек |
| Semantic color | Цвет связан с severity/state; статус дополнен текстом |
| Interaction | Все видимые кнопки/фильтры дают ожидаемую реакцию или явно disabled/mock |
| Edge states | Loading, empty, error, long content, overflow, no evidence |
| Access | Focus/labels/keyboard/contrast проверены |
| Responsive | Desktop/tablet/mobile оценены; видимых наложений нет |
| Evidence | До/после скриншоты; честный список отличий от Figma |

**Не подменять проверку фразой «UI looks polished».** Сделать фактическое сравнение скриншотов и ручной smoke пользовательского сценария.

## 5. Встраиваемая директива для Claude (повторять в каждой Story)

```text
DESIGN REVIEW RULE: Build this as a restrained, dense SRE/observability workstation.
Figma B is the visual source of truth. No gradients, glassmorphism, decorative
AI imagery, excessive rounded KPI cards, meaningless charts or copy-pasted
landing-page patterns. Favor real technical hierarchy, typography, column
alignment and subtle dividers. All states and interactions must be functional
in the local mock scenario. Compare desktop and narrow screenshots against
Figma before declaring the story complete; explicitly list deviations.
```
