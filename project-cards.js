/* PROJECT CARDS — two-column cards, "Show all", and a Read more panel (see project-cards.css) */
window.addEventListener('DOMContentLoaded', function () {   // registered after script.js, so it runs once the filter bar and view wrapper exist
  const sections = [...document.querySelectorAll('.recent-work')];
  const VISIBLE = 6;
  const panel = document.createElement('div');
  panel.className = 'project-panel';
  panel.innerHTML = `<div class="project-panel-backdrop"></div><div class="project-panel-sheet" role="dialog" aria-modal="true"><button class="project-panel-close" aria-label="Close">✕</button><div class="project-panel-body"></div></div>`;
  document.body.appendChild(panel);
  const body = panel.querySelector('.project-panel-body');
  const close = () => {
    panel.classList.remove('open'); document.body.classList.remove('panel-open');
    setTimeout(() => { if (!panel.classList.contains('open')) body.innerHTML = ''; }, 450);
  };
  panel.querySelector('.project-panel-close').addEventListener('click', close);
  panel.querySelector('.project-panel-backdrop').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });

  const open = art => {
    const copy = art.cloneNode(true);
    copy.removeAttribute('id'); copy.classList.remove('card-extra', 'filtered-out');
    copy.querySelectorAll('h3').forEach(h => { h.textContent = h.dataset.original || h.textContent; });
    copy.querySelector('.article-detail')?.classList.add('open');
    body.innerHTML = ''; body.appendChild(copy);
    panel.classList.add('open'); document.body.classList.add('panel-open');
    panel.querySelector('.project-panel-sheet').scrollTop = 0;
  };

  sections.forEach((sec, si) => {
    sec.classList.add('cards-view');
    const grid = sec.querySelector('.articles-grid') || (() => {
      const g = document.createElement('div'); g.className = 'articles-grid';
      const first = sec.querySelector('article'); if (!first) return null;
      first.before(g); sec.querySelectorAll('article').forEach(a => g.appendChild(a)); return g;
    })();
    if (!grid) return;
    const arts = [...grid.querySelectorAll('article')];
    arts.forEach((art, i) => {
      const meta = art.querySelector('.article-meta');
      const ul = meta.querySelector('ul');
      const n = ul ? ul.children.length : 0;
      if (ul && n > 4) ul.dataset.more = `+${n - 4}`;
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const read = document.createElement('button');
      read.className = 'card-read'; read.type = 'button'; read.textContent = 'Read more →';
      read.addEventListener('click', () => open(art));
      actions.appendChild(read);
      const first = [...meta.querySelectorAll(':scope > a')][0];
      if (first) { const a = first.cloneNode(true); a.textContent = first.textContent.replace(/^Visit the /, ''); actions.appendChild(a); }
      meta.appendChild(actions);
      if (si === 0 && i >= VISIBLE) art.classList.add('card-extra');
    });
    if (si === 0 && arts.length > VISIBLE) {
      const more = document.createElement('div');
      more.className = 'cards-more';
      more.innerHTML = `<button type="button">Show all ${arts.length} projects ↓</button>`;
      more.querySelector('button').addEventListener('click', () => sec.classList.add('show-all'));
      grid.after(more);
      // a filter or a clicked skill star shows everything that matches
      document.getElementById('filter-bar')?.addEventListener('click', () => sec.classList.add('show-all'));
      const orig = window.filterProjectsBySkill;
      if (orig) window.filterProjectsBySkill = n => { sec.classList.add('show-all'); orig(n); };
    } else sec.classList.add('show-all');
  });
  document.getElementById('view-toggle')?.remove();
});
