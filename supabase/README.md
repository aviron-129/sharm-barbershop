# Supabase для SHARM

1. Создайте проект на [supabase.com](https://supabase.com).
2. В SQL Editor по очереди выполните:
   - `migrations/001_admin_schema.sql`
   - `seed.sql`
3. Authentication → Users → Add user: email и пароль владельца (подтверждённый).
4. В `add_admin.sql` подставьте этот email и выполните скрипт.
5. Скопируйте URL и anon/publishable key в `js/config.js`.
6. В Vercel добавьте переменные из `.env.example` (включая `SUPABASE_SERVICE_ROLE_KEY` — только на сервере).
