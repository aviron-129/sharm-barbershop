const header = document.querySelector(".site-header");
const nav = document.querySelector("#site-nav");
const toggle = document.querySelector(".nav-toggle");
const form = document.querySelector("#book-form");
const statusEl = document.querySelector("#form-status");
const yearEl = document.querySelector("#year");

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

const revealTargets = document.querySelectorAll(
  ".section-head, .price-list, .works-grid, .team-grid, .interior-grid, .book-form, .contact-layout, .about-meta"
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

if (form && statusEl) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const service = String(data.get("service") || "").trim();

    if (!name || !phone || !service) {
      statusEl.textContent = "Заполните имя, телефон и услугу.";
      return;
    }

    // Placeholder until Telegram bot webhook is connected.
    console.info("Booking request (pending Telegram):", Object.fromEntries(data.entries()));
    statusEl.textContent = "Заявка принята. Скоро подключим Telegram — пока сохраняем локально.";
    form.reset();
  });
}
