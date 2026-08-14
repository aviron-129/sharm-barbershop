const header = document.querySelector(".site-header");
const nav = document.querySelector("#site-nav");
const toggle = document.querySelector(".nav-toggle");
const form = document.querySelector("#book-form");
const statusEl = document.querySelector("#form-status");
const yearEl = document.querySelector("#year");

let galleries = {
  "mens-cut": { title: "Мужская стрижка", images: null, count: 4 },
  "kids-cut": { title: "Детская стрижка", images: null, count: 4 },
  "cut-beard": { title: "Стрижка + борода", images: null, count: 2 },
  "cut-beard-style": { title: "Стрижка + борода + укладка", images: null, count: 4 },
  "wedding-style": { title: "Свадебная укладка", images: null, count: 3 },
  edging: { title: "Окантовка", images: null, count: 4 },
};

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

const onScroll = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

const observeReveals = () => {
  const revealTargets = document.querySelectorAll(
    ".section-head, .price-list, .works-grid, .masters-grid, .master-card, .interior-grid, .book-form, .contact-layout, .about-meta"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  revealTargets.forEach((el) => observer.observe(el));
};

observeReveals();

const galleryDialog = document.querySelector("#gallery-dialog");
const galleryTitle = document.querySelector("#gallery-title");
const galleryImages = document.querySelector("#gallery-images");
const galleryClose = document.querySelector(".gallery-close");

const closeGallery = () => {
  if (!galleryDialog?.open) return;
  galleryDialog.close();
  document.body.classList.remove("dialog-open");
};

const openGallery = (slug) => {
  const gallery = galleries[slug];
  if (!galleryDialog || !galleryTitle || !galleryImages || !gallery) return;

  galleryTitle.textContent = gallery.title;
  galleryImages.replaceChildren();

  if (Array.isArray(gallery.images) && gallery.images.length) {
    gallery.images.forEach((item, index) => {
      const image = document.createElement("img");
      image.src = Sharm.mediaUrl(item.image_url);
      image.alt = item.alt || `${gallery.title} — работа ${index + 1}`;
      image.width = 900;
      image.height = 1125;
      image.loading = index === 0 ? "eager" : "lazy";
      image.decoding = "async";
      galleryImages.append(image);
    });
  } else {
    for (let index = 1; index <= gallery.count; index += 1) {
      const number = String(index).padStart(2, "0");
      const picture = document.createElement("picture");
      const source = document.createElement("source");
      const image = document.createElement("img");
      source.type = "image/webp";
      source.srcset = `images/portfolio/${slug}/${number}.webp`;
      image.src = `images/portfolio/${slug}/${number}.jpg`;
      image.alt = `${gallery.title} — работа ${index}`;
      image.width = 900;
      image.height = 1125;
      image.loading = index === 1 ? "eager" : "lazy";
      image.decoding = "async";
      picture.append(source, image);
      galleryImages.append(picture);
    }
  }

  document.body.classList.add("dialog-open");
  galleryDialog.showModal();
};

const bindWorkItems = () => {
  document.querySelectorAll(".work-item[data-gallery]").forEach((item) => {
    if (item.dataset.bound === "1") return;
    item.dataset.bound = "1";
    const activate = () => openGallery(item.dataset.gallery);
    item.addEventListener("click", activate);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
};

bindWorkItems();

galleryClose?.addEventListener("click", closeGallery);
galleryDialog?.addEventListener("click", (event) => {
  if (event.target === galleryDialog) closeGallery();
});
galleryDialog?.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
});

const setText = (selector, value) => {
  const el = document.querySelector(selector);
  if (el && value != null && value !== "") el.textContent = value;
};

const setHref = (selector, href) => {
  const el = document.querySelector(selector);
  if (el && href) el.setAttribute("href", href);
};

const applySettings = (settings, masters = []) => {
  if (!settings) return;
  if (settings.seo_title) document.title = settings.seo_title;
  if (settings.seo_description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", settings.seo_description);
  }

  setText("#logo-word", settings.brand_name);
  setText("#hero-eyebrow", settings.hero_eyebrow);
  setText("#hero-brand", settings.hero_title || settings.brand_name);
  setText("#hero-lead", settings.hero_lead);
  setText("#about-hours", settings.hours_short);
  setText("#about-address", settings.address);
  setText("#contact-address", settings.address);
  setText("#contact-hours", settings.hours_full || settings.hours_short);
  setText("#footer-brand", settings.brand_name);
  setText("#footer-address", `Барбершоп · ${settings.address || ""}`);

  if (settings.phone) {
    setText("#about-phone", settings.phone);
    setHref("#about-phone", Sharm.phoneHref(settings.phone));
    setText("#contact-phone", settings.phone);
    setHref("#contact-phone", Sharm.phoneHref(settings.phone));
    setText("#footer-phone", settings.phone);
    setHref("#footer-phone", Sharm.phoneHref(settings.phone));
  }

  if (settings.map_url) setHref("#contact-map-link", settings.map_url);
  const map = document.querySelector("#map-frame");
  if (map) map.src = Sharm.mapEmbedSrc(settings);

  const logoImage = document.querySelector("#logo-image");
  const logoCrest = document.querySelector("#logo-crest");
  if (logoImage && settings.logo_url) {
    logoImage.src = Sharm.mediaUrl(settings.logo_url);
    logoImage.classList.remove("is-hidden");
    logoCrest?.classList.add("is-hidden");
  }

  if (settings.hero_image_url) {
    const heroMedia = document.querySelector(".hero-media");
    if (heroMedia) {
      heroMedia.innerHTML = `<img src="${Sharm.esc(Sharm.mediaUrl(settings.hero_image_url))}" alt="" width="1440" height="810" fetchpriority="high" decoding="async" />`;
    }
  }

  if (masters[0]?.name) {
    setText("#contact-master", masters[0].name);
    setText("#footer-master", `мастер ${masters[0].name}`);
  }
};

// Hides a section and its nav link when the admin leaves it empty.
const setSectionVisible = (sectionId, visible) => {
  document.querySelector(sectionId)?.classList.toggle("is-hidden", !visible);
  document.querySelector(`.site-nav a[href="${sectionId}"]`)?.classList.toggle("is-hidden", !visible);
};

const renderServices = (services) => {
  const list = document.querySelector("#price-list");
  const select = document.querySelector("#service-select");
  if (!list) return;

  if (!services.length) {
    list.innerHTML = "";
    setSectionVisible("#services", false);
    if (select) select.innerHTML = `<option value="" disabled selected>Нет доступных услуг</option>`;
    return;
  }

  setSectionVisible("#services", true);
  list.innerHTML = services
    .map(
      (service) => `
      <li>
        <span class="service-name">${Sharm.esc(service.name)}</span>
        <span class="service-dots" aria-hidden="true"></span>
        <span class="service-meta">${Sharm.esc(service.price)}</span>
      </li>`
    )
    .join("");

  if (select) {
    select.innerHTML =
      `<option value="" disabled selected>Выберите услугу</option>` +
      services
        .map((service) => `<option value="${Sharm.esc(service.id)}">${Sharm.esc(service.name)}</option>`)
        .join("");
  }
};

const renderMasters = (masters, phone) => {
  const root = document.querySelector("#masters-root");
  const barberField = document.querySelector("#barber-field");
  const navTeam = document.querySelector("#nav-team");
  if (!root) return;

  if (!masters.length) {
    root.innerHTML = "";
    setSectionVisible("#team", false);
    if (barberField) barberField.innerHTML = `<input type="hidden" name="masterId" value="any" />`;
    return;
  }

  setSectionVisible("#team", true);
  const many = masters.length > 1;
  setText("#team-title", many ? "Команда" : "Мастер");
  setText(
    "#team-lead",
    many
      ? "Выбирайте мастера по стилю — или доверьтесь свободному окну."
      : "Один мастер — один стандарт качества. Каждая работа под личным контролем."
  );
  if (navTeam) navTeam.textContent = many ? "Команда" : "Мастер";

  root.className = many ? "masters-grid" : "";
  root.innerHTML = masters
    .map((master) => {
      const facts = Array.isArray(master.specialties) ? master.specialties : [];
      const factsHtml = facts
        .map((fact) => `<li><span>${Sharm.esc(fact.label || "Стиль")}</span><strong>${Sharm.esc(fact.value || "")}</strong></li>`)
        .join("");
      const hours = master.hours
        ? `<li><span>Приём</span><strong>${Sharm.esc(master.hours)}</strong></li>`
        : "";
      return `
        <article class="master-card">
          <div class="master-photo">
            <img src="${Sharm.esc(Sharm.mediaUrl(master.photo_url || "images/team-01.jpg"))}" alt="${Sharm.esc(master.name)}" width="700" height="850" loading="lazy" />
          </div>
          <div class="master-info">
            <span class="meta-label">${Sharm.esc(master.role || "Барбер SHARM")}</span>
            <h3>${Sharm.esc(master.name)}</h3>
            <p>${Sharm.esc(master.bio || "")}</p>
            <ul class="master-facts">${factsHtml}${hours}</ul>
            <div class="master-actions">
              <a class="btn btn-primary" href="#book">Записаться${many ? "" : ` к ${Sharm.esc(master.name)}`}</a>
              ${phone ? `<a class="btn btn-outline" href="${Sharm.phoneHref(phone)}">${Sharm.esc(phone)}</a>` : ""}
            </div>
          </div>
        </article>`;
    })
    .join("");

  if (barberField) {
    if (many) {
      barberField.innerHTML = `
        <label class="full">
          <span>Мастер</span>
          <select name="masterId">
            <option value="any">Любой свободный</option>
            ${masters.map((master) => `<option value="${Sharm.esc(master.id)}">${Sharm.esc(master.name)}</option>`).join("")}
          </select>
        </label>`;
    } else {
      barberField.innerHTML = `<input type="hidden" name="masterId" value="${Sharm.esc(masters[0].id)}" />`;
    }
  }
};

const renderPortfolio = (categories, portfolioItems) => {
  const grid = document.querySelector("#works-grid");
  if (!grid) return;

  const visible = categories.filter(
    (category) => portfolioItems.some((item) => item.category_id === category.id)
  );

  if (!visible.length) {
    grid.innerHTML = "";
    galleries = {};
    setSectionVisible("#works", false);
    return;
  }

  setSectionVisible("#works", true);
  categories = visible;
  const next = {};
  grid.innerHTML = categories
    .map((category) => {
      const photos = portfolioItems
        .filter((item) => item.category_id === category.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const cover = photos.find((item) => item.is_cover) || photos[0];
      next[category.slug] = { title: category.title, images: photos, count: photos.length };
      return `
        <figure class="work-item" data-gallery="${Sharm.esc(category.slug)}" tabindex="0" role="button" aria-label="Открыть примеры: ${Sharm.esc(category.title)}">
          <img src="${Sharm.esc(Sharm.mediaUrl(cover?.thumb_url || cover?.image_url || ""))}" alt="${Sharm.esc(category.title)}" width="640" height="800" loading="lazy" />
          <figcaption><span>${Sharm.esc(category.title)}</span><small>${Sharm.worksLabel(photos.length)}</small></figcaption>
        </figure>`;
    })
    .join("");

  galleries = next;
  bindWorkItems();
};

const renderInterior = (images) => {
  const grid = document.querySelector("#interior-grid");
  if (!grid) return;

  if (!images.length) {
    grid.innerHTML = "";
    setSectionVisible("#interior", false);
    return;
  }

  setSectionVisible("#interior", true);
  const ordered = [...images].sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order);
  grid.innerHTML = ordered
    .map(
      (image, index) => `
      <figure class="${index === 0 ? "interior-main" : ""}">
        <img src="${Sharm.esc(Sharm.mediaUrl(image.image_url))}" alt="${Sharm.esc(image.alt || "Интерьер SHARM")}" loading="lazy" />
      </figure>`
    )
    .join("");
};

const loadSiteContent = async () => {
  const supabase = await Sharm.createClient();
  if (!supabase) return;

  const [settingsRes, servicesRes, mastersRes, catsRes, itemsRes, interiorRes] = await Promise.all([
    supabase.from("site_settings").select("*").limit(1).maybeSingle(),
    supabase.from("services").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("masters").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("portfolio_categories").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("portfolio_items").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("interior_images").select("*").eq("is_active", true).order("sort_order"),
  ]);

  if (settingsRes.error || servicesRes.error || mastersRes.error || catsRes.error || itemsRes.error || interiorRes.error) {
    console.warn("Supabase content fallback active");
    return;
  }

  applySettings(settingsRes.data, mastersRes.data || []);
  renderServices(servicesRes.data || []);
  renderMasters(mastersRes.data || [], settingsRes.data?.phone);
  renderPortfolio(catsRes.data || [], itemsRes.data || []);
  renderInterior(interiorRes.data || []);
  observeReveals();
};

if (form && statusEl) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const serviceId = String(data.get("service") || "").trim();
    const masterId = String(data.get("masterId") || data.get("barber") || "any").trim();
    const comment = String(data.get("comment") || "").trim();
    const website = String(data.get("website") || "").trim();

    if (!name || !phone || !serviceId) {
      statusEl.textContent = "Заполните имя, телефон и услугу.";
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    statusEl.textContent = "Отправляем заявку…";

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          serviceId,
          service: serviceId,
          masterId,
          barber: masterId,
          comment,
          website,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Send failed");
      }

      statusEl.textContent = "Заявка отправлена. Мы скоро свяжемся с вами.";
      form.reset();
    } catch (error) {
      console.error(error);
      statusEl.textContent = "Не удалось отправить. Позвоните нам или попробуйте ещё раз.";
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

loadSiteContent().catch((error) => console.warn(error));
