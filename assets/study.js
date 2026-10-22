"use strict";
/* Study page behaviour: sidebar (mobile toggle, click-to-activate, scroll-spy). Shared code lives in site.js. */
(function () {
  const { $, $$ } = window.FOM;
  const toggle = $(".side-toggle");
  const menu = $("#side-menu");
  const box = $(".side-sticky");
  const links = $$("a", menu);
  const local = links.filter((a) => a.getAttribute("href").startsWith("#"));
  const targetOf = (a) => document.getElementById(a.getAttribute("href").slice(1));
  const isMobileSide = () => matchMedia("(max-width: 1099px)").matches;
  let manual = null;
  let lockUntil = 0;

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("open", open);
  });
  function keepInView(a) {
    if (isMobileSide()) return;
    const r = a.getBoundingClientRect(),
      b = box.getBoundingClientRect();
    if (r.top < b.top + 8) box.scrollTop -= b.top + 8 - r.top;
    else if (r.bottom > b.bottom - 8) box.scrollTop += r.bottom - (b.bottom - 8);
  }
  function paint(active) {
    links.forEach((a) => {
      const on = a === active;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
    if (active) keepInView(active);
  }
  function compute() {
    const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scroll-pad") || "200");
    if (manual) {
      const r = targetOf(manual).getBoundingClientRect();
      if (performance.now() < lockUntil || (r.bottom > pad && r.top < innerHeight * 0.6)) return manual;
      manual = null;
    }
    const line = pad + 40;
    let cur = null;
    local.forEach((a) => {
      const t = targetOf(a);
      if (t && t.getBoundingClientRect().top <= line) cur = a;
    });
    // A section heading that has just been reached (before its first sidebar target) highlights that section's first link.
    let sec = null;
    $$(".life-section").forEach((el) => {
      if (el.getBoundingClientRect().top <= line) sec = el;
    });
    if (sec && (!cur || !sec.contains(targetOf(cur)))) {
      const first = local.find((a) => sec.contains(targetOf(a)));
      if (first) return first;
    }
    return cur || local[0];
  }
  const refresh = () => paint(compute());
  menu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    if (a.getAttribute("href").startsWith("#")) {
      manual = a;
      lockUntil = performance.now() + 1200;
      paint(a);
      const t = targetOf(a);
      if (t && t.matches("article")) {
        t.classList.remove("highlight");
        void t.offsetWidth;
        t.classList.add("highlight");
        setTimeout(() => t.classList.remove("highlight"), 2200);
      }
    }
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
})();
