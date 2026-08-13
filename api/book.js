export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: "Telegram is not configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: "Invalid JSON" });
    }
  }

  const name = String(body?.name || "").trim().slice(0, 80);
  const phone = String(body?.phone || "").trim().slice(0, 40);
  const service = String(body?.service || "").trim().slice(0, 80);
  const barber = String(body?.barber || "any").trim().slice(0, 80);
  const comment = String(body?.comment || "").trim().slice(0, 500);

  if (!name || !phone || !service) {
    return res.status(400).json({ ok: false, error: "Name, phone and service are required" });
  }

  const barberLabel = barber === "any" ? "Любой свободный" : barber;
  const text = [
    "✂️ Новая заявка — SHARM",
    "",
    `👤 Имя: ${name}`,
    `📞 Телефон: ${phone}`,
    `💈 Услуга: ${service}`,
    `🧑‍💼 Мастер: ${barberLabel}`,
    comment ? `💬 Комментарий: ${comment}` : null,
    "",
    `🕒 ${new Date().toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" })}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const tgData = await tgRes.json();

    if (!tgRes.ok || !tgData.ok) {
      console.error("Telegram error:", tgData);
      return res.status(502).json({ ok: false, error: "Failed to send Telegram message" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram request failed:", error);
    return res.status(502).json({ ok: false, error: "Telegram request failed" });
  }
}
