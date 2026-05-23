/* ═══════════════════════════════════════════════════════
   CARLOS ZABALA — PORTFOLIO SCRIPTS
   ═══════════════════════════════════════════════════════ */

/* ─── DARK MODE ──────────────────────────────────────── */
const toggle = document.querySelector('#dark-mode-toggle');
const savedMode = localStorage.getItem('color-mode');
if (savedMode === 'dark') {
  document.body.classList.add('dark');
  if (toggle) toggle.checked = true;
}
if (toggle) {
  toggle.addEventListener('change', () => {
    const isDark = toggle.checked;
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('color-mode', isDark ? 'dark' : 'light');
  });
}

/* ─── PAGE LOADER ────────────────────────────────────── */
const $loader = document.querySelector('.loader');
window.addEventListener('load', () => {
  if ($loader) $loader.classList.remove('loader--active');
  initAfterLoad();
});
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
    e.preventDefault();
    pageTransitionOut(href);
  });
});

/* ─── SMOOTH PAGE TRANSITIONS ────────────────────────── */
const transitionOverlay = document.createElement('div');
transitionOverlay.id = 'page-transition';
document.body.appendChild(transitionOverlay);

function pageTransitionOut(href) {
  document.body.classList.add('page-leaving');
  transitionOverlay.classList.add('active');
  setTimeout(() => { window.location.href = href; }, 520);
}

window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-entering');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.body.classList.add('page-entered');
  }));
});

/* ─── ACTIVE NAV LINK ────────────────────────────────── */
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach(link => {
  const linkPage = link.getAttribute('href');
  if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
    link.classList.add('active');
  }
});

/* ─── BACK TO TOP ────────────────────────────────────── */
document.querySelectorAll('a[href="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/* ─── SCROLL PROGRESS BAR ────────────────────────────── */
const progressBar = document.createElement('div');
progressBar.id = 'scroll-progress';
document.body.appendChild(progressBar);
window.addEventListener('scroll', () => {
  const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
  progressBar.style.width = Math.min(pct, 100) + '%';
}, { passive: true });

/* ─── CUSTOM CURSOR ──────────────────────────────────── */
const dot  = document.createElement('div'); dot.id  = 'cursor-dot';
const ring = document.createElement('div'); ring.id = 'cursor-ring';
document.body.appendChild(dot);
document.body.appendChild(ring);

let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, trailTimer = 0;
document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  dot.style.left = mouseX + 'px'; dot.style.top = mouseY + 'px';
  trailTimer++;
  if (trailTimer % 4 === 0) spawnTrail(mouseX, mouseY);
});
(function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  ring.style.left = ringX + 'px'; ring.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
})();
document.querySelectorAll('a, button, label, li, .cert-card, .article-media').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});
function spawnTrail(x, y) {
  const t = document.createElement('div');
  t.className = 'cursor-trail';
  t.style.left = x + 'px'; t.style.top = y + 'px';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 500);
}

/* ─── SPOTLIGHT BACKGROUND ───────────────────────────── */
const spotlight = document.createElement('div');
spotlight.id = 'spotlight';
document.body.insertBefore(spotlight, document.body.firstChild);
document.addEventListener('mousemove', e => {
  spotlight.style.background =
    `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px,
      rgba(200,75,47,0.07) 0%,
      rgba(200,75,47,0.02) 40%,
      transparent 70%)`;
});

/* ─── NOISE / GRAIN OVERLAY ──────────────────────────── */
const grain = document.createElement('canvas');
grain.id = 'grain';
document.body.appendChild(grain);
(function animateGrain() {
  const W = grain.width  = window.innerWidth;
  const H = grain.height = window.innerHeight;
  const ctx = grain.getContext('2d');
  const img = ctx.createImageData(W, H);
  const d   = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255 | 0;
    d[i] = d[i+1] = d[i+2] = v;
    d[i+3] = 12; // very subtle opacity
  }
  ctx.putImageData(img, 0, 0);
  setTimeout(animateGrain, 80); // ~12fps grain animation
})();
window.addEventListener('resize', () => {
  grain.width  = window.innerWidth;
  grain.height = window.innerHeight;
});

/* ─── TYPEWRITER HERO TEXT ───────────────────────────── */
const heroH2 = document.querySelector('.bio-text h2');
if (heroH2) {
  const fullText = heroH2.textContent.trim();
  heroH2.innerHTML = '<span class="typewriter-text"></span><span class="typewriter-cursor"></span>';
  const textSpan   = heroH2.querySelector('.typewriter-text');
  const cursorSpan = heroH2.querySelector('.typewriter-cursor');
  let i = 0;
  setTimeout(() => {
    (function typeChar() {
      if (i < fullText.length) { textSpan.textContent += fullText[i++]; setTimeout(typeChar, 38); }
      else { setTimeout(() => { cursorSpan.style.opacity = '0'; }, 2400); }
    })();
  }, 600);
}

/* ─── SCRAMBLE TEXT ──────────────────────────────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
function scramble(el) {
  const original = el.getAttribute('data-original') || el.textContent;
  if (!el.getAttribute('data-original')) el.setAttribute('data-original', original);
  let frame = 0; const totalFrames = 18;
  const iv = setInterval(() => {
    el.textContent = original.split('').map((ch, i) => {
      if (ch === ' ') return ' ';
      if (frame / totalFrames > i / original.length) return ch;
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }).join('');
    if (++frame > totalFrames) { el.textContent = original; clearInterval(iv); }
  }, 35);
}
document.querySelectorAll('article h3').forEach(h3 => {
  h3.closest('article').addEventListener('mouseenter', () => scramble(h3));
});

/* ─── TAG PARTICLE BURST ─────────────────────────────── */
function burst(el) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'tag-particle';
    const angle = (i / 8) * Math.PI * 2;
    const r = 28 + Math.random() * 18;
    p.style.cssText = `left:${cx}px;top:${cy}px;--tx:${Math.cos(angle)*r}px;--ty:${Math.sin(angle)*r}px;width:${3+Math.random()*3}px;height:${3+Math.random()*3}px;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}
document.querySelectorAll('article li, .cert-skills span').forEach(tag => {
  tag.addEventListener('mouseenter', () => burst(tag));
});

/* ─── IMAGE ZOOM MODAL ───────────────────────────────── */
const modal = document.createElement('div');
modal.id = 'img-modal';
modal.innerHTML = `<div id="img-modal-backdrop"></div><div id="img-modal-content"><img id="img-modal-img" src="" alt=""><button id="img-modal-close" aria-label="Close">✕</button></div>`;
document.body.appendChild(modal);
const modalImg = document.getElementById('img-modal-img');
const modalClose = document.getElementById('img-modal-close');
const modalBack  = document.getElementById('img-modal-backdrop');
function openModal(src, alt) { modalImg.src = src; modalImg.alt = alt || ''; modal.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; setTimeout(() => { modalImg.src = ''; }, 300); }
modalClose.addEventListener('click', closeModal);
modalBack.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ─── SCROLL REVEAL ──────────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = [...(entry.target.parentElement?.children || [])].indexOf(entry.target);
      entry.target.style.transitionDelay = `${idx * 0.07}s`;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

document.querySelectorAll('.section-header, article, .cert-card, .contact-wrapper').forEach(el => {
  el.classList.add('reveal'); revealObserver.observe(el);
});
const bioEl = document.querySelector('.bio');
if (bioEl) { bioEl.classList.add('reveal'); revealObserver.observe(bioEl); }

/* ─── MEDIA SCALE-IN + TILT ──────────────────────────── */
const mediaObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); mediaObserver.unobserve(entry.target); }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.article-media').forEach(el => {
  el.classList.add('media-reveal'); el.style.transitionDelay = '0.12s'; mediaObserver.observe(el);
});

function initTilt(el) {
  const glare = document.createElement('div'); glare.className = 'glare'; el.appendChild(glare);
  const MAX = 8;
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width/2)  / (rect.width/2);
    const dy = (e.clientY - rect.top  - rect.height/2) / (rect.height/2);
    el.style.transform = `perspective(800px) rotateX(${-dy*MAX}deg) rotateY(${dx*MAX}deg) scale(1.03)`;
    el.style.boxShadow = `${-dx*12}px ${-dy*12}px 40px rgba(26,26,24,0.18)`;
    const gx = ((e.clientX - rect.left) / rect.width)  * 100;
    const gy = ((e.clientY - rect.top)  / rect.height) * 100;
    glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 65%)`;
    glare.style.opacity = '1';
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; el.style.boxShadow = ''; glare.style.opacity = '0'; });
}
document.querySelectorAll('.article-media').forEach(initTilt);

function initCardTilt(el) {
  const MAX = 6;
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width/2)  / (rect.width/2);
    const dy = (e.clientY - rect.top  - rect.height/2) / (rect.height/2);
    el.style.transform = `perspective(600px) rotateX(${-dy*MAX}deg) rotateY(${dx*MAX}deg) translateY(-6px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
}
document.querySelectorAll('.cert-card').forEach(initCardTilt);

/* ─── PROJECT NUMBER BADGES ──────────────────────────── */
document.querySelectorAll('.recent-work article').forEach((el, i) => {
  el.setAttribute('data-index', String(i + 1).padStart(2, '0'));
});

/* ─── PARALLAX PROFILE PHOTO ─────────────────────────── */
const profileImg = document.querySelector('.bio .profile-img');
if (profileImg) {
  window.addEventListener('scroll', () => {
    profileImg.style.transform = `translateY(${window.scrollY * 0.12}px)`;
  }, { passive: true });
}

/* ─── MAGNETIC BUTTONS ───────────────────────────────── */
document.querySelectorAll('a.btn').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    btn.style.transform = `translate(${(e.clientX - rect.left - rect.width/2) * 0.3}px, ${(e.clientY - rect.top - rect.height/2) * 0.3 - 2}px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
});

/* ─── SECTION LINE DRAW ──────────────────────────────── */
const lineObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); lineObserver.unobserve(entry.target); }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.section-header').forEach(el => lineObserver.observe(el));

/* ─── CONTACT LIVE STATUS ────────────────────────────── */
function initContactStatus() {
  const infoEl = document.querySelector('.contact-info');
  if (!infoEl) return;
  const hour = new Date().getHours();
  const available = hour >= 8 && hour < 23;
  const wrap = document.createElement('div'); wrap.id = 'live-status';
  wrap.innerHTML = `<span class="live-dot" style="background:${available ? '#2D7A4A' : '#7A7A72'}"></span><span class="live-text">${available ? 'Carlos is available — usually replies within 24h' : 'Carlos is offline — will reply first thing tomorrow'}</span>`;
  infoEl.appendChild(wrap);
}
initContactStatus();

/* ═══════════════════════════════════════════════════════
   ① SKILLS CONSTELLATION
   ═══════════════════════════════════════════════════════ */
function initConstellation() {
  const host = document.querySelector('.recent-work');
  if (!host) return;

  const skills = [
    { name: 'C++',           level: 95, group: 'lang',   projects: ['Employee Mgmt', 'GPA Calc'] },
    { name: 'Java',          level: 90, group: 'lang',   projects: ['Library System', 'DMV Project'] },
    { name: 'C#',            level: 80, group: 'lang',   projects: ['Flappy Bird', 'Gunbound'] },
    { name: 'Kotlin',        level: 75, group: 'lang',   projects: ['Retro Hub Android'] },
    { name: 'SwiftUI',       level: 65, group: 'lang',   projects: ['iOS Retro App'] },
    { name: 'HTML/CSS/JS',   level: 70, group: 'web',    projects: ['This Portfolio', 'Pet Adoption'] },
    { name: 'SQL',           level: 72, group: 'data',   projects: ['Netflix DB', 'GCP Cloud'] },
    { name: 'Unity',         level: 78, group: 'engine', projects: ['Flappy Bird', 'Gunbound', 'Pixel City'] },
    { name: 'Unreal Engine', level: 60, group: 'engine', projects: ['Warm Rain of Summer'] },
    { name: 'Android',       level: 74, group: 'mobile', projects: ['Retro Hub'] },
    { name: 'GCP',           level: 65, group: 'data',   projects: ['Netflix DB', 'Retro Hub'] },
    { name: 'Firebase',      level: 62, group: 'data',   projects: ['Retro Hub Android'] },
    { name: 'OOP',           level: 95, group: 'cs',     projects: ['All Projects'] },
    { name: 'Data Structs',  level: 88, group: 'cs',     projects: ['Library System', 'DMV'] },
    { name: 'Algorithms',    level: 85, group: 'cs',     projects: ['GPA Calc', 'Employee Mgmt'] },
  ];

  const connections = [
    [0,12],[0,14],[1,12],[1,13],[2,12],[3,9],[5,10],[6,10],[6,11],[7,8],[9,11],[12,13],[12,14],[13,14]
  ];

  const groupColors = {
    lang:   '#C84B2F',
    web:    '#2D7A8A',
    data:   '#7A4A8A',
    engine: '#4A8A2D',
    mobile: '#8A6A2D',
    cs:     '#8A2D4A',
  };

  // build section
  const section = document.createElement('section');
  section.className = 'constellation-section';
  section.innerHTML = `
    <div class="section-header">
      <h2>Skills</h2>
      <div class="section-line"></div>
    </div>
    <p class="constellation-hint">Hover a star to explore · connected skills share projects</p>
    <div class="constellation-wrap">
      <canvas id="constellation-canvas"></canvas>
      <div id="constellation-tooltip"></div>
    </div>`;
  host.parentNode.insertBefore(section, host);

  const canvas  = section.querySelector('#constellation-canvas');
  const tooltip = section.querySelector('#constellation-tooltip');
  const ctx     = canvas.getContext('2d');

  // layout: place stars in a force-relaxed grid
  const W = () => canvas.offsetWidth;
  const H = 380;

  function layout() {
    const w = W();
    canvas.width  = w;
    canvas.height = H;
    const cols = Math.ceil(Math.sqrt(skills.length * (w / H)));
    skills.forEach((s, i) => {
      if (!s.x || canvas._lastW !== w) {
        const col = i % cols, row = Math.floor(i / cols);
        const totalCols = cols, totalRows = Math.ceil(skills.length / cols);
        s.x = (col + 0.5 + (Math.random() - 0.5) * 0.7) / totalCols * w;
        s.y = (row + 0.5 + (Math.random() - 0.5) * 0.7) / totalRows * H;
      }
    });
    canvas._lastW = w;
  }

  let hoveredIdx = -1;

  function draw() {
    const w = W();
    ctx.clearRect(0, 0, w, H);

    // draw connections
    connections.forEach(([a, b]) => {
      const sa = skills[a], sb = skills[b];
      const isHighlighted = hoveredIdx === a || hoveredIdx === b;
      ctx.beginPath();
      ctx.moveTo(sa.x, sa.y);
      ctx.lineTo(sb.x, sb.y);
      ctx.strokeStyle = isHighlighted
        ? 'rgba(200,75,47,0.55)'
        : 'rgba(26,26,24,0.10)';
      ctx.lineWidth = isHighlighted ? 1.5 : 0.8;
      ctx.stroke();
    });

    // draw stars
    skills.forEach((s, i) => {
      const r   = 4 + (s.level / 100) * 8;
      const col = groupColors[s.group];
      const isHov = i === hoveredIdx;

      // glow
      if (isHov) {
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3.5);
        grd.addColorStop(0, col + 'AA');
        grd.addColorStop(1, col + '00');
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // star body
      ctx.beginPath();
      ctx.arc(s.x, s.y, isHov ? r * 1.35 : r, 0, Math.PI * 2);
      ctx.fillStyle = isHov ? col : col + 'CC';
      ctx.fill();

      // label
      ctx.font = isHov ? `600 12px DM Sans, sans-serif` : `400 11px DM Sans, sans-serif`;
      ctx.fillStyle = isHov ? col : 'rgba(26,26,24,0.65)';
      ctx.textAlign = 'center';
      ctx.fillText(s.name, s.x, s.y + r + 14);
    });
  }

  function getHovered(mx, my) {
    return skills.findIndex(s => {
      const r = 4 + (s.level / 100) * 8 + 8;
      return Math.hypot(s.x - mx, s.y - my) < r;
    });
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    hoveredIdx = getHovered(mx, my);
    canvas.style.cursor = hoveredIdx >= 0 ? 'none' : 'default';

    if (hoveredIdx >= 0) {
      const s = skills[hoveredIdx];
      tooltip.innerHTML = `
        <strong>${s.name}</strong>
        <div class="tt-bar"><div class="tt-fill" style="width:${s.level}%;background:${groupColors[s.group]}"></div></div>
        <span class="tt-pct">${s.level}% proficiency</span>
        <ul>${s.projects.map(p => `<li>${p}</li>`).join('')}</ul>`;
      tooltip.style.opacity = '1';
      const tx = Math.min(mx + 16, W() - 200);
      const ty = Math.max(my - 60, 8);
      tooltip.style.left = tx + 'px';
      tooltip.style.top  = ty + 'px';
    } else {
      tooltip.style.opacity = '0';
    }
    draw();
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredIdx = -1;
    tooltip.style.opacity = '0';
    draw();
  });

  layout();
  draw();
  window.addEventListener('resize', () => { layout(); draw(); });

  // re-observe for reveal
  section.querySelector('.section-header').classList.add('reveal');
  revealObserver.observe(section.querySelector('.section-header'));
}

/* ═══════════════════════════════════════════════════════
   ② TERMINAL EASTER EGG
   ═══════════════════════════════════════════════════════ */
function initTerminal() {
  const termEl = document.createElement('div');
  termEl.id = 'terminal';
  termEl.innerHTML = `
    <div id="terminal-bar">
      <span class="term-dot" style="background:#ff5f57"></span>
      <span class="term-dot" style="background:#febc2e"></span>
      <span class="term-dot" style="background:#28c840"></span>
      <span id="terminal-title">carlos@portfolio ~ </span>
      <button id="terminal-close" aria-label="Close terminal">✕</button>
    </div>
    <div id="terminal-output"></div>
    <div id="terminal-input-line">
      <span class="term-prompt">❯</span>
      <input id="terminal-input" type="text" autocomplete="off" spellcheck="false" placeholder="type a command...">
    </div>`;
  document.body.appendChild(termEl);

  const output  = document.getElementById('terminal-output');
  const input   = document.getElementById('terminal-input');
  const closeBtn= document.getElementById('terminal-close');
  let open = false;
  let history = [], histIdx = -1;

  const COMMANDS = {
    help: () => `<span class="t-dim">Available commands:</span>
<span class="t-acc">about</span>      — who is Carlos?
<span class="t-acc">skills</span>     — tech stack
<span class="t-acc">projects</span>   — list all projects
<span class="t-acc">contact</span>    — get in touch
<span class="t-acc">clear</span>      — clear terminal
<span class="t-acc">github</span>     — open GitHub
<span class="t-acc">linkedin</span>   — open LinkedIn
<span class="t-acc">blog</span>       — open blog
<span class="t-acc">resume</span>     — open resume
<span class="t-dim">press / or Esc to toggle this terminal</span>`,

    about: () => `<span class="t-acc">Carlos Zabala</span> — Programmer & Software Developer
Undergraduate at LaGuardia Community College
Majoring in Programming and Software Development

Strengths: OOP · Data Structures · Algorithms
Interests: Retro hardware · Game dev · Music`,

    skills: () => `<span class="t-acc">Languages</span>   C++ · Java · C# · Kotlin · SwiftUI · HTML/CSS/JS
<span class="t-acc">Engines</span>     Unity · Unreal Engine 5
<span class="t-acc">Data</span>        SQL · Firebase · GCP · MySQL
<span class="t-acc">Concepts</span>    OOP · Data Structures · Algorithms · Threading`,

    projects: () => `<span class="t-acc">01</span> Android Dev — Retro Hub         Kotlin · Jetpack Compose
<span class="t-acc">02</span> Library Management System        Java · OOP
<span class="t-acc">03</span> Windows 98 Retro Blog            HTML · CSS · JS · Framer
<span class="t-acc">04</span> Netflix Database & GCP           MySQL · GCP · Metabase
<span class="t-acc">05</span> Pet Adoption Center              PHP · Project Mgmt
<span class="t-acc">06</span> iOS Retro App                    SwiftUI
<span class="t-acc">07</span> Flappy Bird Replica              Unity · C#
<span class="t-acc">08</span> 2D Gunbound Replica              Unity · C#
<span class="t-acc">09</span> College GPA Calculator           C++
<span class="t-acc">10</span> DMV Project                      Java
<span class="t-acc">11</span> Employee Management System       C++`,

    contact: () => `<span class="t-acc">Email</span>     czabala1998@gmail.com
<span class="t-acc">LinkedIn</span>  linkedin.com/in/carloszabala98
<span class="t-acc">GitHub</span>    github.com/carlosz98`,

    clear: () => { output.innerHTML = ''; return null; },

    github:   () => { window.open('https://github.com/carlosz98?tab=repositories', '_blank'); return '<span class="t-dim">Opening GitHub...</span>'; },
    linkedin: () => { window.open('https://www.linkedin.com/in/carloszabala98/', '_blank'); return '<span class="t-dim">Opening LinkedIn...</span>'; },
    blog:     () => { window.open('https://charlysblog.framer.website/', '_blank'); return '<span class="t-dim">Opening blog...</span>'; },
    resume:   () => { window.open('resume/CAZV-RESUME.pdf', '_blank'); return '<span class="t-dim">Opening resume...</span>'; },
  };

  function print(cmd, resp) {
    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = `<span class="t-prompt-echo">❯ ${cmd}</span>${resp !== null ? `\n${resp}` : ''}`;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
  }

  function runCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    history.unshift(cmd); histIdx = -1;
    const fn = COMMANDS[cmd];
    if (fn) {
      const res = fn();
      if (res !== null) print(cmd, res);
    } else {
      print(cmd, `<span class="t-err">command not found: ${cmd} — type <span class="t-acc">help</span></span>`);
    }
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      runCommand(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIdx < history.length - 1) input.value = history[++histIdx];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx > 0) input.value = history[--histIdx];
      else { histIdx = -1; input.value = ''; }
    }
  });

  function openTerm() {
    open = true;
    termEl.classList.add('open');
    // welcome message on first open
    if (output.innerHTML === '') print('', COMMANDS.help());
    setTimeout(() => input.focus(), 50);
  }
  function closeTerm() { open = false; termEl.classList.remove('open'); }

  closeBtn.addEventListener('click', closeTerm);

  document.addEventListener('keydown', e => {
    if (e.target === input) return;
    if (e.key === '/' && !open) { e.preventDefault(); openTerm(); }
    else if (e.key === 'Escape' && open) closeTerm();
  });

  // hint badge
  const hint = document.createElement('div');
  hint.id = 'terminal-hint';
  hint.innerHTML = `<kbd>/</kbd> terminal`;
  hint.addEventListener('click', () => open ? closeTerm() : openTerm());
  document.body.appendChild(hint);
}

/* ═══════════════════════════════════════════════════════
   ③ PROJECT FILTER BAR
   ═══════════════════════════════════════════════════════ */
function initFilterBar() {
  const workSection = document.querySelector('.recent-work');
  if (!workSection) return;

  const filters = ['All', 'Java', 'C++', 'C#', 'Kotlin', 'Unity', 'Web', 'Android', 'SwiftUI', 'SQL'];

  const tagMap = {
    'Java':    ['java'],
    'C++':     ['c++'],
    'C#':      ['c#', 'unity'],
    'Kotlin':  ['kotlin'],
    'Unity':   ['unity'],
    'Web':     ['html', 'css', 'js', 'framer', 'php'],
    'Android': ['android', 'kotlin'],
    'SwiftUI': ['swiftui'],
    'SQL':     ['sql', 'mysql', 'gcp'],
  };

  const bar = document.createElement('div');
  bar.id = 'filter-bar';
  bar.innerHTML = filters.map((f, i) =>
    `<button class="filter-btn${i === 0 ? ' active' : ''}" data-filter="${f}">${f}</button>`
  ).join('');
  workSection.insertBefore(bar, workSection.firstChild);

  const articles = [...workSection.querySelectorAll('article')];

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    articles.forEach(art => {
      if (filter === 'All') {
        art.classList.remove('filtered-out');
        return;
      }
      const tags = [...art.querySelectorAll('li')].map(li => li.textContent.toLowerCase());
      const keywords = tagMap[filter] || [filter.toLowerCase()];
      const matches  = keywords.some(kw => tags.some(t => t.includes(kw)));
      art.classList.toggle('filtered-out', !matches);
    });
  });
}

/* ─── POST-LOAD INIT ─────────────────────────────────── */
function initAfterLoad() {
  document.querySelectorAll('.article-media img, article .article-img').forEach(img => {
    if (!img.dataset.modalAttached) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => openModal(img.src, img.alt));
      img.dataset.modalAttached = 'true';
    }
  });
}

/* ─── BOOT ALL ───────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  initConstellation();
  initTerminal();
  initFilterBar();
});

/* ═══════════════════════════════════════════════════════
   ④ AMBIENT BACKGROUND PARTICLES
   ═══════════════════════════════════════════════════════ */
function initParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles-canvas';
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];
  const COUNT = 55;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x    = Math.random() * W;
      this.y    = initial ? Math.random() * H : H + 10;
      this.r    = 0.6 + Math.random() * 1.8;
      this.vx   = (Math.random() - 0.5) * 0.18;
      this.vy   = -(0.12 + Math.random() * 0.28);
      this.life = 0;
      this.maxLife = 180 + Math.random() * 200;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.y < -10 || this.life > this.maxLife) this.reset(false);
    }
    draw() {
      const prog   = this.life / this.maxLife;
      const alpha  = Math.sin(prog * Math.PI) * 0.18;
      const isDark = document.body.classList.contains('dark');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? `rgba(200,75,47,${alpha})`
        : `rgba(26,26,24,${alpha * 0.7})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  let raf;
  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    raf = requestAnimationFrame(loop);
  }
  loop();

  // pause when tab is hidden to save resources
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else loop();
  });
}

/* ═══════════════════════════════════════════════════════
   ⑤ "TIME SINCE LAST COMMIT" BADGE
   ═══════════════════════════════════════════════════════ */
async function initLastCommit() {
  // inject badge into bio section
  const bio = document.querySelector('.bio-text');
  if (!bio) return;

  const badge = document.createElement('div');
  badge.id = 'last-commit-badge';
  badge.innerHTML = `<span class="commit-dot"></span><span class="commit-text">fetching activity…</span>`;
  // insert after status-badge
  const statusBadge = bio.querySelector('.status-badge');
  if (statusBadge) statusBadge.insertAdjacentElement('afterend', badge);
  else bio.insertBefore(badge, bio.firstChild);

  const textEl = badge.querySelector('.commit-text');

  function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)          return `${diff}s ago`;
    if (diff < 3600)        return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400)       return `${Math.floor(diff/3600)}h ago`;
    if (diff < 86400 * 7)   return `${Math.floor(diff/86400)}d ago`;
    if (diff < 86400 * 30)  return `${Math.floor(diff/86400/7)}w ago`;
    return `${Math.floor(diff/86400/30)}mo ago`;
  }

  try {
    const res  = await fetch('https://api.github.com/users/carlosz98/events/public?per_page=10');
    if (!res.ok) throw new Error();
    const data = await res.json();
    // find most recent push
    const push = data.find(e => e.type === 'PushEvent' || e.type === 'CreateEvent' || e.type === 'PullRequestEvent');
    if (push) {
      const ago  = timeAgo(push.created_at);
      const repo = push.repo?.name?.replace('carlosz98/', '') || 'a repo';
      textEl.textContent = `last commit ${ago} · ${repo}`;
      badge.classList.add('loaded');
    } else {
      textEl.textContent = 'actively building on GitHub';
      badge.classList.add('loaded');
    }
  } catch {
    // silently fall back — don't show broken badge
    textEl.textContent = 'actively building on GitHub';
    badge.classList.add('loaded');
  }
}

/* ═══════════════════════════════════════════════════════
   ⑥ SCROLL-TRIGGERED PROFICIENCY COUNTERS
      (animates numbers in the constellation tooltip
       AND adds animated stat counters above projects)
   ═══════════════════════════════════════════════════════ */
function initCounters() {
  // ── stat strip above "Recent Work" ──────────────────
  const workHeader = document.querySelector('.recent-work .section-header');
  if (!workHeader) return;

  const stats = [
    { label: 'Projects',     value: 11, suffix: '' },
    { label: 'Languages',    value: 5,  suffix: '+' },
    { label: 'Certificates', value: 4,  suffix: '' },
    { label: 'Commits',      value: 200, suffix: '+' },
  ];

  const strip = document.createElement('div');
  strip.id = 'stat-strip';
  strip.innerHTML = stats.map(s => `
    <div class="stat-item">
      <span class="stat-number" data-target="${s.value}" data-suffix="${s.suffix}">0${s.suffix}</span>
      <span class="stat-label">${s.label}</span>
    </div>`).join('');
  workHeader.insertAdjacentElement('afterend', strip);

  // animate counting when strip enters viewport
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.querySelectorAll('.stat-number').forEach(el => {
        const target  = parseInt(el.dataset.target);
        const suffix  = el.dataset.suffix || '';
        const dur     = 1200;
        const step    = 16;
        const steps   = dur / step;
        let   current = 0;
        const inc = target / steps;
        const iv = setInterval(() => {
          current = Math.min(current + inc, target);
          el.textContent = Math.round(current) + suffix;
          if (current >= target) clearInterval(iv);
        }, step);
      });
      counterObserver.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  counterObserver.observe(strip);
}

/* ─── BOOT NEW FEATURES ──────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initLastCommit();
  initCounters();
});