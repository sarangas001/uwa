"use strict";
/* Academic page behaviour: header/nav, sticky tabs, departments, notices, dialogs, search. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileMedia = matchMedia("(max-width: 767px)");
  const escapeHTML = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ---------- Dialog ---------- */
  const dialog = $("#information-dialog");
  const dialogTitle = $("#dialog-title");
  const dialogBody = $("#dialog-body");
  function openDialog(title, body) {
    dialogTitle.textContent = title;
    dialogBody.innerHTML = body;
    if (!dialog.open) dialog.showModal();
    dialogBody.scrollTop = 0;
  }
  $("#close-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  /* Items without a supplied file / route / date explain themselves instead of leading nowhere. */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-pending]");
    if (!el) return;
    e.preventDefault();
    openDialog(
      "Coming soon",
      "<p><strong>" +
        escapeHTML(el.dataset.pending) +
        "</strong> is not available yet. It will be linked here as soon as the Faculty supplies the final file or page.</p>" +
        '<p>For urgent requests, contact the Faculty at <a href="mailto:fmgt@uwu.ac.lk">fmgt@uwu.ac.lk</a>.</p>',
    );
  });

  /* ---------- Header shrink + sticky offsets ---------- */
  const root = document.documentElement;
  const header = $(".identity");
  const mainNav = $("#navigation");
  const tabs = $("#page-tabs");
  function measure() {
    const navH = mobileMedia.matches ? 0 : mainNav.offsetHeight;
    root.style.setProperty("--stack-top", header.offsetHeight + navH + "px");
    root.style.setProperty("--scroll-pad", header.offsetHeight + navH + tabs.offsetHeight + 16 + "px");
  }
  let queued = false;
  function onScroll() {
    root.classList.toggle("is-scrolled", !mobileMedia.matches && window.scrollY > 80);
    queued = false;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();
  /* Re-measure while the 0.3s height transition runs, then keep stable. */
  const ro = "ResizeObserver" in window ? new ResizeObserver(measure) : null;
  ro && [header, mainNav, tabs.firstElementChild].forEach((n) => ro.observe(n));
  window.addEventListener("resize", measure);
  measure();

  /* ---------- Mobile navigation ---------- */
  const toggle = $(".menu-toggle");
  const backdrop = $("#nav-backdrop");
  const searchForm = $(".search");
  const headerContainer = header.querySelector(".container");
  const navContainer = mainNav.querySelector(".container");
  function inertOthers(on) {
    ["main", ".footer", ".utility"].forEach((s) => {
      const n = $(s);
      if (n) n.inert = on;
    });
  }
  function closeMobileNav(restore = true) {
    mainNav.classList.remove("mobile-open");
    header.classList.remove("mobile-open");
    backdrop.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    $$(".nav-item").forEach((d) => (d.open = false));
    inertOthers(false);
    if (restore && mobileMedia.matches) toggle.focus();
  }
  function syncSearchPosition() {
    if (mobileMedia.matches) navContainer.prepend(searchForm);
    else {
      headerContainer.append(searchForm);
      closeMobileNav(false);
    }
    measure();
  }
  mobileMedia.addEventListener("change", syncSearchPosition);
  syncSearchPosition();
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    if (!open) return closeMobileNav();
    mainNav.classList.add("mobile-open");
    header.classList.add("mobile-open");
    backdrop.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation");
    inertOthers(true);
    $("#close-navigation").focus();
  });
  $("#close-navigation").addEventListener("click", () => closeMobileNav());
  backdrop.addEventListener("click", () => closeMobileNav());
  $$(".nav-item").forEach((item) =>
    item.addEventListener("toggle", () => {
      if (item.open) $$(".nav-item").forEach((o) => o !== item && (o.open = false));
    }),
  );
  $$(".navigation a").forEach((a) =>
    a.addEventListener("click", () => {
      $$(".nav-item").forEach((d) => (d.open = false));
      if (mainNav.classList.contains("mobile-open")) closeMobileNav(false);
    }),
  );
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-item")) $$(".nav-item").forEach((d) => (d.open = false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openItem = $$(".nav-item").find((d) => d.open);
      $$(".nav-item").forEach((d) => (d.open = false));
      if (openItem) openItem.querySelector("summary").focus();
      else if (mainNav.classList.contains("mobile-open")) closeMobileNav();
    }
    if (e.key === "Tab" && mainNav.classList.contains("mobile-open")) {
      const f = $$("a,button,input,summary", mainNav).filter((n) => n.offsetParent !== null);
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
    }
  });

  /* ---------- Sticky tabs: scroll-spy ---------- */
  const tabLinks = $$("a", tabs);
  const sections = tabLinks.map((a) => $(a.getAttribute("href")));
  function setActive(id) {
    tabLinks.forEach((a) => {
      const on = a.getAttribute("href") === "#" + id;
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
      if (on && tabs.firstElementChild.scrollWidth > tabs.firstElementChild.clientWidth)
        tabs.firstElementChild.scrollTo({ left: a.offsetLeft - 16, behavior: reduced() ? "auto" : "smooth" });
    });
  }
  function spy() {
    const line = parseFloat(getComputedStyle(root).getPropertyValue("--stack-top")) + tabs.offsetHeight + 40;
    let current = sections[0];
    sections.forEach((s) => {
      if (s.getBoundingClientRect().top <= line) current = s;
    });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = sections[sections.length - 1];
    setActive(current.id);
  }
  let spyQueued = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!spyQueued) {
        spyQueued = true;
        requestAnimationFrame(() => ((spyQueued = false), spy()));
      }
    },
    { passive: true },
  );
  spy();
  tabLinks.forEach((a) => a.addEventListener("click", () => setActive(a.getAttribute("href").slice(1))));

  /* ---------- Header search across this page ---------- */
  function searchEntries() {
    const seen = new Set();
    return $$("[data-search]")
      .filter((n) => !seen.has(n.dataset.search) && seen.add(n.dataset.search))
      .map((n) => ({
        node: n,
        title: n.dataset.search,
        text: n.textContent.toLowerCase() + " " + n.dataset.search.toLowerCase(),
        section: n.closest("section[id]")?.querySelector("h2")?.textContent || "Academic",
      }));
  }
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#site-search").value.trim().toLowerCase();
    if (!q) return;
    if (mobileMedia.matches) closeMobileNav(false);
    const words = q.split(/\s+/);
    const hits = searchEntries().filter((x) => words.every((w) => x.text.includes(w)));
    openDialog(
      "Search results",
      hits.length
        ? '<p class="search-summary">' +
            hits.length +
            (hits.length === 1 ? " result" : " results") +
            " for “" +
            escapeHTML(q) +
            "”</p>" +
            hits
              .map(
                (h, i) =>
                  '<button class="search-result" type="button" data-hit="' +
                  i +
                  '">' +
                  escapeHTML(h.title) +
                  '<br><small style="color:var(--muted)">' +
                  escapeHTML(h.section) +
                  "</small></button>",
              )
              .join("")
        : '<div class="empty-state"><svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><circle cx="10" cy="10" r="7"></circle><path d="m15 15 6 6"></path></svg><h3>No results found</h3><p>Nothing on this page matches “' +
          escapeHTML(q) +
          "”. Try “management”, “tourism”, “examination” or “board”.</p></div>",
    );
    $$("[data-hit]", dialogBody).forEach((b) =>
      b.addEventListener("click", () => {
        dialog.close();
        const n = hits[Number(b.dataset.hit)].node;
        n.hidden && (n.hidden = false);
        n.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
        n.classList.add("highlight");
        setTimeout(() => n.classList.remove("highlight"), 2500);
      }),
    );
  });

  /* ---------- Fade-up on scroll (content stays visible without JS) ---------- */
  if ("IntersectionObserver" in window && !reduced()) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("reveal-ready");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.06 },
    );
    $$(".content-section > .container, .cta-band > .container, .life-section, .cta-card").forEach((n) => io.observe(n));
  }

  /* ---------- Optional production announcement banner (brand kit §21) ---------- */
  window.setFacultyAnnouncement = function ({ text, kind = "general", id = "" }) {
    const banner = $("#faculty-announcement");
    if (!text) {
      banner.hidden = true;
      return;
    }
    const critical = kind === "urgent";
    banner.className = "announcement " + (["general", "urgent", "information"].includes(kind) ? kind : "general");
    banner.querySelector("p").textContent = text;
    banner.setAttribute("role", critical ? "alert" : "status");
    banner.querySelector("button").hidden = critical;
    banner.hidden = false;
    const key = "fom-notice-" + id;
    try {
      if (id && !critical && sessionStorage.getItem(key)) banner.hidden = true;
    } catch {}
    banner.querySelector("button").onclick = () => {
      banner.hidden = true;
      try {
        if (id) sessionStorage.setItem(key, "dismissed");
      } catch {}
      measure();
    };
    measure();
  };
  window.FOM = { $, $$, reduced, escapeHTML, openDialog, measure, closeMobileNav, mobileMedia };
})();
