"use strict";
/* Contact page behaviour: form validation (no backend), FAQ expand-all. Shared code lives in site.js. */
(function () {
  const { $, $$ } = window.FOM;
  const form = $("#contact-form-el");
  const status = $("#form-status");
  const message = $("#message");
  const count = $("#message-count");
  const required = $$("[required]", form);

  function errorFor(field) {
    if (field.type === "checkbox") return field.checked ? "" : "Please agree to continue.";
    if (!field.value.trim()) return "Please complete this field.";
    if (field.type === "email" && !field.checkValidity()) return "Enter a valid email address.";
    return "";
  }
  function show(field) {
    const msg = errorFor(field);
    const el = $("#" + field.id + "-error");
    field.setAttribute("aria-invalid", String(!!msg));
    if (el) {
      el.hidden = !msg;
      el.textContent = msg;
    }
    return msg;
  }
  required.forEach((f) => f.addEventListener("blur", () => show(f)));
  required.forEach((f) =>
    f.addEventListener(f.tagName === "SELECT" || f.type === "checkbox" ? "change" : "input", () => {
      if (f.getAttribute("aria-invalid") === "true") show(f);
    }),
  );
  message.addEventListener("input", () => {
    count.textContent = message.value.length ? message.value.length + " / 1000 characters" : "Maximum 1000 characters";
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let first = null;
    required.forEach((f) => {
      if (show(f) && !first) first = f;
    });
    status.hidden = false;
    status.className = "alert " + (first ? "error" : "info");
    status.textContent = first
      ? "Please correct the highlighted fields."
      : "Thank you. Online submission is not connected yet, so your message has not been sent. Please email fmgt@uwu.ac.lk or call +94 55 355 3029.";
    if (first) first.focus();
    else status.scrollIntoView({ block: "center", behavior: window.FOM.reduced() ? "auto" : "smooth" });
  });
  $("#clear-form").addEventListener("click", () => {
    setTimeout(() => {
      required.forEach((f) => {
        f.removeAttribute("aria-invalid");
        const el = $("#" + f.id + "-error");
        if (el) el.hidden = true;
      });
      status.hidden = true;
      count.textContent = "Maximum 1000 characters";
    });
  });

  /* FAQ: first five shown, "View All FAQs" reveals the rest. */
  const more = $("#faq-more");
  const extra = $$(".faq-extra");
  more.addEventListener("click", () => {
    const open = more.getAttribute("aria-expanded") !== "true";
    extra.forEach((d) => (d.hidden = !open));
    more.setAttribute("aria-expanded", String(open));
    more.firstElementChild.textContent = open ? "Show fewer FAQs" : "View All FAQs";
  });
  /* Search jump should reveal a hidden FAQ first. */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-hit]") && extra.some((d) => d.hidden)) {
      extra.forEach((d) => (d.hidden = false));
      more.setAttribute("aria-expanded", "true");
      more.firstElementChild.textContent = "Show fewer FAQs";
    }
  });
})();
