"use strict";
/* Life at FOM page behaviour: activity filters, club read-more, sidebar, gallery lightbox. Shared code lives in site.js. */
(function () {
  const { $, $$, reduced, escapeHTML, openDialog } = window.FOM;

  /* ---------- Activities: featured vs all, sidebar filters ---------- */
  const cards = $$("#activity-grid .activity-card");
  const allBtn = $("#all-activities");
  const note = $("#activity-note");
  const state = { all: false, filter: "" };
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
    $$("[data-filter]").forEach((a) => {
      const on = a.dataset.filter === (state.filter || "all");
      a.classList.toggle("is-filter-on", on);
    });
  }
  allBtn.addEventListener("click", () => {
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

  /* ---------- Sidebar: mobile toggle + scroll-spy ---------- */
  const toggle = $(".side-toggle");
  const menu = $("#side-menu");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("open", open);
  });
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a") && matchMedia("(max-width: 1099px)").matches) {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("open");
    }
  });
  const links = $$("a[href^='#']", menu).filter((a) => !a.dataset.filter || a.dataset.filter === "all");
  const targets = links.map((a) => document.getElementById(a.getAttribute("href").slice(1)));
  function spy() {
    const line = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scroll-pad") || "200") + 40;
    let cur = -1;
    targets.forEach((t, i) => {
      if (t && t.getBoundingClientRect().top <= line) cur = i;
    });
    links.forEach((a, i) => {
      a.classList.toggle("active", i === cur);
      if (i === cur) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }
  let q = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!q) {
        q = true;
        requestAnimationFrame(() => ((q = false), spy()));
      }
    },
    { passive: true },
  );
  spy();

  /* ---------- Gallery lightbox ---------- */
  $$(".gallery-tile").forEach((b) =>
    b.addEventListener("click", () =>
      openDialog("Photo gallery", '<img class="lightbox-img" src="' + escapeHTML(b.dataset.full) + '" alt="' + escapeHTML(b.dataset.alt) + '" /><p style="margin-top:16px">' + escapeHTML(b.dataset.alt) + "</p>"),
    ),
  );
})();
