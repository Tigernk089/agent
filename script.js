/* ====================================================================
   AE.AGENT — PORTFOLIO SCRIPT
   Vanilla JS only. Organised into small, reusable functions grouped
   by feature. Everything is guarded so the page still works if a
   piece fails (no single point of failure).
   ==================================================================== */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------------------------------------------------------------
     THEME (toggle + persistence)
  --------------------------------------------------------------- */
  function initTheme() {
    const root = document.documentElement;
    const saved = localStorage.getItem('site-theme');
    if (saved) root.setAttribute('data-theme', saved);

    const toggle = $('#themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('site-theme', next);
    });
  }

  /* ---------------------------------------------------------------
     LOADING SCREEN
  --------------------------------------------------------------- */
  function initLoader() {
    const loader = $('#loader');
    const fill = $('#loaderFill');
    const code = $('#loaderCode');
    if (!loader) return;

    let frame = 0;
    const timer = setInterval(() => {
      frame += 2;
      const pct = Math.min(frame, 100);
      if (fill) fill.style.width = pct + '%';
      if (code) code.textContent = formatTimecode(frame * 2.4);
      if (pct >= 100) clearInterval(timer);
    }, 28);

    const finish = () => {
      loader.classList.add('is-done');
      document.body.style.overflow = '';
    };
    window.addEventListener('load', () => setTimeout(finish, 500));
    // Fallback in case 'load' fires very late (slow connections)
    setTimeout(finish, 2600);
  }

  function formatTimecode(totalFrames) {
    const fps = 24;
    const totalSeconds = Math.floor(totalFrames / fps);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    const f = String(Math.floor(totalFrames % fps)).padStart(2, '0');
    return `${h}:${m}:${s}:${f}`;
  }

  /* ---------------------------------------------------------------
     CUSTOM CURSOR
  --------------------------------------------------------------- */
  function initCursor() {
    if (isTouch) return;
    const dot = $('#cursorDot');
    const ring = $('#cursorRing');
    const label = $('#cursorLabel');
    if (!dot || !ring) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });

    function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(loop);
    }
    loop();

    $$('a, button, input, textarea, select').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
    });
  }

  /* ---------------------------------------------------------------
     SCROLL PROGRESS + NAV ACTIVE SECTION + NAV BACKGROUND
  --------------------------------------------------------------- */
  function initScrollProgress() {
    const bar = $('#scrollProgress');
    const head = $('.site-head');
    if (!bar) return;
    function update() {
      const h = document.documentElement;
      const scrollable = h.scrollHeight - h.clientHeight;
      const pct = scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0;
      bar.style.width = pct + '%';
      if (head) head.classList.toggle('is-scrolled', h.scrollTop > 8);
    }
    document.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initActiveSection() {
    const links = $$('.nav__links a');
    if (!links.length) return;
    const sections = links
      .map((a) => document.getElementById(a.dataset.section))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => a.classList.toggle('is-active', a.dataset.section === entry.target.id));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
  }

  /* ---------------------------------------------------------------
     MOBILE MENU
  --------------------------------------------------------------- */
  function initMobileMenu() {
    const burger = $('#navBurger');
    const menu = $('#mobileMenu');
    if (!burger || !menu) return;

    function close() {
      menu.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', menu).forEach((a) => a.addEventListener('click', close));
  }

  /* ---------------------------------------------------------------
     SMOOTH ANCHOR SCROLL + SECTION "FLASH" ON ARRIVAL
  --------------------------------------------------------------- */
  function initAnchorScroll() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        const navH = document.querySelector('.site-head').offsetHeight;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navH + 1;
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
        const eyebrow = target.querySelector('.eyebrow');
        if (eyebrow) {
          eyebrow.style.transition = 'none';
          eyebrow.style.opacity = '0.25';
          requestAnimationFrame(() => {
            eyebrow.style.transition = 'opacity .6s ease';
            eyebrow.style.opacity = '1';
          });
        }
      });
    });
  }

  /* ---------------------------------------------------------------
     REVEAL ON SCROLL
  --------------------------------------------------------------- */
  function initReveal() {
    const items = $$('[data-reveal]');
    if (!items.length) return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------------
     MAGNETIC BUTTONS
  --------------------------------------------------------------- */
  function initMagnetic() {
    if (reduceMotion || isTouch) return;
    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.22}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------
     BUTTON RIPPLE
  --------------------------------------------------------------- */
  function initRipple() {
    $$('.btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty('--rx', (e.clientX - r.left) + 'px');
        btn.style.setProperty('--ry', (e.clientY - r.top) + 'px');
        btn.classList.remove('is-rippling');
        requestAnimationFrame(() => btn.classList.add('is-rippling'));
      });
    });
  }

  /* ---------------------------------------------------------------
     CARD TILT
  --------------------------------------------------------------- */
  function initTilt() {
    if (reduceMotion || isTouch) return;
    $$('.tilt').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${px * 6}deg) rotateX(${py * -6}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------
     TYPING EFFECT (hero role line)
  --------------------------------------------------------------- */
  function initTyping() {
    const el = $('#typeTarget');
    if (!el) return;
    const words = ['AMVs', 'YouTube Videos', 'TikTok Edits', 'VFX Shots'];
    let wi = 0, ci = 0, deleting = false;

    function step() {
      const word = words[wi];
      ci += deleting ? -1 : 1;
      el.textContent = word.slice(0, ci);

      let delay = deleting ? 45 : 75;
      if (!deleting && ci === word.length) { delay = 1600; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 300; }
      setTimeout(step, delay);
    }
    step();
  }

  /* ---------------------------------------------------------------
     ANIMATED COUNTERS
  --------------------------------------------------------------- */
  function initCounters() {
    const counters = $$('.counter');
    if (!counters.length) return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => observer.observe(c));
  }

  function animateCounter(el) {
    const target = parseFloat(el.dataset.count || '0');
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------
     PROCESS LINE FILL — fills as the section scrolls through view
  --------------------------------------------------------------- */
  function initProcessFill() {
    const section = $('#processLine');
    const fill = $('#processFill');
    if (!section || !fill) return;
    function update() {
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height + vh * 0.6;
      const seen = Math.min(Math.max(vh * 0.8 - r.top, 0), total);
      const pct = Math.min((seen / total) * 100, 100);
      fill.style.width = pct + '%';
    }
    document.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------------------------------------------------------------
     FAQ ACCORDION
  --------------------------------------------------------------- */
  function initAccordion() {
    $$('.accordion__item').forEach((item) => {
      const trigger = $('.accordion__trigger', item);
      const panel = $('.accordion__panel', item);
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        $$('.accordion__item').forEach((i) => {
          i.classList.remove('is-open');
          $('.accordion__panel', i).style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('is-open');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  }

  /* ---------------------------------------------------------------
     CONTACT FORM VALIDATION + MAILTO SUBMIT
  --------------------------------------------------------------- */
  function initContactForm() {
    const form = $('#contactForm');
    if (!form) return;

    function setError(field, message) {
      const wrap = field.closest('.field');
      const errorEl = wrap.querySelector('.field__error');
      wrap.classList.toggle('has-error', Boolean(message));
      if (errorEl) errorEl.textContent = message || '';
    }

    function validate() {
      let ok = true;
      const name = $('#name'), email = $('#email'), message = $('#message');

      if (!name.value.trim()) { setError(name, 'Please enter your name.'); ok = false; }
      else setError(name, '');

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email.value.trim())) { setError(email, 'Please enter a valid email.'); ok = false; }
      else setError(email, '');

      if (message.value.trim().length < 10) { setError(message, 'Tell me a little more (10+ characters).'); ok = false; }
      else setError(message, '');

      return ok;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) return;

      const data = new FormData(form);
      const checkedServices = $$('input[name="services"]:checked', form).map((c) => c.value);
      const servicesText = checkedServices.length ? checkedServices.join(', ') : 'Not specified';
      const phone = (data.get('phone') || '').toString().trim();

      const subject = `New project enquiry from ${data.get('name')}`;
      const body =
        `Name: ${data.get('name')}\n` +
        `Email: ${data.get('email')}\n` +
        `Phone / WhatsApp: ${phone || 'Not provided'}\n` +
        `Services needed: ${servicesText}\n` +
        `Budget: ${data.get('budget')}\n\n` +
        `Project details:\n${data.get('message')}`;

      window.location.href =
        `mailto:ttvagenttt@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      showToast('Opening your email client…');
    });
  }

  /* ---------------------------------------------------------------
     COPY-TO-CLIPBOARD (e.g. Discord handle — no public profile URL)
  --------------------------------------------------------------- */
  function initCopyButtons() {
    $$('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.copy;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(() => showToast(`Copied "${value}" to clipboard`));
        } else {
          showToast(`Discord: ${value}`);
        }
      });
    });

    // Fallback "checked" styling for browsers without :has() support
    $$('.checkbox input').forEach((input) => {
      input.addEventListener('change', () => {
        input.closest('.checkbox').classList.toggle('is-checked', input.checked);
      });
    });
  }

  function showToast(text) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-visible');
    setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  /* ---------------------------------------------------------------
     SCROLL TO TOP BUTTON
  --------------------------------------------------------------- */
  function initToTop() {
    const btn = $('#toTop');
    if (!btn) return;
    document.addEventListener('scroll', () => {
      btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  /* ---------------------------------------------------------------
     FOOTER YEAR
  --------------------------------------------------------------- */
  function initYear() {
    const el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------
     HERO BACKGROUND PARTICLES (subtle floating dust)
  --------------------------------------------------------------- */
  function initParticles() {
    const canvas = $('#particles');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      const count = Math.floor((canvas.width * canvas.height) / 90000);
      particles = Array.from({ length: Math.min(count, 60) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.4,
        s: Math.random() * 0.25 + 0.05,
      }));
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rgb = getComputedStyle(document.documentElement).getPropertyValue('--particle-rgb').trim() || '245,245,244';
      ctx.fillStyle = `rgba(${rgb},.35)`;
      particles.forEach((p) => {
        p.y -= p.s;
        if (p.y < 0) p.y = canvas.height;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------------------------------------------------------------
     INIT
  --------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLoader();
    initCursor();
    initScrollProgress();
    initActiveSection();
    initMobileMenu();
    initAnchorScroll();
    initReveal();
    initMagnetic();
    initRipple();
    initTilt();
    initTyping();
    initCounters();
    initProcessFill();
    initAccordion();
    initContactForm();
    initCopyButtons();
    initToTop();
    initYear();
    initParticles();
  });
})();
