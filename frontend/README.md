# Frontend

React 18 + TypeScript приложение, построенное по методологии Feature-Sliced Design (FSD v2).

## 🚀 Команды

```bash
# Установка зависимостей
npm install

# Разработка
npm run dev          # http://localhost:3000

# Сборка
npm run build
npm run preview      # просмотр продакшн-билда

# Тесты
npm test             # интерактивный режим (watch)
npm test -- --run    # однократный запуск
npm run test:ui      # с UI интерфейсом
npm run test:coverage # с покрытием кода

# PWA ассеты
npm run generate-pwa-assets
```

## 📁 Структура (FSD)

```
src/
├── app/          # Глобальная инфраструктура (провайдеры, роутинг)
├── pages/        # Страницы (Auth, Home, Study, Stats, Profile)
├── widgets/      # Крупные reusable UI блоки
├── features/     # Фичи (создание карточек, изучение, редактирование)
├── entities/     # Сущности (Card, Deck, User, Group)
├── shared/       # UI kit, API, утилиты, конфиг
└── test/         # Настройки тестов
```

## 🏗️ FSD правила

**Импорты только сверху вниз:**
```
app → pages → widgets → features → entities → shared
```

**Используйте алиас `@/`:**
```typescript
// ✅ Правильно
import { Button } from '@/shared/ui/Button/Button';
import { StudyCard } from '@/entities/card';

// ❌ Неправильно
import { Button } from '../../../shared/ui/Button/Button';
```

## 🧪 Тесты

Тесты находятся **рядом с кодом**:

```
src/
├── shared/lib/errors/
│   ├── getErrorMessage.ts
│   └── getErrorMessage.test.ts
├── entities/card/api/
│   ├── cardApi.ts
│   └── cardApi.test.ts
```

## 🛠️ Технологии

- **Build:** Vite 6 с SWC
- **UI:** Radix UI + Tailwind CSS
- **State:** React hooks, react-hook-form
- **Math:** KaTeX
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library
- **PWA:** vite-plugin-pwa

## 📖 Документация

- [FSD Contract](./docs/fsd-contract.md) — архитектурный контракт (на русском)
- [CLAUDE.md](../CLAUDE.md) — документация для разработчиков
