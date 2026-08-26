/* =============================================================
   CONFIGURATOR — multi-step quote builder
   -------------------------------------------------------------
   - Manages step navigation
   - Keeps a live summary panel in sync
   - Validates required fields per step
   - Builds the payload sent by quote-send.js
   ============================================================= */
(function () {
  "use strict";

  const form = document.getElementById("quote-form");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll(".form-step"));
  const bar = form.querySelectorAll(".steps-bar__dot");
  const summaryRoot = document.getElementById("summary-list");
  const summaryEmpty = document.getElementById("summary-empty");

  let current = 0;

  /* ---------- Step navigation ---------- */
  function showStep(idx) {
    steps.forEach((s, i) => s.classList.toggle("is-active", i === idx));
    bar.forEach((d, i) => {
      d.classList.toggle("is-active", i === idx);
      d.classList.toggle("is-done", i < idx);
    });

    const prevBtn = form.querySelector("[data-action='prev']");
    const nextBtn = form.querySelector("[data-action='next']");
    const sendBtn = form.querySelector("[data-action='send']");

    if (prevBtn) prevBtn.style.visibility = idx === 0 ? "hidden" : "visible";
    if (nextBtn) nextBtn.style.display = idx === steps.length - 1 ? "none" : "";
    if (sendBtn) sendBtn.style.display = idx === steps.length - 1 ? "" : "none";

    // Scroll the form into view nicely on small screens
    if (window.innerWidth < 960) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function validateStep(idx) {
    const stepEl = steps[idx];
    const required = stepEl.querySelectorAll("[data-required]");
    let ok = true;
    let firstInvalid = null;

    required.forEach(field => {
      let valid = true;

      if (field.type === "radio" || field.type === "checkbox") {
        // groupName based validation
        const name = field.name;
        const checked = form.querySelectorAll(`[name="${name}"]:checked`);
        valid = checked.length > 0;
      } else {
        valid = field.value && field.value.trim().length > 0;
      }

      const fieldWrap = field.closest(".field") || field;
      if (!valid) {
        ok = false;
        fieldWrap.classList.add("field--error");
        if (!firstInvalid) firstInvalid = field;
      } else {
        fieldWrap.classList.remove("field--error");
      }
    });

    if (!ok && firstInvalid) {
      firstInvalid.focus();
      window.showToast && window.showToast("Please complete the highlighted fields.");
    }
    return ok;
  }

  form.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]");
    if (!action) return;
    const a = action.dataset.action;

    if (a === "next") {
      if (!validateStep(current)) return;
      if (current < steps.length - 1) {
        current++;
        showStep(current);
      }
    } else if (a === "prev") {
      if (current > 0) {
        current--;
        showStep(current);
      }
    }
  });

  /* ---------- Live summary ---------- */
  // Maps field name → display label and how to render
  const fieldLabels = {
    package: "Package",
    travelers: "Travelers",
    timeframe: "Preferred timing",
    duration: "Trip length",
    regions: "Italian regions of interest",
    transport: "Transport",
    ancestors: "Known ancestors / surnames",
    first_name: "First name",
    last_name: "Last name",
    email: "Email",
    phone: "Phone",
    country: "Country",
    notes: "Notes",
    has_tree: "Has a family tree?",
    contact_living: "Wants to contact living relatives?"
  };
  const addonLabel = {
    assistant: "Rita as personal assistant during the stay",
    driving: "Rita drives the rental car (to be added to the rental agreement as a named driver)",
    gastronomy: "Food & wine suggestions (anywhere in Italy, client books directly)",
    villages: "Visit to ancestral villages, with Rita alongside to translate",
    document_help: "Certified copies of the records we find",
    interpreter: "Translation during family meetings",
    archive_research: "Deep archive research (state, military, notarial)"
  };

  function readForm() {
    const data = {};
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) {
      if (data[k] === undefined) data[k] = v;
      else if (Array.isArray(data[k])) data[k].push(v);
      else data[k] = [data[k], v];
    }
    return data;
  }

  function renderSummary() {
    const data = readForm();
    summaryRoot.innerHTML = "";

    const items = [];

    const packageVal = data.package;
    if (packageVal) {
      const pkLabels = {
        research: "Research Package",
        journey: "Full Heritage Journey",
        tree_help: "No family tree yet — wants to start one"
      };
      items.push({ lbl: "Package", val: pkLabels[packageVal] || packageVal });
    }

    // Add-ons
    const addons = [].concat(data.addons || []).filter(Boolean);
    if (addons.length) {
      items.push({
        lbl: "Add-ons",
        val: addons.map(a => addonLabel[a] || a).join(", ")
      });
    }

    [
      "has_tree", "contact_living",
      "travelers", "duration", "timeframe", "regions",
      "transport", "ancestors", "notes",
      "first_name", "last_name", "email", "phone", "country"
    ].forEach(k => {
      const v = data[k];
      if (v && String(v).trim()) {
        items.push({ lbl: fieldLabels[k] || k, val: v });
      }
    });

    if (!items.length) {
      summaryEmpty.style.display = "";
      return;
    }
    summaryEmpty.style.display = "none";

    items.forEach(({ lbl, val }) => {
      const li = document.createElement("li");
      const a = document.createElement("span");
      a.className = "lbl"; a.textContent = lbl;
      const b = document.createElement("span");
      b.className = "val"; b.textContent = val;
      li.appendChild(a); li.appendChild(b);
      summaryRoot.appendChild(li);
    });
  }

  form.addEventListener("input", renderSummary);
  form.addEventListener("change", renderSummary);

  // Build the addon labels lookup as a global so quote-send.js can mirror them.
  window.QUOTE_LABELS = { package: {
    research: "Research Package",
    journey: "Full Heritage Journey",
    tree_help: "No family tree yet — wants to start one"
  }, addons: addonLabel, fields: fieldLabels };

  /* ---------- Submission ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Validate all visible & required-on-final-step fields
    if (!validateStep(current)) return;

    const data = readForm();

    // Honeypot: se e' compilato e' un bot. Usciamo in silenzio.
    // (quote-send.js ricontrolla lo stesso campo prima di spedire.)
    if (data._website && String(data._website).trim()) return;

    // Normalize add-ons into array
    data.addons = [].concat(data.addons || []).filter(Boolean);

    // Hand off to dispatcher
    if (typeof window.sendQuote === "function") {
      window.sendQuote(data);
    } else {
      console.error("quote-send.js not loaded");
    }
  });

  /* ---------- Init ---------- */
  showStep(0);
  renderSummary();
})();
