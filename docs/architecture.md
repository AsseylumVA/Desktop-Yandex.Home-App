# Архитектура Yandex Smart Home Control

> **Версия документа:** 1.2  
> **Дата:** 4 июля 2026 г.  
> **Версия приложения:** 1.8.5-beta  
> **Назначение:** Описание общей архитектуры, стека технологий, потоков данных и контрактов между модулями проекта Yandex Smart Home Control
> **Аудитория:** Разработчики, архитекторы

---

## Содержание

- [1. Общая архитектура приложения](#1-общая-архитектура-приложения)
- [2. Стек технологий](#2-стек-технологий)
- [3. Поток данных (Data Flow)](#3-поток-данных-data-flow)
- [4. Иерархия компонентов React](#4-иерархия-компонентов-react)
- [5. Схема навигации](#5-схема-навигации)
- [6. Схема темизации](#6-схема-темизации)
- [7. Роль каждого модуля](#7-роль-каждого-модуля)
- [8. Контракты между модулями](#8-контракты-между-модулями)
- [9. Ключевые архитектурные проблемы](#9-ключевые-архитектурные-проблемы)
- [10. Изоляция режима редактирования (Hide/Show)](#10-изоляция-режима-редактирования-hideshow)
  - [10.1. Проблема](#101-проблема)
  - [10.2. Решение](#102-решение)
  - [10.3. Архитектура изоляции](#103-архитектура-изоляции)
  - [10.4. Поток данных (схема передачи пропсов)](#104-поток-данных-схема-передачи-пропсов)
  - [10.5. Состояние и localStorage](#105-состояние-и-localstorage)
  - [10.6. Изменённые файлы](#106-изменённые-файлы)
  - [10.7. Edge Cases](#107-edge-cases)
  - [10.8. Ключевые принципы](#108-ключевые-принципы)
- [11. Декомпозиция Sidebar](#11-декомпозиция-sidebar)
  - [11.1. Проблема](#111-проблема)
  - [11.2. Решение](#112-решение)
  - [11.3. Архитектура подкомпонентов](#113-архитектура-подкомпонентов)
  - [11.4. Поток данных через контекст](#114-поток-данных-через-контекст)
  - [11.5. Схема collapsed-секций](#115-схема-collapsed-секций)
  - [11.6. Оптимизация мемоизации GroupCard](#116-оптимизация-мемоизации-groupcard)
  - [11.7. Изменённые файлы](#117-изменённые-файлы)
- [Связанные документы](#связанные-документы)

---

## 1. Общая архитектура приложения

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Yandex Smart Home Control                       │
│                          Electron + React 19 App                        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PROCESS MAIN (Electron)                      │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐   │   │
│  │  │   main.js     │  │  yandex-api   │  │ yandex-quasar.js  │   │   │
│  │  │  (Window,     │  │  (REST-клиент │  │ (Камеры Quasar)   │   │   │
│  │  │   Tray, IPC)  │  │   к Yandex    │  │                   │   │   │
│  │  └───────┬───────┘  │   IoT API)    │  │                   │   │   │
│  │          │          └───────┬───────┘  └───────────────────┘   │   │
│  │          │                  │                                   │   │
│  │  ┌───────┴──────────────────┴──────────────────────────────┐   │   │
│  │  │              IPC Bridge (ipcMain/ipcRenderer)            │   │   │
│  │  └───────┬─────────────────────────────────────────────────┘   │   │
│  └──────────┼─────────────────────────────────────────────────────┘   │
│             │                    preload.js                            │
│  ┌──────────┼─────────────────────────────────────────────────────┐   │
│  │          ▼                 PROCESS RENDERER                    │   │
│  │  ┌───────────────┐  ┌────────────────────────────────────┐    │   │
│  │  │  window.api   │  │   React Application (Vite + HMR)   │    │   │
│  │  │  (IPC-мост)   │  │                                    │    │   │
│  │  └───────┬───────┘  │  ┌────────────────────────────────┐  │    │   │
│  │          │          │  │  App.tsx                       │  │    │   │
│  │          │          │  │  (хуки, логика, ~305 строк)     │  │    │   │
│  │          ▼          │  └────────────┬───────────────────┘  │    │   │
│  │  ┌───────────────┐  │               │                      │    │   │
│  │  │  yandexIoT.ts │  │  ┌────────────▼───────────────────┐  │    │   │
│  │  │  (сервис-слой)│  │  │  DashboardContext               │  │    │   │
│  │  └───────────────┘  │  │  (данные, обработчики)          │  │    │   │
│  │  ┌───────────────┐  │  └────────────┬───────────────────┘  │    │   │
│  │  │ yandexGoloom  │  │               │                      │    │   │
│  │  │ WebRtc.ts     │  │  ┌────────────▼───────────────────┐  │    │   │
│  │  └───────────────┘  │  │  Dashboard                      │  │    │   │
│  │  ┌─────────────────┐ │  │  (рендеринг, модалки)           │  │    │   │
│  │  │  src/constants/  │ │  └──┬────────────────────────────┘  │    │   │
│  │  │  ├── icons.tsx   │ │     │                                │    │   │
│  │  │  ├── deviceTypes │ │     ├── Sidebar.tsx                  │    │   │
│  │  │  ├── formatting  │ │     │   (1 пропс + контекст)         │    │   │
│  │  │  ├── parsing.ts  │ │     ├── DeviceCard / GroupCard       │    │   │
│  │  │  └── index.ts    │ │     ├── ScenarioCard                 │    │   │
│  │  └─────────────────┘ │     └── 11 модалок                   │    │   │
│  └─────────────────────┴────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌───────────────────────┐
                 │   Yandex IoT API      │
                 │   api.iot.yandex.net  │
                 │   + Quasar API        │
                 └───────────────────────┘
```

## 2. Стек технологий

| Компонент          | Технология                     | Версия       |
|--------------------|--------------------------------|--------------|
| **Ядро**           | Electron                       | 39.8.10      |
| **UI-фреймворк**   | React                          | 19.2.0       |
| **Язык**           | TypeScript                     | 5.8          |
| **Сборщик**        | Vite                           | 6.2          |
| **Стилизация**     | Tailwind CSS                   | 3.4.17       |
| **Иконки**         | Lucide React                   | 0.555.0      |
| **Безопасное хранилище** | keytar                    | 7.9.0        |
| **Потоки видео**   | HLS.js                         | 1.6.16       |
| **Авторизация**    | QR-код (qrcode)                | 1.5.4        |
| **HTTP-клиент**    | fetch-cookie + tough-cookie    | 3.2.0 / 6.0.1|

**Стейт-менеджмент:** Только React hooks (useState, useCallback, useEffect, useMemo, useRef) — без внешних библиотек.

**Роутинг:** Ручной, через условный рендеринг на основе `activeSidebarView`.

## 3. Поток данных (Data Flow)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW DIAGRAM                               │
│                                                                         │
│  ┌──────┐    ┌─────────┐    ┌───────────┐    ┌────────────┐            │
│  │User  │───►│App.tsx  │───►│yandexIoT  │───►│window.api  │            │
│  │Action│    │(hook)   │    │.ts        │    │(ipcRenderer)│            │
│  └──────┘    └─────────┘    └───────────┘    └─────┬──────┘            │
│       ▲                                            │                   │
│       │                                            ▼                   │
│       │                                    ┌──────────────┐            │
│       │                                    │  main.js     │            │
│       │                                    │  (ipcMain)   │            │
│       │                                    └──────┬───────┘            │
│       │                                           │                    │
│       │                                           ▼                    │
│       │                                    ┌──────────────┐            │
│       │                                    │ yandex-api.js │            │
│       │                                    │ (REST client) │            │
│       │                                    └──────┬───────┘            │
│       │                                           │                    │
│       │                                           ▼                    │
│       │                              ┌─────────────────────┐           │
│       │                              │  Yandex IoT API     │           │
│       │                              │  api.iot.yandex.net │           │
│       │                              └─────────────────────┘           │
│       │                                           │                    │
│       │          OPTIMISTIC UPDATE                │                    │
│       └───────────────────────────────────────────┘                    │
│         (UI обновляется сразу, затем синхронизация)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Детальный поток:**

1. **Пользователь** → нажимает кнопку (вкл/выкл устройство)
2. **Dashboard** → вызывает `onToggleDevice(deviceId, currentState)`
3. **App.tsx** → `handleToggleDevice`:
   - Вызывает `toggleDevice(token, deviceId, newState)` из `yandexIoT.ts`
   - **Оптимистично** обновляет `userData` в стейте
   - Запускает `refreshDashboardData(token)` для синхронизации
4. **yandexIoT.ts** → `window.api.toggleDevice()` → IPC → main.js
5. **main.js** → `yandex-api.js` → `PUT /v1.0/devices/{id}/actions`
6. **Ответ** → обратно по цепочке → обновление UI

## 4. Иерархия компонентов React

```
<ThemeProvider>                       // contexts/ThemeContext.tsx
  └── <App>                           // App.tsx — композиция хуков (~305 строк)
        │
        ├── <TokenInput />            // Экран входа (условно)
        ├── <QrAuthModal />           // Модалка QR-авторизации (условно)
        ├── <UpdateNotificationModal /> // Модалка обновлений (условно)
        │
        └── <Dashboard                // Dashboard.tsx (~417 строк)
               /* использует useDashboardContext()
                  и useDashboardState() */>
              │
              ├── <Sidebar             // 1 пропс: onOpenCameraStream
              │      /* использует useDashboardContext() */>
              │      │
              │      ├── <SidebarHeader />       // Household selector
              │      ├── <SidebarFavorites />    // Избранные устройства
              │      ├── <SidebarSensors />      // Датчики
              │      ├── <SidebarRooms />        // Комнаты
              │      ├── <SidebarGroups />       // Группы устройств
              │      └── <SidebarScenarios />    // Сценарии
              │
              ├── <ScenarioCard        // Карточка сценария
              │      scenario={...}
              │      isFavorite={...}
              │      onToggleFavorite={...} />
              │
              ├── <GroupCard           // Карточка группы
              │      /* 7 useMemo → 2 (groupDevices + groupInfo) */
              │      group={...}
              │      devices={...}
              │      isFavorite={...}
              │      onToggleFavorite={...}
              │      onToggleGroup={...}
              │      onOpenSettings={...}
              │      isEditMode={...} />
              │
              ├── <DeviceCard          // Карточка устройства
              │      device={...}
              │      isFavorite={...}
              │      onToggleFavorite={...}
              │      onOpenSettings={...}
              │      onOpenCameraStream={...}
              │      isEditMode={...} />
              │
              ├── <ThermostatSettingsModal />     // Модалка термостата
              ├── <BrightnessSettingsModal />      // Модалка яркости
              ├── <GroupLightSettingsModal />      // Групповая яркость
              ├── <GroupThermostatSettingsModal /> // Групповой термостат
              ├── <FanSettingsModal />             // Модалка вентилятора
              ├── <GroupFanSettingsModal />        // Групповой вентилятор
              ├── <CameraStreamModal />            // Поток с камеры
              └── <InfoModal />                    // Информация о программе
        │
        └── <NotificationToast />     // Всплывающее уведомление (определён внутри App)
</ThemeProvider>
```

## 5. Схема навигации

```
                    ┌──────────────────────────┐
                    │       App.tsx            │
                    │   appState === LOADING   │
                    │   (спиннер загрузки)     │
                    └──────────┬───────────────┘
                               │
                    ┌──────────▼───────────────┐
                    │       App.tsx            │
                    │   appState === AUTH      │
                    │   <TokenInput />         │
                    │   (ввод токена)          │
                    └──────────┬───────────────┘
                               │
                    ┌──────────▼───────────────┐
                    │       App.tsx            │
                    │  appState === DASHBOARD  │
                    │  <Dashboard>             │
                    │                          │
                    │  activeSidebarView:      │
                    │  ┌────────────────────┐  │
                    │  │  'home'  ── Все    │  │
                    │  │  'room'  ── Комната│  │
                    │  │  'group' ── Группа │  │
                    │  └────────────────────┘  │
                    └──────────────────────────┘
```

**Логика переключения:**

- `'home'` — показывает все устройства всех комнат и групп выбранного дома
- `'room'` — фильтрует только устройства и группы указанной комнаты (`activeRoomId`)
- `'group'` — фильтрует только устройства указанной группы (`activeGroupId`)

Переключение между видами выполняется через Sidebar (клик по комнате/группе или кнопка «Главная»).

## 6. Схема темизации

```
┌─────────────────────────────────────────────────────────────────────┐
│                         THEMING SYSTEM                               │
│                                                                      │
│  ThemeContext (src/contexts/ThemeContext.tsx)                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  state: theme = 'light' | 'dark'                              │  │
│  │  + toggleTheme()                                              │  │
│  │  + localStorage('app_theme') — сохранение выбора              │  │
│  │  + document.documentElement:                                 │  │
│  │    • classList: 'dark' / убрано                              │  │
│  │    • setAttribute('data-theme', 'light'|'dark')              │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Tailwind CSS (JIT)                                            │  │
│  │  • dark: классы (dark:bg-gray-900) — через darkMode: 'class'  │  │
│  │  • [data-theme='dark'] селекторы — для кастомных свойств       │  │
│  │  • CSS Variables в index.css:                                  │  │
│  │    --bg-primary, --surface, --text-primary                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Компоненты                                                    │  │
│  │  • useTheme() хук — получает { theme, toggleTheme }           │  │
│  │  • Кнопка переключения темы в Dashboard (иконка Sun/Moon)     │  │
│  │  • Все компоненты используют Tailwind dark: вариации          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 7. Роль каждого модуля

### Frontend (src/)

| Модуль / Файл                       | Роль                                              | Строк |
|-------------------------------------|---------------------------------------------------|-------|
| `src/App.tsx`                       | Корневой компонент, хуки, логика                  | 305   |
| `src/index.tsx`                     | Точка входа React                                 | ~15   |
| `src/index.css`                     | Глобальные стили, CSS переменные                   | 1047  |
| `src/constants/icons.tsx`           | Определения иконок для устройств                  | 87    |
| `src/constants/deviceTypes.ts`      | Типы и маппинги устройств                         | 34    |
| `src/constants/formatting.ts`       | Форматирование данных (температура, влажность)    | 258   |
| `src/constants/parsing.ts`          | Парсинг данных устройств                          | 9     |
| `src/constants/index.ts`            | Реэкспорт всех модулей constants                  | 5     |
| `src/components/Dashboard.tsx`      | Панель, модалки, фильтрация (использует useDashboardContext) | 417   |
| `src/components/Sidebar.tsx`        | Навигация: 1 пропс, 6 подкомпонентов, контекст    | 164   |
| `src/components/sidebar/SidebarHeader.tsx` | Выбор домохозяйства (household selector)     | ~63   |
| `src/components/sidebar/SidebarFavorites.tsx` | Избранные устройства                      | ~203  |
| `src/components/sidebar/SidebarSensors.tsx` | Датчики                                  | ~70   |
| `src/components/sidebar/SidebarRooms.tsx` | Комнаты                                  | 43    |
| `src/components/sidebar/SidebarGroups.tsx` | Группы устройств                         | 46    |
| `src/components/sidebar/SidebarScenarios.tsx` | Сценарии                              | 57    |
| `src/components/TokenInput.tsx`     | Форма ввода токена                                 | ~80   |
| `src/components/cards/DeviceCard.tsx` | Карточка устройства                              | 201   |
| `src/components/cards/ScenarioCard.tsx` | Карточка сценария                              | 77    |
| `src/components/cards/GroupCard.tsx` | Карточка группы (7 useMemo → 2, багфикс groupIsOn) | 151   |
| `src/components/modals/` (11 файлов)| Модальные окна (настройки, стрим, инфо, обновления, SensorSettings)| разное |
| `src/contexts/ThemeContext.tsx`      | Провайдер темы (light/dark)                       | 55    |
| `src/contexts/DashboardContext.tsx`  | Провайдер контекста Dashboard (данные, обработчики)| ~90   |
| `src/hooks/` (11 файлов)            | Выделенные хуки: useDashboardState, useDashboardContext, useYandexApi, useAuth, useTheme, useNotifications, useHouseholdData, useCollapsedSections, useEditMode, useVisibility, useDeviceOperations | ~суммарно 600+ |
| `src/services/yandexIoT.ts`         | Сервис-слой: вызовы IPC (мок-функция удалена)     | 118   |
| `src/services/yandexGoloomWebRtc.ts`| WebRTC стриминг с камер Yandex                    | 613   |
| `src/types/index.ts`                | Все TypeScript интерфейсы                         | 142   |
| `src/utils/colorConverter.ts`       | Конвертация HSV ↔ RGB                             | ~80   |

### Electron (electron/)

| Файл                 | Роль                                               |
|----------------------|----------------------------------------------------|
| `main.js`           | Главный процесс: окно, трей, IPC, keytar           |
| `yandex-api.js`     | REST-клиент к Yandex IoT API (с retry механизмом) |
| `yandex-quasar.js`  | API для камер Яндекса (Quasar)                     |
| `yandex-x-token-auth.js` | QR-авторизация для X-Token                    |

## 8. Контракты между модулями

### IPC-контракт (window.api)

Rendere-процесс взаимодействует с main-процессом через `window.api` — объект, инжектируемый preload-скриптом.

| Метод                          | Параметры                                | Возвращает        |
|--------------------------------|------------------------------------------|-------------------|
| `fetchUserInfo`                | `(token: string)`                        | `YandexUserInfoResponse` |
| `fetchDevice`                  | `(token: string, deviceId: string)`      | `YandexDevice`    |
| `toggleDevice`                 | `(token, deviceId, newState)`            | `void`            |
| `toggleGroup`                  | `(token, groupId, deviceIds, newState)`  | `void`            |
| `executeScenario`              | `(token, scenarioId)`                    | `void`            |
| `setDeviceMode`                | `(token, deviceId, modeActions, turnOn)` | `void`            |
| `getCameraStream`              | `(deviceId)`                             | `CameraStreamResult` |
| `setCameraPrivacyMode`         | `(deviceId, privacyEnabled, toggleInstance)` | `void`        |
| `getQuasarCameraDevice`        | `(deviceId)`                             | `Yandevice`       |
| `hasXToken`/`getXToken`/`setXToken`/`deleteXToken` | —                      | `boolean/string/void` |
| `getSecureToken`/`setSecureToken`/`deleteSecureToken` | —                | `string/void`     |
| `getAutostart`/`setAutostart`  | —                                        | `boolean/void`    |

### Сервис-слой → IPC

`yandexIoT.ts` — это тонкая обёртка над `window.api`, добавляющая обработку ошибок и, в одном случае, до-загрузку устройств, отсутствующих в списке комнаты.

### Компоненты → Сервис-слой

Компоненты НЕ вызывают `window.api` напрямую. Все вызовы идут через:
1. `yandexIoT.ts` (функции-обёртки)
2. Обработчики в `App.tsx`, которые прокидываются в Dashboard и ниже через props

### Контракт ThemeContext

```
<ThemeProvider>
  // 1. Устанавливает класс 'dark' на <html>
  // 2. Устанавливает data-theme атрибут
  // 3. Сохраняет выбор в localStorage
  // 4. Предоставляет { theme, toggleTheme } через контекст
</ThemeProvider>
```

## 9. Ключевые архитектурные проблемы

Статус на текущую итерацию: **✅ Все 6 проблем решены**.

| № | Проблема | Статус | Комментарий |
|:-:|----------|--------|-------------|
| 1 | God-компонент `App.tsx` | ✅ **Решено** | Сокращён с 893 до 305 строк. Логика вынесена в 11 хуков и DashboardContext |
| 2 | Prop drilling (App → Dashboard → Sidebar → ...) | 🔶 **Частично решено** | Sidebar переведён на DashboardContext (25 пропсов → 1). GroupCard/DeviceCard всё ещё получают пропсы от Dashboard |
| 3 | Смешение ответственности `constants.tsx` | ✅ **Решено** | Разбит на 6 модулей: icons.tsx, deviceTypes.ts, formatting.ts, parsing.ts, index.ts |
| 4 | Dead code (`injectComprehensiveMockDevices`) | ✅ **Решено** | Мок-функция удалена. yandexIoT.ts сокращён с 741 до 118 строк |
| 5 | Отсутствие выделенных хуков | ✅ **Решено** | Созданы 11 хуков в src/hooks/ (useDashboardState, useDashboardContext, useYandexApi и др.) |
| 6 | Перерендеры NotificationToast | ✅ **Решено** | Вынесен в отдельный компонент src/components/NotificationToast.tsx, обёрнут в React.memo |

## 10. Изоляция режима редактирования (Hide/Show)

> **Версия:** 1.0  
> **Дата:** 4 июля 2026 г.  
> **Статус:** Реализовано

### 10.1. Проблема

Функциональность «редактирование отображения» (скрытие/показ карточек устройств, сценариев и групп) была внедрена глобально — она применялась ко всем страницам приложения (главный дашборд, страницы комнат и групп). Это приводило к путанице: пользователь, скрыв карточку на главном дашборде, «терял» её и на странице комнаты, где ожидал видеть все устройства.

### 10.2. Решение

Режим редактирования и фильтрация скрытых карточек **изолированы** — они работают **только на главном дашборде** (`DashboardHomeView`). Страницы комнат и групп (`DashboardRoomView`, `DashboardGroupView`) показывают **все устройства** без фильтрации, как если бы функция скрытия не существовала.

### 10.3. Архитектура изоляции

Изоляция реализована на **трёх уровнях**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DASHBOARD (Dashboard.tsx)                           │
│                                                                         │
│  activeSidebarView:                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 'home'  → Показывает кнопку Pencil → DashboardHomeView         │   │
│  │           (edit mode ДОСТУПЕН: фильтрация, видимость, toggles)  │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 'room'  → Не показывает Pencil  → DashboardRoomView            │   │
│  │           (edit mode НЕ ДОСТУПЕН: все устройства без фильтра)   │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 'group' → Не показывает Pencil  → DashboardGroupView           │   │
│  │           (edit mode НЕ ДОСТУПЕН: все устройства без фильтра)   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Уровень 1: Кнопка входа в режим (Dashboard.tsx)

Кнопка «Pencil» (карандаш) показывается **только** когда `activeSidebarView === 'home'`:

```tsx
// Dashboard.tsx, строка 279
{ctx.activeSidebarView === 'home' && (
    <button onClick={state.toggleEditMode} ...>
        <Pencil className="w-4 h-4" />
    </button>
)}
```

При переключении на комнату или группу кнопка исчезает — войти в режим редактирования невозможно.

#### Уровень 2: Сброс режима при смене вида (useDashboardState.ts)

Хук `useDashboardState` сбрасывает `isEditMode` при уходе с главного дашборда:

```tsx
// useDashboardState.ts, строка 262-266
useEffect(() => {
    if (activeSidebarView !== 'home') {
        setIsEditMode(false);
    }
}, [activeSidebarView]);
```

Это гарантирует, что если пользователь активировал edit mode на главном дашборде, а затем переключился на комнату, режим автоматически выключится. При возврате на главный дашборд режим не активен — нужно нажать Pencil снова.

#### Уровень 3: Отсутствие пропсов в Room/Group View

View-компоненты для комнат и групп **не передают** карточкам пропсы, связанные с редактированием:

| Пропс                     | DashboardHomeView | DashboardRoomView | DashboardGroupView |
|---------------------------|:-----------------:|:-----------------:|:------------------:|
| `isEditMode`              | ✅                | ❌                | ❌                 |
| `iconHiddenState`         | ✅                | ❌                | ❌                 |
| `onToggleVisibility`      | ✅                | ❌                | ❌                 |
| `getEffectiveHidden`      | ✅                | ❌                | ❌                 |
| `getIconHiddenState`      | ✅                | ❌                | ❌                 |
| `onToggleDeviceVisibility`| ✅                | ❌                | ❌                 |

Также в `DashboardRoomView` и `DashboardGroupView` **отсутствует фильтрация** устройств через `.filter(d => !state.getEffectiveHidden(...))`.

### 10.4. Поток данных (схема передачи пропсов)

#### Главный дашборд ('home') — edit mode ПОЛНОСТЬЮ функционален

```
Dashboard.tsx
  │
  │  state.toggleEditMode          (кнопка Pencil видна)
  │  state.edit.isEditMode
  │  state.getEffectiveHidden()
  │  state.getIconHiddenState()
  │  state.toggleCardVisibility()
  │
  ▼
DashboardHomeView.tsx
  │
  ├── ScenarioCard
  │     isEditMode={state.edit.isEditMode}
  │     iconHiddenState={state.getIconHiddenState(cardId)}
  │     onToggleVisibility={() => state.toggleCardVisibility(cardId)}
  │
  ├── DeviceCardAdapter
  │     isEditMode={state.edit.isEditMode}
  │     iconHiddenState={state.getIconHiddenState(`device_${dev.id}`)}
  │     onToggleVisibility={() => state.toggleCardVisibility(`device_${dev.id}`)}
  │
  └── GroupCard
        isEditMode={state.edit.isEditMode}
        getEffectiveHidden={state.getEffectiveHidden}
        getIconHiddenState={state.getIconHiddenState}
        onToggleDeviceVisibility={state.toggleCardVisibility}
```

#### Комната ('room') — edit mode ОТСУТСТВУЕТ

```
Dashboard.tsx
  │
  │  (кнопка Pencil скрыта)
  │
  ▼
DashboardRoomView.tsx
  │
  ├── DeviceCardAdapter        (без пропсов edit mode)
  └── GroupCard                (без пропсов edit mode)
```

#### Группа ('group') — edit mode ОТСУТСТВУЕТ

```
Dashboard.tsx
  │
  │  (кнопка Pencil скрыта)
  │
  ▼
DashboardGroupView.tsx
  │
  └── DeviceCard               (без пропсов edit mode)
```

### 10.5. Состояние и localStorage

Несмотря на изоляцию, **все состояния** режима редактирования сохраняются в `useDashboardState` и `localStorage` в неизменном виде:

| Состояние               | Тип              | Хранение                     |
|-------------------------|------------------|------------------------------|
| `isEditMode`            | `boolean`        | React state (сбрасывается при смене вида) |
| `hiddenCardIds`         | `Set<string>`    | React state + localStorage  |
| `visibilityChanges`     | `Map<string, boolean>` | React state (только во время сессии) |

- `hiddenCardIds` пишется в `localStorage` при выходе из режима редактирования (`toggleEditMode`)
- `hiddenCardIds` также загружается из `localStorage` при смене household
- Данные в `localStorage` не удаляются — они неактивны на страницах комнат/групп, но применяются при возврате на главный дашборд

### 10.6. Изменённые файлы

| Файл                              | Изменение                                                                 |
|-----------------------------------|---------------------------------------------------------------------------|
| `src/components/DashboardRoomView.tsx` | Убрана фильтрация `.filter(d => !state.getEffectiveHidden(...))` для устройств. Убраны пропсы `isEditMode`, `iconHiddenState`, `onToggleVisibility` из `DeviceCardAdapter`. Убраны пропсы `isEditMode`, `getEffectiveHidden`, `getIconHiddenState`, `onToggleDeviceVisibility` из `GroupCard`. |
| `src/components/DashboardGroupView.tsx` | Убрана фильтрация `.filter(d => !state.getEffectiveHidden(...))` для устройств. Убраны пропсы `isEditMode`, `iconHiddenState`, `onToggleVisibility` из `DeviceCard`. |

### 10.7. Edge Cases

| Сценарий                                           | Ожидаемое поведение                                                                              |
|----------------------------------------------------|--------------------------------------------------------------------------------------------------|
| Пользователь скрыл карточку на home → перешёл в комнату | Карточка **видна** в комнате. `hiddenCardIds` сохранён, но `DashboardRoomView` не применяет фильтр. |
| Пользователь в edit mode на home → переключился на комнату | Режим редактирования **автоматически сбрасывается** (useEffect в `useDashboardState`).            |
| Пользователь вернулся на home                       | Edit mode **не активен**. Чтобы увидеть/изменить скрытые карточки, нужно нажать Pencil.           |
| Пользователь активировал edit mode → скрыл карточку → вышел из режима (Save) → перешёл в комнату → вернулся на home → нажал Pencil | Карточка **скрыта** — все changeset'ы закоммичены в `hiddenCardIds` и сохранены в `localStorage`. |
| Пользователь активировал edit mode → скрыл карточку → перешёл в комнату (режим сброшен) → вернулся на home → нажал Pencil | Карточка **показана** — changeset'ы не были закоммичены (выход из режима не через `toggleEditMode`, а через сброс при смене вида). |
| Скрытие карточки на странице комнаты                 | **Невозможно** — кнопка Pencil не показывается, карточки не содержат UI для скрытия.              |
| Переключение household                              | `hiddenCardIds` перезагружаются из `localStorage` для нового household. Режим редактирования сбрасывается. |

### 10.8. Ключевые принципы

1. **View-компоненты сами решают, вызывать ли функции скрытия.** `DashboardHomeView` — вызывает, `DashboardRoomView`/`DashboardGroupView` — нет. Нет общего флага «isHiddenEnabled» в пропсах — решение зашито в каждом view.
2. **Хук `useDashboardState` ничего не знает о том, какой view его использует.** Все функции (getEffectiveHidden, getIconHiddenState и т.д.) доступны всегда — это ответственность view-компонента решать, какие из них передавать карточкам.
3. **Сброс edit mode при навигации — страховочный механизм.** Даже если view случайно передаст isEditMode карточке, значение будет `false`, и UI скрытия не появится.
4. **Данные не теряются.** localStorage сохраняет скрытые карточки даже при переключении между страницами. Пользователь не потеряет настройки отображения.

## 11. Декомпозиция Sidebar

> **Версия:** 1.0  
> **Дата:** 4 июля 2026 г.  
> **Статус:** Реализовано (Приоритет 3)

### 11.1. Проблема

Компонент `Sidebar.tsx` (358 строк) принимал **25 пропсов**, большинство из которых дублировали данные из контекста дашборда. Каждый новый пропс требовал изменений в трёх местах:
- определение пропсов в `Sidebar.tsx`
- передача в `Dashboard.tsx`
- обновление в `App.tsx` (через цепочку App → Dashboard → Sidebar)

Это тормозило разработку и усложняло тестирование.

### 11.2. Решение

1. **Sidebar переведён на `useDashboardContext()`** — все данные читаются напрямую из контекста, без prop drilling.
2. **25 пропсов → 1 пропс** (`onOpenCameraStream`) — единственный пропс, которого нет в контексте.
3. **Декомпозиция на 6 подкомпонентов** — каждый отвечает за свою секцию.
4. **Оптимизация `GroupCard`** — сопутствующий рефакторинг мемоизации.

### 11.3. Архитектура подкомпонентов

```
Sidebar.tsx
│   Пропсы: { onOpenCameraStream? }
│   Состояние: loadingItems, collapsedSections
│
├── SidebarHeader.tsx
│   Через контекст: households, activeHouseholdId, onSelectHousehold
│   Роль: выпадающий список домохозяйств
│
├── SidebarFavorites.tsx
│   Пропсы: collapsed, onToggle, loadingItems, withLoading, onOpenCameraStream
│   Через контекст: favoriteDeviceIds, data.devices, onToggleFavorite, onOpenSettings
│   Роль: список избранных устройств
│
├── SidebarSensors.tsx
│   Пропсы: collapsed, onToggle
│   Через контекст: data.devices, isSensorDevice, data.rooms, activeHouseholdId
│   Роль: список датчиков
│
├── SidebarRooms.tsx
│   Пропсы: collapsed, onToggle
│   Через контекст: data.rooms, activeRoomId, onSelectRoom
│   Роль: список комнат
│
├── SidebarGroups.tsx
│   Пропсы: collapsed, onToggle
│   Через контекст: data.groups, activeGroupId, onSelectGroup
│   Роль: список групп
│
└── SidebarScenarios.tsx
    Пропсы: collapsed, onToggle, loadingItems, withLoading, scenarios
    Через контекст: onExecuteScenario
    Роль: список сценариев
```

### 11.4. Поток данных через контекст

Вместо цепочки `App.tsx → Dashboard.tsx → Sidebar.tsx` данные теперь поступают через `DashboardContext`:

```
App.tsx                              // Владелец данных
  │
  ├──<DashboardContext.Provider>     // Провайдер контекста
  │    │
  │    ├── Dashboard.tsx             // Читает ctx.data, ctx.activeSidebarView и т.д.
  │    │
  │    └── Sidebar.tsx               // Читает ctx.data, ctx.activeHouseholdId,
  │         │                        //         ctx.activeSidebarView, ctx.onSelect* и т.д.
  │         ├── SidebarHeader.tsx    // Читает ctx.households, ctx.activeHouseholdId
  │         ├── SidebarRooms.tsx     // Читает ctx.data.rooms, ctx.activeRoomId
  │         ├── SidebarGroups.tsx    // Читает ctx.data.groups, ctx.activeGroupId
  │         └── ...                  // Все подкомпоненты
  │
  └── DashboardContext               // Определение типов контекста
```

**Преимущества:**
- Устранён prop drilling (25 пропсов → 1)
- Каждый подкомпонент читает только нужные ему поля контекста
- Dashboard перестал быть транзитом данных для Sidebar
- `Dashboard.tsx` сократился с ~1115 до ~417 строк

### 11.5. Схема collapsed-секций

Sidebar управляет состоянием свёрнутых секций через `localStorage` с привязкой к домохозяйству:

```
Состояние: collapsedSections: Record<string, boolean>
Ключ:      'sidebar:collapsedSections:household:{activeHouseholdId}'

Поток:
1. Загрузка: useEffect → localStorage.getItem(...) → setCollapsedSections
2. Переключение: toggleSection(key) → обновление state + localStorage.setItem(...)
3. Смена household: useEffect [activeHouseholdId] → перезагрузка
```

Секции: `favorites`, `sensors`, `rooms`, `groups`, `scenarios`.

### 11.6. Оптимизация мемоизации GroupCard

**До:** 7 `useMemo` в `GroupCard`:
```
useMemo 1: groupDevices = devices.filter(d => group.devices.includes(d.id))
useMemo 2: isLightGroup — проверка всех устройств
useMemo 3: isThermostatGroup — проверка всех устройств
useMemo 4: isFanGroup — проверка всех устройств
useMemo 5: groupIsOn — подсчёт on_off состояний
useMemo 6: hasOnOffCapability
useMemo 7: visibleDevices — фильтрация hidden
```

**После:** 2 `useMemo`:
```
useMemo 1: groupDevices = devices.filter(d => group.devices.includes(d.id))
useMemo 2: groupInfo — ОДИН проход по groupDevices:
             • определение типа группы (light/thermostat/fan)
             • подсчёт on_off состояний (багфикс)
             • фильтрация visibleDevices
           Результат: { isLightGroup, isThermostatGroup, isFanGroup,
                        groupIsOn, hasOnOffCapability, visibleDevices }
```

**Багфикс `groupIsOn`:**
- **Было:** `groupIsOn = devices.every(...)` — проверял все устройства, даже без on_off capability.
- **Стало:** `groupIsOn = totalOnOff > 0 && onCount === totalOnOff` — проверяет только устройства с on_off capability.

### 11.7. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `src/components/cards/GroupCard.tsx` | 7 useMemo → 2, объединённая логика в groupInfo, багфикс groupIsOn |
| `src/components/Sidebar.tsx` | Полностью переписан: 25 пропсов → 1, useDashboardContext, 6 подкомпонентов |
| `src/components/sidebar/SidebarHeader.tsx` | Новый: household selector |
| `src/components/sidebar/SidebarFavorites.tsx` | Новый: избранные |
| `src/components/sidebar/SidebarSensors.tsx` | Новый: датчики |
| `src/components/sidebar/SidebarRooms.tsx` | Новый: комнаты |
| `src/components/sidebar/SidebarGroups.tsx` | Новый: группы |
| `src/components/sidebar/SidebarScenarios.tsx` | Новый: сценарии |
| `src/components/Dashboard.tsx` | Упрощён вызов `<Sidebar onOpenCameraStream={...} />` |
| `src/contexts/DashboardContext.tsx` | Создан контекст для устранения prop drilling, предоставляет данные и обработчики |
| `src/hooks/useDashboardState.ts` | Хук состояния Dashboard (модалки, collapse, edit mode) |

---

## Связанные документы

- [`components-analysis.md`](./components-analysis.md) — Полный анализ каждого компонента, метрики, дублирование кода, dead code
- [`refactoring-plan.md`](./refactoring-plan.md) — Пошаговый план рефакторинга: выделение хуков, контекстов, устранение дублирования
- [`sensor-card.md`](./sensor-card.md) — Описание компонента SensorCard
- [`CHANGELOG.md`](./CHANGELOG.md) — История изменений проекта
