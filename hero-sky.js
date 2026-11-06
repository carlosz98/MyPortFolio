/* ═══════════════════════════════════════════════════════
   HERO SKY + GLASS HEADER
   1) A soft Queens → Manhattan skyline behind the home-page intro,
      day in light mode, night (moon, stars, lit windows) in dark mode.
   2) A frosted-glass strip behind the header that only appears
      once the page is scrolled.
   ═══════════════════════════════════════════════════════ */
(function () {
  /* ── 2) glass header ── */
  const header = document.querySelector('header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 1) hero sky (home page only) ── */
  const bio = document.querySelector('.bio');
  if (!bio || !bio.querySelector('.profile-img') || bio.querySelector('.hs-scene')) return;   // home page intro only

  const W = 1440, H = 420, BASE = 420;
  let seed = 13;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // Manhattan, far away (right side, behind the text)
  let far = '', farWins = '';
  let x = 380;
  while (x < W) {
    const w = 24 + rnd() * 36, h = 70 + rnd() * 150;
    far += `<rect x="${x.toFixed(1)}" y="${(BASE - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2"/>`;
    for (let wy = BASE - h + 10; wy < BASE - 8; wy += 13)
      for (let wx = x + 6; wx < x + w - 6; wx += 9)
        if (rnd() < 0.12) farWins += `<rect class="hs-win" style="animation-delay:${(rnd() * 7).toFixed(2)}s" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="3" height="4"/>`;
    x += w + 2 + rnd() * 8;
  }
  const es = 1010, cb = 1160;
  far += `<path d="M${es} ${BASE} V${BASE - 230} h8 v-18 h6 v-14 h4 v-40 h2 v-34 h2 v34 h2 v40 h4 v14 h6 v18 h8 V${BASE} Z"/>`;
  far += `<path d="M${cb} ${BASE} V${BASE - 205} h4 l8 -22 l8 -26 l6 -40 l6 40 l8 26 l8 22 h4 V${BASE} Z"/>`;

  // Queens, close up: a low row along the bottom
  let near = '';
  x = 0; seed = 77;
  while (x < W) {
    const w = 50 + rnd() * 80, h = 22 + rnd() * 46;
    near += `<rect x="${x.toFixed(1)}" y="${(BASE - h).toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 4).toFixed(1)}" rx="5"/>`;
    x += w + 5 + rnd() * 8;
  }

  let stars = '';
  seed = 5;
  for (let s = 0; s < 60; s++)
    stars += `<circle class="hs-star" style="animation-delay:${(rnd() * 4).toFixed(2)}s" cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * 230).toFixed(0)}" r="${(0.6 + rnd() * 1.2).toFixed(1)}"/>`;

  const scene = document.createElement('div');
  scene.className = 'hs-scene';
  scene.setAttribute('aria-hidden', 'true');
  scene.innerHTML = `
    <div class="hs-sky"></div>
    <div class="hs-sun"></div>
    <div class="hs-moon"></div>
    <svg class="hs-stars-layer" viewBox="0 0 ${W} 240" preserveAspectRatio="xMidYMid slice"><g class="hs-stars">${stars}</g></svg>
    <svg class="hs-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMax slice">
      <g class="hs-far">${far}</g>
      <g class="hs-wins">${farWins}</g>
      <g class="hs-near">${near}</g>
    </svg>
    <div class="hs-fade"></div>`;
  bio.prepend(scene);
  bio.classList.add('has-sky');
})();
