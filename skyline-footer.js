/* ═══════════════════════════════════════════════════════
   QUEENS SKYLINE FOOTER — day ↔ night with the sun & moon switch
   Replaces the plain <footer> on every page that loads this file.
   ═══════════════════════════════════════════════════════ */
(function () {
  const old = document.querySelector('footer');
  if (!old) return;
  const year = new Date().getFullYear();
  const W = 1440, H = 360, GROUND = 330;

  // deterministic "random" so the skyline looks the same on every load
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // Manhattan, far away
  let back = '';
  let x = 560;
  const towers = [];
  while (x < 1440) {
    const w = 26 + rnd() * 34, h = 90 + rnd() * 120;
    towers.push([x, w, h]); x += w + 2 + rnd() * 6;
  }
  towers.forEach(([tx, w, h], i) => {
    back += `<rect x="${tx.toFixed(1)}" y="${(GROUND - 46 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 46).toFixed(1)}" rx="2"/>`;
    if (i % 5 === 2) back += `<rect x="${(tx + w / 2 - 1).toFixed(1)}" y="${(GROUND - 46 - h - 22).toFixed(1)}" width="2" height="22"/>`;
  });
  // Empire State + Chrysler silhouettes
  const es = 930, cb = 1060;
  back += `<path d="M${es} ${GROUND} V${GROUND - 210} h8 v-18 h6 v-14 h4 v-40 h2 v-34 h2 v34 h2 v40 h4 v14 h6 v18 h8 V${GROUND} Z"/>`;
  back += `<path d="M${cb} ${GROUND} V${GROUND - 190} h4 l8 -22 l8 -26 l6 -40 l6 40 l8 26 l8 22 h4 V${GROUND} Z"/>`;

  // Queens, close up: low buildings with windows
  let front = '', wins = '';
  x = 0;
  seed = 41;
  while (x < 1440) {
    const w = 46 + rnd() * 70, h = 34 + rnd() * 70;
    if (x > 250 && x < 470) { x = 470; continue; }   // room for the Unisphere
    front += `<rect x="${x.toFixed(1)}" y="${(GROUND - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="5"/>`;
    for (let wy = GROUND - h + 10; wy < GROUND - 12; wy += 15)
      for (let wx = x + 9; wx < x + w - 12; wx += 15)
        wins += `<rect class="sk-win${rnd() < 0.45 ? ' on' : ''}" style="animation-delay:${(rnd() * 6).toFixed(2)}s" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="6" height="8" rx="1.5"/>`;
    x += w + 6 + rnd() * 10;
  }

  // Unisphere (Flushing Meadows)
  const ux = 360, uy = 226, ur = 58;
  let globe = `<circle cx="${ux}" cy="${uy}" r="${ur}"/>`;
  for (let k = 1; k <= 3; k++) globe += `<ellipse cx="${ux}" cy="${uy}" rx="${(ur * k / 4).toFixed(1)}" ry="${ur}"/>`;
  for (let k = -2; k <= 2; k++) {
    const yy = uy + k * ur * 0.36, rr = Math.sqrt(ur * ur - (yy - uy) ** 2);
    globe += `<line x1="${(ux - rr).toFixed(1)}" y1="${yy.toFixed(1)}" x2="${(ux + rr).toFixed(1)}" y2="${yy.toFixed(1)}"/>`;
  }
  globe += `<ellipse cx="${ux}" cy="${uy}" rx="${ur + 18}" ry="14" transform="rotate(-22 ${ux} ${uy})"/>`;
  const stand = `<path d="M${ux - 10} ${uy + ur - 4} L${ux - 22} ${GROUND} H${ux + 22} L${ux + 10} ${uy + ur - 4} Z"/><rect x="${ux - 70}" y="${GROUND - 8}" width="140" height="8" rx="4"/>`;

  // elevated 7 line
  const TRACK = 288;
  let pillars = '';
  for (let px = 20; px < W; px += 120) pillars += `<rect x="${px}" y="${TRACK}" width="8" height="${GROUND - TRACK}" rx="2"/>`;
  let cars = '';
  for (let c = 0; c < 4; c++) {
    const cx = c * 78;
    cars += `<rect x="${cx}" y="0" width="74" height="22" rx="6"/>`;
    for (let wi = 0; wi < 4; wi++) cars += `<rect class="sk-train-win" x="${cx + 8 + wi * 16}" y="5" width="10" height="8" rx="2"/>`;
  }
  cars += `<circle class="sk-train-badge" cx="20" cy="-10" r="0"/>`;

  // stars
  let stars = '';
  seed = 99;
  for (let s = 0; s < 46; s++)
    stars += `<circle class="sk-star" style="animation-delay:${(rnd() * 4).toFixed(2)}s" cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * 150).toFixed(0)}" r="${(0.6 + rnd() * 1.3).toFixed(1)}"/>`;

  const footer = document.createElement('footer');
  footer.className = 'sk-footer';
  footer.innerHTML = `
    <div class="sk-content">
      <div class="sk-brand">
        <p class="sk-name">Carlos Zabala</p>
        <p class="sk-tag">Software developer · built in Queens, NY</p>
      </div>
      <ul class="sk-links">
        <li><a href="https://github.com/carlosz98?tab=repositories" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github" aria-hidden="true"></i>GitHub</a></li>
        <li><a href="https://www.linkedin.com/in/carloszabala98/" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-linkedin" aria-hidden="true"></i>LinkedIn</a></li>
        <li><a href="resume.html"><i class="fa-solid fa-file-lines" aria-hidden="true"></i>Resume</a></li>
        <li><a href="contact.html"><i class="fa-solid fa-envelope" aria-hidden="true"></i>Contact</a></li>
        <li><a href="#" class="sk-top"><i class="fa-solid fa-arrow-up" aria-hidden="true"></i>Back to top</a></li>
      </ul>
    </div>
    <div class="sk-scene" aria-hidden="true">
      <div class="sk-sky"></div>
      <div class="sk-sun"></div>
      <div class="sk-moon"></div>
      <svg class="sk-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">
        <g class="sk-stars">${stars}</g>
        <g class="sk-back">${back}</g>
        <g class="sk-front">${front}<g class="sk-globe-stand">${stand}</g></g>
        <g class="sk-globe">${globe}</g>
        <g class="sk-wins">${wins}</g>
        <g class="sk-track"><rect x="0" y="${TRACK - 6}" width="${W}" height="6" rx="3"/>${pillars}</g>
        <g class="sk-train" transform="translate(-340 ${TRACK - 28})"><g class="sk-train-body">${cars}</g>
          <text class="sk-seven" x="-22" y="16">7</text><circle class="sk-seven-dot" cx="-18" cy="11" r="11"/></g>
        <rect class="sk-ground" x="0" y="${GROUND}" width="${W}" height="${H - GROUND}"/>
      </svg>
      <p class="sk-copy">© ${year} Carlos Zabala · Flushing Meadows to Manhattan</p>
    </div>`;
  old.replaceWith(footer);
  // phones see the Queens side (Unisphere + the 7), wide screens see all the way to Manhattan
  const svg = footer.querySelector('.sk-svg'), mq = matchMedia('(max-width: 700px)');
  const fit = () => {
    svg.setAttribute('viewBox', mq.matches ? `150 0 ${W - 150} ${H}` : `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', mq.matches ? 'xMinYMax slice' : 'xMidYMax slice');
  };
  fit(); mq.addEventListener('change', fit);
  // the 7 badge sits in front of its number
  const dot = footer.querySelector('.sk-seven-dot'), seven = footer.querySelector('.sk-seven');
  seven.before(dot);
  // copyright sits under the scene
  footer.appendChild(footer.querySelector('.sk-copy'));
  footer.querySelector('.sk-top').addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); });
})();
