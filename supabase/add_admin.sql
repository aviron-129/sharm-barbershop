-- Owner admin access for barberofsharm@gmail.com
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'barberofsharm@gmail.com'
on conflict (user_id) do nothing;
