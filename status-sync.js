(function(){
  const STATUS_URL = 'https://super-band-24a0.marcomedium-com.workers.dev/status';

  async function fetchStatus() {
    try {
      const r = await fetch(STATUS_URL);
      const d = await r.json();
      const busy = !d.available;
      const navDot = document.querySelector('.live-dot');
      if(navDot) {
        navDot.classList.toggle('busy', busy);
      }
    } catch(e) {}
  }

  fetchStatus();
  setInterval(fetchStatus, 30000);
})();
