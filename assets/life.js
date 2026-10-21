"use strict";
/* Life at FOM page behaviour: activity filters, club read-more, sidebar, gallery lightbox. Shared code lives in site.js. */
(function () {
  const { $, $$, reduced, escapeHTML, openDialog } = window.FOM;

  /* ---------- Activities: featured vs all, sidebar filters ---------- */
  const cards = $$("#activity-grid .activity-card");
  const allBtn = $("#all-activities");
  const note = $("#activity-note");
  const state = { all: false, filter: "" };
  let onActivities = () => {};
  const FILTERS = {
    annual: { label: "Annual Events", test: (c) => c.dataset.group === "Annual Event" },
    workshop: { label: "Workshops & Seminars", test: (c) => c.dataset.group === "Workshop" },
    sports: { label: "Sports Events", test: (c) => c.dataset.tag.includes("sports") },
  };
  function renderActivities() {
    const f = FILTERS[state.filter];
    let shown = 0;
    cards.forEach((c) => {
      const ok = f ? f.test(c) : state.all || c.dataset.featured === "1";
      c.hidden = !ok;
      if (ok) shown++;
    });
    allBtn.setAttribute("aria-pressed", String(state.all && !f));
    allBtn.firstChild.textContent = state.all && !f ? "Show featured " : "All activities ";
    note.hidden = !f;
    if (f) note.textContent = "Showing " + shown + (shown === 1 ? " activity" : " activities") + " in " + f.label + ".";
    onActivities();
  }
  allBtn.addEventListener("click", () => {
    manual = null;
    state.filter = "";
    state.all = !state.all;
    renderActivities();
  });
  $$("[data-filter]").forEach((a) =>
    a.addEventListener("click", () => {
      const k = a.dataset.filter;
      state.filter = k === "all" ? "" : k;
      if (k === "all") state.all = false;
      renderActivities();
    }),
  );
  renderActivities();

  /* ---------- Clubs: read more ---------- */
  $$(".club-toggle").forEach((btn) =>
    btn.addEventListener("click", () => {
      const card = btn.closest(".club-card");
      const open = card.classList.toggle("expanded");
      btn.setAttribute("aria-expanded", String(open));
      btn.firstElementChild.textContent = open ? "Read less" : "Read more";
    }),
  );

  /* ---------- Sidebar: mobile toggle, click-to-activate, scroll-spy ---------- */
  const toggle = $(".side-toggle");
  const menu = $("#side-menu");
  const box = $(".side-sticky");
  const clubsNote = $("#clubs-note");
  const sideLinks = $$("a", menu);
  const targetOf = (a) => document.getElementById(a.getAttribute("href").slice(1));
  const isMobileSide = () => matchMedia("(max-width: 1099px)").matches;
  let manual = null;
  let lockUntil = 0;

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("open", open);
  });

  function filterLink() {
    return sideLinks.find((a) => a.dataset.filter === (state.filter || "all"));
  }
  function keepInView(a) {
    if (isMobileSide()) return;
    const r = a.getBoundingClientRect(),
      b = box.getBoundingClientRect();
    if (r.top < b.top + 8) box.scrollTop -= b.top + 8 - r.top;
    else if (r.bottom > b.bottom - 8) box.scrollTop += r.bottom - (b.bottom - 8);
  }
  function paint(active) {
    sideLinks.forEach((a) => {
      const on = a === active;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
    if (active) keepInView(active);
  }
  function compute() {
    const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scroll-pad") || "200");
    const line = pad + 40;
    if (manual) {
      const r = targetOf(manual).getBoundingClientRect();
      if (performance.now() < lockUntil || (r.bottom > pad && r.top < innerHeight * 0.6)) return manual;
      manual = null;
    }
    let cur = null;
    sideLinks.forEach((a) => {
      const t = targetOf(a);
      if (t && t.getBoundingClientRect().top <= line) cur = t;
    });
    if (!cur) return filterLink();
    if (cur.id === "activities") return filterLink();
    return sideLinks.find((a) => targetOf(a) === cur && !a.dataset.filter && !a.dataset.club) || null;
  }
  const refresh = () => paint(compute());
  onActivities = refresh;

  menu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    manual = a;
    lockUntil = performance.now() + 1200;
    if (clubsNote) {
      const missing = a.dataset.club && !a.dataset.hasCard;
      clubsNote.hidden = !missing;
      if (missing) clubsNote.textContent = a.dataset.club + " details will be added soon.";
    }
    const t = targetOf(a);
    if (t && t.matches("article")) {
      t.classList.remove("highlight");
      void t.offsetWidth;
      t.classList.add("highlight");
      setTimeout(() => t.classList.remove("highlight"), 2200);
    }
    paint(a);
    if (isMobileSide()) {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("open");
    }
  });
  let q = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!q) {
        q = true;
        requestAnimationFrame(() => ((q = false), refresh()));
      }
    },
    { passive: true },
  );
  refresh();

  /* ---------- Gallery lightbox ---------- */
  $$(".gallery-tile").forEach((b) =>
    b.addEventListener("click", () =>
      openDialog("Photo gallery", '<img class="lightbox-img" src="' + escapeHTML(b.dataset.full) + '" alt="' + escapeHTML(b.dataset.alt) + '" /><p style="margin-top:16px">' + escapeHTML(b.dataset.alt) + "</p>"),
    ),
  );
})();
