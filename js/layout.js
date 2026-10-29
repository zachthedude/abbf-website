/**
 * Shared layout injection for static pages.
 * Keeps header/footer markup in one place for consistency across URLs.
 */
(function () {
  "use strict";

  /* Site root derived from this script's URL, so the site works at "/" locally
     and under "/<repo>/" on GitHub Pages without a build step. */
  var ROOT = document.currentScript.src.replace(/js\/layout\.js(\?.*)?$/, "");

  var NAV_ITEMS = [
    { href: "", label: "home" },
    { href: "about/", label: "who we are" },
    { href: "what-we-do/", label: "what we do" },
    { href: "our-work/", label: "our work so far" },
    { href: "events/upcoming/", label: "upcoming experiences" },
    { href: "blog/", label: "blog" },
    { href: "contact/", label: "contact us" },
  ];

  function normalizePath(path) {
    return path.replace(/index\.html$/, "");
  }

  function isCurrent(href, currentPath) {
    var h = normalizePath(new URL(ROOT + href).pathname);
    var c = normalizePath(currentPath);
    return href === "" ? h === c : c.indexOf(h) === 0;
  }

  function navLinks(currentPath) {
    return NAV_ITEMS.map(function (item) {
      var current = isCurrent(item.href, currentPath);
      return (
        '<a href="' + ROOT + item.href + '" class="site-nav__link' +
        (current ? ' site-nav__link--current" aria-current="page"' : '"') +
        ">" + item.label + "</a>"
      );
    }).join("\n");
  }

  function renderSkipLink() {
    return (
      '<a class="skip-link" href="#main-content">Skip to main content</a>'
    );
  }

  /* Universal-access figure, drawn to match the header icons' 2px stroke */
  var A11Y_ICON =
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="4.5" r="1.8" fill="currentColor" stroke="none"/><path d="M4.5 8.5c2.4.8 4.9 1.2 7.5 1.2s5.1-.4 7.5-1.2M12 9.7v4.6M12 14.3l-3 6.2M12 14.3l3 6.2"/></svg>';

  function toggleBtn(id, label, hint) {
    return (
      '<button type="button" class="a11y-switch" id="' + id + '" aria-pressed="false">' +
      '<span class="a11y-switch__text"><span class="a11y-switch__label">' + label + "</span>" +
      '<span class="a11y-switch__hint">' + hint + "</span></span>" +
      '<span class="a11y-switch__track" aria-hidden="true"></span>' +
      "</button>"
    );
  }

  function renderA11yToolbar() {
    return (
      '<aside class="a11y-toolbar" aria-label="Accessibility settings">' +
      '<button type="button" class="a11y-toolbar__toggle" aria-expanded="false" aria-controls="a11y-panel" id="a11y-toggle" title="Accessibility and read aloud">' +
      A11Y_ICON + '<span class="visually-hidden">Accessibility and read aloud</span>' +
      "</button>" +
      '<div class="a11y-toolbar__panel" id="a11y-panel" role="region" aria-labelledby="a11y-panel-title" hidden>' +
      '<div class="a11y-toolbar__head">' +
      '<h2 class="a11y-toolbar__title" id="a11y-panel-title">Make this site work for you</h2>' +
      '<button type="button" class="a11y-toolbar__close" id="a11y-close" aria-label="Close accessibility settings">' +
      '<span class="burger burger--x burger--static" aria-hidden="true"><span></span><span></span></span></button>' +
      "</div>" +
      '<p class="a11y-toolbar__note">Settings are saved on this device. Already use a screen reader? Every page is built to work with NVDA, JAWS, VoiceOver and TalkBack.</p>' +

      '<section class="a11y-toolbar__section" id="a11y-listen" aria-labelledby="a11y-listen-h">' +
      '<h3 class="a11y-toolbar__section-title" id="a11y-listen-h">Listen</h3>' +
      '<button type="button" class="btn btn-primary a11y-toolbar__read" id="a11y-read">Read this page aloud</button>' +
      '<div class="a11y-toolbar__row">' +
      '<label for="a11y-rate" class="a11y-toolbar__label">Reading speed</label>' +
      '<select id="a11y-rate" class="a11y-toolbar__select">' +
      '<option value="0.75">Slow</option><option value="1" selected>Normal</option><option value="1.25">Fast</option><option value="1.5">Faster</option>' +
      "</select>" +
      "</div>" +
      toggleBtn("a11y-hover-speak", "Speak what I point at", "Hover, tap or tab to any text to hear it") +
      '<p class="a11y-toolbar__note" id="a11y-tts-missing" hidden>Your browser cannot read aloud. Try Chrome, Edge or Safari, or your device\'s built-in screen reader.</p>' +
      "</section>" +

      '<section class="a11y-toolbar__section" aria-labelledby="a11y-see-h">' +
      '<h3 class="a11y-toolbar__section-title" id="a11y-see-h">See</h3>' +
      '<div class="a11y-toolbar__group" role="group" aria-labelledby="a11y-font-label">' +
      '<span id="a11y-font-label" class="a11y-toolbar__label">Text size</span>' +
      '<button type="button" id="a11y-font-decrease" aria-label="Decrease text size">A−</button>' +
      '<button type="button" id="a11y-font-reset" aria-label="Reset text size">Reset</button>' +
      '<button type="button" id="a11y-font-increase" aria-label="Increase text size">A+</button>' +
      "</div>" +
      toggleBtn("a11y-contrast", "High contrast", "Black on white, strongest outlines") +
      toggleBtn("a11y-links", "Highlight links", "Underline and mark everything clickable") +
      toggleBtn("a11y-cursor", "Big cursor", "A larger pointer that is easier to follow") +
      "</section>" +

      '<section class="a11y-toolbar__section" aria-labelledby="a11y-read-h">' +
      '<h3 class="a11y-toolbar__section-title" id="a11y-read-h">Read</h3>' +
      toggleBtn("a11y-spacing", "Easier reading", "More space between letters, words and lines") +
      toggleBtn("a11y-guide", "Reading guide", "Dims the page except the line you are on") +
      "</section>" +

      '<section class="a11y-toolbar__section" aria-labelledby="a11y-move-h">' +
      '<h3 class="a11y-toolbar__section-title" id="a11y-move-h">Movement</h3>' +
      toggleBtn("a11y-motion", "Stop animations", "Freeze carousels, scrolling logos and effects") +
      "</section>" +

      '<button type="button" class="a11y-toolbar__reset" id="a11y-reset-all">Reset all settings</button>' +
      "</div>" +
      "</aside>" +
      /* Floating player while the page is being read; lives outside the panel so it stays visible */
      '<div class="tts-player" id="tts-player" role="region" aria-label="Read aloud controls" hidden>' +
      '<p class="tts-player__status" id="tts-status" aria-live="polite">Reading</p>' +
      '<button type="button" class="tts-player__btn" id="tts-prev" aria-label="Previous paragraph">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg></button>' +
      '<button type="button" class="tts-player__btn tts-player__btn--main" id="tts-pause" aria-label="Pause reading">' +
      '<svg class="tts-icon-pause" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>' +
      '<svg class="tts-icon-play" viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg></button>' +
      '<button type="button" class="tts-player__btn" id="tts-next" aria-label="Next paragraph">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg></button>' +
      '<button type="button" class="tts-player__btn" id="tts-stop" aria-label="Stop reading">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6 6h12v12H6z"/></svg></button>' +
      "</div>" +
      '<div class="reading-guide" id="reading-guide" aria-hidden="true" hidden></div>'
    );
  }

  var NEW_TAB = '<span class="visually-hidden"> (opens in a new tab)</span>';

  function renderQuickActions() {
    return (
      '<nav class="quick-actions" aria-label="Quick actions">' +
      '<a href="https://give.abbf.in" class="quick-actions__link quick-actions__link--primary" target="_blank" rel="noopener noreferrer">Donate' + NEW_TAB + "</a>" +
      '<a href="' + ROOT + 'volunteer/" class="quick-actions__link">Volunteer</a>' +
      '<a href="' + ROOT + 'contact/" class="quick-actions__link">Contact</a>' +
      "</nav>"
    );
  }

  function renderHeader(currentPath) {
    return (
      '<header class="site-header">' +
      '<div class="site-header__bar">' +
      '<a href="' + ROOT + '" class="site-header__logo">' +
      '<img src="https://storage.googleapis.com/abbf/images/logo.png" alt="Adventures Beyond Barriers Foundation home" width="165" height="48" />' +
      "</a>" +
      '<nav class="site-nav" aria-label="Primary">' +
      navLinks(currentPath) +
      "</nav>" +
      '<a href="https://give.abbf.in" class="btn btn-primary btn-sm site-header__donate" target="_blank" rel="noopener noreferrer">Donate' + NEW_TAB + "</a>" +
      '<button type="button" class="theme-toggle" id="theme-toggle" aria-pressed="false">' +
      '<svg class="theme-toggle__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
      '<svg class="theme-toggle__moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>' +
      '<span class="visually-hidden">Dark mode</span>' +
      "</button>" +
      '<button type="button" class="site-header__menu-btn" id="menu-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Open navigation menu">' +
      '<span class="burger" aria-hidden="true"><span></span><span></span></span>' +
      "</button>" +
      "</div>" +
      '<div class="mobile-nav" id="mobile-nav" hidden>' +
      '<div class="mobile-nav__dialog" role="dialog" aria-modal="true" aria-labelledby="mobile-nav-title">' +
      '<div class="mobile-nav__header">' +
      '<p id="mobile-nav-title" class="mobile-nav__title">Menu</p>' +
      '<button type="button" class="mobile-nav__close" id="menu-close" aria-label="Close navigation menu">' +
      '<span class="burger burger--x" aria-hidden="true"><span></span><span></span></span>' +
      "</button>" +
      "</div>" +
      '<nav class="mobile-nav__links" aria-label="Mobile primary">' +
      navLinks(currentPath) +
      "</nav>" +
      '<a href="https://give.abbf.in" class="btn btn-primary btn-lg mobile-nav__donate" target="_blank" rel="noopener noreferrer">Donate now' + NEW_TAB + "</a>" +
      "</div>" +
      "</div>" +
      "</header>"
    );
  }

  function renderFooter() {
    var ext = ' target="_blank" rel="noopener noreferrer"';
    return (
      '<footer class="site-footer">' +
      '<div class="inner site-footer__grid">' +
      '<p class="site-footer__mark">strength lies in community.</p>' +
      '<div class="site-footer__col">' +
      '<h2 class="site-footer__heading">Get in touch</h2>' +
      '<ul class="site-footer__list" role="list">' +
      '<li><a href="mailto:divyanshu@abbf.in">divyanshu@abbf.in</a></li>' +
      '<li><a href="tel:+919890993825">+91 98909 93825</a></li>' +
      '<li><a href="https://wa.me/919011140185"' + ext + ">Message us on WhatsApp" + NEW_TAB + "</a></li>" +
      "</ul>" +
      "</div>" +
      '<div class="site-footer__col">' +
      '<h2 class="site-footer__heading">Follow along</h2>' +
      '<ul class="site-footer__list" role="list">' +
      '<li><a href="https://in.linkedin.com/company/abbf"' + ext + ">LinkedIn" + NEW_TAB + "</a></li>" +
      '<li><a href="https://www.instagram.com/adventuresbeyondbarriers/"' + ext + ">Instagram" + NEW_TAB + "</a></li>" +
      '<li><a href="https://www.youtube.com/AdventuresbeyondBarriers"' + ext + ">YouTube" + NEW_TAB + "</a></li>" +
      "</ul>" +
      "</div>" +
      '<div class="site-footer__col">' +
      '<h2 class="site-footer__heading">Explore</h2>' +
      '<ul class="site-footer__list" role="list">' +
      NAV_ITEMS.slice(1).map(function (item) {
        return '<li><a href="' + ROOT + item.href + '">' + item.label + "</a></li>";
      }).join("") +
      "</ul>" +
      "</div>" +
      "</div>" +
      '<div class="inner site-footer__legal">' +
      "<p>&copy; 2016–26 Adventures Beyond Barriers Foundation. All rights reserved.</p>" +
      '<p>Developed by <a href="https://www.qicode.co"' + ext + ">Qicode Solutions" + NEW_TAB + "</a></p>" +
      "</div>" +
      "</footer>"
    );
  }

  function inject() {
    var path = window.location.pathname;
    var skip = document.getElementById("skip-link-root");
    var header = document.getElementById("header-root");
    var footer = document.getElementById("footer-root");
    var a11y = document.getElementById("a11y-root");
    var quick = document.getElementById("quick-actions-root");

    if (skip) skip.innerHTML = renderSkipLink();
    if (header) header.innerHTML = renderHeader(path);
    if (footer) footer.innerHTML = renderFooter();
    if (a11y) a11y.innerHTML = renderA11yToolbar();
    if (quick) quick.innerHTML = renderQuickActions();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();
