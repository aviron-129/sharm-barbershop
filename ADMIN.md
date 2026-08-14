# Админка SHARM

## Что сделано
- `/admin/` — вход по email/паролю, редактирование контактов, логотипа, услуг, мастеров, портфолио, интерьера и заявок
- Публичный сайт подтягивает данные из Supabase; если ключи не заданы, остаётся текущая HTML-версия
- Заявки пишутся в таблицу `bookings` и уходят в Telegram

## Подключение Supabase
1. Создайте проект на supabase.com
2. SQL Editor → выполните `supabase/migrations/001_admin_schema.sql`
3. Затем `supabase/seed.sql`
4. Authentication → Users → Add user (email + пароль владельца)
5. В `supabase/add_admin.sql` подставьте email и выполните
6. В `js/config.js` вставьте:
   ```js
   window.SHARM_CONFIG = {
     supabaseUrl: "https://xxxx.supabase.co",
     supabaseAnonKey: "eyJ...",
   };
   ```
7. В Vercel Environment Variables добавьте:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (только сервер)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   - `SITE_ORIGIN` = ваш прод-домен без слэша в конце

## Локально
```bash
npm install
npm run dev
```
- Сайт: http://localhost:5173
- Админка: http://localhost:5173/admin/
