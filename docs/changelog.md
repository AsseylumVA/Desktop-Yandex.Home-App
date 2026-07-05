# Changelog

## 2026-07-05

### Added
- Поддержка устройств `devices.types.cradle.*` — детские кроватки (например, `yandex.blanc`) теперь распознаются как сенсорные устройства и отображаются через `SensorCard` с выводом температуры, влажности и CO₂.
- Новая функция `formatFloatValue(value, decimalPlaces?)` в `src/constants/formatting.ts` с защитой от NaN/Infinity, по умолчанию округляет до 1 знака после запятой.

### Changed
- `isSensorDevice()` в `src/constants/deviceTypes.ts` расширена для включения `devices.types.cradle.*`.
- Температура, влажность и generic sensor float-значения в `DeviceCard` форматируются через `formatFloatValue()`.

### Fixed
- Предотвращён выход длинных float-значений за пределы карточки устройства.

### Tests
- Добавлены тесты для `formatFloatValue()` и `deviceTypes` (`src/constants/formatting.test.ts`, `src/constants/deviceTypes.test.ts`) — 33 теста, все проходят.
