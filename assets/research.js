"use strict";
/* Research page behaviour: publication filters/sort/pagination, conference tabs and read-more. Shared code lives in site.js. */
(function () {
  const { $, $$ } = window.FOM;

  /* ---------- Publications ---------- */
  const list = $("#pub-list");
  const cards = $$(".pub-card", list);
  const f = { type: $("#f-type"), dept: $("#f-dept"), year: $("#f-year"), q: $("#f-q"), sort: $("#f-sort") };
  const count = $("#pub-count");
  const status = $("#pub-status");
  const pageBtns = $$("#pub-pages [data-page]");
  const PAGES = 30;
  const state = { page: 1 };

  function emptyState(kind) {
    $(".empty-state", list)?.remove();
    if (!kind) return;
    const el = document.createElement("div");
    el.className = "empty-state";
    el.setAttribute("role", "status");
    el.innerHTML =
      '<svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><circle cx="10" cy="10" r="7"></circle><path d="m15 15 6 6"></path></svg>' +
      (kind === "none"
        ? '<h3>No results found</h3><p>No publications match the current filters. Try a different keyword, or clear the filters.</p><div class="actions"><button class="btn outline" type="button" id="pub-clear">Clear filters</button></div>'
        : '<h3>More publications coming soon</h3><p>Additional publications will appear here as they are added to the repository. Return to the first page to see the latest.</p><div class="actions"><button class="btn outline" type="button" id="pub-first">Back to page 1</button></div>');
    list.append(el);
  }
  function render() {
    const q = f.q.value.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    const order = cards.slice();
    if (f.sort.value === "Title A–Z") order.sort((a, b) => a.dataset.title.localeCompare(b.dataset.title));
    else order.sort((a, b) => b.dataset.year - a.dataset.year || a.dataset.i - b.dataset.i);
    order.forEach((c) => list.append(c));
    let shown = 0;
    cards.forEach((c) => {
      const ok =
        state.page === 1 &&
        (!f.type.value || c.dataset.type === f.type.value) &&
        (!f.dept.value || c.dataset.dept === f.dept.value) &&
        (!f.year.value || c.dataset.year === f.year.value) &&
        words.every((w) => c.dataset.title.includes(w) || c.dataset.type.toLowerCase().includes(w) || c.dataset.dept.toLowerCase().includes(w));
      c.hidden = !ok;
      if (ok) shown++;
    });
    const filtered = f.type.value || f.dept.value || f.year.value || q;
    emptyState(state.page > 1 ? "page" : shown ? "" : "none");
    count.innerHTML =
      state.page > 1
        ? "Showing <strong>results on page " + state.page + "</strong> of <strong>150+</strong>"
        : filtered
          ? "Showing <strong>" + shown + "</strong> matching " + (shown === 1 ? "result" : "results") + " on this page"
          : "Showing <strong>1–5</strong> of <strong>150+</strong> results";
    status.textContent = "Page " + state.page + " of " + PAGES + " · 150+ publications total";
    pageBtns.forEach((b) => {
      const p = b.dataset.page;
      if (p === "prev") b.disabled = state.page === 1;
      else if (p === "next") b.disabled = state.page === PAGES;
      else if (Number(p) === state.page) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
  }
  ["type", "dept", "year", "sort"].forEach((k) => f[k].addEventListener("change", () => ((state.page = 1), render())));
  f.q.addEventListener("input", () => ((state.page = 1), render()));
  $("#pub-filter").addEventListener("submit", (e) => (e.preventDefault(), (state.page = 1), render()));
  pageBtns.forEach((b) =>
    b.addEventListener("click", () => {
      const p = b.dataset.page;
      state.page = p === "prev" ? Math.max(1, state.page - 1) : p === "next" ? Math.min(PAGES, state.page + 1) : Number(p);
      render();
      $("#publications .pub-toolbar").scrollIntoView({ behavior: window.FOM.reduced() ? "auto" : "smooth", block: "start" });
    }),
  );
  list.addEventListener("click", (e) => {
    if (e.target.closest("#pub-clear")) {
      f.type.value = f.dept.value = f.year.value = f.q.value = "";
      state.page = 1;
      render();
      f.q.focus();
    } else if (e.target.closest("#pub-first")) {
      state.page = 1;
      render();
      $("[data-page='1']").focus();
    }
  });
  render();

  /* ---------- Conferences ---------- */
  const grid = $("#conf-grid");
  const confs = $$(".conf-card", grid);
  const tabs = $$("#conf-tabs button");
  function renderConfs(statusFilter) {
    let shown = 0;
    confs.forEach((c) => {
      const ok = !statusFilter || c.dataset.status === statusFilter;
      c.hidden = !ok;
      if (ok) shown++;
    });
    tabs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.status === statusFilter)));
    $(".conf-empty", grid)?.remove();
    if (!shown) {
      const el = document.createElement("div");
      el.className = "empty-state conf-empty";
      el.setAttribute("role", "status");
      el.innerHTML =
        '<svg aria-hidden="true" class="icon" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 10h18M8 3v4M16 3v4"></path></svg><h3>No upcoming conferences</h3><p>New conferences will be announced here. Switch to Past or All to see earlier events.</p>';
      grid.append(el);
    }
  }
  tabs.forEach((b) => b.addEventListener("click", () => renderConfs(b.dataset.status)));
  $$(".conf-toggle").forEach((btn) =>
    btn.addEventListener("click", () => {
      const card = btn.closest(".conf-card");
      const open = card.classList.toggle("expanded");
      btn.setAttribute("aria-expanded", String(open));
      btn.firstElementChild.textContent = open ? "Read less" : "Read more";
    }),
  );
})();
