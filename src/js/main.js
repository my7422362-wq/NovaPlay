/* ──────────────────────────────────────────
   NovaPlay — Application Entry (src/js/main.js)
   ──────────────────────────────────────────
   Navbar: scroll effects, mobile drawer, active link tracking
   Hero: load hero component, initialize Swiper
   Gallery: load gallery component + mobile Swiper
─────────────────────────────────────────── */

import { createIcons, icons } from "lucide";
import Swiper from "swiper";
import AOS from "aos";

import { initEmailJSForm } from "./emailjs-handler.js";

/* ─── Load Navbar Component ─── */
async function loadNavbar() {
  try {
    const response = await fetch("/components/navbar.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const app = document.getElementById("app");
    if (app) {
      app.insertAdjacentHTML("afterbegin", html);
    }

    /* Re-initialize Lucide icons after injecting HTML */
    createIcons({ icons });

    /* Initialize navbar behaviors */
    initNavbar();
  } catch (err) {
    console.error("Failed to load navbar:", err);
  }
}

/* ─── Navbar Initialization ─── */
function initNavbar() {
  const navbar = document.getElementById("navbar");
  const menuToggle = document.getElementById("menu-toggle");
  const drawerClose = document.getElementById("drawer-close");
  const mobileDrawer = document.getElementById("mobile-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");
  const navLinks = document.querySelectorAll(".nav-link");
  const drawerLinks = mobileDrawer?.querySelectorAll(".drawer-link");
  const drawerAnchors = mobileDrawer?.querySelectorAll("a");
  const sections = document.querySelectorAll("section[id]");

  if (!navbar || !menuToggle || !drawerClose || !mobileDrawer || !drawerOverlay) return;
  if (navbar.dataset.navbarInitialized === "true") return;
  navbar.dataset.navbarInitialized = "true";

  /* ─── Scroll Effect ─── */
  let isScrolled = false;
  let isDrawerOpen = false;
  let lockedScrollY = 0;

  function handleScroll() {
    const scrollY = window.scrollY;
    const shouldScroll = scrollY > 50;

    if (shouldScroll !== isScrolled) {
      isScrolled = shouldScroll;
      if (isScrolled) {
        navbar.classList.add(
          "bg-background/80",
          "backdrop-blur-xl",
          "border-b",
          "border-border",
          "shadow-lg",
          "shadow-black/20"
        );
        navbar.classList.remove("bg-transparent");
      } else {
        navbar.classList.remove(
          "bg-background/80",
          "backdrop-blur-xl",
          "border-b",
          "border-border",
          "shadow-lg",
          "shadow-black/20"
        );
        navbar.classList.add("bg-transparent");
      }
    }

    /* ─── Active Link Tracking ─── */
    updateActiveLink(scrollY);
  }

  /* Throttled scroll listener */
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  });

  /* Run once on load to set initial state */
  handleScroll();

  /* ─── Mobile Drawer Toggle ─── */
  function openDrawer() {
    if (isDrawerOpen) return;
    isDrawerOpen = true;
    lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    mobileDrawer?.classList.remove("translate-x-full");
    mobileDrawer?.classList.add("translate-x-0");
    mobileDrawer?.setAttribute("aria-hidden", "false");
    drawerOverlay?.classList.remove("opacity-0", "pointer-events-none");
    drawerOverlay?.classList.add("opacity-100", "pointer-events-auto");
    menuToggle?.setAttribute("aria-expanded", "true");
    /* Robust scroll lock — works on iOS Safari / older browsers */
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }

  function closeDrawer() {
    if (!isDrawerOpen) return;
    isDrawerOpen = false;
    mobileDrawer?.classList.remove("translate-x-0");
    mobileDrawer?.classList.add("translate-x-full");
    mobileDrawer?.setAttribute("aria-hidden", "true");
    drawerOverlay?.classList.remove("opacity-100", "pointer-events-auto");
    drawerOverlay?.classList.add("opacity-0", "pointer-events-none");
    menuToggle?.setAttribute("aria-expanded", "false");
    /* Restore body scrolling */
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, lockedScrollY);
  }

  menuToggle?.addEventListener("click", () => {
    if (isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });
  drawerClose?.addEventListener("click", closeDrawer);
  drawerOverlay?.addEventListener("click", closeDrawer);

  /* Close drawer on ESC key */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isDrawerOpen) closeDrawer();
  });

  /* Close drawer when a drawer link is clicked */
  drawerAnchors.forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });

  /* ─── Active Link Tracking ─── */
  function updateActiveLink(scrollY) {
    const offset = 120;
    let currentSection = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - offset;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollY >= sectionTop && scrollY < sectionBottom) {
        currentSection = section.getAttribute("id");
      }
    });

    /* Update desktop nav links */
    navLinks.forEach((link) => {
      const href = link.getAttribute("href")?.replace("#", "");
      const isActive = href === currentSection;

      link.classList.toggle("text-text", isActive);
      link.classList.toggle("text-muted", !isActive);

      /* Active indicator dot */
      let dot = link.querySelector(".active-dot");
      if (isActive) {
        if (!dot) {
          dot = document.createElement("span");
          dot.className =
            "active-dot absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary";
          link.appendChild(dot);
        }
      } else {
        dot?.remove();
      }
    });

    /* Update drawer links */
    drawerLinks.forEach((link) => {
      const href = link.getAttribute("href")?.replace("#", "");
      const isActive = href === currentSection;

      link.classList.toggle("text-text", isActive);
      link.classList.toggle("text-muted", !isActive);
      if (isActive) {
        link.classList.add("bg-white/5");
      } else {
        link.classList.remove("bg-white/5");
      }
    });
  }
}

/* ──────────────────────────────────────────
   Hero Section — Component Loader + Swiper
   ────────────────────────────────────────── */

/* ─── Load Hero Component ─── */
async function loadHero() {
  try {
    const response = await fetch("/components/hero.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const navbar = document.getElementById("navbar");
    const app = document.getElementById("app");

    if (navbar && app) {
      /* Insert hero HTML right after the navbar element */
      navbar.insertAdjacentHTML("afterend", html);
    } else if (app) {
      app.insertAdjacentHTML("beforeend", html);
    }

    /* Re-initialize Lucide icons for hero buttons/icons */
    createIcons({ icons });

    /* Initialize hero Swiper */
    initHeroSwiper();
  } catch (err) {
    console.error("Failed to load hero:", err);
  }
}

/* ─── Initialize Hero Swiper ─── */
function initHeroSwiper() {
  const heroSwiperEl = document.querySelector(".hero-swiper");
  if (!heroSwiperEl) return;

  new Swiper(heroSwiperEl, {
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
    },
    loop: true,
    speed: 800,
    pagination: {
      el: ".hero-swiper-pagination",
      clickable: true,
      renderBullet: function (index, className) {
        return `<span class="${className} w-1.5 h-1.5 rounded-full bg-white/40 transition-all duration-300"></span>`;
      },
    },
    on: {
      init: function () {
        /* Style active pagination bullet */
        const bullets = document.querySelectorAll(".hero-swiper-pagination .swiper-pagination-bullet");
        bullets.forEach((bullet) => {
          bullet.style.width = "6px";
          bullet.style.height = "6px";
          bullet.style.borderRadius = "9999px";
          bullet.style.backgroundColor = "rgba(255,255,255,0.4)";
          bullet.style.opacity = "1";
          bullet.style.transition = "all 0.3s ease";
        });
      },
      slideChange: function () {
        const bullets = document.querySelectorAll(".hero-swiper-pagination .swiper-pagination-bullet");
        bullets.forEach((bullet, idx) => {
          if (bullet.classList.contains("swiper-pagination-bullet-active")) {
            bullet.style.width = "20px";
            bullet.style.backgroundColor = "#7c3aed";
            bullet.style.opacity = "1";
          } else {
            bullet.style.width = "6px";
            bullet.style.backgroundColor = "rgba(255,255,255,0.4)";
            bullet.style.opacity = "1";
          }
        });
      },
    },
  });
}

/* ──────────────────────────────────────────
   Featured Games Section — Component Loader
   ────────────────────────────────────────── */

/* ─── Load Featured Games Component ─── */
async function loadFeaturedGames() {
  try {
    const response = await fetch("/components/featured-games.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const about = document.getElementById("about");
    const app = document.getElementById("app");

    if (about && app) {
      /* Insert featured games HTML after the about section (before categories) */
      about.insertAdjacentHTML("afterend", html);
    } else if (app) {
      app.insertAdjacentHTML("beforeend", html);
    }

    /* Re-initialize Lucide icons for star ratings and buttons */
    createIcons({ icons });
  } catch (err) {
    console.error("Failed to load featured games:", err);
  }
}

/* ──────────────────────────────────────────
   Game Showcase Section — Component Loader
   ────────────────────────────────────────── */

/* ─── Load Game Showcase Component ─── */
async function loadGameShowcase() {
  try {
    const response = await fetch("/components/game-showcase.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const hero = document.getElementById("home");
    const app = document.getElementById("app");

    if (hero && app) {
      /* Insert game showcase HTML right after the hero section */
      hero.insertAdjacentHTML("afterend", html);
    } else if (app) {
      app.insertAdjacentHTML("beforeend", html);
    }

    /* Re-initialize Lucide icons */
    createIcons({ icons });
  } catch (err) {
    console.error("Failed to load game showcase:", err);
  }
}

/* ──────────────────────────────────────────
   About Section — Component Loader
   ────────────────────────────────────────── */

/* ─── Load About Component ─── */
async function loadAbout() {
  try {
    const response = await fetch("/components/about.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const hero = document.getElementById("home");
    const app = document.getElementById("app");

    if (hero && app) {
      /* Insert about HTML right after the hero section */
      hero.insertAdjacentHTML("afterend", html);
    } else if (app) {
      app.insertAdjacentHTML("beforeend", html);
    }

    /* Re-initialize Lucide icons for feature icons and stats */
    createIcons({ icons });
  } catch (err) {
    console.error("Failed to load about:", err);
  }
}

/* ──────────────────────────────────────────
   Categories Section — Component Loader
   ────────────────────────────────────────── */

/* ─── Load Categories Component ─── */
async function loadCategories() {
  try {
    const response = await fetch("/components/categories.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const about = document.getElementById("about");
    const app = document.getElementById("app");

    if (about && app) {
      /* Insert categories HTML right after the about section */
      about.insertAdjacentHTML("afterend", html);
    } else if (app) {
      app.insertAdjacentHTML("beforeend", html);
    }

    /* Re-initialize Lucide icons for category icons */
    createIcons({ icons });
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

/* ──────────────────────────────────────────
   Gallery Section — Component Loader
   ────────────────────────────────────────── */

/* ─── Load Gallery Component ─── */
async function loadGallery() {
  try {
    const response = await fetch("/components/gallery.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const categories = document.getElementById("categories");
    const app = document.getElementById("app");
    if (categories && app) {
      categories.insertAdjacentHTML("afterend", html);
    } else if (app) {
      app.insertAdjacentHTML("beforeend", html);
    }
    createIcons({ icons });
  } catch (err) {
    console.error("Failed to load gallery:", err);
  }
}

/* ──────────────────────────────────────────
   CTA Section — Component Loader
   ────────────────────────────────────────── */

/* ─── Load CTA Component ─── */
async function loadCta() {
  try {
    const response = await fetch("/components/cta.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const featuredGames = document.getElementById("games");
    const app = document.getElementById("app");

    if (featuredGames && app) {
      /* Insert CTA HTML after the featured games section */
      featuredGames.insertAdjacentHTML("afterend", html);
    } else if (app) {
      app.insertAdjacentHTML("beforeend", html);
    }

    /* Re-initialize Lucide icons for button and platform icons */
    createIcons({ icons });
  } catch (err) {
    console.error("Failed to load CTA:", err);
  }
}

/* ──────────────────────────────────────────
   Contact Section — Component Loader (EmailJS)
   ────────────────────────────────────────── */

/* ─── Load Contact Component ─── */
async function loadContact() {
  try {
    const response = await fetch("/components/contact.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const cta = document.getElementById("download");
    const app = document.getElementById("app");

    if (cta && app) {
      /* Insert contact HTML after the CTA section */
      cta.insertAdjacentHTML("afterend", html);
    } else if (app) {
      app.insertAdjacentHTML("beforeend", html);
    }

    /* Re-initialize Lucide icons for form icons and info card icons */
    createIcons({ icons });

    /* Initialize EmailJS form handler from separate module */
    initEmailJSForm();
  } catch (err) {
    console.error("Failed to load contact:", err);
  }
}

/* ──────────────────────────────────────────
   Footer Section — Component Loader
   ────────────────────────────────────────── */

/* ─── Load Footer Component ─── */
async function loadFooter() {
  try {
    const response = await fetch("/components/footer.html");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const contact = document.getElementById("contact");
    const cta = document.getElementById("download");
    const app = document.getElementById("app");

    const insertAfter = contact || cta;

    if (insertAfter && app) {
      /* Insert footer HTML after the contact section (or CTA as fallback) */
      insertAfter.insertAdjacentHTML("afterend", html);
    } else if (app) {
      app.insertAdjacentHTML("beforeend", html);
    }

    /* Re-initialize Lucide icons for social icons and links */
    createIcons({ icons });
  } catch (err) {
    console.error("Failed to load footer:", err);
  }
}

/* ─── Mount ─── */
(async () => {
  /* Load sections sequentially to preserve DOM order */
  await loadNavbar();
  await loadHero();
  await loadAbout();
  await loadCategories();
  await loadGallery();
  await loadFeaturedGames();
  await loadCta();
  await loadContact();
  await loadFooter();

  /* Refresh AOS to detect dynamically added elements */
  AOS.refresh();
})();
