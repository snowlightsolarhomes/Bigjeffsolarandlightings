/* BIG JEFF SOLAR — Home page Spotlight video */
(async function () {
  const sec = document.getElementById('spotlight');
  if (!sec) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  let s;
  await (window.bjReady || Promise.resolve());
  try { s = await fetch('/data/spotlight.json', { cache: 'no-cache' }).then(r => r.json()); } catch (e) { return; }
  if (!s || !s.enabled || !s.video) return;

  const v = s.video, yt = v.type !== 'file';
  const price = String(s.price || '').trim();
  const priceTxt = /^[\d,.\s]+$/.test(price) ? '₦' + price : price;
  const wa = waLink(`Hello ${BRAND}, I saw your spotlight: ${s.title || 'product'}. Please send details.`);
  const media = yt
    ? (v.type === 'youtube'
      ? `<iframe id="spYT" src="https://www.youtube.com/embed/${esc(v.id)}?autoplay=1&mute=1&loop=1&playlist=${esc(v.id)}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1" title="Spotlight video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
      : videoEmbed(v, true).replace('<iframe', '<iframe id="spYT"'))
    : `<video id="spVideo" src="${esc(v.url)}" muted loop playsinline webkit-playsinline autoplay preload="auto"></video><button class="spot-play" id="spPlay" aria-label="Play video" hidden>▶</button>`;

  sec.innerHTML = `
  <div class="container">
    <div class="spot-card">
      <div class="spot-media${yt && v.shorts ? ' tall' : ''}" id="spMedia">
        ${media}
        <button class="spot-sound" id="spSound" type="button">🔇 <span>Tap for sound</span></button>
      </div>
      <div class="spot-info">
        ${s.badge ? `<span class="spot-badge">${esc(s.badge)}</span>` : ''}
        ${s.title ? `<h2 class="spot-title">${esc(s.title)}</h2>` : ''}
        ${s.description ? `<p class="spot-desc">${esc(s.description)}</p>` : ''}
        ${priceTxt ? `<div class="spot-price">${esc(priceTxt)}</div>` : ''}
        <a class="spot-btn" href="${wa}" target="_blank" rel="noopener">${esc(s.buttonText || '💬 Order on WhatsApp')}</a>
      </div>
    </div>
  </div>`;
  sec.hidden = false;

  const soundBtn = document.getElementById('spSound');
  const setLabel = muted => { soundBtn.innerHTML = muted ? '🔇 <span>Tap for sound</span>' : '🔊 <span>Sound on</span>'; };

  if (yt) {
    const f = document.getElementById('spYT');
    let muted = true;
    soundBtn.addEventListener('click', () => {
      muted = !muted;
      const send = (func, args) => f.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: args || [] }), '*');
      if (muted) send('mute'); else { send('unMute'); send('setVolume', [100]); send('playVideo'); }
      setLabel(muted);
    });
    return;
  }

  const vid = document.getElementById('spVideo');
  const playBtn = document.getElementById('spPlay');
  let userPaused = false;
  const sync = () => { playBtn.hidden = !vid.paused; };
  vid.addEventListener('play', sync);
  vid.addEventListener('pause', sync);
  vid.muted = true;
  const tryPlay = () => vid.play().catch(() => { playBtn.hidden = false; });
  tryPlay();
  document.addEventListener('touchstart', function once() { if (vid.paused && !userPaused) tryPlay(); document.removeEventListener('touchstart', once); }, { passive: true });
  document.getElementById('spMedia').addEventListener('click', e => {
    if (e.target.closest('#spSound')) return;
    if (vid.paused) { userPaused = false; vid.play(); } else { userPaused = true; vid.pause(); }
  });
  soundBtn.addEventListener('click', () => {
    vid.muted = !vid.muted;
    if (!vid.muted) { vid.volume = 1; if (vid.paused) vid.play(); }
    setLabel(vid.muted);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { if (!userPaused) tryPlay(); } else vid.pause();
    }), { threshold: 0.25 }).observe(vid);
  }
})();
