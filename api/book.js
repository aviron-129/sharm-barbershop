import { createClient } from "@supabase/supabase-js";

const hits = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 8;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
};

const allowOrigin = (req) => {
  const allowed = (process.env.SITE_ORIGIN || "").replace(/\/$/, "");
  const origin = String(req.headers.origin || "").replace(/\/$/, "");
  if (!allowed) return origin || "*";
  if (origin && origin === allowed) return origin;
  return null;
};

const rateLimit = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((stamp) => now - stamp < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
};

const parseBody = (raw) => {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const text = (value, max) => String(value || "").trim().slice(0, max);

const isPhone = (value) => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
};

export default async function handler(req, res) {
  const origin = allowOrigin(req);
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(origin ? 204 : 403).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!origin && process.env.SITE_ORIGIN) {
    return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const ip = getClientIp(req);
  if (!rateLimit(ip)) {
    return res.status(429).json({ ok: false, error: "Too many requests" });
  }

  const body = parseBody(req.body);
  if (!body) {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  if (text(body.website, 80) || text(body.company, 80)) {
    return res.status(200).json({ ok: true });
  }

  const name = text(body.name, 80);
  const phone = text(body.phone, 40);
  const comment = text(body.comment, 500);
  let serviceId = text(body.serviceId, 80);
  let masterId = text(body.masterId, 80);
  let serviceName = text(body.service, 80);
  let masterName = text(body.barber, 80);

  if (serviceId && !UUID_RE.test(serviceId)) {
    if (!serviceName) serviceName = serviceId;
    serviceId = "";
  }

  if (masterId && masterId !== "any" && !UUID_RE.test(masterId)) {
    if (!masterName || masterName === "any") masterName = masterId;
    masterId = "";
  }

  if (!name || !phone || (!serviceId && !serviceName)) {
    return res.status(400).json({ ok: false, error: "Name, phone and service are required" });
  }

  if (!isPhone(phone)) {
    return res.status(400).json({ ok: false, error: "Invalid phone" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: "Booking is not configured" });
  }

  let supabase = null;
  if (supabaseUrl && serviceKey) {
    supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  try {
    if (supabase && serviceId) {
      const { data: service, error } = await supabase
        .from("services")
        .select("id, name")
        .eq("id", serviceId)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !service) {
        return res.status(400).json({ ok: false, error: "Unknown service" });
      }
      serviceName = service.name;
    }

    let masterRow = null;
    if (supabase && masterId && masterId !== "any") {
      const { data, error } = await supabase
        .from("masters")
        .select("id, name")
        .eq("id", masterId)
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) {
        return res.status(400).json({ ok: false, error: "Unknown master" });
      }
      masterRow = data;
      masterName = data.name;
    }

    if (!masterName || masterName === "any") {
      masterName = "Любой свободный";
    }

    if (supabase) {
      const { error: insertError } = await supabase.from("bookings").insert({
        name,
        phone,
        service_id: serviceId && UUID_RE.test(serviceId) ? serviceId : null,
        service_name: serviceName,
        master_id: masterRow?.id || null,
        master_name: masterName,
        comment: comment || null,
        status: "new",
      });

      if (insertError) {
        console.error("Booking insert failed:", insertError);
        return res.status(500).json({ ok: false, error: "Could not save booking" });
      }
    }

    const message = [
      "✂️ Новая заявка — SHARM",
      "",
      `👤 Имя: ${name}`,
      `📞 Телефон: ${phone}`,
      `💈 Услуга: ${serviceName}`,
      `🧑‍💼 Мастер: ${masterName}`,
      comment ? `💬 Комментарий: ${comment}` : null,
      "",
      `🕒 ${new Date().toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" })}`,
    ]
      .filter(Boolean)
      .join("\n");

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
      }),
    });

    const tgData = await tgRes.json().catch(() => ({}));
    if (!tgRes.ok || !tgData.ok) {
      console.error("Telegram error:", tgData);
      return res.status(502).json({ ok: false, error: "Could not send notification" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Booking request failed:", error);
    return res.status(502).json({ ok: false, error: "Booking request failed" });
  }
}
