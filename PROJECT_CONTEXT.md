# StopSmoke - Контекст проекта

## Краткое описание
StopSmoke - это веб-приложение для помощи людям в отказе от курения. Приложение позволяет отслеживать прогресс, участвовать в марафонах, общаться с другими пользователями и получать мотивацию.

## Технологический стек

### Backend
- **Framework**: ASP.NET Core 10.0 (net10.0)
- **База данных**: PostgreSQL
- **ORM**: Entity Framework Core 10.0
- **Аутентификация**:
  - ASP.NET Identity
  - JWT Bearer токены (срок действия 30 дней)
- **Real-time**: SignalR (для чата)
- **Дополнительно**: reCAPTCHA для защиты от ботов

### Frontend
- **Framework**: React 19.2.0 + TypeScript 5.9.3
- **Build tool**: Vite 7.2.4
- **Routing**: React Router 7.9.6
- **HTTP Client**: Axios 1.13.2
- **Real-time**: SignalR Client 10.0.0
- **Интернационализация**: i18next + react-i18next
- **UI Icons**: lucide-react
- **Forms**: react-hook-form

## Структура проекта

```
StopSmoke/
├── backend/              # ASP.NET Core API
│   ├── Controllers/      # API контроллеры
│   ├── Models/          # Модели данных (Entity)
│   ├── DTOs/            # Data Transfer Objects
│   ├── Data/            # ApplicationDbContext
│   ├── Services/        # Бизнес-логика
│   ├── Hubs/            # SignalR хабы
│   ├── Migrations/      # EF миграции
│   └── Program.cs       # Точка входа
└── frontend/            # React приложение
    ├── src/
    │   ├── components/  # React компоненты
    │   ├── pages/       # Страницы
    │   └── contexts/    # React Context API
    └── package.json
```

## Основные модели данных

### User (наследует IdentityUser)
- Id, Email, UserName (от Identity)
- Name (необязательное, 3-100 символов)
- QuitDate - дата отказа от курения
- CigarettesPerDay - количество сигарет в день
- PricePerPack - цена за пачку
- Currency - валюта (по умолчанию USD)
- IsAdmin - флаг администратора

### Marathon
- Id, Title, Description
- StartDate, EndDate
- IsActive
- Participants (связь многие-ко-многим через MarathonParticipant)

### MarathonParticipant
- Связь User <-> Marathon
- JoinedAt
- HasCompleted - флаг завершения марафона

### Relapse
- Срывы пользователей
- UserId, Date, Description

### Message & Conversation
- Система личных сообщений между пользователями
- ConversationParticipant для участников бесед

## Ключевые функции

### Аутентификация
- Регистрация с email/password (минимум 6 символов)
- Авторизация с JWT токенами (30 дней)
- reCAPTCHA при регистрации и логине
- Автоматический редирект на /login при 401

### Основной функционал
1. **Дашборд**: отображение прогресса отказа от курения
   - Дни без курения
   - Сэкономленные деньги
   - Не выкуренные сигареты
   - График здоровья (Health Timeline)
   - Достижения (Achievements)

2. **Марафоны**:
   - Создание и участие в марафонах (admin)
   - Автоматическое завершение через background service
   - Отслеживание участников

3. **Таблица лидеров**:
   - Сортировка по дням без курения
   - Публичные профили пользователей

4. **Личные сообщения**:
   - Real-time чат через SignalR
   - Поиск пользователей
   - История сообщений

5. **Профиль**:
   - Редактирование данных
   - История срывов
   - Статистика

6. **Админ панель**: (SecretAdminPage)
   - Управление марафонами
   - Модерация

### CORS конфигурация
Разрешенные origins:
- http://localhost:5173 (dev)
- https://stopsmoke.info
- http://stopsmoke.info
- https://www.stopsmoke.info
- http://www.stopsmoke.info

## Конфигурация

### Backend (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=StopSmoke;..."
  },
  "Jwt": {
    "Key": "...",
    "Issuer": "StopSmoke",
    "Audience": "StopSmokeUsers"
  },
  "Recaptcha": {
    "SecretKey": "..."
  }
}
```

### Frontend
- Dev server: http://localhost:5173
- API endpoint: настраивается через axios

## Deployment
- Автоматическое применение миграций при запуске (Program.cs:87-100)
- Поддержка ForwardedHeaders для работы за прокси/nginx
- HTTPS redirect включен

## SignalR Hub
- Endpoint: `/chatHub`
- JWT токен передается через query string: `?access_token=...`
- Используется для real-time чата

## Background Services
- **MarathonCompletionService**: автоматически завершает марафоны по истечении срока

## Особенности
- Мультиязычность через i18next
- Минималистичный SVG логотип (недавно обновлен)
- SOS Modal для экстренной помощи
- Toast уведомления
- Protected routes с автоматическим редиректом
- Глобальный слушатель уведомлений (SignalR)

## Недавние изменения (из git log)
- Обновлен логотип приложения (новый минималистичный SVG)
- Увеличен срок действия токена до 30 дней
- Добавлен автоматический редирект на /login
- Исправления reCAPTCHA (fallback для site key, логирование)

## База данных
- PostgreSQL
- Миграции применяются автоматически при старте приложения
- Последние миграции включают систему чата и марафоны

## API Контроллеры
- AuthController - регистрация/логин
- ProfileController - управление профилем
- MarathonController - марафоны
- LeaderboardController - таблица лидеров
- RelapseController - срывы
- MessagesController - личные сообщения
- AdminController - админ функции

## Ключевые зависимости
- Microsoft.AspNetCore.Identity.EntityFrameworkCore
- Microsoft.AspNetCore.Authentication.JwtBearer
- Npgsql.EntityFrameworkCore.PostgreSQL
- @microsoft/signalr
- react-google-recaptcha
