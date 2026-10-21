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

  /* ---------- Departments: read more ---------- */
  $$(".dept-toggle").forEach((btn) =>
    btn.addEventListener("click", () => {
      const card = btn.closest(".dept-card");
      const open = card.classList.toggle("expanded");
      btn.setAttribute("aria-expanded", String(open));
      btn.firstElementChild.textContent = open ? "Read less" : "Read more";
      btn.querySelector(".icon").style.transform = open ? "rotate(180deg)" : "";
    }),
  );

  /* ---------- Notices: filter, tabs, pagination ---------- */
  const notices = JSON.parse($("#notice-data").textContent);
  const list = $("#notice-list");
  const cards = $$(".notice-item", list);
  const status = $("#result-status");
  const selDept = $("#filter-dept");
  const selCat = $("#filter-cat");
  const inputQ = $("#filter-q");
  const tabBtns = $$("#notice-tabs button");
  const sideCat = $$("[data-side-cat]");
  const sideDept = $$("[data-side-dept]");
  const pageBtns = $$("#pagination [data-page]");
  const PAGES = 3;
  const TOTAL = 28;
  const state = { cat: "", dept: "", q: "", page: 1 };

  function emptyState(kind) {
    const old = $(".empty-state", list);
    if (old) old.remove();
    if (!kind) return;
    const el = document.createElement("div");
    el.className = "empty-state";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><circle cx="10" cy="10" r="7"></circle><path d="m15 15 6 6"></path></svg>' +
      (kind === "none"
        ? "<h3>No results found</h3><p>No notices match the current filters. Try a different keyword, or clear the filters to see every notice.</p>" +
          '<div class="actions"><button class="btn outline" type="button" id="clear-filters">Clear filters</button></div>'
        : "<h3>More notices coming soon</h3><p>Additional notices will appear here as they are published by the Faculty. Return to the first page to see the latest notices.</p>" +
          '<div class="actions"><button class="btn outline" type="button" id="first-page">Back to page 1</button></div>');
    list.append(el);
  }
  function render(focusStatus) {
    const q = state.q.trim().toLowerCase();
    let shown = 0;
    cards.forEach((c) => {
      const ok =
        state.page === 1 &&
        (!state.cat || c.dataset.cat === state.cat) &&
        (!state.dept || c.dataset.dept === state.dept) &&
        (!q || q.split(/\s+/).every((w) => c.dataset.text.includes(w)));
      c.hidden = !ok;
      if (ok) shown++;
    });
    emptyState(state.page > 1 ? "page" : shown ? "" : "none");
    tabBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === state.cat)));
    sideCat.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sideCat === state.cat)));
    sideDept.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sideDept === state.dept)));
    selCat.value = state.cat;
    selDept.value = state.dept;
    pageBtns.forEach((b) => {
      const p = b.dataset.page;
      if (p === "prev") b.disabled = state.page === 1;
      else if (p === "next") b.disabled = state.page === PAGES;
      else if (Number(p) === state.page) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    const filtered = state.cat || state.dept || q;
    status.textContent =
      state.page > 1
        ? "Page " + state.page + " of " + PAGES + " · " + TOTAL + " notices total"
        : filtered
          ? shown + (shown === 1 ? " notice matches" : " notices match") + " your filters on this page · " + TOTAL + " notices total"
          : "Page 1 of " + PAGES + " · " + TOTAL + " notices total";
  }
  tabBtns.forEach((b) =>
    b.addEventListener("click", () => {
      state.cat = b.dataset.cat;
      state.page = 1;
      render();
    }),
  );
  sideCat.forEach((b) =>
    b.addEventListener("click", () => {
      state.cat = state.cat === b.dataset.sideCat ? "" : b.dataset.sideCat;
      state.page = 1;
      render();
    }),
  );
  sideDept.forEach((b) =>
    b.addEventListener("click", () => {
      state.dept = state.dept === b.dataset.sideDept ? "" : b.dataset.sideDept;
      state.page = 1;
      render();
    }),
  );
  selCat.addEventListener("change", () => ((state.cat = selCat.value), (state.page = 1), render()));
  selDept.addEventListener("change", () => ((state.dept = selDept.value), (state.page = 1), render()));
  inputQ.addEventListener("input", () => ((state.q = inputQ.value), (state.page = 1), render()));
  $("#notice-filter").addEventListener("submit", (e) => {
    e.preventDefault();
    state.q = inputQ.value;
    state.page = 1;
    render();
  });
  pageBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const p = b.dataset.page;
      state.page = p === "prev" ? Math.max(1, state.page - 1) : p === "next" ? Math.min(PAGES, state.page + 1) : Number(p);
      render();
      $("#notices .notices-layout").scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    }),
  );
  list.addEventListener("click", (e) => {
    if (e.target.closest("#clear-filters")) {
      state.cat = state.dept = state.q = "";
      inputQ.value = "";
      state.page = 1;
      render();
      inputQ.focus();
    } else if (e.target.closest("#first-page")) {
      state.page = 1;
      render();
      $("[data-page='1']").focus();
    }
    const view = e.target.closest("[data-notice]");
    if (view) {
      const n = notices[Number(view.dataset.notice)];
      openDialog(
        n.title,
        '<p class="meta" style="margin-bottom:12px">' +
          escapeHTML(n.day + " " + n.mon) +
          " · " +
          escapeHTML(n.cat) +
          " · " +
          escapeHTML(n.dept) +
          "</p><p><strong>Issued by:</strong> " +
          escapeHTML(n.by) +
          "</p><p>" +
          escapeHTML(n.desc) +
          '</p><p>The full notice (PDF) will be available here once uploaded. For clarifications, contact <a href="mailto:fmgt@uwu.ac.lk">fmgt@uwu.ac.lk</a>.</p>',
      );
    }
  });
  render();

  /* ---------- Subscribe form (no backend: validates and explains) ---------- */
  const sub = $("#subscribe-form");
  sub.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#sub-email");
    const err = $("#sub-email-error");
    const st = $("#subscribe-status");
    const valid = email.checkValidity() && email.value.trim() !== "";
    email.setAttribute("aria-invalid", String(!valid));
    err.hidden = valid;
    err.textContent = valid ? "" : email.value ? "Enter a valid email address." : "Please complete this field.";
    st.hidden = false;
    st.className = "alert " + (valid ? "info" : "error");
    st.textContent = valid
      ? "Thank you. Email subscriptions are not connected yet; please contact fmgt@uwu.ac.lk to receive notices."
      : "Please correct the highlighted field.";
    if (!valid) email.focus();
  });

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
    $$(".content-section > .container, .cta-band > .container").forEach((n) => io.observe(n));
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
})();
