# История изменений

> **Формат:** [Keep a Changelog](https://keepachangelog.com/)  
> **Дата:** 4 июля 2026 г.

---

## 2026-07-04

### Изменено

- **Изоляция режима редактирования (Hide/Show):** Функциональность скрытия/показа карточек устройств, сценариев и групп теперь работает **только на главном дашборде** (`DashboardHomeView`). Страницы комнат (`DashboardRoomView`) и групп (`DashboardGroupView`) показывают все устройства без фильтрации.
  - Подробное описание архитектурного решения: [`architecture.md#10-изоляция-режима-редактирования-hideshow`](./architecture.md#10-изоляция-режима-редактирования-hideshow)

### Изменённые файлы

| Файл | Что изменилось |
|------|----------------|
| `src/components/DashboardRoomView.tsx` | Убрана фильтрация `.filter(d => !state.getEffectiveHidden(...))`. Убраны пропсы edit mode из `DeviceCardAdapter` и `GroupCard`. |
| `src/components/DashboardGroupView.tsx` | Убрана фильтрация `.filter(d => !state.getEffectiveHidden(...))`. Убраны пропсы edit mode из `DeviceCard`. |
| `docs/architecture.md` | Добавлен раздел 10 «Изоляция режима редактирования (Hide/Show)» с описанием архитектуры, потока данных и edge cases. |
| `docs/CHANGELOG.md` | Создан файл истории изменений. |
