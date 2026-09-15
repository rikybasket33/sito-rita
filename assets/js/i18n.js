/* =============================================================
   I18N — switch inglese / italiano
   -------------------------------------------------------------
   L'inglese e' la sorgente: vive nell'HTML delle pagine. L'italiano
   sta in i18n-it.js, indicizzato per testo inglese.

   Come funziona
   -------------
   1. Appena questo file viene eseguito (in fondo al <body>, quando il
      DOM e' gia' completo ma prima che main.js scriva i dati da
      config.js) registriamo ogni "unita di traduzione" della pagina
      e ne teniamo in memoria l'HTML inglese originale.
   2. Un'unita e' un elemento che contiene testo proprio e nessun
      discendente di tipo blocco: e' il piu' grande pezzo di pagina
      che si puo' sostituire in un colpo solo senza rompere il layout.
   3. Cambiare lingua significa solo riassegnare innerHTML dalla
      memoria: nessuna rilettura del dizionario, nessun ricaricamento.

   Se una frase inglese non ha traduzione resta in inglese: mai una
   pagina rotta. In console, i18nAudit() elenca cosa manca.
   ============================================================= */
(function () {
  "use strict";

  var STORAGE_KEY = "rr_lang";
  var DICT = window.I18N_IT || {};
  var META = window.I18N_IT_META || {};

  /* elementi che non contengono testo traducibile */
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, SVG: 1, OBJECT: 1, NOSCRIPT: 1, CODE: 1 };

  /* tag che NON interrompono un'unita di traduzione */
  var INLINE = {
    A: 1, ABBR: 1, B: 1, BDI: 1, BDO: 1, BR: 1, CITE: 1, CODE: 1, DATA: 1,
    DFN: 1, EM: 1, I: 1, KBD: 1, MARK: 1, Q: 1, S: 1, SAMP: 1, SMALL: 1,
    SPAN: 1, STRONG: 1, SUB: 1, SUP: 1, TIME: 1, U: 1, WBR: 1
  };

  var ATTRS = ["placeholder", "aria-label", "alt", "title"];

  var units = [];   /* { el, en, it } */
  var attrs = [];   /* { el, name, en, it } */
  var current = "en";

  function norm(s) {
    return String(s).replace(/\s+/g, " ").trim();
  }

  function hasBlockDescendant(el) {
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) {
      if (!INLINE[kids[i].tagName]) return true;
      if (hasBlockDescendant(kids[i])) return true;
    }
    return false;
  }

  function hasOwnText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    }
    return false;
  }

  /* --------- registrazione: si percorre l'albero una volta sola --------- */
  function register(el) {
    if (SKIP_TAGS[el.tagName]) return;

    for (var a = 0; a < ATTRS.length; a++) {
      var name = ATTRS[a];
      if (!el.hasAttribute(name)) continue;
      var v = norm(el.getAttribute(name));
      if (v && DICT[v]) attrs.push({ el: el, name: name, en: el.getAttribute(name), it: DICT[v] });
    }

    /* data-biz: il contenuto lo scrive main.js da config.js, non si traduce */
    if (!el.hasAttribute("data-biz") && hasOwnText(el) && !hasBlockDescendant(el)) {
      var key = norm(el.textContent);
      if (key) {
        units.push({ el: el, en: el.innerHTML, it: DICT[key] || null, key: key });
        return;   /* unita trovata: non si scende oltre */
      }
    }

    var kids = el.children;
    for (var i = 0; i < kids.length; i++) register(kids[i]);
  }

  function collect() {
    units = [];
    attrs = [];
    if (document.body) register(document.body);
  }

  /* --------- applicazione --------- */
  function apply(lang) {
    var it = lang === "it";
    var i;

    for (i = 0; i < units.length; i++) {
      var u = units[i];
      if (it && u.it) {
        if (u.el.innerHTML !== u.it) u.el.innerHTML = u.it;
      } else if (u.el.innerHTML !== u.en) {
        u.el.innerHTML = u.en;
      }
    }

    for (i = 0; i < attrs.length; i++) {
      var at = attrs[i];
      at.el.setAttribute(at.name, it ? at.it : at.en);
    }

    /* titolo e meta description */
    var page = (location.pathname.split("/").pop() || "index.html");
    var m = META[page];
    if (m) {
      if (!apply._enMeta) {
        var dsc = document.querySelector('meta[name="description"]');
        apply._enMeta = { title: document.title, desc: dsc ? dsc.getAttribute("content") : null };
      }
      var descEl = document.querySelector('meta[name="description"]');
      document.title = it ? m.title : apply._enMeta.title;
      if (descEl && apply._enMeta.desc !== null) {
        descEl.setAttribute("content", it ? m.desc : apply._enMeta.desc);
      }
    }

    document.documentElement.setAttribute("lang", it ? "it" : "en");
    current = it ? "it" : "en";

    /* i dati da config.js vivono dentro alcune unita tradotte: si riscrivono */
    if (typeof window.applyBusinessInfo === "function") window.applyBusinessInfo();

    /* il tema riscrive le proprie aria-label: gliele facciamo rigenerare */
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      var label = dark ? "Switch to light mode" : "Switch to dark mode";
      btn.setAttribute("aria-label", it && DICT[label] ? DICT[label] : label);
    });

    document.querySelectorAll(".lang-switch__btn").forEach(function (btn) {
      var on = btn.getAttribute("data-lang") === current;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    document.dispatchEvent(new CustomEvent("languagechange", { detail: { lang: current } }));
  }

  /* --------- API pubblica --------- */

  /* Traduce una stringa generata da JavaScript (toast, riepilogo...). */
  window.i18nT = function (s) {
    if (current !== "it") return s;
    return DICT[norm(s)] || s;
  };

  window.i18nLang = function () { return current; };

  window.setLanguage = function (lang) {
    lang = lang === "it" ? "it" : "en";
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    apply(lang);
  };

  /* Elenca in console le frasi della pagina senza traduzione italiana. */
  window.i18nAudit = function () {
    var missing = units.filter(function (u) { return !u.it; });
    console.log("i18n — frasi senza traduzione in questa pagina: " + missing.length);
    missing.forEach(function (u) { console.log("  " + u.key); });
    return missing.map(function (u) { return u.key; });
  };

  /* --------- avvio --------- */
  collect();   /* subito: il DOM e' parsato e ancora "vergine" */

  function saved() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function boot() {
    document.querySelectorAll(".lang-switch__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.setLanguage(btn.getAttribute("data-lang"));
      });
    });

    /* ?lang=it nell'indirizzo vince sulla preferenza salvata: serve per
       mandare a qualcuno un link gia' in italiano. */
    var asked = null;
    try { asked = new URLSearchParams(location.search).get("lang"); } catch (e) {}
    if (asked === "it" || asked === "en") {
      window.setLanguage(asked);
      return;
    }
    apply(saved() === "it" ? "it" : "en");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
