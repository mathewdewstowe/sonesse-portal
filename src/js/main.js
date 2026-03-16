/* ============================================
   Sonesse — Main JavaScript
   Replaces jQuery + all WordPress plugins
   ============================================ */

(function() {
  'use strict';

  /* --- Mobile Menu --- */
  function initMobileMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var menu = document.querySelector('.mobile-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function() {
      var isOpen = menu.classList.contains('is-open');
      menu.classList.toggle('is-open');
      toggle.classList.toggle('is-active');
      toggle.setAttribute('aria-expanded', !isOpen);
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Close on link click
    menu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        menu.classList.remove('is-open');
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* --- Tabs --- */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function(tabGroup) {
      var buttons = tabGroup.querySelectorAll('.tabs__btn');
      var panels = tabGroup.querySelectorAll('.tabs__panel');

      buttons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          var target = btn.getAttribute('data-tab');

          // Deactivate all
          buttons.forEach(function(b) { b.classList.remove('is-active'); });
          panels.forEach(function(p) { p.classList.remove('is-active'); });

          // Activate target
          btn.classList.add('is-active');
          var panel = tabGroup.querySelector('[data-tab-panel="' + target + '"]');
          if (panel) panel.classList.add('is-active');
        });
      });
    });
  }

  /* --- Modal --- */
  function initModals() {
    // Open modal
    document.querySelectorAll('[data-modal-open]').forEach(function(trigger) {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        var modalId = trigger.getAttribute('data-modal-open');
        var modal = document.getElementById(modalId);
        if (modal) {
          modal.classList.add('is-open');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    // Close modal
    document.querySelectorAll('.modal__close, .modal-overlay').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (e.target === el) {
          var overlay = el.closest('.modal-overlay') || el;
          overlay.classList.remove('is-open');
          document.body.style.overflow = '';
        }
      });
    });

    // Close on ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.is-open').forEach(function(m) {
          m.classList.remove('is-open');
          document.body.style.overflow = '';
        });
      }
    });
  }

  /* --- Video Lightbox --- */
  function initVideoLightbox() {
    var overlay = document.getElementById('video-lightbox');
    if (!overlay) return;

    var video = overlay.querySelector('video');

    document.querySelectorAll('[data-video]').forEach(function(trigger) {
      trigger.addEventListener('click', function(e) {
        e.preventDefault();
        var src = trigger.getAttribute('data-video');
        if (video && src) {
          video.src = src;
          overlay.classList.add('is-open');
          document.body.style.overflow = 'hidden';
          video.play();
        }
      });
    });

    function closeVideo() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      if (video) { video.pause(); video.src = ''; }
    }

    overlay.querySelector('.video-lightbox__close').addEventListener('click', closeVideo);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeVideo();
    });
  }

  /* --- Accordion --- */
  function initAccordions() {
    document.querySelectorAll('.accordion__trigger').forEach(function(trigger) {
      trigger.addEventListener('click', function() {
        var item = trigger.closest('.accordion__item');
        if (!item) return;
        item.classList.toggle('is-open');
      });
    });
  }

  /* --- Form Submission (Formspree) --- */
  function initForms() {
    document.querySelectorAll('form[data-formspree]').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var submitBtn = form.querySelector('[type="submit"]');
        var originalValue = submitBtn.value;
        submitBtn.value = 'Sending...';
        submitBtn.disabled = true;

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        }).then(function(response) {
          if (response.ok) {
            form.innerHTML = '<div style="padding:20px;text-align:center;color:#7C5CFC;font-size:18px;font-weight:600;">Thank you! We\'ll be in touch soon.</div>';
          } else {
            submitBtn.value = originalValue;
            submitBtn.disabled = false;
            alert('There was a problem submitting the form. Please try again.');
          }
        }).catch(function() {
          submitBtn.value = originalValue;
          submitBtn.disabled = false;
          alert('There was a problem submitting the form. Please try again.');
        });
      });
    });
  }

  /* --- Scroll to Top --- */
  function initScrollToTop() {
    var btn = document.querySelector('.scroll-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function() {
      btn.classList.toggle('is-visible', window.scrollY > 400);
    });

    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Mobile Browser Detection --- */
  function detectMobile() {
    if (/Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      document.body.classList.add('is-mobile');
    }
  }

  /* --- Init All --- */
  document.addEventListener('DOMContentLoaded', function() {
    detectMobile();
    initMobileMenu();
    initTabs();
    initModals();
    initVideoLightbox();
    initAccordions();
    initForms();
    initScrollToTop();
  });
})();
