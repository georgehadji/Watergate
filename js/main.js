(function () {
  "use strict";

  // ---------- Mobile navigation ----------
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    function closeNav(returnFocus) {
      if (!nav.classList.contains("is-open")) return;
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus) toggle.focus();
    }
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav(false);
    });
    // Escape closes the menu; tabbing out of the open menu closes it too.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav(true);
    });
    nav.addEventListener("focusout", function (e) {
      if (e.relatedTarget && !nav.contains(e.relatedTarget) && e.relatedTarget !== toggle) closeNav(false);
    });
  }

  // ---------- Header shadow once the page has scrolled ----------
  // A sentinel at the top of the page replaces a scroll listener: no work per scroll frame.
  var header = document.querySelector(".site-header");
  if (header && "IntersectionObserver" in window) {
    var sentinel = document.createElement("div");
    sentinel.className = "scroll-sentinel";
    sentinel.setAttribute("aria-hidden", "true");
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      header.classList.toggle("is-scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  // ---------- Product filter (by type of space) ----------
  var tabs = document.querySelectorAll(".filter-tabs .tab");
  var products = document.querySelectorAll(".product");
  // Screen readers hear how many products the filter left visible.
  var filterStatus = null;
  var tabGroup = document.querySelector(".filter-tabs");
  if (tabGroup) {
    filterStatus = document.createElement("p");
    filterStatus.className = "sr-only";
    filterStatus.setAttribute("role", "status");
    tabGroup.after(filterStatus);
  }
  function applyFilter(filter) {
    var label = "";
    tabs.forEach(function (t) {
      var active = t.dataset.filter === filter;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-pressed", String(active));
      if (active) label = t.textContent.trim();
    });
    var shown = 0;
    products.forEach(function (p) {
      p.hidden = !(filter === "all" || p.dataset.cat.split(" ").indexOf(filter) !== -1);
      if (!p.hidden) shown++;
    });
    if (filterStatus) {
      filterStatus.textContent = shown + (shown === 1 ? " προϊόν" : " προϊόντα") +
        (filter === "all" ? " συνολικά." : " για: " + label + ".");
    }
  }
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () { applyFilter(tab.dataset.filter); });
  });

  // "Δείτε τα προϊόντα για …" links in the solutions section pre-filter the products
  // and pre-select the type of space in the contact form.
  var spaceSelect = document.getElementById("space-select");
  var spaceByFilter = { home: 0, cafe: 1, horeca: 2, office: 3 };
  document.querySelectorAll("[data-show]").forEach(function (link) {
    link.addEventListener("click", function () {
      applyFilter(link.dataset.show);
      if (spaceSelect && link.dataset.show in spaceByFilter) spaceSelect.selectedIndex = spaceByFilter[link.dataset.show];
    });
  });

  // ---------- Product "Ζητήστε δωρεάν συμβουλή" buttons preselect the product in the form ----------
  var select = document.getElementById("product-select");
  document.querySelectorAll("[data-product]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!select) return;
      var wanted = btn.dataset.product;
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].text === wanted) { select.selectedIndex = i; break; }
      }
    });
  });

  // ---------- Savings calculator ----------
  var fmt = new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var fmtInt = new Intl.NumberFormat("el-GR", { maximumFractionDigits: 0 });
  function num(id) {
    var v = parseFloat(String(document.getElementById(id).value).replace(",", "."));
    return isFinite(v) && v >= 0 ? v : 0;
  }
  function calc() {
    var litersYear = num("c-people") * num("c-liters") * 365;
    var bottled = litersYear * num("c-bottle");
    var filter = num("c-filter");
    var save = bottled - filter;
    document.getElementById("r-bottled").textContent = fmt.format(bottled);
    document.getElementById("r-filter").textContent = fmt.format(filter);
    document.getElementById("r-save").textContent = fmt.format(Math.max(save, 0));
    document.getElementById("r-bottles").textContent = fmtInt.format(litersYear / 1.5);
  }
  var calcForm = document.getElementById("calc");
  if (calcForm) {
    calcForm.addEventListener("input", calc);
    calcForm.addEventListener("submit", function (e) { e.preventDefault(); });
    calc();
  }

  // ---------- Contact form ----------
  // If a real Formspree endpoint is set in the form's action, submit via fetch.
  // Otherwise fall back to opening the visitor's email client with the details filled in.
  var form = document.getElementById("contact-form");
  var status = document.getElementById("form-status");
  function setStatus(msg, kind) {
    status.textContent = msg;
    status.className = "form-status" + (kind ? " " + kind : "");
  }
  // Anti-spam and input hygiene. This only stops bots that use the page: anything posting
  // straight to Formspree skips it, so keep Formspree's own spam filter switched on too.
  var MIN_FILL_MS = 3000;          // people need longer than this to fill the form
  var RESEND_COOLDOWN_MS = 60000;  // one request per minute from the same browser tab
  var REQUEST_TIMEOUT_MS = 15000;
  var SENT_KEY = "waterwal-form-sent";
  var THANKS = "Ευχαριστούμε! Λάβαμε το αίτημά σας και θα επικοινωνήσουμε σύντομα μαζί σας.";
  var FAILED = "Κάτι πήγε στραβά. Δοκιμάστε ξανά ή καλέστε μας στο τηλέφωνο.";
  var EMAIL_RE = /^[^\s@<>()"',;:?&=]+@[^\s@<>()"',;:?&=]+\.[a-z]{2,}$/i;
  var formShownAt = Date.now();

  // Control characters, plus invisible and bidirectional formatting characters used to
  // hide or spoof text. Line breaks and tabs survive only in the message.
  var UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
  function clean(value, multiline) {
    var v = String(value).replace(UNSAFE_CHARS, "");
    if (!multiline) v = v.replace(/[\r\n\t]+/g, " ");
    return v.trim();
  }
  function cleanData(source) {
    var out = new FormData();
    source.forEach(function (value, key) {
      if (key === "website") return; // our own honeypot, never sent
      out.append(key, clean(value, key === "message"));
    });
    return out;
  }
  function isBot() {
    var trapped = form.elements._gotcha.value || (form.elements.website && form.elements.website.value);
    return Boolean(trapped) || Date.now() - formShownAt < MIN_FILL_MS;
  }
  function sentRecently() {
    try { return Date.now() - Number(sessionStorage.getItem(SENT_KEY) || 0) < RESEND_COOLDOWN_MS; }
    catch (err) { return false; }
  }
  function markSent() {
    try { sessionStorage.setItem(SENT_KEY, String(Date.now())); } catch (err) { /* no storage: no cooldown */ }
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      // Bots get the same "thank you" as people, so they learn nothing about the filter.
      if (isBot()) {
        form.reset();
        setStatus(THANKS, "ok");
        return;
      }
      if (sentRecently()) {
        setStatus("Το αίτημά σας έχει ήδη σταλεί. Για νέο αίτημα δοκιμάστε ξανά σε ένα λεπτό ή καλέστε μας.", "err");
        return;
      }

      var data = cleanData(new FormData(form));
      var configured = form.action.indexOf("YOUR_FORM_ID") === -1;

      if (!configured) {
        if (!EMAIL_RE.test(form.dataset.fallbackEmail || "")) {
          setStatus(FAILED, "err");
          return;
        }
        var lines = [
          "Ονοματεπώνυμο: " + data.get("name"),
          "Τύπος χώρου: " + data.get("space"),
          "Τηλέφωνο: " + data.get("phone"),
          "Email: " + (data.get("email") || "-"),
          "Περιοχή: " + (data.get("area") || "-"),
          "Ενδιαφέρον: " + data.get("product"),
          "",
          data.get("message") || ""
        ];
        var href = "mailto:" + form.dataset.fallbackEmail +
          "?subject=" + encodeURIComponent("Αίτημα για φίλτρο νερού – " + data.get("product")) +
          "&body=" + encodeURIComponent(lines.join("\n"));
        window.location.href = href;
        setStatus("Ανοίξαμε το email σας με τα στοιχεία συμπληρωμένα. Πατήστε «Αποστολή» για να ολοκληρωθεί.", "ok");
        return;
      }

      // Post only to Formspree over HTTPS, whatever the action attribute was changed to.
      if (form.action.indexOf("https://formspree.io/f/") !== 0) {
        setStatus(FAILED, "err");
        return;
      }

      var btn = form.querySelector("button[type=submit]");
      var ctrl = typeof AbortController === "function" ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, REQUEST_TIMEOUT_MS) : 0;
      btn.disabled = true;
      setStatus("Αποστολή…");
      fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "strict-origin-when-cross-origin",
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) {
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          markSent();
          setStatus(THANKS, "ok");
        })
        .catch(function (err) {
          setStatus(err && err.name === "AbortError"
            ? "Η σύνδεση άργησε πολύ. Δοκιμάστε ξανά ή καλέστε μας στο τηλέφωνο."
            : FAILED, "err");
        })
        .finally(function () {
          clearTimeout(timer);
          btn.disabled = false;
        });
    });
  }

  // ---------- Contact form: Greek error messages under each field ----------
  // Messages are also set as the native validity message, so the browser's own
  // bubble (and validation without this script) stays in Greek.
  var fieldMessages = {
    name: {
      valueMissing: "Γράψτε το ονοματεπώνυμό σας.",
      tooShort: "Γράψτε το ονοματεπώνυμό σας (τουλάχιστον 2 γράμματα).",
      patternMismatch: "Το ονοματεπώνυμο μπορεί να έχει μόνο γράμματα, κενά, τελεία, απόστροφο και παύλα."
    },
    phone: {
      valueMissing: "Γράψτε ένα τηλέφωνο για να σας καλέσουμε.",
      patternMismatch: "Ο αριθμός δεν φαίνεται σωστός. Γράψτε 8 έως 25 ψηφία, π.χ. 6912345678."
    },
    email: { typeMismatch: "Το email δεν φαίνεται σωστό. Ελέγξτε ότι έχει τη μορφή onoma@domain.gr." },
    area: { patternMismatch: "Γράψτε την περιοχή με γράμματα και αριθμούς, π.χ. Καλαμαριά." },
    message: { tooManyLinks: "Για λόγους ασφαλείας, το μήνυμα μπορεί να έχει έως 2 συνδέσμους." },
    consent: { valueMissing: "Τσεκάρετε τη συγκατάθεση για να μπορέσουμε να σας απαντήσουμε." }
  };
  // Checks the browser has no built-in validity flag for.
  var customChecks = {
    tooManyLinks: function (field) { return (field.value.match(/https?:\/\/|www\./gi) || []).length > 2; }
  };

  function errorFor(field) {
    var id = "err-" + field.name;
    var el = document.getElementById(id);
    if (el) return el;
    el = document.createElement("span");
    el.id = id;
    el.className = "field-error";
    el.hidden = true;
    // Inside the label (keeps the grid layout) but outside its accessible name;
    // screen readers get it through aria-describedby instead.
    el.setAttribute("aria-hidden", "true");
    var label = field.closest("label");
    if (field.type === "checkbox") label.after(el);
    else label.appendChild(el);
    field.setAttribute("aria-describedby", id);
    return el;
  }

  function messageFor(field) {
    field.setCustomValidity("");
    var msgs = fieldMessages[field.name] || {};
    for (var key in msgs) {
      var failed = customChecks[key] ? customChecks[key](field) : field.validity[key];
      if (failed) return msgs[key];
    }
    return "";
  }

  function validateField(field, show) {
    var msg = messageFor(field);
    field.setCustomValidity(msg);
    var err = errorFor(field);
    if (msg && show) {
      err.textContent = msg;
      err.hidden = false;
      field.setAttribute("aria-invalid", "true");
    } else if (!msg) {
      err.hidden = true;
      field.removeAttribute("aria-invalid");
    }
  }

  // Errors that appear after the visitor has already moved on are read out here.
  var errorLive = null;
  if (form) {
    errorLive = document.createElement("p");
    errorLive.className = "sr-only";
    errorLive.setAttribute("aria-live", "polite");
    form.appendChild(errorLive);
  }
  function announceError(field, msg) {
    if (!errorLive || document.activeElement === field) return;
    var label = field.closest("label");
    var name = label ? label.firstChild.textContent.replace("*", "").trim() : "";
    errorLive.textContent = name ? name + ": " + msg : msg;
  }

  if (form) {
    var checked = Object.keys(fieldMessages).map(function (n) { return form.elements[n]; }).filter(Boolean);
    checked.forEach(function (field) {
      validateField(field, false);
      // Validate when the visitor leaves a field they typed in, then live while they fix it.
      field.addEventListener("blur", function () {
        if (!field.value || field.type === "checkbox") return;
        validateField(field, true);
        if (field.validationMessage) setTimeout(function () { announceError(field, field.validationMessage); }, 0);
      });
      field.addEventListener(field.type === "checkbox" ? "change" : "input", function () {
        validateField(field, field.getAttribute("aria-invalid") === "true");
      });
    });
    // On a submit attempt the browser fires "invalid" on each failing field.
    form.addEventListener("invalid", function (e) { validateField(e.target, true); }, true);
  }

  // ---------- Highlight the nav item for the section in view (home page) ----------
  var spyLinks = document.querySelectorAll('.site-nav a[href^="#"]:not(.btn)');
  if (spyLinks.length && "IntersectionObserver" in window) {
    var linkFor = {};
    spyLinks.forEach(function (a) { linkFor[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = linkFor[en.target.id];
        if (en.isIntersecting) {
          spyLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
          link.setAttribute("aria-current", "location");
        } else if (link.getAttribute("aria-current")) {
          link.removeAttribute("aria-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(linkFor).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  // ---------- Service-area map (click to load) ----------
  // Google Maps is only contacted after the visitor clicks "Εμφάνιση χάρτη".
  var mapCard = document.getElementById("service-map");
  if (mapCard) {
    var loadBtn = mapCard.querySelector(".map-load");
    loadBtn.hidden = false;
    loadBtn.addEventListener("click", function () {
      // Only Google Maps embeds; anything else in data-embed-src is ignored.
      var custom = mapCard.dataset.embedSrc || "";
      var src = custom.indexOf("https://www.google.com/maps/") === 0 ? custom :
        "https://www.google.com/maps?q=" + encodeURIComponent(mapCard.dataset.mapQuery) +
        "&z=" + encodeURIComponent(mapCard.dataset.mapZoom || "11") + "&hl=el&output=embed";
      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = "Χάρτης: περιοχή εξυπηρέτησης";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      var frame = mapCard.querySelector(".map-frame");
      frame.replaceChildren(iframe);
      frame.classList.add("is-loaded");
      iframe.focus();
    });
  }

  // ---------- Reveal on scroll ----------
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var targets = document.querySelectorAll(".section-head, .solution, .product, .steps li, .faq details, .calc-result, .chips, .table-wrap");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -60px 0px" });
    targets.forEach(function (t) { t.classList.add("reveal"); io.observe(t); });
  }

  // ---------- Footer year ----------
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
