/*! Marco Médium — Conversion tracking OpenAI Ads Pixel */
(function () {
  if (typeof window.oaiq !== 'function') return;

  function fire(source) {
    try {
      window.oaiq('measure', 'lead_created', {
        type: 'customer_action',
        source: source
      });
    } catch (e) {}
    try {
      if (typeof gtag === 'function') {
        gtag('event', 'conversion_' + source, {
          event_category: 'contact',
          event_label: source
        });
      }
    } catch (e) {}
  }

  // Phone clicks (0901 numbers)
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('tel:0901') === 0 || href.indexOf('tel:+41901') === 0) {
      fire('phone_0901');
    }
  }, true);

  // WhatsApp clicks
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="wa.me/"], a[href*="whatsapp.com/send"]') : null;
    if (!a) return;
    fire('whatsapp');
  }, true);

  // Form submissions
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    // Ignore search forms and other non-lead forms
    var id = (f.id || '').toLowerCase();
    var cls = (f.className || '').toLowerCase();
    if (id.indexOf('search') >= 0 || cls.indexOf('search') >= 0) return;
    if (id.indexOf('newsletter') >= 0 || cls.indexOf('newsletter') >= 0) {
      fire('newsletter');
    } else {
      fire('form');
    }
  }, true);
})();
