const loginScreen = document.querySelector("#login-screen");
const app = document.querySelector("#app");
const loginForm = document.querySelector("#login-form");
const loginStatus = document.querySelector("#login-status");
const appStatus = document.querySelector("#app-status");
const panelTitle = document.querySelector("#panel-title");
const menuToggle = document.querySelector("#menu-toggle");
const sidebar = document.querySelector(".sidebar");

const titles = {
  settings: "Основное",
  services: "Услуги и цены",
  masters: "Мастера",
  portfolio: "Портфолио",
  interior: "Интерьер",
  bookings: "Заявки",
};

let db = null;
let settings = null;
let services = [];
let masters = [];
let categories = [];
let items = [];
let interiors = [];
let bookings = [];
let pendingLogo = null;
let pendingHero = null;
let pendingMasterPhoto = null;
let activeUserId = null;
let handling = false;

const setStatus = (el, message, kind = "") => {
  if (!el) return;
  el.textContent = message || "";
  el.classList.toggle("is-error", kind === "error");
  el.classList.toggle("is-ok", kind === "ok");
};

const toast = (message, kind = "ok") => setStatus(appStatus, message, kind);

const requireAdmin = async (session) => {
  const { data, error } = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
};

const showApp = (visible) => {
  loginScreen.classList.toggle("is-hidden", visible);
  app.classList.toggle("is-hidden", !visible);
};

const prepareImage = async (file, { maxW = 1600, maxH = 2000, quality = 0.82, logo = false } = {}) => {
  const allowed = logo
    ? ["image/png", "image/webp", "image/svg+xml"]
    : ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
  if (!allowed.includes(file.type)) {
    throw new Error("Неподдерживаемый формат файла");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Файл больше 8 МБ");
  }
  if (file.type === "image/svg+xml") {
    if (file.size > 400 * 1024) throw new Error("SVG слишком большой");
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("Не удалось обработать изображение");
  return blob;
};

const uploadMedia = async (file, folder, options) => {
  const blob = await prepareImage(file, options);
  const ext = blob.type === "image/svg+xml" ? "svg" : blob.type === "image/png" ? "png" : "webp";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from("media").upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = db.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
};

const removeMedia = async (url) => {
  const path = Sharm.storagePathFromUrl(url);
  if (!path) return;
  await db.storage.from("media").remove([path]);
};

const preview = (img, url) => {
  if (!img) return;
  if (url) {
    img.src = Sharm.mediaUrl(url);
    img.classList.add("is-on");
  } else {
    img.removeAttribute("src");
    img.classList.remove("is-on");
  }
};

const formValue = (form, name) => String(form.elements[name]?.value || "").trim();
const checked = (form, name) => Boolean(form.elements[name]?.checked);

async function loadAll() {
  const [settingsRes, servicesRes, mastersRes, catsRes, itemsRes, interiorRes, bookingsRes] = await Promise.all([
    db.from("site_settings").select("*").limit(1).maybeSingle(),
    db.from("services").select("*").order("sort_order"),
    db.from("masters").select("*").order("sort_order"),
    db.from("portfolio_categories").select("*").order("sort_order"),
    db.from("portfolio_items").select("*").order("sort_order"),
    db.from("interior_images").select("*").order("sort_order"),
    db.from("bookings").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  const firstError = [settingsRes, servicesRes, mastersRes, catsRes, itemsRes, interiorRes, bookingsRes]
    .map((result) => result.error)
    .find(Boolean);
  if (firstError) throw firstError;

  settings = settingsRes.data;
  services = servicesRes.data || [];
  masters = mastersRes.data || [];
  categories = catsRes.data || [];
  items = itemsRes.data || [];
  interiors = interiorRes.data || [];
  bookings = bookingsRes.data || [];

  fillSettings();
  renderServices();
  renderMasters();
  renderPortfolio();
  renderInterior();
  renderBookings();
}

function fillSettings() {
  const form = document.querySelector("#settings-form");
  if (!form || !settings) return;
  [
    "brand_name",
    "phone",
    "address",
    "hours_short",
    "hours_full",
    "map_url",
    "map_query",
    "hero_eyebrow",
    "hero_title",
    "hero_lead",
    "seo_title",
    "seo_description",
  ].forEach((name) => {
    if (form.elements[name]) form.elements[name].value = settings[name] || "";
  });
  preview(document.querySelector("#logo-preview"), settings.logo_url);
  preview(document.querySelector("#hero-preview"), settings.hero_image_url);
}

function renderServices() {
  const root = document.querySelector("#services-list");
  root.innerHTML = services
    .map(
      (service, index) => `
      <article class="row">
        <div>
          <h3>${Sharm.esc(service.name)}</h3>
          <p>${Sharm.esc(service.price)} ${service.is_active ? "" : "· скрыта"}</p>
        </div>
        <div class="row-actions">
          <button class="btn btn-small" data-act="up" data-id="${service.id}" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="btn btn-small" data-act="down" data-id="${service.id}" ${index === services.length - 1 ? "disabled" : ""}>↓</button>
          <button class="btn btn-small" data-act="edit" data-id="${service.id}">Изменить</button>
          <button class="btn btn-small" data-act="toggle" data-id="${service.id}">${service.is_active ? "Скрыть" : "Показать"}</button>
          <button class="btn btn-small btn-danger" data-act="delete" data-id="${service.id}">Удалить</button>
        </div>
      </article>`
    )
    .join("") || `<p class="muted">Услуг пока нет.</p>`;
}

function renderMasters() {
  const root = document.querySelector("#masters-list");
  root.innerHTML = masters
    .map(
      (master, index) => `
      <article class="row">
        <div>
          <h3>${Sharm.esc(master.name)}</h3>
          <p>${Sharm.esc(master.role || "Мастер")} ${master.is_active ? "" : "· скрыт"}</p>
        </div>
        <div class="row-actions">
          <button class="btn btn-small" data-act="up" data-id="${master.id}" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="btn btn-small" data-act="down" data-id="${master.id}" ${index === masters.length - 1 ? "disabled" : ""}>↓</button>
          <button class="btn btn-small" data-act="edit" data-id="${master.id}">Изменить</button>
          <button class="btn btn-small" data-act="toggle" data-id="${master.id}">${master.is_active ? "Скрыть" : "Показать"}</button>
          <button class="btn btn-small btn-danger" data-act="delete" data-id="${master.id}">Удалить</button>
        </div>
      </article>`
    )
    .join("") || `<p class="muted">Добавьте мастера.</p>`;
}

function itemsFor(categoryId) {
  return items.filter((item) => item.category_id === categoryId);
}

function renderPortfolio() {
  const root = document.querySelector("#portfolio-list");
  root.innerHTML = categories
    .map((category) => {
      const photos = itemsFor(category.id);
      return `
        <article class="card" data-category="${category.id}">
          <div class="row" style="border:0;padding:0;background:transparent">
            <div>
              <h3>${Sharm.esc(category.title)}</h3>
              <p>${Sharm.esc(category.slug)} · ${photos.length} фото ${category.is_active ? "" : "· скрыта"}</p>
            </div>
            <div class="row-actions">
              <button class="btn btn-small" data-act="edit-cat" data-id="${category.id}">Изменить</button>
              <button class="btn btn-small" data-act="toggle-cat" data-id="${category.id}">${category.is_active ? "Скрыть" : "Показать"}</button>
              <button class="btn btn-small btn-danger" data-act="delete-cat" data-id="${category.id}">Удалить</button>
            </div>
          </div>
          <label class="file-field" style="margin-top:0.8rem">
            <span>Добавить фото</span>
            <input type="file" accept="image/*" multiple data-upload="${category.id}" />
          </label>
          <div class="thumbs">
            ${photos
              .map(
                (photo) => `
                <div class="thumb-card">
                  <img src="${Sharm.esc(Sharm.mediaUrl(photo.thumb_url || photo.image_url))}" alt="" />
                  <div class="pad">
                    <span class="muted">${photo.is_cover ? "Обложка" : ""}</span>
                    <div class="inline-actions">
                      ${photo.is_cover ? "" : `<button class="btn btn-small" data-act="cover" data-id="${photo.id}">Обложка</button>`}
                      <button class="btn btn-small btn-danger" data-act="delete-item" data-id="${photo.id}">Удалить</button>
                    </div>
                  </div>
                </div>`
              )
              .join("")}
          </div>
        </article>`;
    })
    .join("") || `<p class="muted">Создайте категорию работ.</p>`;
}

function renderInterior() {
  const root = document.querySelector("#interior-list");
  root.innerHTML = interiors
    .map(
      (image) => `
      <article class="media-card ${image.is_featured ? "featured" : ""}">
        <img src="${Sharm.esc(Sharm.mediaUrl(image.image_url))}" alt="" />
        <div class="pad">
          <strong>${Sharm.esc(image.alt || "Фото салона")}</strong>
          <span class="muted">${image.is_featured ? "Главное" : ""}</span>
          <div class="inline-actions">
            ${image.is_featured ? "" : `<button class="btn btn-small" data-act="feature" data-id="${image.id}">Главное</button>`}
            <button class="btn btn-small btn-danger" data-act="delete-interior" data-id="${image.id}">Удалить</button>
          </div>
        </div>
      </article>`
    )
    .join("") || `<p class="muted">Загрузите фото салона.</p>`;
}

function renderBookings() {
  const root = document.querySelector("#bookings-list");
  const query = String(document.querySelector("#booking-search")?.value || "").trim().toLowerCase();
  const status = String(document.querySelector("#booking-filter")?.value || "");
  const list = bookings.filter((booking) => {
    const hay = `${booking.name} ${booking.phone} ${booking.service_name || ""}`.toLowerCase();
    const matchesQuery = !query || hay.includes(query);
    const matchesStatus = !status || booking.status === status;
    return matchesQuery && matchesStatus;
  });

  root.innerHTML = list
    .map((booking) => {
      const created = new Date(booking.created_at).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" });
      const options = Sharm.BOOKING_STATUSES.map(
        (item) => `<option value="${item.value}" ${item.value === booking.status ? "selected" : ""}>${item.label}</option>`
      ).join("");
      return `
        <article class="card booking-card">
          <div class="booking-head">
            <div>
              <h3>${Sharm.esc(booking.name)}</h3>
              <p><a href="${Sharm.phoneHref(booking.phone)}">${Sharm.esc(booking.phone)}</a></p>
            </div>
            <span class="badge">${created}</span>
          </div>
          <p>${Sharm.esc(booking.service_name || "Услуга не указана")} · ${Sharm.esc(booking.master_name || "любой мастер")}</p>
          ${booking.comment ? `<p>${Sharm.esc(booking.comment)}</p>` : ""}
          <label>
            <span>Статус</span>
            <select data-status="${booking.id}">${options}</select>
          </label>
          <label>
            <span>Заметка</span>
            <textarea data-note="${booking.id}" rows="2">${Sharm.esc(booking.admin_note || "")}</textarea>
          </label>
          <div class="inline-actions">
            <button class="btn btn-small btn-primary" data-act="save-booking" data-id="${booking.id}">Сохранить</button>
          </div>
        </article>`;
    })
    .join("") || `<p class="muted">Заявок нет.</p>`;
}

async function moveRow(table, list, id, direction) {
  const index = list.findIndex((row) => row.id === id);
  const swapWith = index + direction;
  if (index < 0 || swapWith < 0 || swapWith >= list.length) return;
  const current = list[index];
  const other = list[swapWith];
  await Promise.all([
    db.from(table).update({ sort_order: other.sort_order }).eq("id", current.id),
    db.from(table).update({ sort_order: current.sort_order }).eq("id", other.id),
  ]);
  await loadAll();
}

document.querySelector("#side-nav").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-panel]");
  if (!button) return;
  document.querySelectorAll("#side-nav button").forEach((item) => item.classList.toggle("is-active", item === button));
  document.querySelectorAll(".panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `panel-${button.dataset.panel}`);
  });
  panelTitle.textContent = titles[button.dataset.panel];
  sidebar.classList.remove("is-open");
});

menuToggle.addEventListener("click", () => sidebar.classList.toggle("is-open"));

document.querySelector("#logout-btn").addEventListener("click", async () => {
  activeUserId = null;
  await db?.auth.signOut();
  showApp(false);
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!db) {
    setStatus(loginStatus, "Подключение к Supabase ещё не готово. Обновите страницу.", "error");
    return;
  }

  const email = formValue(loginForm, "email");
  const password = String(loginForm.elements.password?.value || "");
  if (!email || !password) {
    setStatus(loginStatus, "Введите email и пароль.", "error");
    return;
  }

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  setStatus(loginStatus, "Входим…");

  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(loginStatus, error.message || "Неверный email или пароль.", "error");
      return;
    }
    await handleSession(data.session);
  } catch (error) {
    console.error(error);
    setStatus(loginStatus, error.message || "Не удалось войти.", "error");
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

document.querySelector("#logo-file").addEventListener("change", (event) => {
  pendingLogo = event.target.files?.[0] || null;
  if (pendingLogo) preview(document.querySelector("#logo-preview"), URL.createObjectURL(pendingLogo));
});

document.querySelector("#hero-file").addEventListener("change", (event) => {
  pendingHero = event.target.files?.[0] || null;
  if (pendingHero) preview(document.querySelector("#hero-preview"), URL.createObjectURL(pendingHero));
});

document.querySelector("#master-file").addEventListener("change", (event) => {
  pendingMasterPhoto = event.target.files?.[0] || null;
  if (pendingMasterPhoto) preview(document.querySelector("#master-preview"), URL.createObjectURL(pendingMasterPhoto));
});

document.querySelector("#settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    toast("Сохраняем…", "");
    const payload = {
      brand_name: formValue(form, "brand_name"),
      phone: formValue(form, "phone"),
      address: formValue(form, "address"),
      hours_short: formValue(form, "hours_short"),
      hours_full: formValue(form, "hours_full"),
      map_url: formValue(form, "map_url"),
      map_query: formValue(form, "map_query"),
      hero_eyebrow: formValue(form, "hero_eyebrow"),
      hero_title: formValue(form, "hero_title"),
      hero_lead: formValue(form, "hero_lead"),
      seo_title: formValue(form, "seo_title"),
      seo_description: formValue(form, "seo_description"),
    };
    if (pendingLogo) payload.logo_url = await uploadMedia(pendingLogo, "logos", { maxW: 800, maxH: 800, logo: true });
    if (pendingHero) payload.hero_image_url = await uploadMedia(pendingHero, "hero", { maxW: 2400, maxH: 1600 });
    const { error } = await db.from("site_settings").update(payload).eq("id", settings.id);
    if (error) throw error;
    pendingLogo = null;
    pendingHero = null;
    await loadAll();
    toast("Основное сохранено.", "ok");
  } catch (error) {
    toast(error.message || "Не удалось сохранить.", "error");
  }
});

document.querySelector("#service-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const id = formValue(form, "id");
  const payload = {
    name: formValue(form, "name"),
    price: formValue(form, "price"),
    is_active: checked(form, "is_active"),
  };
  try {
    if (id) {
      const { error } = await db.from("services").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      payload.sort_order = (services.at(-1)?.sort_order || 0) + 1;
      const { error } = await db.from("services").insert(payload);
      if (error) throw error;
    }
    form.reset();
    form.elements.is_active.checked = true;
    await loadAll();
    toast("Услуга сохранена.", "ok");
  } catch (error) {
    toast(error.message || "Не удалось сохранить услугу.", "error");
  }
});

document.querySelector("#services-list").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act]");
  if (!button) return;
  const service = services.find((row) => row.id === button.dataset.id);
  if (!service) return;
  try {
    if (button.dataset.act === "edit") {
      const form = document.querySelector("#service-form");
      form.elements.id.value = service.id;
      form.elements.name.value = service.name;
      form.elements.price.value = service.price;
      form.elements.is_active.checked = service.is_active;
    } else if (button.dataset.act === "toggle") {
      await db.from("services").update({ is_active: !service.is_active }).eq("id", service.id);
      await loadAll();
    } else if (button.dataset.act === "delete" && confirm("Удалить услугу?")) {
      await db.from("services").delete().eq("id", service.id);
      await loadAll();
    } else if (button.dataset.act === "up") {
      await moveRow("services", services, service.id, -1);
    } else if (button.dataset.act === "down") {
      await moveRow("services", services, service.id, 1);
    }
  } catch (error) {
    toast(error.message || "Ошибка услуги.", "error");
  }
});

document.querySelector("#master-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const id = formValue(form, "id");
  const specialtiesValue = formValue(form, "specialties");
  const payload = {
    name: formValue(form, "name"),
    role: formValue(form, "role"),
    bio: formValue(form, "bio"),
    hours: formValue(form, "hours"),
    is_active: checked(form, "is_active"),
    specialties: specialtiesValue
      ? specialtiesValue
          .split("|")
          .map((part) => {
            const chunks = part.split(":");
            if (chunks.length > 1) {
              return { label: chunks[0].trim(), value: chunks.slice(1).join(":").trim() };
            }
            return { label: "Стиль", value: part.trim() };
          })
          .filter((item) => item.value)
      : [],
  };
  try {
    if (pendingMasterPhoto) {
      payload.photo_url = await uploadMedia(pendingMasterPhoto, "masters", { maxW: 1200, maxH: 1500 });
    }
    if (id) {
      const { error } = await db.from("masters").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      payload.sort_order = (masters.at(-1)?.sort_order || 0) + 1;
      const { error } = await db.from("masters").insert(payload);
      if (error) throw error;
    }
    form.reset();
    form.elements.is_active.checked = true;
    pendingMasterPhoto = null;
    preview(document.querySelector("#master-preview"), "");
    await loadAll();
    toast("Мастер сохранён.", "ok");
  } catch (error) {
    toast(error.message || "Не удалось сохранить мастера.", "error");
  }
});

document.querySelector("#masters-list").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act]");
  if (!button) return;
  const master = masters.find((row) => row.id === button.dataset.id);
  if (!master) return;
  try {
    if (button.dataset.act === "edit") {
      const form = document.querySelector("#master-form");
      form.elements.id.value = master.id;
      form.elements.name.value = master.name || "";
      form.elements.role.value = master.role || "";
      form.elements.bio.value = master.bio || "";
      form.elements.hours.value = master.hours || "";
      form.elements.specialties.value = (master.specialties || [])
        .map((item) => `${item.label || "Стиль"}: ${item.value || ""}`)
        .join(" | ");
      form.elements.is_active.checked = master.is_active;
      preview(document.querySelector("#master-preview"), master.photo_url);
    } else if (button.dataset.act === "toggle") {
      await db.from("masters").update({ is_active: !master.is_active }).eq("id", master.id);
      await loadAll();
    } else if (button.dataset.act === "delete" && confirm("Удалить мастера?")) {
      await removeMedia(master.photo_url);
      await db.from("masters").delete().eq("id", master.id);
      await loadAll();
    } else if (button.dataset.act === "up") {
      await moveRow("masters", masters, master.id, -1);
    } else if (button.dataset.act === "down") {
      await moveRow("masters", masters, master.id, 1);
    }
  } catch (error) {
    toast(error.message || "Ошибка мастера.", "error");
  }
});

document.querySelector("#category-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const id = formValue(form, "id");
  const title = formValue(form, "title");
  const payload = {
    title,
    slug: formValue(form, "slug") || Sharm.slugify(title),
    is_active: checked(form, "is_active"),
  };
  try {
    if (id) {
      const { error } = await db.from("portfolio_categories").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      payload.sort_order = (categories.at(-1)?.sort_order || 0) + 1;
      const { error } = await db.from("portfolio_categories").insert(payload);
      if (error) throw error;
    }
    form.reset();
    form.elements.is_active.checked = true;
    await loadAll();
    toast("Категория сохранена.", "ok");
  } catch (error) {
    toast(error.message || "Не удалось сохранить категорию.", "error");
  }
});

document.querySelector("#portfolio-list").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act]");
  if (!button) return;
  try {
    if (button.dataset.act === "edit-cat") {
      const category = categories.find((row) => row.id === button.dataset.id);
      const form = document.querySelector("#category-form");
      form.elements.id.value = category.id;
      form.elements.title.value = category.title;
      form.elements.slug.value = category.slug;
      form.elements.is_active.checked = category.is_active;
    } else if (button.dataset.act === "toggle-cat") {
      const category = categories.find((row) => row.id === button.dataset.id);
      await db.from("portfolio_categories").update({ is_active: !category.is_active }).eq("id", category.id);
      await loadAll();
    } else if (button.dataset.act === "delete-cat" && confirm("Удалить категорию и все фото?")) {
      const photos = itemsFor(button.dataset.id);
      await Promise.all(photos.map((photo) => removeMedia(photo.image_url)));
      await db.from("portfolio_categories").delete().eq("id", button.dataset.id);
      await loadAll();
    } else if (button.dataset.act === "cover") {
      const photo = items.find((row) => row.id === button.dataset.id);
      await db.from("portfolio_items").update({ is_cover: false }).eq("category_id", photo.category_id);
      await db.from("portfolio_items").update({ is_cover: true }).eq("id", photo.id);
      await loadAll();
    } else if (button.dataset.act === "delete-item" && confirm("Удалить фото?")) {
      const photo = items.find((row) => row.id === button.dataset.id);
      await removeMedia(photo.image_url);
      if (photo.thumb_url && photo.thumb_url !== photo.image_url) await removeMedia(photo.thumb_url);
      await db.from("portfolio_items").delete().eq("id", photo.id);
      await loadAll();
    }
  } catch (error) {
    toast(error.message || "Ошибка портфолио.", "error");
  }
});

document.querySelector("#portfolio-list").addEventListener("change", async (event) => {
  const input = event.target.closest("input[data-upload]");
  if (!input?.files?.length) return;
  const categoryId = input.dataset.upload;
  const existing = itemsFor(categoryId);
  try {
    toast("Загружаем фото…", "");
    let order = existing.at(-1)?.sort_order || 0;
    for (const file of [...input.files]) {
      order += 1;
      const url = await uploadMedia(file, `portfolio/${categoryId}`, { maxW: 1400, maxH: 1750 });
      const { error } = await db.from("portfolio_items").insert({
        category_id: categoryId,
        image_url: url,
        thumb_url: url,
        alt: categories.find((row) => row.id === categoryId)?.title || "",
        sort_order: order,
        is_cover: existing.length === 0 && order === 1,
      });
      if (error) throw error;
    }
    input.value = "";
    await loadAll();
    toast("Фото добавлены.", "ok");
  } catch (error) {
    toast(error.message || "Не удалось загрузить фото.", "error");
  }
});

document.querySelector("#interior-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const file = document.querySelector("#interior-file").files?.[0];
  if (!file) return;
  try {
    const url = await uploadMedia(file, "interior", { maxW: 1800, maxH: 1400 });
    const featured = checked(form, "is_featured");
    if (featured) {
      await db.from("interior_images").update({ is_featured: false }).eq("is_featured", true);
    }
    const { error } = await db.from("interior_images").insert({
      image_url: url,
      alt: formValue(form, "alt") || "Интерьер SHARM",
      sort_order: (interiors.at(-1)?.sort_order || 0) + 1,
      is_featured: featured || interiors.length === 0,
    });
    if (error) throw error;
    form.reset();
    await loadAll();
    toast("Фото салона добавлено.", "ok");
  } catch (error) {
    toast(error.message || "Не удалось добавить фото салона.", "error");
  }
});

document.querySelector("#interior-list").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act]");
  if (!button) return;
  const image = interiors.find((row) => row.id === button.dataset.id);
  if (!image) return;
  try {
    if (button.dataset.act === "feature") {
      await db.from("interior_images").update({ is_featured: false }).neq("id", image.id);
      await db.from("interior_images").update({ is_featured: true }).eq("id", image.id);
      await loadAll();
    } else if (button.dataset.act === "delete-interior" && confirm("Удалить фото салона?")) {
      await removeMedia(image.image_url);
      await db.from("interior_images").delete().eq("id", image.id);
      await loadAll();
    }
  } catch (error) {
    toast(error.message || "Ошибка интерьера.", "error");
  }
});

document.querySelector("#booking-search").addEventListener("input", renderBookings);
document.querySelector("#booking-filter").addEventListener("change", renderBookings);

document.querySelector("#bookings-list").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-act='save-booking']");
  if (!button) return;
  const card = button.closest("article");
  const status = card.querySelector(`[data-status="${button.dataset.id}"]`).value;
  const admin_note = card.querySelector(`[data-note="${button.dataset.id}"]`).value.trim();
  try {
    const { error } = await db.from("bookings").update({ status, admin_note }).eq("id", button.dataset.id);
    if (error) throw error;
    await loadAll();
    toast("Заявка обновлена.", "ok");
  } catch (error) {
    toast(error.message || "Не удалось обновить заявку.", "error");
  }
});

async function handleSession(session) {
  if (!session) {
    activeUserId = null;
    showApp(false);
    return;
  }
  if (handling || activeUserId === session.user.id) return;

  handling = true;
  try {
    const allowed = await requireAdmin(session);
    if (!allowed) {
      await db.auth.signOut();
      setStatus(loginStatus, "Этот аккаунт не является администратором.", "error");
      showApp(false);
      return;
    }
    activeUserId = session.user.id;
    setStatus(loginStatus, "");
    showApp(true);
    await loadAll();
    toast("Данные загружены.", "ok");
  } catch (error) {
    console.error(error);
    setStatus(loginStatus, error.message || "Не удалось проверить доступ.", "error");
    showApp(false);
  } finally {
    handling = false;
  }
}

async function start() {
  try {
    db = await Sharm.createClient();
  } catch (error) {
    console.error(error);
  }

  if (!db) {
    setStatus(loginStatus, "Не удалось подключиться к Supabase. Проверьте js/config.js.", "error");
    return;
  }

  // Supabase holds an auth lock during this callback, so any query must run after it returns.
  db.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      activeUserId = null;
      showApp(false);
      return;
    }
    setTimeout(() => handleSession(session), 0);
  });

  const { data } = await db.auth.getSession();
  if (data?.session) await handleSession(data.session);
}

start();
