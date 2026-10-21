"use strict";
/* Academic page behaviour: departments and notices. Shared header/nav/dialog code lives in site.js. */
(function () {
  const { $, $$, reduced, escapeHTML, openDialog } = window.FOM;
  const dialog = $("#information-dialog");
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

})();
