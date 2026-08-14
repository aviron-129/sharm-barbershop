window.Sharm = window.Sharm || {};

Sharm.BOOKING_STATUSES = [
  { value: "new", label: "Новая" },
  { value: "contacted", label: "Связались" },
  { value: "confirmed", label: "Подтверждена" },
  { value: "done", label: "Выполнена" },
  { value: "cancelled", label: "Отменена" },
];

Sharm.esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
  );

Sharm.phoneHref = (phone) => {
  const cleaned = String(phone || "").replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : "#";
};

Sharm.worksLabel = (count) => {
  const n = Number(count) || 0;
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return `${n} работа →`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${n} работы →`;
  return `${n} работ →`;
};

Sharm.slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || `cat-${Date.now()}`;

Sharm.mapEmbedSrc = (settings) => {
  if (settings?.map_embed_url) return settings.map_embed_url;
  const query = encodeURIComponent(settings?.map_query || settings?.address || "Olmaliq Uzbekistan");
  return `https://maps.google.com/maps?q=${query}&hl=ru&z=17&output=embed`;
};

Sharm.storagePathFromUrl = (url) => {
  const marker = "/storage/v1/object/public/media/";
  const index = String(url || "").indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
};

// Local seed paths like "images/..." must start with "/" so /admin/ resolves them from site root.
Sharm.mediaUrl = (url) => {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:|\/\/)/i.test(value)) return value;
  return value.startsWith("/") ? value : `/${value}`;
};

Sharm.getConfig = async () => {
  const local = window.SHARM_CONFIG || {};
  if (local.supabaseUrl && local.supabaseAnonKey) {
    return {
      supabaseUrl: local.supabaseUrl,
      supabaseAnonKey: local.supabaseAnonKey,
    };
  }

  try {
    const response = await fetch("/api/public-config", { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.supabaseUrl && data?.supabaseAnonKey) return data;
  } catch {
    return null;
  }

  return null;
};

Sharm.createClient = async () => {
  const config = await Sharm.getConfig();
  if (!config || !window.supabase?.createClient) return null;
  return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};
