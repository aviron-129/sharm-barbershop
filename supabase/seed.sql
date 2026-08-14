-- Current SHARM content. Safe to re-run: uses fixed IDs.

insert into public.site_settings (
  id,
  brand_name,
  logo_url,
  phone,
  address,
  hours_short,
  hours_full,
  map_url,
  map_query,
  hero_image_url,
  hero_eyebrow,
  hero_title,
  hero_lead,
  seo_title,
  seo_description
) values (
  '00000000-0000-0000-0000-000000000001',
  'SHARM',
  null,
  '+998 99 005 12 20',
  'Алмалык, ул. Амир Тимур, 59',
  'Ежедневно 10:00 – 20:00',
  '10:00 – 20:00 · без выходных',
  'https://share.google/rlUNrPFdZWHVRSbtP',
  'Amir Temur 59, Olmaliq, Tashkent Region, Uzbekistan',
  'images/hero/hero-wide-1440.jpg',
  'Алмалык · мужской барбершоп',
  'SHARM',
  'Классическая стрижка. Точный fade. Характер без лишнего шума.',
  'SHARM — Барбершоп в Алмалыке',
  'Мужской барбершоп SHARM в Алмалыке, ул. Амир Тимур 59. Мастер Отабек: классические стрижки, fade, борода. Запись онлайн, тел. +998 99 005 12 20.'
)
on conflict (id) do nothing;

insert into public.services (id, name, price, sort_order, is_active) values
  ('11111111-1111-1111-1111-111111111001', 'Мужская стрижка', '40 000 сум', 1, true),
  ('11111111-1111-1111-1111-111111111002', 'Детская стрижка', '30 000 сум', 2, true),
  ('11111111-1111-1111-1111-111111111003', 'Стрижка + борода', '60 000 сум', 3, true),
  ('11111111-1111-1111-1111-111111111004', 'Стрижка + борода + укладка', '80 000 сум', 4, true),
  ('11111111-1111-1111-1111-111111111005', 'Свадебная укладка', 'от 100 000 сум', 5, true),
  ('11111111-1111-1111-1111-111111111006', 'Окантовка', '20 000 сум', 6, true)
on conflict (id) do nothing;

insert into public.masters (
  id, name, role, photo_url, bio, specialties, hours, sort_order, is_active
) values (
  '22222222-2222-2222-2222-222222222001',
  'Отабек',
  'Барбер SHARM',
  'images/team-01.jpg',
  'Классические мужские стрижки, точный fade, оформление бороды и контура, детские стрижки и укладка под событие. Работает с формой головы и типом волос, а не «как у всех».',
  '[
    {"label":"Стрижки","value":"fade · классика · crop"},
    {"label":"Борода","value":"контур · hot towel"}
  ]'::jsonb,
  'ежедневно 10:00 – 20:00',
  1,
  true
)
on conflict (id) do nothing;

insert into public.portfolio_categories (id, slug, title, sort_order, is_active) values
  ('33333333-3333-3333-3333-333333333001', 'mens-cut', 'Мужская стрижка', 1, true),
  ('33333333-3333-3333-3333-333333333002', 'kids-cut', 'Детская стрижка', 2, true),
  ('33333333-3333-3333-3333-333333333003', 'cut-beard', 'Стрижка + борода', 3, true),
  ('33333333-3333-3333-3333-333333333004', 'cut-beard-style', 'Стрижка + борода + укладка', 4, true),
  ('33333333-3333-3333-3333-333333333005', 'wedding-style', 'Свадебная укладка', 5, true),
  ('33333333-3333-3333-3333-333333333006', 'edging', 'Окантовка', 6, true)
on conflict (id) do nothing;

insert into public.portfolio_items (id, category_id, image_url, thumb_url, alt, sort_order, is_cover) values
  ('44444444-4444-4444-4444-444444444001', '33333333-3333-3333-3333-333333333001', 'images/portfolio/mens-cut/01.jpg', 'images/portfolio/mens-cut/01-thumb.webp', 'Мужская стрижка', 1, true),
  ('44444444-4444-4444-4444-444444444002', '33333333-3333-3333-3333-333333333001', 'images/portfolio/mens-cut/02.jpg', 'images/portfolio/mens-cut/02-thumb.webp', 'Мужская стрижка', 2, false),
  ('44444444-4444-4444-4444-444444444003', '33333333-3333-3333-3333-333333333001', 'images/portfolio/mens-cut/03.jpg', 'images/portfolio/mens-cut/03-thumb.webp', 'Мужская стрижка', 3, false),
  ('44444444-4444-4444-4444-444444444004', '33333333-3333-3333-3333-333333333001', 'images/portfolio/mens-cut/04.jpg', 'images/portfolio/mens-cut/04-thumb.webp', 'Мужская стрижка', 4, false),
  ('44444444-4444-4444-4444-444444444011', '33333333-3333-3333-3333-333333333002', 'images/portfolio/kids-cut/01.jpg', 'images/portfolio/kids-cut/01-thumb.webp', 'Детская стрижка', 1, true),
  ('44444444-4444-4444-4444-444444444012', '33333333-3333-3333-3333-333333333002', 'images/portfolio/kids-cut/02.jpg', 'images/portfolio/kids-cut/02-thumb.webp', 'Детская стрижка', 2, false),
  ('44444444-4444-4444-4444-444444444013', '33333333-3333-3333-3333-333333333002', 'images/portfolio/kids-cut/03.jpg', 'images/portfolio/kids-cut/03-thumb.webp', 'Детская стрижка', 3, false),
  ('44444444-4444-4444-4444-444444444014', '33333333-3333-3333-3333-333333333002', 'images/portfolio/kids-cut/04.jpg', 'images/portfolio/kids-cut/04-thumb.webp', 'Детская стрижка', 4, false),
  ('44444444-4444-4444-4444-444444444021', '33333333-3333-3333-3333-333333333003', 'images/portfolio/cut-beard/01.jpg', 'images/portfolio/cut-beard/01-thumb.webp', 'Стрижка + борода', 1, true),
  ('44444444-4444-4444-4444-444444444022', '33333333-3333-3333-3333-333333333003', 'images/portfolio/cut-beard/02.jpg', 'images/portfolio/cut-beard/02-thumb.webp', 'Стрижка + борода', 2, false),
  ('44444444-4444-4444-4444-444444444031', '33333333-3333-3333-3333-333333333004', 'images/portfolio/cut-beard-style/01.jpg', 'images/portfolio/cut-beard-style/01-thumb.webp', 'Стрижка + борода + укладка', 1, true),
  ('44444444-4444-4444-4444-444444444032', '33333333-3333-3333-3333-333333333004', 'images/portfolio/cut-beard-style/02.jpg', 'images/portfolio/cut-beard-style/02-thumb.webp', 'Стрижка + борода + укладка', 2, false),
  ('44444444-4444-4444-4444-444444444033', '33333333-3333-3333-3333-333333333004', 'images/portfolio/cut-beard-style/03.jpg', 'images/portfolio/cut-beard-style/03-thumb.webp', 'Стрижка + борода + укладка', 3, false),
  ('44444444-4444-4444-4444-444444444034', '33333333-3333-3333-3333-333333333004', 'images/portfolio/cut-beard-style/04.jpg', 'images/portfolio/cut-beard-style/04-thumb.webp', 'Стрижка + борода + укладка', 4, false),
  ('44444444-4444-4444-4444-444444444041', '33333333-3333-3333-3333-333333333005', 'images/portfolio/wedding-style/01.jpg', 'images/portfolio/wedding-style/01-thumb.webp', 'Свадебная укладка', 1, true),
  ('44444444-4444-4444-4444-444444444042', '33333333-3333-3333-3333-333333333005', 'images/portfolio/wedding-style/02.jpg', 'images/portfolio/wedding-style/02-thumb.webp', 'Свадебная укладка', 2, false),
  ('44444444-4444-4444-4444-444444444043', '33333333-3333-3333-3333-333333333005', 'images/portfolio/wedding-style/03.jpg', 'images/portfolio/wedding-style/03-thumb.webp', 'Свадебная укладка', 3, false),
  ('44444444-4444-4444-4444-444444444051', '33333333-3333-3333-3333-333333333006', 'images/portfolio/edging/01.jpg', 'images/portfolio/edging/01-thumb.webp', 'Окантовка', 1, true),
  ('44444444-4444-4444-4444-444444444052', '33333333-3333-3333-3333-333333333006', 'images/portfolio/edging/02.jpg', 'images/portfolio/edging/02-thumb.webp', 'Окантовка', 2, false),
  ('44444444-4444-4444-4444-444444444053', '33333333-3333-3333-3333-333333333006', 'images/portfolio/edging/03.jpg', 'images/portfolio/edging/03-thumb.webp', 'Окантовка', 3, false),
  ('44444444-4444-4444-4444-444444444054', '33333333-3333-3333-3333-333333333006', 'images/portfolio/edging/04.jpg', 'images/portfolio/edging/04-thumb.webp', 'Окантовка', 4, false)
on conflict (id) do nothing;

insert into public.interior_images (id, image_url, alt, sort_order, is_featured) values
  ('55555555-5555-5555-5555-555555555001', 'images/interior-01.jpg', 'Интерьер барбершопа SHARM', 1, true),
  ('55555555-5555-5555-5555-555555555002', 'images/interior-02.jpg', 'Рабочее место барбера', 2, false),
  ('55555555-5555-5555-5555-555555555003', 'images/interior-03.jpg', 'Детали салона', 3, false)
on conflict (id) do nothing;
