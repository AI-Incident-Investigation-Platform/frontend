# FE-08. Login + mandatory Email OTP — frontend auth flow

**Приоритет:** P1 · **Исполнитель:** Frontend · **Зависимости:** FE-01, App Shell/router, общие формы · **Статус:** TODO.

**Макеты:** новая пара экранов, пока **не включена** в 9 утверждённых Figma product screens. Использовать palette/typography/interaction patterns из [Figma B](https://www.figma.com/design/JFUcynM2y9vIq6vJ7efTOc?node-id=6-2).

## Цель

Создать элегантный двухэтапный **UI входа**: email/password → OTP challenge → шестизначный код → доступ к Overview в mock-сценарии. **OTP обязателен при каждом password login.** Настоящую аутентификацию, JWT и отправку email делает Main Backend позднее.

## Объём работ

1. Разместить `/login` и `/verify-email-otp` вне обычного product shell, в общем аскетичном AuthLayout. Вариант брендинга соответствует существующему приложению, без лендинговой графики.
2. **Login form**: email, password с show/hide, submit state, доступные labels, field validation, inline errors, keyboard submit. При корректном mock email/password переключение на OTP challenge; не делать настоящую проверку credentials.
3. **OTP page**: подсказка с частично скрытым email; 6 цифр; вставка кода целиком; backspace и arrow navigation между полями либо единый input с визуальным разделением; доступность со screen-reader; `Verify`, `Resend`, `Back to login`.
4. Поддержать состояния challenge pending/verified, invalid code, expired code, too many attempts, resend cooldown, network error (mock). Если в mock нужен валидный код, показать его только в явном `Development demo` helper, не вводить будто письмо действительно отправлено.
5. Использовать абстракцию mock `AuthAdapter`: `login` возвращает challenge, `verifyOtp` подтверждает, `resendOtp` обновляет демо-состояние. Не создавать настоящие JWT, refresh tokens и localStorage authentication bypass.
6. После mock-success навигация в `/overview`. Обозначить demo auth в UI при необходимости, чтобы разработчик не принимал поведение за безопасность. При refresh без реального Backend не изображать полноценную длительную авторизацию.
7. Форма и responsive: компактный auth panel, грамотные spacing, focus, errors и reduced-motion. Успешный flow должен быть доступен с клавиатуры.
8. Интерфейс в будущем готов к draft API v0.2: `POST /api/v1/auth/login` (202 OTP challenge), `POST /api/v1/auth/otp/verify` (tokens после проверки), `POST /api/v1/auth/otp/resend` (повтор). **Фактические поля запросов и ответов при интеграции брать из актуального OpenAPI**, не закладывать предположения как финальный контракт.

## Не входит

Email delivery, настоящие JWT, refresh tokens, реальная session security, полноценная registration/password reset, `localStorage` с реальными credentials, backend роли и audit log.

## Предполагаемые зоны файлов

`src/pages/auth/*`, `src/features/auth/*`, `src/services/auth/*` (mock adapter), form components/tests.

## Anti-AI-slop design directive

Простая, строгая dark corporate auth-форма. **Не** 3D robot/AI brain, waving neon gradients, split-screen marketing, абстрактный network background, oversized illustrations. Компактная типографика и аккуратные поля. Это функциональный рабочий вход, а не showcase page. Пройти [DESIGN_QUALITY_GATE.md](./DESIGN_QUALITY_GATE.md).

## Критерии приёмки

1. `/login` и `/verify-email-otp` существуют и выглядят частью одного продукта.
2. Вход по password не переводит напрямую в Overview; сначала OTP step.
3. OTP принимает строго 6 цифр, поддерживает paste и клавиатурную навигацию.
4. Покрыты invalid/expired/too-many-attempts/cooldown/resend сценарии.
5. После mock verify — переход на Overview; нет настоящих JWT/tokens и ложных email notifications.
6. Формы корректны при узкой ширине и с keyboard-only interaction.
7. Unit/integration tests workflow + lint/typecheck/build проходят.

## Выходной контракт

Две полностью свёрстанные, связанные страницы авторизации в demo mode, скриншоты desktop/mobile, проверенные flow и error states, список открытых вопросов к реальной auth интеграции. Только после отдельной Backend Story заменять mock adapter на API.
