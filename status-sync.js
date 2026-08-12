(function(){
  var BASE = 'https://super-band-24a0.marcomedium-com.workers.dev';
  var STATUS_URL = BASE + '/status';
  var MDP_HASH = -1155591604; // empreinte du mot de passe admin
  var LABEL = { libre: 'Disponible', occupe: 'En consultation' };

  function hash(s){ var h=0; for(var i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))|0; } return h; }
  function occupe(){ return localStorage.getItem('mm_status') === 'busy'; }

  function peindre(busy){
    document.querySelectorAll('.live-dot').forEach(function(d){ d.classList.toggle('busy', busy); });
    document.querySelectorAll('.mm-status').forEach(function(b){
      b.classList.toggle('busy', busy);
      var t = b.querySelector('b');
      if (t) t.textContent = busy ? LABEL.occupe : LABEL.libre;
      b.setAttribute('aria-label', busy ? 'Marco est en consultation' : 'Marco est disponible');
    });
  }

  function init(){ peindre(occupe()); }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }

  window.addEventListener('storage', function(e){ if (e.key === 'mm_status') peindre(occupe()); });
  window.addEventListener('pageshow', function(){ peindre(occupe()); });

  // L'état vient du serveur : il est le même pour tous les appareils
  function fetchStatus(){
    fetch(STATUS_URL, { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(d){
      var busy = !d.available;
      localStorage.setItem('mm_status', busy ? 'busy' : 'free');
      peindre(busy);
    }).catch(function(){ peindre(occupe()); });
  }
  fetchStatus();
  setInterval(fetchStatus, 30000);

  // Triple-clic sur le badge ou la pastille : ouvre la page de disponibilité
  var clics = 0, minuteur = null;
  document.addEventListener('click', function(e){
    if (!e.target.closest('.mm-status') && !e.target.closest('.live-dot')) return;
    e.preventDefault();
    clics++;
    clearTimeout(minuteur);
    minuteur = setTimeout(function(){ clics = 0; }, 900);
    if (clics < 3) return;
    clics = 0;
    location.href = 'admin.html';
  });
})();

/* Vidéos de fond : chargement différé, lecture uniquement quand elles sont visibles.
   Évite d'avoir 5 flux décodés en même temps (cause des saccades / blocages). */
(function videosDeFond(){
  function economie(){
    var c = navigator.connection || {};
    if (c.saveData) return true;
    if (/2g/.test(c.effectiveType || '')) return true;
    return matchMedia('(max-width: 760px)').matches; // sur mobile : dégradés seuls, pas de vidéo
  }
  function activer(v){
    if (!v.dataset.mmOn) {
      v.dataset.mmOn = '1';
      if (v.dataset.src) v.src = v.dataset.src;
      v.load();
    }
    var p = v.play();
    if (p && p.catch) p.catch(function(){});
  }
  function init(){
    var vids = [].slice.call(document.querySelectorAll('video.video-bg:not(.hero-video)'));
    if (!vids.length) return;
    if (economie()) {
      vids.forEach(function(v){
        v.pause();
        v.removeAttribute('autoplay');
        v.removeAttribute('src');
        v.style.display = 'none';
      });
      return;
    }
    if (!('IntersectionObserver' in window)) { vids.forEach(activer); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) activer(e.target);
        else if (e.target.dataset.mmOn) e.target.pause();
      });
    }, { rootMargin: '200px 0px' });
    vids.forEach(function(v){
      var r = v.getBoundingClientRect();
      if (r.top < innerHeight + 200 && r.bottom > -200) activer(v);
      io.observe(v);
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();

/* Entrées de texte : chaque bloc monte en fondu quand il entre dans l'écran. */
(function entreesTexte(){
  // animations réduites : on garde un fondu simple, sans mouvement
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('mm-soft');
  }

  var SELECTEURS = [
    '.hero-copy > *', '.head-inner > *',
    '.section > h2', '.section > .sec-head > *', '.sec-head > *',
    '.offer-card', '.review-card', '.avis-card', '.about-copy > *',
    '.section > .section-label', '.section > h2', '.section > p',
    '.post-card', '.faq-item', '.contact-copy > *', '.form-card'
  ].join(',');

  function preparer(){
    var els = [].slice.call(document.querySelectorAll(SELECTEURS));
    if (!els.length) return;

    els.forEach(function(el){
      if (el.closest('#intro')) return;
      el.classList.add('mm-reveal');
    });

    var io = new IntersectionObserver(function(entrees){
      entrees.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target;
        // léger décalage entre voisins pour un enchaînement en cascade
        var voisins = [].slice.call(el.parentElement ? el.parentElement.children : []);
        var rang = Math.min(voisins.indexOf(el), 5);
        el.style.transitionDelay = (rang * 90) + 'ms';
        el.classList.add('mm-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });

    document.querySelectorAll('.mm-reveal').forEach(function(el){ io.observe(el); });

    // filet de sécurité : rien ne doit rester invisible
    setTimeout(function(){
      document.querySelectorAll('.mm-reveal:not(.mm-in)').forEach(function(el){
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight) el.classList.add('mm-in');
      });
    }, 2500);
  }

  function demarrer(){
    var intro = document.getElementById('intro');
    // sur l'accueil, on attend la fin de la vidéo d'intro
    if (intro && !intro.hidden) {
      document.addEventListener('mm-intro-done', preparer, { once: true });
      setTimeout(preparer, 12000);
    } else {
      preparer();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
