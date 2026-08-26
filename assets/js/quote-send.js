/* =============================================================
   QUOTE-SEND — invio sicuro della richiesta di preventivo
   -------------------------------------------------------------
   Strategia di sicurezza (sito statico, niente backend nostro):

     1) Honeypot field nascosto — i bot lo riempiono, gli umani no.
     2) Time-based bot detection — i bot inviano in pochi millisecondi.
     3) Rate-limit lato client — un invio al massimo ogni N secondi
        per IP/browser tramite localStorage.
     4) Validazione robusta dell'email + sanitizzazione dei valori.
     5) Submission via Formspree (HTTPS, anti-spam server-side,
        Recaptcha gestita da loro). NESSUNA API key esposta nel codice.
     6) Fallback automatico a "mailto" se Formspree non è configurato,
        così il sito non si rompe mai durante lo sviluppo.

   La modalità è scelta in assets/js/config.js → delivery.method.
   ============================================================= */
(function () {
  "use strict";

  const FORM_OPENED_AT = Date.now();
  const STORAGE_LAST_SUBMIT = "rr_last_submit_at";

  /* ---------- Helpers ---------- */
  function isValidEmail(v) {
    if (typeof v !== "string") return false;
    const s = v.trim();
    if (s.length < 5 || s.length > 254) return false;
    // RFC-5322-light: local@domain.tld, no whitespace, sensible chars only.
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s);
  }

  function sanitize(v) {
    // Remove control chars that would corrupt the email body.
    if (typeof v !== "string") v = String(v == null ? "" : v);
    return v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  }

  function getSecurityCfg() {
    const s = (window.SITE_CONFIG && window.SITE_CONFIG.security) || {};
    return {
      minFillSeconds: Number.isFinite(s.minFillSeconds) ? s.minFillSeconds : 3,
      minSecondsBetweenSubmits: Number.isFinite(s.minSecondsBetweenSubmits) ? s.minSecondsBetweenSubmits : 60
    };
  }

  function passesSecurityChecks(data) {
    const cfg = getSecurityCfg();

    // 1) Honeypot — must be empty.
    if (data._website && data._website.trim().length > 0) {
      console.warn("Honeypot tripped");
      return { ok: false, reason: "spam" };
    }
    // 2) Time-based check.
    const elapsed = (Date.now() - FORM_OPENED_AT) / 1000;
    if (elapsed < cfg.minFillSeconds) {
      return { ok: false, reason: "too_fast" };
    }
    // 3) Rate-limit.
    try {
      const last = parseInt(localStorage.getItem(STORAGE_LAST_SUBMIT) || "0", 10);
      const since = (Date.now() - last) / 1000;
      if (last && since < cfg.minSecondsBetweenSubmits) {
        const wait = Math.ceil(cfg.minSecondsBetweenSubmits - since);
        return { ok: false, reason: "rate_limit", wait };
      }
    } catch (e) { /* localStorage might be disabled — proceed */ }

    return { ok: true };
  }

  function markSubmitted() {
    try { localStorage.setItem(STORAGE_LAST_SUBMIT, String(Date.now())); } catch (e) {}
  }

  /* ---------- Formattazione corpo email ---------- */
  function formatBody(data) {
    const L = (window.QUOTE_LABELS || {});
    const pkg = (L.package && L.package[data.package]) || data.package || "(nessuno selezionato)";
    const addons = (data.addons || []).map(a => (L.addons && L.addons[a]) || a);
    const line = (label, value) => value ? `${label}: ${sanitize(value)}\n` : "";

    let body = "";
    const site = (window.SITE_CONFIG && window.SITE_CONFIG.business && window.SITE_CONFIG.business.name) || "";
    body += "NUOVA RICHIESTA DI PREVENTIVO" + (site ? " \u2014 " + site : "") + "\n";
    body += "====================================================\n\n";

    body += "— Pacchetto scelto —\n";
    body += `${sanitize(pkg)}\n\n`;

    if (addons.length) {
      body += "— Add-on selezionati —\n";
      addons.forEach(a => { body += `  • ${sanitize(a)}\n`; });
      body += "\n";
    }

    body += "— Dettagli del viaggio —\n";
    body += line("Viaggiatori", data.travelers);
    body += line("Periodo preferito", data.timeframe);
    body += line("Durata viaggio", data.duration);
    body += line("Regioni di interesse", data.regions);
    body += line("Trasporto", data.transport);
    body += "\n";

    body += "— Informazioni famiglia —\n";
    body += line("Ha già un albero genealogico", data.has_tree);
    body += line("Vuole incontrare parenti viventi", data.contact_living);
    body += line("Antenati / cognomi noti", data.ancestors);
    body += "\n";

    body += "— Contatti —\n";
    body += line("Nome", `${sanitize(data.first_name || "")} ${sanitize(data.last_name || "")}`.trim());
    body += line("Email", data.email);
    body += line("Telefono", data.phone);
    body += line("Paese", data.country);
    body += "\n";

    if (data.notes) {
      body += "— Note aggiuntive —\n";
      body += sanitize(data.notes) + "\n\n";
    }

    body += "----------------------------------------------------\n";
    body += `Inviato il: ${new Date().toLocaleString("it-IT")}\n`;
    if (typeof location !== "undefined") {
      body += `Dalla pagina: ${location.href}\n`;
    }

    return body;
  }

  function buildSubject(data) {
    const L = (window.QUOTE_LABELS || {});
    const pkg = (L.package && L.package[data.package]) || data.package || "Quote";
    const who = [data.first_name, data.last_name].map(sanitize).filter(Boolean).join(" ") || "new visitor";
    return `Quote request — ${pkg} — ${who}`;
  }

  /* ---------- Delivery: Formspree (raccomandato) ---------- */
  function sendFormspree(data, cfg) {
    const endpoint = cfg.formspree && cfg.formspree.endpoint;
    if (!endpoint || endpoint.includes("YOUR_FORM_ID")) {
      console.warn("Formspree endpoint non configurato — fallback a mailto. Vedi README.txt per attivarlo.");
      return sendMailto(data, cfg);
    }

    const subject = buildSubject(data);
    const body = formatBody(data);

    const payload = {
      _subject: subject,
      _replyto: data.email || "",
      _language: "it",

      // Reply destination (Formspree honours this)
      email: data.email || "",
      name: `${sanitize(data.first_name || "")} ${sanitize(data.last_name || "")}`.trim(),

      // Human-readable message
      message: body,

      // Raw fields for the dashboard
      package: data.package,
      addons: (data.addons || []).join(", "),
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      phone: data.phone || "",
      country: data.country || "",
      travelers: data.travelers || "",
      timeframe: data.timeframe || "",
      duration: data.duration || "",
      regions: data.regions || "",
      transport: data.transport || "",
      has_tree: data.has_tree || "",
      contact_living: data.contact_living || "",
      ancestors: data.ancestors || "",
      notes: data.notes || ""
    };

    setBusy(true);
    fetch(endpoint, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(r => r.json().then(j => ({ ok: r.ok, status: r.status, json: j })).catch(() => ({ ok: r.ok, status: r.status, json: {} })))
      .then(res => {
        setBusy(false);
        if (res.ok) {
          markSubmitted();
          showSuccess("Your request is on its way. Rita will get back to you within 48 hours.");
          resetForm();
        } else {
          const msg = (res.json && res.json.error) ? res.json.error : "Something went wrong on the way out. Please try again, or simply email Rita directly.";
          showError(msg);
        }
      })
      .catch(() => {
        setBusy(false);
        showError("We could not reach the server. Check your connection and try again.");
      });
  }

  /* ---------- Delivery: mailto (fallback) ---------- */
  function sendMailto(data, cfg) {
    const to = cfg.recipientEmail || "";
    const cc = cfg.ccEmails || "";
    const subject = buildSubject(data);
    const body = formatBody(data);
    const params = new URLSearchParams();
    params.set("subject", subject);
    params.set("body", body);
    if (cc) params.set("cc", cc);
    const qs = params.toString().replace(/\+/g, "%20");
    const href = `mailto:${encodeURIComponent(to)}?${qs}`;
    window.location.href = href;
    markSubmitted();
    showSuccess("Your email program is opening with the request already written. Press Send to finish.");
  }

  /* ---------- Delivery: EmailJS (alternativa) ---------- */
  function sendEmailJS(data, cfg) {
    const ej = cfg.emailjs || {};
    if (!ej.publicKey || ej.publicKey.includes("YOUR_") || !window.emailjs) {
      console.warn("EmailJS non configurato — fallback a mailto.");
      return sendMailto(data, cfg);
    }
    setBusy(true);
    const params = {
      to_email: cfg.recipientEmail,
      cc_email: cfg.ccEmails || "",
      subject: buildSubject(data),
      reply_to: data.email || "",
      message: formatBody(data)
    };
    window.emailjs.send(ej.serviceId, ej.templateId, params, ej.publicKey)
      .then(() => {
        setBusy(false);
        markSubmitted();
        showSuccess("Your request is on its way. Rita will get back to you within 48 hours.");
        resetForm();
      })
      .catch(() => {
        setBusy(false);
        showError("The request could not be sent. Please try again, or email Rita directly.");
      });
  }

  /* ---------- UI helpers ---------- */
  function setBusy(state) {
    const form = document.getElementById("quote-form");
    const btn = form && form.querySelector("[data-action='send']");
    if (!btn) return;
    btn.disabled = !!state;
    btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
    btn.innerHTML = state ? "Sending…" : btn.dataset.originalText;
  }
  function showSuccess(msg) {
    const banner = document.getElementById("quote-result");
    if (banner) {
      banner.innerHTML = `<div class="result result--ok"><strong>Thank you!</strong> ${escapeHtml(msg)}</div>`;
      banner.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.showToast && window.showToast(msg);
    }
  }
  function showError(msg) {
    const banner = document.getElementById("quote-result");
    if (banner) {
      banner.innerHTML = `<div class="result result--err">${escapeHtml(msg)}</div>`;
      banner.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.showToast && window.showToast(msg);
    }
  }
  function resetForm() {
    const form = document.getElementById("quote-form");
    if (form) form.reset();
  }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  /* ---------- Public dispatcher ---------- */
  window.sendQuote = function (data) {
    // 1) Security checks first.
    const sec = passesSecurityChecks(data);
    if (!sec.ok) {
      if (sec.reason === "spam") {
        // Silently drop bots so they don't learn from the error.
        showError("Something went wrong with this submission. Please try again later.");
        return;
      }
      if (sec.reason === "too_fast") {
        showError("That was quick! Please check your answers and send again in a moment.");
        return;
      }
      if (sec.reason === "rate_limit") {
        showError(`You have just sent a request. Please wait ${sec.wait} seconds before sending another.`);
        return;
      }
    }

    // 2) Validazione email obbligatoria.
    if (!isValidEmail(data.email)) {
      showError("Please enter a valid email address — it is the only way Rita can write back to you.");
      const field = document.getElementById("email");
      if (field) {
        field.focus();
        const wrap = field.closest(".field");
        if (wrap) wrap.classList.add("field--error");
      }
      return;
    }

    // 3) Dispatch.
    const cfg = (window.SITE_CONFIG && window.SITE_CONFIG.delivery) || {};
    const method = (cfg.method || "formspree").toLowerCase();
    if (method === "mailto")    return sendMailto(data, cfg);
    if (method === "emailjs")   return sendEmailJS(data, cfg);
    return sendFormspree(data, cfg);
  };
})();
