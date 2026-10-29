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
    Object.keys(SWITCHES).forEach(function (key) {
      var attr = SWITCHES[key][1];
      if (prefs[key]) html.setAttribute(attr, SWITCHES[key][2]);
      else html.removeAttribute(attr);
    });
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
  /* On/off settings: pref key -> [button id, <html> attribute] */
  var SWITCHES = {
    highContrast: ["a11y-contrast", "data-a11y-contrast", "high"],
    reduceMotion: ["a11y-motion", "data-a11y-reduce-motion", "true"],
    links: ["a11y-links", "data-a11y-links", "true"],
    cursor: ["a11y-cursor", "data-a11y-cursor", "big"],
    spacing: ["a11y-spacing", "data-a11y-spacing", "true"],
    guide: ["a11y-guide", "data-a11y-guide", "true"],
    hoverSpeak: ["a11y-hover-speak", "data-a11y-hover-speak", "true"],
  };

  function initA11yToolbar() {
    var prefs = loadPrefs();
    /* Follow the OS "increase contrast" setting until the visitor chooses */
    if (prefs.highContrast === undefined && window.matchMedia("(prefers-contrast: more)").matches) {
      prefs.highContrast = true;
    }
    applyPrefs(prefs);

    var toggle = document.getElementById("a11y-toggle");
    var panel = document.getElementById("a11y-panel");
    if (!toggle || !panel) return;

    var sizes = ["sm", "", "lg", "xl"];
    var sizeIndex = sizes.indexOf(prefs.fontSize || "");

    function syncButtons() {
      Object.keys(SWITCHES).forEach(function (key) {
        var btn = document.getElementById(SWITCHES[key][0]);
        if (btn) btn.setAttribute("aria-pressed", prefs[key] ? "true" : "false");
      });
      readingGuide(!!prefs.guide);
    }

    function commit() {
      applyPrefs(prefs);
      savePrefs(prefs);
      syncButtons();
    }

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      panel.hidden = !open;
      if (open) panel.querySelector("h2").focus();
    }

    panel.querySelector("h2").tabIndex = -1;

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.getElementById("a11y-close").addEventListener("click", function () {
      setOpen(false);
      toggle.focus();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });

    function setSize(i) {
      sizeIndex = i;
      if (sizes[i]) prefs.fontSize = sizes[i];
      else delete prefs.fontSize;
      commit();
    }

    document.getElementById("a11y-font-decrease").addEventListener("click", function () {
      setSize(Math.max(0, sizeIndex - 1));
    });
    document.getElementById("a11y-font-increase").addEventListener("click", function () {
      setSize(Math.min(sizes.length - 1, sizeIndex + 1));
    });
    document.getElementById("a11y-font-reset").addEventListener("click", function () {
      setSize(1);
    });

    Object.keys(SWITCHES).forEach(function (key) {
      var btn = document.getElementById(SWITCHES[key][0]);
      if (!btn) return;
      btn.addEventListener("click", function () {
        prefs[key] = !prefs[key];
        commit();
        if (key === "reduceMotion") {
          document.querySelectorAll("[data-carousel]").forEach(function (el) {
            if (el._carouselApi) el._carouselApi.resetAutoplay();
          });
        }
      });
    });

    var rate = document.getElementById("a11y-rate");
    if (prefs.rate) rate.value = String(prefs.rate);
    rate.addEventListener("change", function () {
      prefs.rate = parseFloat(rate.value);
      savePrefs(prefs);
      tts.setRate(prefs.rate);
    });

    document.getElementById("a11y-reset-all").addEventListener("click", function () {
      prefs = { highContrast: false };
      sizeIndex = 1;
      rate.value = "1";
      tts.setRate(1);
      commit();
    });

    tts.init(prefs.rate || 1, function () {
      setOpen(false);
    });
    syncButtons();
  }

  /* --- Reading guide: a clear band that follows the pointer, finger or keyboard focus --- */
  var guideOn = false;
  function readingGuide(on) {
    var el = document.getElementById("reading-guide");
    if (!el) return;
    el.hidden = !on;
    if (on === guideOn) return;
    guideOn = on;
    var move = function (y) {
      el.style.transform = "translateY(" + Math.round(y) + "px)";
    };
    if (!el._wired) {
      el._wired = true;
      document.addEventListener("pointermove", function (e) {
        if (guideOn) move(e.clientY);
      }, { passive: true });
      document.addEventListener("focusin", function (e) {
        if (!guideOn || !e.target.getBoundingClientRect) return;
        var r = e.target.getBoundingClientRect();
        move(r.top + r.height / 2);
      });
      move(window.innerHeight / 3);
    }
  }

  /* --- Read aloud with the browser's own speech engine (Web Speech API).
     A helper for low-vision, dyslexic and other readers; it never starts on its own,
     so it cannot talk over a screen reader. --- */
  var tts = (function () {
    var synth = window.speechSynthesis;
    var rate = 1;
    var blocks = [];
    var index = 0;
    var paused = false;
    var voice = null;
    var player, status, pauseBtn, readBtn, current;

    var BLOCKS = "h1, h2, h3, p, li, dt, dd, figcaption, blockquote, .creed__statement, .options__title, .options__desc, .card-link__title, .path__title, .path__desc";

    function pickVoice() {
      var voices = synth.getVoices();
      voice =
        voices.find(function (v) { return v.lang === "en-IN"; }) ||
        voices.find(function (v) { return /^en[-_]GB/i.test(v.lang); }) ||
        voices.find(function (v) { return /^en/i.test(v.lang); }) ||
        null;
    }

    /* What a sighted reader would read: no aria-hidden copies, no "(opens in a new tab)" notes */
    function speakable(el) {
      var clone = el.cloneNode(true);
      clone.querySelectorAll('[aria-hidden="true"], svg, script, style').forEach(function (n) {
        n.remove();
      });
      return clone.textContent
        .replace(/\(opens in a new tab\)/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function isVisible(el) {
      return !el.closest("[hidden], [aria-hidden='true'], .visually-hidden") && el.getClientRects().length > 0;
    }

    function collect() {
      var main = document.getElementById("main-content") || document.body;
      var all = Array.prototype.slice.call(main.querySelectorAll(BLOCKS)).filter(isVisible);
      /* keep the innermost blocks so nothing is read twice */
      return all.filter(function (el) {
        return !all.some(function (other) {
          return other !== el && el.contains(other);
        });
      }).filter(function (el) {
        return speakable(el).length > 1;
      });
    }

    function mark(el) {
      if (current) current.classList.remove("tts-current");
      current = el;
      if (!el) return;
      el.classList.add("tts-current");
      var r = el.getBoundingClientRect();
      if (r.top < 90 || r.bottom > window.innerHeight - 110) {
        el.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    }

    function utter(text, onend) {
      var u = new SpeechSynthesisUtterance(text);
      u.rate = rate;
      u.lang = voice ? voice.lang : "en-IN";
      if (voice) u.voice = voice;
      u.onend = onend;
      u.onerror = function (e) {
        if (e.error !== "interrupted" && e.error !== "canceled" && onend) onend();
      };
      synth.speak(u);
    }

    function speakFrom(i) {
      synth.cancel();
      if (i < 0) i = 0;
      if (i >= blocks.length) return stop("Finished reading the page");
      index = i;
      paused = false;
      setPausedUi(false);
      mark(blocks[i]);
      status.textContent = "Reading " + (i + 1) + " of " + blocks.length;
      var token = (speakFrom.token = (speakFrom.token || 0) + 1);
      utter(speakable(blocks[i]), function () {
        if (token === speakFrom.token && !paused) speakFrom(index + 1);
      });
    }

    function setPausedUi(isPaused) {
      player.classList.toggle("is-paused", isPaused);
      pauseBtn.setAttribute("aria-label", isPaused ? "Resume reading" : "Pause reading");
    }

    function start() {
      blocks = collect();
      if (!blocks.length) return;
      player.hidden = false;
      readBtn.textContent = "Restart from the top";
      speakFrom(0);
    }

    function stop(message) {
      speakFrom.token = (speakFrom.token || 0) + 1;
      synth.cancel();
      mark(null);
      paused = false;
      player.hidden = true;
      readBtn.textContent = "Read this page aloud";
      if (message) announce(message);
    }

    /* Status for screen reader users once the player hides */
    function announce(text) {
      var live = document.getElementById("tts-announce");
      if (!live) {
        live = document.createElement("p");
        live.id = "tts-announce";
        live.className = "visually-hidden";
        live.setAttribute("aria-live", "polite");
        document.body.appendChild(live);
      }
      live.textContent = text;
    }

    /* "Speak what I point at": hover (with a short dwell), tap or keyboard focus */
    var POINT = "h1, h2, h3, p, li, dt, dd, figcaption, blockquote, a, button, label, summary, img[alt]";
    var hoverTimer = null;
    var lastSpoken = null;

    function speakTarget(el) {
      if (!el || el === lastSpoken || !player.hidden) return;
      lastSpoken = el;
      var text = el.tagName === "IMG" ? "Image: " + el.alt : el.getAttribute("aria-label") || speakable(el);
      if (!text) return;
      synth.cancel();
      utter(text);
    }

    function pointTarget(node) {
      if (!node || !node.closest) return null;
      if (node.closest(".tts-player, .a11y-toolbar__panel")) return null;
      return node.closest(POINT);
    }

    function hoverSpeakOn() {
      return document.documentElement.getAttribute("data-a11y-hover-speak") === "true";
    }

    function wirePointing() {
      document.addEventListener("pointerover", function (e) {
        if (!hoverSpeakOn() || e.pointerType === "touch") return;
        var el = pointTarget(e.target);
        clearTimeout(hoverTimer);
        if (el) hoverTimer = setTimeout(function () { speakTarget(el); }, 350);
      });
      document.addEventListener("pointerout", function () {
        clearTimeout(hoverTimer);
        lastSpoken = null;
      });
      /* touch: tapping plain text speaks it; links and buttons still work as normal */
      document.addEventListener("click", function (e) {
        if (!hoverSpeakOn()) return;
        var el = pointTarget(e.target);
        if (el && !el.closest("a, button, summary, label")) {
          lastSpoken = null;
          speakTarget(el);
        }
      });
      document.addEventListener("focusin", function (e) {
        if (!hoverSpeakOn()) return;
        var el = pointTarget(e.target) || (e.target.matches && e.target.matches("input, select, textarea") ? e.target : null);
        if (!el) return;
        lastSpoken = null;
        if (el.matches("input, select, textarea")) {
          var lab = el.labels && el.labels[0];
          synth.cancel();
          utter((lab ? speakable(lab) + ". " : "") + (el.value || ""));
        } else {
          speakTarget(el);
        }
      });
    }

    function init(initialRate, closePanel) {
      readBtn = document.getElementById("a11y-read");
      player = document.getElementById("tts-player");
      status = document.getElementById("tts-status");
      pauseBtn = document.getElementById("tts-pause");
      if (!readBtn || !player) return;

      if (!synth || !window.SpeechSynthesisUtterance) {
        readBtn.hidden = true;
        document.getElementById("a11y-rate").parentNode.hidden = true;
        document.getElementById("a11y-hover-speak").hidden = true;
        document.getElementById("a11y-tts-missing").hidden = false;
        return;
      }

      rate = initialRate;
      pickVoice();
      if ("onvoiceschanged" in synth) synth.addEventListener("voiceschanged", pickVoice);

      readBtn.addEventListener("click", function () {
        closePanel();
        start();
        pauseBtn.focus();
      });
      pauseBtn.addEventListener("click", function () {
        if (paused) {
          speakFrom(index);
        } else {
          paused = true;
          speakFrom.token++;
          synth.cancel();
          setPausedUi(true);
          status.textContent = "Paused at " + (index + 1) + " of " + blocks.length;
        }
      });
      document.getElementById("tts-next").addEventListener("click", function () {
        speakFrom(index + 1);
      });
      document.getElementById("tts-prev").addEventListener("click", function () {
        speakFrom(index - 1);
      });
      document.getElementById("tts-stop").addEventListener("click", function () {
        stop("Stopped reading");
        readBtn.closest(".a11y-toolbar").querySelector(".a11y-toolbar__toggle").focus();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !player.hidden && document.getElementById("a11y-panel").hidden) stop("Stopped reading");
      });
      /* Chrome keeps talking after navigation unless told to stop */
      window.addEventListener("pagehide", function () {
        synth.cancel();
      });

      wirePointing();
    }

    return {
      init: init,
      setRate: function (r) {
        rate = r;
        if (player && !player.hidden && !paused) speakFrom(index);
      },
    };
  })();

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

  /* --- Light/dark theme. The inline <head> script sets data-theme before paint;
     this only wires the button and remembers an explicit choice. --- */
  function initThemeToggle() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    var html = document.documentElement;
    var meta = document.querySelector('meta[name="theme-color"]');

    function sync() {
      var dark = html.getAttribute("data-theme") === "dark";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
      if (meta) meta.setAttribute("content", dark ? "#061317" : "#0e2a33");
    }

    btn.addEventListener("click", function () {
      var next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      try {
        localStorage.setItem("abbf-theme", next);
      } catch (e) {
        /* ignore */
      }
      sync();
    });

    sync();
    requestAnimationFrame(function () {
      html.classList.add("theme-ready");
    });
  }

  /* --- Scroll reveal: content is visible without JS; only animate when motion is allowed --- */
  function initReveal() {
    var els = document.querySelectorAll("[data-reveal]");
    if (!els.length || prefersReducedMotion() || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.classList.add("is-revealed");
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) {
      el.classList.add("reveal-pending");
      io.observe(el);
    });
  }

  function initAll() {
    initThemeToggle();
    initReveal();
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
