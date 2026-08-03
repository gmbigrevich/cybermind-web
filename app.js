'use strict';

/**
 * Cybermind — app.js
 * Sin dependencias de almacenamiento local (localStorage/sessionStorage no se usan:
 * el estado del tema vive únicamente en memoria durante la sesión de la pestaña).
 * Sin manejadores inline (onclick=), todo vía addEventListener.
 * Sin innerHTML con datos dinámicos ni eval — superficie de ataque mínima por diseño.
 */

(function () {
  var root = document.documentElement;

  /* ============================================================
     Theme toggle (estado solo en memoria — sin localStorage)
     ============================================================ */
  var themeToggleBtn = document.getElementById('theme-toggle');

  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggleBtn) {
      var toLight = theme === 'dark';
      themeToggleBtn.setAttribute(
        'aria-label',
        toLight ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
      );
    }
    if (window.__cybermindChart) {
      updateChartTheme(window.__cybermindChart);
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  /* ============================================================
     Navegación móvil
     ============================================================ */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('nav');
  var navLinks = document.getElementById('nav-links');

  function closeNav() {
    if (nav) nav.classList.remove('nav--open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('nav--open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeNav();
  });

  /* ============================================================
     Header: ocultar al bajar, mostrar al subir
     ============================================================ */
  var header = document.getElementById('site-header');
  var lastScrollY = window.scrollY;
  var scrollTicking = false;

  function onScroll() {
    var currentY = window.scrollY;
    if (header) {
      header.classList.toggle('header--scrolled', currentY > 8);
      if (currentY > lastScrollY && currentY > 140) {
        header.classList.add('header--hidden');
      } else {
        header.classList.remove('header--hidden');
      }
    }
    lastScrollY = currentY;
    scrollTicking = false;
  }

  window.addEventListener(
    'scroll',
    function () {
      if (!scrollTicking) {
        window.requestAnimationFrame(onScroll);
        scrollTicking = true;
      }
    },
    { passive: true }
  );

  /* ============================================================
     Scroll suave a anclas internas
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      var targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ============================================================
     Revelado al hacer scroll (IntersectionObserver)
     ============================================================ */
  var revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealItems.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

  /* ============================================================
     Modal de seguridad
     ============================================================ */
  var securityModal = document.getElementById('security-modal');
  var openTriggers = [
    document.getElementById('security-badge-btn'),
    document.getElementById('security-footer-btn')
  ];
  var closeBtn = document.getElementById('security-modal-close');
  var lastFocusedElement = null;

  function openModal() {
    if (!securityModal) return;
    lastFocusedElement = document.activeElement;
    securityModal.classList.add('modal-overlay--open');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!securityModal) return;
    securityModal.classList.remove('modal-overlay--open');
    document.body.style.overflow = '';
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  openTriggers.forEach(function (trigger) {
    if (trigger) trigger.addEventListener('click', openModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (securityModal) {
    securityModal.addEventListener('click', function (event) {
      if (event.target === securityModal) closeModal();
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && securityModal && securityModal.classList.contains('modal-overlay--open')) {
      closeModal();
    }
  });

  /* ============================================================
     Gráfico de incidentes CERT.ar (Chart.js)
     Fuentes: Informes de gestión CERT.ar 2022-2024 (argentina.gob.ar)
     ============================================================ */
  function chartColors() {
    var styles = getComputedStyle(root);
    return {
      primary: styles.getPropertyValue('--color-primary').trim() || '#3fd3f0',
      secondary: styles.getPropertyValue('--color-secondary').trim() || '#7488e0',
      text: styles.getPropertyValue('--color-text').trim() || '#e7eaf0',
      muted: styles.getPropertyValue('--color-text-muted').trim() || '#9aa5b7',
      divider: styles.getPropertyValue('--color-divider').trim() || '#1e2430'
    };
  }

  function updateChartTheme(chart) {
    var c = chartColors();
    chart.data.datasets[0].backgroundColor = c.primary;
    chart.data.datasets[0].hoverBackgroundColor = c.secondary;
    chart.options.scales.x.ticks.color = c.muted;
    chart.options.scales.y.ticks.color = c.muted;
    chart.options.scales.y.grid.color = c.divider;
    chart.options.plugins.tooltip.titleColor = c.text;
    chart.options.plugins.tooltip.bodyColor = c.muted;
    chart.update();
  }

  function initChart() {
    var canvas = document.getElementById('incidents-chart');
    if (!canvas || typeof window.Chart === 'undefined') return;
    var c = chartColors();

    window.__cybermindChart = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['2021', '2022', '2023', '2024'],
        datasets: [
          {
            label: 'Incidentes gestionados por CERT.ar',
            data: [591, 335, 379, 438],
            backgroundColor: c.primary,
            hoverBackgroundColor: c.secondary,
            borderRadius: 6,
            maxBarThickness: 64
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: c.divider,
            titleColor: c.text,
            bodyColor: c.muted,
            titleFont: { family: 'General Sans, sans-serif', weight: '600' },
            bodyFont: { family: 'General Sans, sans-serif' },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (ctx) {
                return ctx.parsed.y.toLocaleString('es-AR') + ' incidentes';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: c.muted, font: { family: 'JetBrains Mono, monospace', size: 12 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: c.divider },
            ticks: {
              color: c.muted,
              font: { family: 'JetBrains Mono, monospace', size: 11 },
              callback: function (value) {
                return value.toLocaleString('es-AR');
              }
            }
          }
        }
      }
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initChart();
  } else {
    document.addEventListener('DOMContentLoaded', initChart);
  }
})();
