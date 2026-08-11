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

  // Bascule admin : 3 clics sur le badge de l'accueil, puis mot de passe
  var clics = 0, minuteur = null;
  document.addEventListener('click', function(e){
    if (!e.target.closest('.mm-status')) return;
    e.preventDefault();
    clics++;
    clearTimeout(minuteur);
    minuteur = setTimeout(function(){ clics = 0; }, 800);
    if (clics < 3) return;
    clics = 0;
    var mdp = prompt('Mot de passe');
    if (mdp === null) return;
    if (hash(mdp) !== MDP_HASH) { alert('Mot de passe incorrect'); return; }
    var busy = !occupe();
    peindre(busy); // retour visuel immédiat
    fetch(STATUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !busy })
    }).then(function(r){ return r.json(); }).then(function(d){
      if (d && d.ok) { localStorage.setItem('mm_status', busy ? 'busy' : 'free'); }
      else { alert('Le serveur a refusé le changement.'); fetchStatus(); }
    }).catch(function(){
      alert("Serveur injoignable : le changement n'est pas partagé.");
      fetchStatus();
    });
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
