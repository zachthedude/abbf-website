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

  function renderA11yToolbar() {
    return (
      '<aside class="a11y-toolbar" aria-label="Accessibility settings">' +
      '<button type="button" class="a11y-toolbar__toggle" aria-expanded="false" aria-controls="a11y-panel" id="a11y-toggle">' +
      '<span aria-hidden="true">A</span><span class="visually-hidden">Accessibility settings</span>' +
      "</button>" +
      '<div class="a11y-toolbar__panel" id="a11y-panel" hidden>' +
      '<p class="a11y-toolbar__title" id="a11y-panel-title">Accessibility</p>' +
      '<div class="a11y-toolbar__group" role="group" aria-labelledby="a11y-font-label">' +
      '<span id="a11y-font-label" class="a11y-toolbar__label">Text size</span>' +
      '<button type="button" id="a11y-font-decrease" aria-label="Decrease text size">A−</button>' +
      '<button type="button" id="a11y-font-reset" aria-label="Reset text size">Reset</button>' +
      '<button type="button" id="a11y-font-increase" aria-label="Increase text size">A+</button>' +
      "</div>" +
      '<button type="button" id="a11y-contrast" aria-pressed="false">High contrast</button>' +
      '<button type="button" id="a11y-motion" aria-pressed="false">Reduce motion</button>' +
      "</div>" +
      "</aside>"
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
