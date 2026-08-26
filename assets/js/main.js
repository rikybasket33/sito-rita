/* =============================================================
   MAIN — navigation, reveal, micro-interactions
   ============================================================= */
(function () {
  "use strict";

  const cfg = (window.SITE_CONFIG && window.SITE_CONFIG.flags) || {};

  /* ---------- Inject business info from config ---------- */
  function applyBusinessInfo() {
    const b = (window.SITE_CONFIG && window.SITE_CONFIG.business) || {};
    document.querySelectorAll("[data-biz='name']").forEach(el => el.textContent = b.name || el.textContent);
    document.querySelectorAll("[data-biz='tagline']").forEach(el => el.textContent = b.tagline || el.textContent);
    document.querySelectorAll("[data-biz='phone']").forEach(el => {
      if (!b.phone) return;
      el.textContent = b.phone;
      if (el.tagName === "A") el.href = "tel:" + b.phone.replace(/\s+/g, "");
    });
    document.querySelectorAll("[data-biz='email']").forEach(el => {
      if (!b.publicEmail) return;
      el.textContent = b.publicEmail;
      if (el.tagName === "A") el.href = "mailto:" + b.publicEmail;
    });
    // Solo l'href, senza toccare il testo del bottone.
    document.querySelectorAll("[data-biz-email-href]").forEach(el => {
      if (!b.publicEmail) return;
      const href = el.getAttribute("href") || "mailto:";
      const q = href.includes("?") ? href.slice(href.indexOf("?")) : "";
      el.setAttribute("href", "mailto:" + b.publicEmail + q);
    });
    document.querySelectorAll("[data-biz='location']").forEach(el => el.textContent = b.baseLocation || el.textContent);
    document.querySelectorAll("[data-biz='year']").forEach(el => el.textContent = new Date().getFullYear());
  }

  /* ---------- Navigation: scroll state + active link + mobile toggle ---------- */
  function setupNavigation() {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    const onScroll = () => {
      nav.classList.toggle("nav--scrolled", window.scrollY > 16);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const toggle = nav.querySelector(".nav__toggle");
    const setOpen = (open) => {
      nav.classList.toggle("nav--open", open);
      if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
      // Lock background scroll while the full-screen menu is open
      document.documentElement.classList.toggle("nav-locked", open);
    };
    if (toggle) {
      toggle.addEventListener("click", () => setOpen(!nav.classList.contains("nav--open")));
    }

    // Close the menu after tapping a link, and on Escape
    nav.querySelectorAll(".nav__links a").forEach(a =>
      a.addEventListener("click", () => setOpen(false))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("nav--open")) setOpen(false);
    });

    // Active link based on current page
    const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    nav.querySelectorAll(".nav__links a").forEach(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href === file || (file === "" && href === "index.html")) {
        a.classList.add("is-active");
      }
    });
  }

  /* ---------- Scroll-reveal via IntersectionObserver ---------- */
  function setupReveal() {
    if (!cfg.enableAnimations) {
      document.querySelectorAll(".reveal").forEach(el => el.classList.add("is-visible"));
      return;
    }
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(el => el.classList.add("is-visible"));
      return;
    }
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));

    // Safety net: reveal anything already on screen right away (some engines
    // don't deliver the initial IntersectionObserver callback), so above-the-
    // fold content is never left hidden. Scroll-in is still handled by the IO.
    const revealInView = () => {
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < (window.innerHeight || 0) * 0.95 && r.bottom > 0) {
          el.classList.add("is-visible");
        }
      });
    };
    revealInView();
    window.addEventListener("load", revealInView);
  }

  /* ---------- Word-by-word reveal for the hero headline ---------- */
  function setupWordReveal() {
    document.querySelectorAll("[data-word-reveal]").forEach(el => {
      // Preserve any inner HTML spans (.italic, .underline) by walking children.
      const wrap = (node) => {
        const fragment = document.createDocumentFragment();
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const parts = child.textContent.split(/(\s+)/);
            parts.forEach(part => {
              if (/^\s+$/.test(part)) {
                fragment.appendChild(document.createTextNode(part));
              } else if (part.length) {
                const span = document.createElement("span");
                span.className = "word";
                span.textContent = part;
                fragment.appendChild(span);
              }
            });
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const clone = child.cloneNode(false);
            // Recurse into the clone with the child's contents
            clone.appendChild(wrap(child));
            fragment.appendChild(clone);
          }
        });
        return fragment;
      };

      const wrapped = wrap(el);
      el.classList.add("word-reveal");
      el.innerHTML = "";
      el.appendChild(wrapped);

      const words = el.querySelectorAll(".word");
      words.forEach((w, i) => {
        w.style.animationDelay = (200 + i * 90) + "ms";
      });
    });
  }

  /* ---------- Count-up numbers ---------- */
  function setupCountUp() {
    const nums = document.querySelectorAll("[data-count]");
    if (!nums.length || !("IntersectionObserver" in window)) {
      nums.forEach(n => n.textContent = n.dataset.count);
      return;
    }
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const dur = 1400;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = (target * eased);
        el.textContent = (target % 1 === 0 ? Math.round(v) : v.toFixed(1)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animate(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    nums.forEach(n => io.observe(n));
  }

  /* ---------- Parallax for the hero background ---------- */
  function setupParallax() {
    if (!cfg.enableParallax) return;
    const layers = document.querySelectorAll("[data-parallax]");
    if (!layers.length) return;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      layers.forEach(layer => {
        const speed = parseFloat(layer.dataset.parallax) || 0.2;
        layer.style.transform = `translate3d(0, ${y * speed * -1}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ---------- Dark mode toggle ---------- */
  function setupThemeToggle() {
    const root = document.documentElement;
    const STORAGE_KEY = "rr_theme";

    const readSaved = () => {
      try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    };
    const saveTheme = (t) => {
      try { localStorage.setItem(STORAGE_KEY, t); } catch (e) {}
    };

    const applyTheme = (theme) => {
      if (theme === "dark") {
        root.setAttribute("data-theme", "dark");
      } else {
        root.removeAttribute("data-theme");
      }
      document.querySelectorAll(".theme-toggle").forEach(btn => {
        btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
        btn.setAttribute(
          "aria-label",
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        );
      });
    };

    // The inline <head> script has already applied the initial theme to
    // avoid the flash of incorrect theme on load — but reapply now to set
    // up the aria-* attributes on the buttons.
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(current);

    // Toggle clicks
    document.querySelectorAll(".theme-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        saveTheme(next);
      });
    });

    // Note: the site intentionally defaults to LIGHT and does NOT auto-follow
    // the OS dark preference — dark mode is strictly opt-in via this toggle.
  }

  /* ---------- Booking: wire CTAs + optional embed ---------- */
  function setupBooking() {
    const bk = (window.SITE_CONFIG && window.SITE_CONFIG.booking) || {};
    const url = (bk.enabled && bk.url && bk.url.trim()) ? bk.url.trim() : "";

    // CTA links / buttons
    document.querySelectorAll("[data-book-link]").forEach(el => {
      if (url) {
        el.setAttribute("href", url);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      } else {
        // Graceful fallback: send people to the contact page.
        el.setAttribute("href", "contact.html#contact-methods");
        el.removeAttribute("target");
      }
    });

    // Hide the "opens in a new tab" note when we fall back to contact.
    if (!url) {
      document.querySelectorAll("[data-book-note]").forEach(el => el.style.display = "none");
    }

    // Optional embed on the contact page
    const host = document.querySelector("[data-book-embed]");
    if (host) {
      if (url && bk.embed) {
        const frame = document.createElement("iframe");
        frame.src = url;
        frame.title = "Booking calendar";
        frame.loading = "lazy";
        host.innerHTML = "";
        host.appendChild(frame);
      } else {
        // No URL or embed disabled — remove the empty embed box.
        host.remove();
      }
    }
  }

  /* ---------- Toast helper exposed globally ---------- */
  window.showToast = function (msg) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("is-visible"));
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.classList.remove("is-visible"), 3200);
  };

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    applyBusinessInfo();
    setupNavigation();
    setupThemeToggle();
    setupWordReveal();
    setupReveal();
    setupCountUp();
    setupParallax();
    setupBooking();
  });
})();
