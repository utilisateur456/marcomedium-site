(function(){
  var STATUS_URL = 'https://super-band-24a0.marcomedium-com.workers.dev/status';
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

  // Le réglage manuel de Marco est prioritaire sur le Worker
  function manuel(){ return localStorage.getItem('mm_status_manuel') === '1'; }

  function fetchStatus(){
    if (manuel()) { peindre(occupe()); return; }
    fetch(STATUS_URL).then(function(r){ return r.json(); }).then(function(d){
      if (manuel()) return;
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
    localStorage.setItem('mm_status', busy ? 'busy' : 'free');
    localStorage.setItem('mm_status_manuel', '1');
    peindre(busy);
  });
})();

/* Chargement différé des vidéos de fond : rien ne se télécharge avant d'entrer dans l'écran */
(function lazyVideos(){
  function activer(v){
    if (v.dataset.mmOn) return;
    v.dataset.mmOn = '1';
    v.src = v.dataset.src;
    v.load();
    var p = v.play();
    if (p && p.catch) p.catch(function(){});
  }
  function init(){
    var vids = [].slice.call(document.querySelectorAll('video[data-lazy]'));
    if (!vids.length) return;
    if (!('IntersectionObserver' in window)) { vids.forEach(activer); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        activer(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '250px 0px' });
    vids.forEach(function(v){ io.observe(v); });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
