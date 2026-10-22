"use strict";
/* Downloads page behaviour: search, category/type/year filters and category tabs. Shared code lives in site.js. */
(function () {
  const { $, $$, reduced } = window.FOM;
  const items = $$("[data-item]");
  const sections = $$("[data-cat-section]");
  const tabs = $$("#dl-tabs button");
  const q = $("#dl-q");
  const selCat = $("#dl-cat");
  const selType = $("#dl-type");
  const selYear = $("#dl-year");
  const status = $("#dl-status");
  const empty = $("#dl-empty");
  const recent = $("#recent");
  const state = { cat: "" };

  function render() {
    const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const type = selType.value;
    const year = selYear.value;
    const filtering = words.length || type || year;
    let total = 0;
    items.forEach((el) => {
      const ok =
        (!state.cat || el.dataset.cat === state.cat) &&
        (!type || el.dataset.type === type) &&
        (!year || el.dataset.year === year) &&
        words.every((w) => el.dataset.text.includes(w));
      el.hidden = !ok;
      if (ok) total++;
    });
    sections.forEach((s) => {
      const any = $$("[data-item]", s).some((el) => !el.hidden);
      s.hidden = !any;
    });
    tabs.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tab === state.cat)));
    selCat.value = state.cat;
    recent.hidden = !!(state.cat || filtering);
    empty.hidden = total > 0;
    status.hidden = !(filtering || state.cat) || total === 0;
    status.textContent = total + (total === 1 ? " document" : " documents") + " shown · 60+ documents in the full repository";
  }
  tabs.forEach((b) =>
    b.addEventListener("click", () => {
      state.cat = b.dataset.tab;
      render();
      const target = state.cat ? $("#" + state.cat) : $(".dl-body");
      if (target && !target.hidden) {
        const top = target.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scroll-pad") || "160");
        scrollTo({ top: Math.max(0, top), behavior: reduced() ? "auto" : "smooth" });
      }
    }),
  );
  selCat.addEventListener("change", () => ((state.cat = selCat.value), render()));
  selType.addEventListener("change", render);
  selYear.addEventListener("change", render);
  q.addEventListener("input", render);
  $("#dl-filter").addEventListener("submit", (e) => {
    e.preventDefault();
    render();
  });
  function reset() {
    q.value = "";
    state.cat = "";
    setTimeout(() => {
      selType.value = selYear.value = "";
      render();
    });
  }
  $("#dl-reset").addEventListener("click", reset);
  $("#dl-clear").addEventListener("click", () => {
    q.value = selType.value = selYear.value = "";
    state.cat = "";
    render();
    q.focus();
  });
  render();
})();
