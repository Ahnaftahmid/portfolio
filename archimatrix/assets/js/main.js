/* =========================================================
   Archimatrix — motion & interaction
   GSAP 3.13 (ScrollTrigger, SplitText) + Lenis smooth scroll
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  gsap.registerPlugin(ScrollTrigger, SplitText);
  gsap.defaults({ ease: "expo.out", duration: 1.2 });

  /* ---------- Missing-image fallback ---------- */
  const markMissing = (img) => {
    img.classList.add("is-missing");
    const logo = img.closest(".header__logo");
    if (logo) logo.classList.add("is-fallback");
  };
  $$("img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) markMissing(img);
    // Images with an inline onerror swap to a fallback source first
    img.addEventListener("error", () => { if (!img.hasAttribute("onerror") || img.src.endsWith("cloudtree.jpg")) markMissing(img); });
  });

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduceMotion) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  const scrollToTarget = (target) => {
    const el = target === "#top" ? 0 : $(target);
    if (el === null) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.8, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
    else if (el === 0) window.scrollTo({ top: 0 });
    else el.scrollIntoView();
  };

  /* ---------- Menu (tablet / mobile) ---------- */
  const menu = $("[data-menu]");
  const burger = $("[data-burger]");
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open;
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", String(!open));
    if (open) {
      lenis && lenis.stop();
      gsap.set(menu, { visibility: "visible" });
      gsap.fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1, ease: "expo.inOut" });
      gsap.fromTo($$(".menu__nav a span", menu), { yPercent: 110 }, { yPercent: 0, stagger: 0.06, delay: 0.35 });
      gsap.fromTo(".menu__foot", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, delay: 0.6 });
    } else {
      lenis && lenis.start();
      gsap.to(menu, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut", onComplete: () => gsap.set(menu, { visibility: "hidden" }) });
    }
  };
  burger.addEventListener("click", () => setMenu(!menuOpen));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menuOpen) setMenu(false); });

  $$("[data-scroll-to]").forEach((a) =>
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      e.preventDefault();
      if (menuOpen) { setMenu(false); setTimeout(() => scrollToTarget(href), 450); }
      else scrollToTarget(href);
    })
  );

  /* ---------- Custom cursor + magnetic ---------- */
  const cursor = $("[data-cursor]");
  const cursorLabel = $("[data-cursor-label]");
  if (finePointer && !reduceMotion) {
    const dot = $(".cursor__dot", cursor);
    const ring = $(".cursor__ring", cursor);
    const dx = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power3" });
    const dy = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power3" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });
    let shown = false;
    window.addEventListener("pointermove", (e) => {
      if (!shown) { shown = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); gsap.to(cursor, { autoAlpha: 1, duration: 0.4 }); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      const labelled = e.target.closest("[data-cursor-text]");
      const link = e.target.closest("a, button");
      cursor.classList.toggle("has-label", !!labelled && !link);
      cursor.classList.toggle("is-link", !!link);
      if (labelled && !link) cursorLabel.textContent = labelled.dataset.cursorText;
    });
    document.addEventListener("pointerleave", () => gsap.to(cursor, { autoAlpha: 0, duration: 0.3 }));
    document.addEventListener("pointerenter", () => shown && gsap.to(cursor, { autoAlpha: 1, duration: 0.3 }));

    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, .4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, .4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Header behaviour ---------- */
  const header = $("[data-header]");
  ScrollTrigger.create({
    start: "top top-=120",
    end: "max",
    onUpdate: (self) => {
      if (menuOpen) return;
      header.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > window.innerHeight * 0.6);
    },
    onToggle: (self) => { if (!self.isActive) header.classList.remove("is-hidden"); },
  });
  ScrollTrigger.create({
    trigger: "[data-hero]",
    start: "bottom top+=80",
    onEnter: () => header.classList.add("is-solid"),
    onLeaveBack: () => header.classList.remove("is-solid"),
  });
  // Active nav item per section
  $$(".nav__link").forEach((link) => {
    const target = $(link.getAttribute("href"));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target, start: "top 50%", end: "bottom 50%",
      onToggle: (self) => link.classList.toggle("is-active", self.isActive),
    });
  });

  /* ---------- Text helpers ---------- */
  const splitLines = (el, opts = {}) =>
    SplitText.create(el, { type: "lines", mask: "lines", linesClass: "split-line", autoSplit: false, ...opts });

  /* ---------- Hero slideshow ---------- */
  const hero = $("[data-hero]");
  const slides = $$("[data-slide]", hero);
  const heroTitle = $("[data-hero-title]");
  const heroName = $("[data-hero-name]");
  const heroLoc = $("[data-hero-loc]");
  const heroIndex = $("[data-hero-index]");
  const dotsWrap = $("[data-hero-dots]");
  $("[data-hero-total]").textContent = String(slides.length).padStart(2, "0");
  const SLIDE_MS = 6.5;
  let current = 0;
  let heroBusy = false;
  let heroTitleSplit = null;
  let progressTween = null;
  let kenBurns = null;

  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.className = "hero__dot";
    b.setAttribute("aria-label", `Show slide ${i + 1}`);
    b.innerHTML = "<i></i>";
    b.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(b);
    return b;
  });

  const startKenBurns = (slide) => {
    kenBurns && kenBurns.kill();
    kenBurns = gsap.fromTo($("img", slide), { scale: 1.12 }, { scale: 1, duration: SLIDE_MS + 2, ease: "none" });
  };
  const startProgress = () => {
    progressTween && progressTween.kill();
    dots.forEach((d, i) => gsap.set($("i", d), { scaleX: i < current ? 1 : 0 }));
    progressTween = gsap.fromTo($("i", dots[current]), { scaleX: 0 }, {
      scaleX: 1, duration: SLIDE_MS, ease: "none",
      onComplete: () => goTo((current + 1) % slides.length),
    });
  };

  const renderTitle = (text) => {
    heroTitleSplit && heroTitleSplit.revert();
    heroTitle.textContent = text;
    heroTitleSplit = splitLines(heroTitle);
    return heroTitleSplit.lines;
  };

  function goTo(next) {
    if (heroBusy || next === current) return;
    heroBusy = true;
    const prev = slides[current];
    const incoming = slides[next];
    const dir = next > current || (current === slides.length - 1 && next === 0) ? 1 : -1;
    current = next;
    heroIndex.textContent = String(next + 1).padStart(2, "0");
    progressTween && progressTween.pause();

    const tl = gsap.timeline({
      defaults: { ease: "expo.inOut" },
      onComplete: () => { prev.classList.remove("is-active"); heroBusy = false; startProgress(); },
    });
    gsap.set(incoming, { zIndex: 2 });
    gsap.set(prev, { zIndex: 1 });
    incoming.classList.add("is-active");
    tl.fromTo(incoming, { clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0%)", duration: 1.6 }, 0)
      .fromTo($("img", incoming), { scale: 1.3, xPercent: 8 * dir }, { scale: 1.12, xPercent: 0, duration: 1.6, onComplete: () => startKenBurns(incoming) }, 0)
      .to($("img", prev), { xPercent: -14 * dir, duration: 1.6 }, 0)
      .to(heroTitleSplit.lines, { yPercent: -110, stagger: 0.05, duration: 0.8, ease: "expo.in" }, 0)
      .to([heroName, heroLoc], { yPercent: -110, autoAlpha: 0, stagger: 0.05, duration: 0.6, ease: "expo.in" }, 0)
      .add(() => {
        const lines = renderTitle(incoming.dataset.title);
        heroName.textContent = incoming.dataset.name;
        heroLoc.textContent = incoming.dataset.loc;
        gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, stagger: 0.08, duration: 1.3, ease: "expo.out" });
        gsap.fromTo([heroName, heroLoc], { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.08, duration: 1.1, ease: "expo.out" });
      }, 0.85)
      .add(() => gsap.set($("img", prev), { xPercent: 0 }));
  }

  // Pause autoplay when hero is off-screen or tab hidden
  ScrollTrigger.create({
    trigger: hero, start: "top top", end: "bottom top",
    onLeave: () => { progressTween && progressTween.pause(); kenBurns && kenBurns.pause(); },
    onEnterBack: () => { progressTween && progressTween.resume(); kenBurns && kenBurns.resume(); },
  });
  document.addEventListener("visibilitychange", () => {
    if (!progressTween) return;
    document.hidden ? progressTween.pause() : progressTween.resume();
  });

  // Swipe on touch
  let touchX = null;
  hero.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const d = e.changedTouches[0].clientX - touchX;
    if (Math.abs(d) > 50) goTo((current + (d < 0 ? 1 : -1) + slides.length) % slides.length);
    touchX = null;
  });

  /* ---------- Intro sequence (after loader) ---------- */
  const playIntro = () => {
    root.classList.remove("is-loading");
    lenis && lenis.start();
    const lines = renderTitle(slides[0].dataset.title);
    const tl = gsap.timeline();
    tl.fromTo($("img", slides[0]), { scale: 1.35 }, { scale: 1.12, duration: 2.2, ease: "expo.out", onComplete: () => startKenBurns(slides[0]) }, 0)
      .set([heroTitle, ".hero__caption", ".hero__pager", header], { visibility: "visible" }, 0)
      .fromTo(lines, { yPercent: 110 }, { yPercent: 0, stagger: 0.1, duration: 1.5 }, 0.35)
      .fromTo([heroName, heroLoc], { yPercent: 110, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.08 }, 0.7)
      .fromTo(".hero__pager", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0 }, 0.8)
      .fromTo(header, { yPercent: -100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1.4, clearProps: "transform" }, 0.5)
      .fromTo(".hero__scroll", { autoAlpha: 0 }, { autoAlpha: 1 }, 1.2)
      .add(startProgress, 1);
  };

  /* ---------- Preloader ---------- */
  const loader = $("[data-loader]");
  const runLoader = () => {
    const markHolder = $("[data-loader-mark]");
    markHolder.appendChild($("[data-footer-mark] svg").cloneNode(true));
    const svg = $("svg", markHolder);
    svg.style.overflow = "hidden";
    const letters = $$("path", svg).sort((a, b) => a.getBBox().x - b.getBBox().x);
    const count = $("[data-loader-count]");
    const bar = $("[data-loader-bar]");

    // Real progress from critical images, floored by a minimum cinematic duration
    const critical = [$("img", slides[0]), $(".header__logo img")].filter(Boolean);
    let loaded = 0;
    const state = { p: 0 };
    const target = { v: 0 };
    critical.forEach((img) => {
      const done = () => { loaded++; target.v = loaded / critical.length; };
      if (img.complete) done(); else { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }
    });
    setTimeout(() => { target.v = 1; }, 4000); // never hang on slow networks

    gsap.set(letters, { y: 170 });
    gsap.to(letters, { y: 0, stagger: 0.05, duration: 1.4, ease: "expo.out", delay: 0.2 });

    const tick = () => {
      state.p += (Math.min(target.v, 1) - state.p) * 0.06 + 0.004;
      state.p = Math.min(state.p, target.v === 1 ? 1 : 0.9);
      const pct = Math.round(state.p * 100);
      count.textContent = pct;
      gsap.set(bar, { scaleX: state.p });
      if (pct >= 100) { gsap.ticker.remove(tick); exit(); }
    };
    const minTime = gsap.delayedCall(1.6, () => gsap.ticker.add(tick));

    const exit = () => {
      const tl = gsap.timeline({ onComplete: () => { loader.remove(); ScrollTrigger.refresh(); } });
      tl.to(letters, { y: -170, stagger: 0.03, duration: 0.9, ease: "expo.in" }, 0.1)
        .to(".loader__meta, .loader__bar", { autoAlpha: 0, duration: 0.5 }, 0.2)
        .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.2, ease: "expo.inOut" }, 0.8)
        .add(playIntro, 1.05);
    };
    return minTime;
  };

  /* ---------- Scroll-driven reveals ---------- */
  const initReveals = () => {
    // Line reveals
    $$("[data-split-lines]").forEach((el) => {
      const split = splitLines(el);
      gsap.set(el, { visibility: "visible" });
      // Text inside pinned project panels triggers off the panel itself
      const panel = el.closest("[data-project]");
      gsap.fromTo(split.lines, { yPercent: 110 }, {
        yPercent: 0, stagger: 0.09, duration: 1.4,
        scrollTrigger: panel ? { trigger: panel, start: "top 55%" } : { trigger: el, start: "top 88%" },
      });
    });

    // Character reveals (big serif titles)
    $$("[data-split-chars]").forEach((el) => {
      const split = SplitText.create(el, { type: "chars,words", mask: "words", charsClass: "split-char" });
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(split.chars, { yPercent: 115, rotate: 6 }, {
        yPercent: 0, rotate: 0, stagger: 0.035, duration: 1.5,
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // Simple fades
    $$("[data-fade]").forEach((el) => {
      gsap.fromTo(el, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.2, scrollTrigger: { trigger: el, start: "top 92%" } });
    });

    // Line draws
    $$("[data-draw-x]").forEach((el) => gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 90%" } }));
    $$("[data-draw-y]").forEach((el) => gsap.fromTo(el, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top 80%", end: "bottom bottom", scrub: true } }));

    // Image clip reveals
    $$("[data-reveal-img]").forEach((el) => {
      const fromLeft = el.dataset.revealImg === "left";
      const img = $("img", el);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%" } });
      tl.fromTo(el, { clipPath: fromLeft ? "inset(0 100% 0 0)" : "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" })
        .fromTo(img, { scale: 1.4 }, { scale: 1, duration: 2, ease: "expo.out" }, 0.2);
    });

    // Parallax layers
    $$("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 10;
      gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Rotating crosshairs
    $$("[data-spin]").forEach((el) => gsap.to(el, { rotate: 360, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 } }));

    // Statement: words light up as you scroll
    $$("[data-scrub-words]").forEach((el) => {
      const split = SplitText.create(el, { type: "words", wordsClass: "w" });
      gsap.to(split.words, {
        color: "#ffffff", stagger: 0.1, ease: "none",
        scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 35%", scrub: true },
      });
    });
  };

  /* ---------- Hero scroll-out ---------- */
  const initHeroScroll = () => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    tl.to(".hero__slides", { yPercent: 28, ease: "none" }, 0)
      .to([heroTitle, ".hero__caption", ".hero__pager"], { yPercent: -60, autoAlpha: 0, ease: "none" }, 0)
      .to(".hero__overlay", { opacity: 1.4, ease: "none" }, 0);
  };

  /* ---------- Projects: stacked panels ---------- */
  const initProjects = () => {
    const panels = $$("[data-project]");
    panels.forEach((panel, i) => {
      const img = $(".project__media img", panel);
      const shade = document.createElement("div");
      shade.className = "project__shade";
      panel.appendChild(shade);

      // Image drifts inside its frame as panel enters
      gsap.fromTo(img, { yPercent: -10, scale: 1.25 }, {
        yPercent: 0, scale: 1.1, ease: "none",
        scrollTrigger: { trigger: panel, start: "top bottom", end: "top top", scrub: true },
      });

      if (i === panels.length - 1) return;
      ScrollTrigger.create({ trigger: panel, start: "top top", end: () => "+=" + panel.offsetHeight, pin: true, pinSpacing: false });
      const out = gsap.timeline({ scrollTrigger: { trigger: panels[i + 1], start: "top bottom", end: "top top", scrub: true } });
      out.to(shade, { opacity: 0.7, ease: "none" }, 0)
        .to($(".project__media", panel), { scale: 0.92, yPercent: -6, ease: "none" }, 0)
        .to($(".project__info", panel), { yPercent: -120, autoAlpha: 0, ease: "none" }, 0);
    });
  };

  /* ---------- Sketch → Reality lens ---------- */
  const initSketch = () => {
    const film = $("[data-sketch]");
    const stage = $("[data-sketch-stage]");
    const photo = $("[data-sketch-photo]");
    const radius = { r: 0 };
    const setR = () => photo.style.setProperty("--r", radius.r + "px");
    let pinned = false;

    const move = (x, y) => {
      const r = stage.getBoundingClientRect();
      photo.style.setProperty("--mx", ((x - r.left) / r.width) * 100 + "%");
      photo.style.setProperty("--my", ((y - r.top) / r.height) * 100 + "%");
    };
    film.addEventListener("pointerenter", (e) => { move(e.clientX, e.clientY); if (!pinned) gsap.to(radius, { r: Math.max(120, stage.offsetWidth * 0.19), duration: 1, onUpdate: setR }); });
    film.addEventListener("pointermove", (e) => move(e.clientX, e.clientY));
    film.addEventListener("pointerleave", () => { if (!pinned) gsap.to(radius, { r: 0, duration: 0.8, ease: "expo.inOut", onUpdate: setR }); });
    // Tap / click toggles the full built photo (touch friendly)
    film.addEventListener("click", (e) => {
      pinned = !pinned;
      move(e.clientX, e.clientY);
      gsap.to(radius, { r: pinned ? stage.offsetWidth * 1.3 : finePointer ? Math.max(120, stage.offsetWidth * 0.19) : 0, duration: 1.4, ease: "expo.inOut", onUpdate: setR });
    });

    gsap.fromTo(film, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 2, scrollTrigger: { trigger: film, start: "top 80%" } });
    // Pause the CSS film loop when off-screen
    ScrollTrigger.create({
      trigger: film, start: "top bottom", end: "bottom top",
      onToggle: (self) => film.classList.toggle("is-paused", !self.isActive),
    });
  };

  /* ---------- CloudTree disciplines ---------- */
  const initCloudtree = () => {
    const sec = $("[data-cloudtree]");
    gsap.fromTo($(".cloudtree__media img", sec), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true } });
    $$("[data-word]", sec).forEach((w, i) => {
      const dir = parseFloat(w.dataset.word);
      gsap.fromTo(w, { xPercent: 45 * dir, autoAlpha: 0 }, {
        xPercent: 0, autoAlpha: 1, ease: "power2.out",
        scrollTrigger: { trigger: sec, start: `top ${85 - i * 8}%`, end: `top ${25 - i * 6}%`, scrub: 1 },
      });
    });
  };

  /* ---------- Expertise accordion ---------- */
  const initAccordion = () => {
    const items = $$("[data-acc-item]");
    const toggle = (item, open, instant = false) => {
      const panel = $("[data-acc-panel]", item);
      const head = $("[data-acc-head]", item);
      head.setAttribute("aria-expanded", String(open));
      item.classList.toggle("is-open", open);
      const img = $(".acc__img", item);
      const copy = $$(".acc__copy > *", item);
      if (instant || reduceMotion) { gsap.set(panel, { height: open ? "auto" : 0 }); return; }
      if (open) {
        gsap.fromTo(panel, { height: 0 }, { height: "auto", duration: 1, ease: "expo.inOut", onComplete: () => ScrollTrigger.refresh() });
        gsap.fromTo(img, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 1.3, ease: "expo.inOut", delay: 0.1 });
        gsap.fromTo($("img", img), { scale: 1.3 }, { scale: 1, duration: 1.8, delay: 0.1 });
        gsap.fromTo(copy, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, delay: 0.35 });
      } else {
        gsap.to(panel, { height: 0, duration: 0.9, ease: "expo.inOut", onComplete: () => ScrollTrigger.refresh() });
        gsap.to(img, { clipPath: "inset(100% 0 0% 0)", duration: 0.8, ease: "expo.inOut" });
      }
    };
    items.forEach((item) => {
      $("[data-acc-head]", item).addEventListener("click", () => {
        const willOpen = !item.classList.contains("is-open");
        items.forEach((other) => { if (other !== item && other.classList.contains("is-open")) toggle(other, false); });
        toggle(item, willOpen);
      });
    });
    // Rows rise in
    gsap.fromTo(items, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.1, duration: 1.3, scrollTrigger: { trigger: "[data-acc]", start: "top 85%" } });
    // Ornament drift
    gsap.fromTo("[data-deco]", { yPercent: -15, rotate: -4 }, { yPercent: 15, rotate: 4, ease: "none", scrollTrigger: { trigger: ".expertise", start: "top bottom", end: "bottom top", scrub: true } });
  };

  /* ---------- Contact parallax ---------- */
  const initContact = () => {
    const sec = $("[data-contact]");
    const st = { trigger: sec, start: "top bottom", end: "bottom top", scrub: true };
    gsap.fromTo("[data-contact-sky]", { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: st });
    gsap.fromTo("[data-contact-tower]", { yPercent: 5, scale: 1.08 }, { yPercent: -3, scale: 1, ease: "none", scrollTrigger: { ...st } });
  };

  /* ---------- Footer curtain ---------- */
  const initFooter = () => {
    const footer = $("[data-footer]");
    gsap.fromTo($$(":scope > *:not(.footer__texture)", footer), { yPercent: -18 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: footer, start: "top bottom", end: "bottom bottom", scrub: true } });
    gsap.fromTo("[data-footer-texture]", { rotate: -6, scale: 1.1 }, { rotate: 0, scale: 1, ease: "none", scrollTrigger: { trigger: footer, start: "top bottom", end: "bottom bottom", scrub: true } });
    const markSvg = $("[data-footer-mark] svg");
    markSvg.style.overflow = "hidden";
    const letters = $$("path", markSvg).sort((a, b) => a.getBBox().x - b.getBBox().x);
    gsap.fromTo(letters, { y: 170 }, { y: 0, stagger: 0.05, duration: 1.6, scrollTrigger: { trigger: markSvg, start: "top 98%" } });
    gsap.fromTo(".footer__nav a", { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.06, scrollTrigger: { trigger: ".footer__nav", start: "top 90%" } });
  };

  /* ---------- Boot ---------- */
  const boot = () => {
    if (reduceMotion) {
      loader.remove();
      root.classList.remove("is-loading");
      gsap.set("[data-split-lines], [data-split-chars], [data-fade], .hero__title, .hero__caption, .hero__pager, .header", { visibility: "visible" });
      initAccordion();
      initSketch();
      return;
    }
    initReveals();
    initHeroScroll();
    initProjects();
    initSketch();
    initCloudtree();
    initAccordion();
    initContact();
    initFooter();
    runLoader();
    ScrollTrigger.refresh();
  };

  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(boot);
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
