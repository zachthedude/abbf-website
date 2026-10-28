/**
 * ABBF accessible interactions — vanilla JS, no heavy dependencies.
 * Respects prefers-reduced-motion; toolbar can override locally.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "abbf-a11y-prefs";

  function prefersReducedMotion() {
    return (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.getAttribute("data-a11y-reduce-motion") ===
        "true"
    );
  }

  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      /* ignore */
    }
  }

  function applyPrefs(prefs) {
    var html = document.documentElement;
    if (prefs.fontSize) html.setAttribute("data-font-size", prefs.fontSize);
    else html.removeAttribute("data-font-size");
    if (prefs.highContrast)
      html.setAttribute("data-a11y-contrast", "high");
    else html.removeAttribute("data-a11y-contrast");
    if (prefs.reduceMotion)
      html.setAttribute("data-a11y-reduce-motion", "true");
    else html.removeAttribute("data-a11y-reduce-motion");
  }

  /* --- Mobile navigation with focus trap (WCAG 2.1.2, 4.1.2) --- */
  function initMobileNav() {
    var toggle = document.getElementById("menu-toggle");
    var closeBtn = document.getElementById("menu-close");
    var panel = document.getElementById("mobile-nav");
    if (!toggle || !panel) return;

    var dialog = panel.querySelector(".mobile-nav__dialog");
    var lastFocused = null;

    function getFocusable(container) {
      return Array.prototype.slice
        .call(
          container.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          )
        )
        .filter(function (el) {
          return el.offsetParent !== null || el === closeBtn;
        });
    }

    function openMenu() {
      lastFocused = document.activeElement;
      panel.hidden = false;
      /* next frame so the staggered link reveal transitions in */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panel.classList.add("is-open");
        });
      });
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var focusables = getFocusable(dialog);
      if (focusables.length) focusables[0].focus();
    }

    function closeMenu() {
      panel.classList.remove("is-open");
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    toggle.addEventListener("click", openMenu);
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);

    panel.addEventListener("click", function (e) {
      if (e.target === panel) closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (panel.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== "Tab") return;
      var focusables = getFocusable(dialog);
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* --- Accessibility toolbar --- */
  function initA11yToolbar() {
    var prefs = loadPrefs();
    applyPrefs(prefs);

    var toggle = document.getElementById("a11y-toggle");
    var panel = document.getElementById("a11y-panel");
    if (!toggle || !panel) return;

    var sizes = ["sm", "", "lg", "xl"];
    var sizeIndex = sizes.indexOf(prefs.fontSize || "");

    function syncButtons() {
      var contrast = document.getElementById("a11y-contrast");
      var motion = document.getElementById("a11y-motion");
      if (contrast)
        contrast.setAttribute(
          "aria-pressed",
          prefs.highContrast ? "true" : "false"
        );
      if (motion)
        motion.setAttribute(
          "aria-pressed",
          prefs.reduceMotion ? "true" : "false"
        );
    }

    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      panel.hidden = expanded;
    });

    document
      .getElementById("a11y-font-decrease")
      .addEventListener("click", function () {
        sizeIndex = Math.max(0, sizeIndex - 1);
        prefs.fontSize = sizes[sizeIndex] || undefined;
        if (!prefs.fontSize) delete prefs.fontSize;
        applyPrefs(prefs);
        savePrefs(prefs);
      });

    document
      .getElementById("a11y-font-increase")
      .addEventListener("click", function () {
        sizeIndex = Math.min(sizes.length - 1, sizeIndex + 1);
        prefs.fontSize = sizes[sizeIndex] || undefined;
        if (!prefs.fontSize) delete prefs.fontSize;
        applyPrefs(prefs);
        savePrefs(prefs);
      });

    document
      .getElementById("a11y-font-reset")
      .addEventListener("click", function () {
        sizeIndex = 1;
        delete prefs.fontSize;
        applyPrefs(prefs);
        savePrefs(prefs);
      });

    document
      .getElementById("a11y-contrast")
      .addEventListener("click", function () {
        prefs.highContrast = !prefs.highContrast;
        applyPrefs(prefs);
        savePrefs(prefs);
        syncButtons();
      });

    document.getElementById("a11y-motion").addEventListener("click", function () {
      prefs.reduceMotion = !prefs.reduceMotion;
      applyPrefs(prefs);
      savePrefs(prefs);
      syncButtons();
      /* Re-init carousels when motion preference changes */
      document.querySelectorAll("[data-carousel]").forEach(function (el) {
        if (el._carouselApi) el._carouselApi.resetAutoplay();
      });
    });

    syncButtons();
  }

  /* --- Accessible carousel (WCAG 2.2.2, 4.1.3) --- */
  function initCarousel(root) {
    var track = root.querySelector(".carousel__track");
    var slides = Array.prototype.slice.call(
      root.querySelectorAll(".carousel__slide")
    );
    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var pauseBtn = root.querySelector('[data-carousel-pause]');
    var live = root.querySelector(".carousel__status");
    var indicators = root.querySelector(".carousel__indicators");
    if (!track || !slides.length) return;

    var index = 0;
    var timer = null;
    var autoplayEnabled = !prefersReducedMotion();

    function announce() {
      if (!live) return;
      var name = slides[index].querySelector(".carousel__name");
      live.textContent =
        "Slide " +
        (index + 1) +
        " of " +
        slides.length +
        (name ? ": " + name.textContent : "");
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(-" + index * 100 + "%)";
      if (indicators) {
        Array.prototype.forEach.call(
          indicators.querySelectorAll("button"),
          function (btn, idx) {
            btn.setAttribute("aria-selected", idx === index ? "true" : "false");
          }
        );
      }
      announce();
    }

    function startAutoplay() {
      stopAutoplay();
      if (!autoplayEnabled || slides.length < 2) return;
      timer = window.setInterval(function () {
        goTo(index + 1);
      }, 7000);
    }

    function stopAutoplay() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    if (indicators) {
      slides.forEach(function (_, idx) {
        var li = document.createElement("li");
        li.className = "carousel__indicator";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", "Go to slide " + (idx + 1));
        btn.setAttribute("aria-selected", idx === 0 ? "true" : "false");
        btn.addEventListener("click", function () {
          stopAutoplay();
          goTo(idx);
        });
        li.appendChild(btn);
        indicators.appendChild(li);
      });
    }

    if (prevBtn)
      prevBtn.addEventListener("click", function () {
        stopAutoplay();
        goTo(index - 1);
      });
    if (nextBtn)
      nextBtn.addEventListener("click", function () {
        stopAutoplay();
        goTo(index + 1);
      });
    if (pauseBtn) {
      pauseBtn.addEventListener("click", function () {
        var paused = pauseBtn.getAttribute("aria-pressed") === "true";
        if (paused) {
          autoplayEnabled = !prefersReducedMotion();
          pauseBtn.setAttribute("aria-pressed", "false");
          pauseBtn.textContent = "Pause";
          startAutoplay();
        } else {
          autoplayEnabled = false;
          pauseBtn.setAttribute("aria-pressed", "true");
          pauseBtn.textContent = "Play";
          stopAutoplay();
        }
      });
      if (prefersReducedMotion()) {
        pauseBtn.setAttribute("aria-pressed", "true");
        pauseBtn.textContent = "Play";
      }
    }

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
    root.addEventListener("focusin", stopAutoplay);
    root.addEventListener("focusout", function (e) {
      if (!root.contains(e.relatedTarget)) startAutoplay();
    });

    root._carouselApi = {
      resetAutoplay: function () {
        autoplayEnabled = !prefersReducedMotion();
        if (pauseBtn && prefersReducedMotion()) {
          pauseBtn.setAttribute("aria-pressed", "true");
          pauseBtn.textContent = "Play";
        }
        startAutoplay();
      },
    };

    goTo(0);
    startAutoplay();
  }

  /* --- Partners marquee pause control --- */
  function initPartnersMarquee() {
    var marquee = document.querySelector(".partners-marquee");
    var btn = document.querySelector("[data-marquee-toggle]");
    if (!marquee || !btn) return;

    btn.addEventListener("click", function () {
      var paused = marquee.getAttribute("data-paused") === "true";
      marquee.setAttribute("data-paused", paused ? "false" : "true");
      btn.setAttribute("aria-pressed", paused ? "false" : "true");
      btn.textContent = paused ? "Pause partner scroll" : "Resume partner scroll";
    });

    if (prefersReducedMotion()) {
      marquee.setAttribute("data-paused", "true");
      btn.setAttribute("aria-pressed", "true");
      btn.textContent = "Resume partner scroll";
    }
  }

  /* --- Contact form validation (WCAG 3.3.1, 3.3.2, 3.3.3) --- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var fields = ["name", "email", "message"];

    function showError(id, message) {
      var input = document.getElementById(id);
      var err = document.getElementById(id + "-error");
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", id + "-error");
      }
      if (err) {
        err.textContent = message;
        err.hidden = false;
      }
    }

    function clearError(id) {
      var input = document.getElementById(id);
      var err = document.getElementById(id + "-error");
      if (input) {
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
      }
      if (err) {
        err.textContent = "";
        err.hidden = true;
      }
    }

    function validate() {
      var valid = true;
      fields.forEach(clearError);

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();

      if (!name) {
        showError("name", "Please enter your name.");
        valid = false;
      }
      if (!email) {
        showError("email", "Please enter your email address.");
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("email", "Please enter a valid email address.");
        valid = false;
      }
      if (!message) {
        showError("message", "Please enter your message.");
        valid = false;
      }

      var status = document.getElementById("form-status");
      if (!valid) {
        if (status) {
          status.textContent = "There are errors in the form. Please review the fields below.";
        }
        var firstInvalid = form.querySelector("[aria-invalid='true']");
        if (firstInvalid) firstInvalid.focus();
      }
      return valid;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      var status = document.getElementById("form-status");
      if (status) {
        status.textContent =
          "Thank you. Your message has been recorded locally for this demo. Connect a backend endpoint to send email.";
      }
      form.reset();
      fields.forEach(clearError);
    });

    fields.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", function () {
          clearError(id);
        });
      }
    });
  }

  /* --- Impact counters: real number is in the HTML; animation is visual only --- */
  function initCounters() {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length || prefersReducedMotion() || !("IntersectionObserver" in window)) return;

    function run(el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1600, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * eased).toLocaleString("en-IN");
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run(e.target);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (el) {
      io.observe(el);
    });
  }

  /* --- Tabs (role picker) — WAI-ARIA tabs pattern, arrow keys + Home/End --- */
  function initTabs(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          select(next, true);
        }
      });
    });

    /* Panels are all visible without JS; collapse to the selected one now. */
    select(root.querySelector('[aria-selected="true"]') || tabs[0], false);
  }

  function initAll() {
    initMobileNav();
    initA11yToolbar();
    document.querySelectorAll("[data-carousel]").forEach(initCarousel);
    initPartnersMarquee();
    initContactForm();
    initCounters();
    document.querySelectorAll("[data-tabs]").forEach(initTabs);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
