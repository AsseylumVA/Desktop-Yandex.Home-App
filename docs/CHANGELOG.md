# История изменений

> **Формат:** [Keep a Changelog](https://keepachangelog.com/)  
> **Дата:** 4 июля 2026 г.

---

## 2026-07-04

### Изменено

- **Изоляция режима редактирования (Hide/Show):** Функциональность скрытия/показа карточек устройств, сценариев и групп теперь работает **только на главном дашборде** (`DashboardHomeView`). Страницы комнат (`DashboardRoomView`) и групп (`DashboardGroupView`) показывают все устройства без фильтрации.
  - Подробное описание архитектурного решения: [`architecture.md#10-изоляция-режима-редактирования-hideshow`](./architecture.md#10-изоляция-режима-редактирования-hideshow)

### Изменённые файлы (Изоляция Hide/Show)

| Файл | Что изменилось |
|------|----------------|
| `src/components/DashboardRoomView.tsx` | Убрана фильтрация `.filter(d => !state.getEffectiveHidden(...))`. Убраны пропсы edit mode из `DeviceCardAdapter` и `GroupCard`. |
| `src/components/DashboardGroupView.tsx` | Убрана фильтрация `.filter(d => !state.getEffectiveHidden(...))`. Убраны пропсы edit mode из `DeviceCard`. |
| `docs/architecture.md` | Добавлен раздел 10 «Изоляция режима редактирования (Hide/Show)» с описанием архитектуры, потока данных и edge cases. |
| `docs/CHANGELOG.md` | Создан файл истории изменений. |

### Оптимизировано

- **Мемоизация GroupCard:** 7 `useMemo` → 2 (`groupDevices` + объединённый `groupInfo`). Проверки типа группы (light/thermostat/fan), состояния on/off и фильтрация `visibleDevices` объединены в один проход.
- **Багфикс `groupIsOn`:** Исправлена логика — теперь корректно проверяет только устройства с on_off capability (`totalOnOff > 0 && onCount === totalOnOff`). Раньше при отсутствии on_off у устройств группы возвращалось `false`, что могло вводить в заблуждение.

### Реорганизовано

- **Декомпозиция Sidebar:** Создана директория `src/components/sidebar/` с 6 подкомпонентами:
  - `SidebarHeader` — выбор домохозяйства (household selector)
  - `SidebarFavorites` — избранные устройства
  - `SidebarSensors` — датчики
  - `SidebarRooms` — комнаты
  - `SidebarGroups` — группы устройств
  - `SidebarScenarios` — сценарии
- Sidebar переписан с 25 пропсов до 1 (`onOpenCameraStream`). Все данные читаются через `useDashboardContext()`.
- Dashboard: `<Sidebar>` теперь вызывается с 1 пропсом вместо 25.
- Подробное описание архитектуры: [`architecture.md#11-декомпозиция-sidebar`](./architecture.md#11-декомпозиция-sidebar)

### Изменённые файлы (Приоритет 3)

| Файл | Что изменилось |
|------|----------------|
| `src/components/cards/GroupCard.tsx` | 7 useMemo → 2. Объединена логика проверки типов группы, состояния on/off и фильтрации устройств. Исправлен баг `groupIsOn`. |
| `src/components/Sidebar.tsx` | Полностью переписан: 25 пропсов → 1, используется `useDashboardContext()`, рендерит 6 подкомпонентов. |
| `src/components/sidebar/SidebarHeader.tsx` | **Новый файл.** Household selector. |
| `src/components/sidebar/SidebarFavorites.tsx` | **Новый файл.** Избранные устройства. |
| `src/components/sidebar/SidebarSensors.tsx` | **Новый файл.** Датчики. |
| `src/components/sidebar/SidebarRooms.tsx` | **Новый файл.** Комнаты. |
| `src/components/sidebar/SidebarGroups.tsx` | **Новый файл.** Группы устройств. |
| `src/components/sidebar/SidebarScenarios.tsx` | **Новый файл.** Сценарии. |
| `src/components/Dashboard.tsx` | Упрощён вызов `<Sidebar>`: 25 пропсов → 1. |
| `docs/architecture.md` | Обновлён раздел 4 (иерархия компонентов), раздел 7 (роль модулей), добавлен раздел 11 «Декомпозиция Sidebar». |
