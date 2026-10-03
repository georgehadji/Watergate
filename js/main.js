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
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---------- Header shadow on scroll ----------
  var header = document.querySelector(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  requestAnimationFrame(onScroll);

  // ---------- Product filter (by type of space) ----------
  var tabs = document.querySelectorAll(".filter-tabs .tab");
  var products = document.querySelectorAll(".product");
  function applyFilter(filter) {
    tabs.forEach(function (t) {
      var active = t.dataset.filter === filter;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-pressed", String(active));
    });
    products.forEach(function (p) {
      p.hidden = !(filter === "all" || p.dataset.cat.split(" ").indexOf(filter) !== -1);
    });
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

  // ---------- "Ζητήστε πληροφορίες" preselects the product in the form ----------
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
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (form.elements._gotcha.value) return; // spam bot

      var data = new FormData(form);
      var configured = form.action.indexOf("YOUR_FORM_ID") === -1;

      if (!configured) {
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

      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      setStatus("Αποστολή…");
      fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          setStatus("Ευχαριστούμε! Λάβαμε το αίτημά σας και θα επικοινωνήσουμε σύντομα μαζί σας.", "ok");
        })
        .catch(function () {
          setStatus("Κάτι πήγε στραβά. Δοκιμάστε ξανά ή καλέστε μας στο τηλέφωνο.", "err");
        })
        .finally(function () { btn.disabled = false; });
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
