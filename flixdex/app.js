/* =====================================================================
   FLIXDEX — front end (vanilla JS, hash router)
   Talks to the Express API in server.js.
   ===================================================================== */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const view = $('#view');
  const state = { profile: null, profiles: [], myList: new Set() };

  // -------------------------------------------------------------------
  //  Utilities
  // -------------------------------------------------------------------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function api(path, options = {}) {
    if (staticDb) return staticApi(path, options);
    const sep = path.includes('?') ? '&' : '?';
    const url = state.profile ? `${path}${sep}profile=${state.profile.profile_id}` : path;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  // Each title gets its own "poster": a gradient picked from a hash of
  // its title + first genre, so it looks the same on every visit.
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function artStyle(t) {
    const h = hash(`${t.title}|${(t.genres || '').split(',')[0]}`);
    const hue = h % 360;
    const hue2 = (hue + 40 + (h >> 8) % 80) % 360;
    const angle = (h >> 4) % 360;
    return `background:
      radial-gradient(circle at ${20 + (h % 60)}% ${10 + ((h >> 6) % 50)}%, hsla(${hue2},85%,60%,.55), transparent 55%),
      linear-gradient(${angle}deg, hsl(${hue},55%,16%), hsl(${hue2},60%,32%))`;
  }

  const avatarColor = (name) => `hsl(${hash(name) % 360}, 65%, 45%)`;
  const matchPct = (t) => 80 + (hash(t.title) % 19); // decorative, like the real UI

  function toast(msg, isError = false) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('is-error', isError);
    el.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove('is-on'), 2600);
  }

  function errorView(err) {
    view.innerHTML = `<div class="page-top"><div class="empty">
      <strong>Couldn't load this page.</strong><br>${esc(err.message)}</div></div>`;
  }

  const skeletonRow = `<div class="skeleton">${'<i></i>'.repeat(8)}</div>`;
  const skeleton = () => `<div class="page-top">${skeletonRow.repeat(3)}</div>`;


  // -------------------------------------------------------------------
  //  Static mode (GitHub Pages): no server, so answer the API in the
  //  browser from data.json, built by `npm run build:static`.
  //  Same rules as the SQL: sp_search_titles, sp_similar_titles and the
  //  trg_watchlist_kids_guard trigger.
  // -------------------------------------------------------------------
  let staticDb = null;
  const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const byTitle = (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });

  async function detectMode() {
    try {
      const res = await fetch('api/health', { cache: 'no-store' });
      if (res.ok && (res.headers.get('content-type') || '').includes('json')) return;
    } catch { /* no server */ }
    await loadStatic();
  }

  async function loadStatic() {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('No API server and no data.json found');
    const d = await res.json();
    const titles = d.titles.map((r) => {
      const [id, showId, type, title, description, year, dateAdded, ratingIdx, minutes, seasons, g, c, dir, cast] = r;
      const rating = ratingIdx >= 0 ? d.ratings[ratingIdx] : null;
      const t = {
        title_id: id, show_id: showId, type: type ? 'TV Show' : 'Movie', title, description,
        release_year: year, date_added: dateAdded, year_added: dateAdded ? Number(dateAdded.slice(0, 4)) : null,
        rating: rating ? rating[0] : null, audience: rating ? rating[1] : null, audience_rank: rating ? rating[2] : null,
        duration_minutes: minutes, seasons, g, c, dir, cast,
      };
      t.duration_label = type === 0 && minutes ? `${minutes} min`
        : type === 1 && seasons ? (seasons === 1 ? '1 Season' : `${seasons} Seasons`) : null;
      t.genres = g.map((i) => d.genres[i]).sort((a, b) => a.localeCompare(b)).join(', ') || null;
      t.countries = c.map((i) => d.countries[i]).sort((a, b) => a.localeCompare(b)).join(', ') || null;
      t.directors = dir.map((i) => d.people[i]).sort((a, b) => a.localeCompare(b)).join(', ') || null;
      t.cast_list = cast.map((i) => d.people[i]).join(', ') || null;
      t._title = fold(title);
      t._text = fold(`${title} ${description}`);
      return t;
    });
    const byId = new Map(titles.map((t) => [t.title_id, t]));
    const invert = (key) => {
      const m = new Map();
      for (const t of titles) for (const k of t[key]) { if (!m.has(k)) m.set(k, []); m.get(k).push(t); }
      return m;
    };
    staticDb = {
      ...d, titles, byId, peopleFold: d.people.map(fold),
      genreTitles: invert('g'), dirTitles: invert('dir'), castTitles: invert('cast'),
    };
  }

  const STATIC_PROFILES = [
    { profile_id: 1, name: 'Carlos', is_kids: false },
    { profile_id: 2, name: 'Kids', is_kids: true },
  ];
  function listGet(pid) {
    try { return JSON.parse(localStorage.getItem(`flixdex-list-${pid}`)) || []; } catch { return []; }
  }
  function listSet(pid, list) {
    try { localStorage.setItem(`flixdex-list-${pid}`, JSON.stringify(list)); } catch { /* storage off */ }
  }
  const cardOf = (t) => ({
    title_id: t.title_id, show_id: t.show_id, type: t.type, title: t.title, release_year: t.release_year,
    rating: t.rating, audience_rank: t.audience_rank, duration_label: t.duration_label,
    genres: t.genres, description: t.description,
  });
  const allowed = (t, maxRank, type) => (!maxRank || (t.audience_rank != null && t.audience_rank <= maxRank))
    && (!type || t.type === type);

  function staticSearch(term, type, genre, maxRank, limit = 24, offset = 0) {
    const db = staticDb;
    term = (term || '').trim();
    limit = Math.min(Math.max(limit || 24, 1), 100);
    let pool = db.titles;
    if (term) {
      const f = fold(term);
      const words = f.split(/\s+/).filter((w) => w.length >= 3);
      const ids = new Set();
      for (const t of db.titles) {
        if (t._title.includes(f) || words.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t._text))) ids.add(t.title_id);
      }
      db.peopleFold.forEach((name, i) => {
        if (!name.includes(f)) return;
        for (const t of db.castTitles.get(i) || []) ids.add(t.title_id);
        for (const t of db.dirTitles.get(i) || []) ids.add(t.title_id);
      });
      pool = [...ids].map((id) => db.byId.get(id));
    }
    const gi = genre ? db.genres.indexOf(genre) : -1;
    const f = fold(term);
    return pool
      .filter((t) => allowed(t, maxRank, type) && (!genre || t.g.includes(gi)))
      .sort((a, b) => (term ? (b._title.startsWith(f) - a._title.startsWith(f)) || (b._title.includes(f) - a._title.includes(f)) : 0)
        || (b.release_year || 0) - (a.release_year || 0) || byTitle(a, b))
      .slice(offset, offset + limit)
      .map(cardOf);
  }

  function staticSimilar(id) {
    const db = staticDb;
    const t = db.byId.get(id);
    const score = new Map();
    const add = (list, pts) => { for (const o of list || []) if (o.title_id !== id) score.set(o.title_id, (score.get(o.title_id) || 0) + pts); };
    t.g.forEach((g) => add(db.genreTitles.get(g), 2));
    t.dir.forEach((p) => add(db.dirTitles.get(p), 3));
    t.cast.forEach((p) => add(db.castTitles.get(p), 1));
    return [...score].map(([tid, sc]) => ({ ...cardOf(db.byId.get(tid)), score: sc }))
      .sort((a, b) => b.score - a.score || (b.release_year || 0) - (a.release_year || 0))
      .slice(0, 24);
  }

  function countBy(items, keyFn) {
    const m = new Map();
    for (const it of items) for (const k of [].concat(keyFn(it))) m.set(k, (m.get(k) || 0) + 1);
    return m;
  }

  async function staticApi(path, options = {}) {
    const db = staticDb;
    const url = new URL(path, 'http://x');
    const p = url.pathname;
    const qs = url.searchParams;
    const method = (options.method || 'GET').toUpperCase();
    const profileId = state.profile ? state.profile.profile_id : null;
    const kids = state.profile && state.profile.is_kids;
    const maxRank = kids ? 4 : null;
    let m;

    if (p === '/api/profiles') {
      return STATIC_PROFILES.map((pr) => ({ ...pr, list_count: listGet(pr.profile_id).length }));
    }
    if ((m = p.match(/^\/api\/profiles\/(\d+)\/watchlist(?:\/(\d+))?$/))) {
      const pid = Number(m[1]);
      const list = listGet(pid);
      if (method === 'GET') {
        return list.map((e) => db.byId.get(e.id)).filter(Boolean).map(cardOf);
      }
      if (method === 'POST') {
        const tid = Number(options.body && options.body.title_id);
        const t = db.byId.get(tid);
        if (!t) throw new Error('Unknown profile or title');
        const pr = STATIC_PROFILES.find((x) => x.profile_id === pid);
        if (pr && pr.is_kids && (t.audience_rank == null || t.audience_rank > 4)) {
          throw new Error('This title is not available on a Kids profile.');
        }
        if (!list.some((e) => e.id === tid)) list.unshift({ id: tid, at: Date.now() });
        listSet(pid, list);
        return { added: true };
      }
      if (method === 'DELETE') {
        listSet(pid, list.filter((e) => e.id !== Number(m[2])));
        return null;
      }
    }
    if (p === '/api/home') {
      const type = ['Movie', 'TV Show'].includes(qs.get('type')) ? qs.get('type') : null;
      const pool = db.titles.filter((t) => allowed(t, maxRank, type));
      const recent = [...pool]
        .sort((a, b) => (b.date_added || '').localeCompare(a.date_added || '') || byTitle(a, b))
        .slice(0, 20).map(cardOf);
      const rows = [{ id: 'new', title: 'Recently Added', items: recent }];
      if (profileId) {
        const list = listGet(profileId).map((e) => db.byId.get(e.id)).filter((t) => t && allowed(t, maxRank, type));
        if (list.length) rows.push({ id: 'mylist', title: 'My List', items: list.slice(0, 20).map(cardOf) });
      }
      const counts = countBy(pool, (t) => t.g);
      [...counts].filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1] || db.genres[a[0]].localeCompare(db.genres[b[0]]))
        .slice(0, 10)
        .forEach(([gi]) => {
          const name = db.genres[gi];
          rows.push({ id: `genre-${name}`, title: name, genre: name, items: staticSearch(null, type, name, maxRank, 20) });
        });
      const heroPool = recent.filter((t) => t.description).slice(0, 10);
      return { hero: heroPool[Math.floor(Math.random() * heroPool.length)] || null, rows };
    }
    if (p === '/api/titles') {
      const type = ['Movie', 'TV Show'].includes(qs.get('type')) ? qs.get('type') : null;
      return staticSearch(qs.get('q'), type, qs.get('genre'), maxRank, Number(qs.get('limit')) || 40, Number(qs.get('offset')) || 0);
    }
    if ((m = p.match(/^\/api\/titles\/(\d+)$/))) {
      const t = db.byId.get(Number(m[1]));
      if (!t) throw new Error('Title not found');
      let similar = staticSimilar(t.title_id);
      if (maxRank) similar = similar.filter((s) => s.audience_rank != null && s.audience_rank <= maxRank);
      const { g, c, dir, cast, _title, _text, ...detail } = t; // eslint-disable-line no-unused-vars
      return {
        ...detail,
        in_list: profileId ? listGet(profileId).some((e) => e.id === t.title_id) : false,
        similar: similar.slice(0, 12),
      };
    }
    if (p === '/api/stats') {
      const T = db.titles;
      const movies = T.filter((t) => t.type === 'Movie');
      const years = new Map();
      for (const t of T) {
        if (!t.year_added) continue;
        const y = years.get(t.year_added) || { label: t.year_added, movies: 0, shows: 0, total: 0 };
        y[t.type === 'Movie' ? 'movies' : 'shows']++; y.total++;
        years.set(t.year_added, y);
      }
      const top = (map, names, n = 10) => [...map].map(([k, v]) => ({ label: names[k], value: v }))
        .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)).slice(0, n);
      const ratingCounts = countBy(T.filter((t) => t.rating), (t) => t.rating);
      const rankOf = new Map(db.ratings.map((r) => [r[0], r[2]]));
      const buckets = [['< 60', 0, 60], ['60–89', 60, 90], ['90–119', 90, 120], ['120–149', 120, 150], ['150+', 150, 1e9]];
      return {
        totals: {
          titles: T.length, movies: movies.length, shows: T.length - movies.length,
          people: db.people.length, countries: db.countries.length, genres: db.genres.length,
        },
        byYear: [...years.values()].sort((a, b) => a.label - b.label),
        topGenres: top(countBy(T, (t) => t.g), db.genres),
        topCountries: top(countBy(T, (t) => t.c), db.countries),
        ratings: [...ratingCounts].map(([label, value]) => ({ label, value }))
          .sort((a, b) => rankOf.get(a.label) - rankOf.get(b.label) || b.value - a.value),
        movieLengths: buckets.map(([label, lo, hi]) => ({
          label, value: movies.filter((t) => t.duration_minutes != null && t.duration_minutes >= lo && t.duration_minutes < hi).length,
        })).filter((b) => b.value > 0),
        topActors: top(countBy(T, (t) => t.cast), db.people),
      };
    }
    throw new Error('Not found');
  }

  // -------------------------------------------------------------------
  //  Rendering pieces
  // -------------------------------------------------------------------
  function card(t) {
    return `<button class="card" data-title="${t.title_id}" aria-label="${esc(t.title)}">
      <div class="card-art" style="${artStyle(t)}"></div>
      <span class="card-type">${t.type === 'Movie' ? 'FILM' : 'SERIES'}</span>
      <span class="card-title">${esc(t.title)}</span>
      <span class="card-meta">
        ${t.rating ? `<span class="badge">${esc(t.rating)}</span>` : ''}
        <span>${esc(t.duration_label || '')}</span>
        <span>${esc(t.release_year || '')}</span>
      </span>
    </button>`;
  }

  function row(r) {
    if (!r.items || !r.items.length) return '';
    const more = r.genre ? `<a href="#/genre/${encodeURIComponent(r.genre)}">Explore all ›</a>` : '';
    return `<section class="row">
      <div class="row-head"><h2>${esc(r.title)}</h2>${more}</div>
      <div class="row-wrap">
        <button class="row-arrow row-arrow--left" data-scroll="-1" aria-label="Scroll left">‹</button>
        <div class="row-track">${r.items.map(card).join('')}</div>
        <button class="row-arrow row-arrow--right" data-scroll="1" aria-label="Scroll right">›</button>
      </div>
    </section>`;
  }

  function hero(t) {
    if (!t) return '';
    const word = (t.genres || t.type).split(',')[0];
    return `<section class="hero">
      <div class="hero-art" style="${artStyle(t)}"><span class="hero-word">${esc(word)}</span></div>
      <div class="hero-content">
        <span class="kicker"><b>F</b> ${t.type === 'Movie' ? 'Film' : 'Series'}</span>
        <h1>${esc(t.title)}</h1>
        <div class="meta">
          <span class="match">${matchPct(t)}% Match</span>
          <span>${esc(t.release_year || '')}</span>
          ${t.rating ? `<span class="badge">${esc(t.rating)}</span>` : ''}
          <span>${esc(t.duration_label || '')}</span>
        </div>
        <p>${esc(t.description || '')}</p>
        <div class="actions">
          <button class="btn btn--light" data-title="${t.title_id}">
            <svg viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/></svg>More Info
          </button>
          <button class="btn btn--ghost" data-toggle-list="${t.title_id}">
            ${state.myList.has(t.title_id) ? '✓ In My List' : '+ My List'}
          </button>
        </div>
      </div>
    </section>`;
  }

  // -------------------------------------------------------------------
  //  Pages
  // -------------------------------------------------------------------
  async function homePage(type = null) {
    view.innerHTML = skeleton();
    const data = await api(`/api/home${type ? `?type=${encodeURIComponent(type)}` : ''}`);
    if (!data.rows.some((r) => r.items.length)) {
      view.innerHTML = `<div class="page-top"><div class="empty"><strong>No titles yet.</strong>
        Run <code>npm run db:load</code> to load the dataset.</div></div>`;
      return;
    }
    view.innerHTML = `${hero(data.hero)}<div class="rows">${data.rows.map(row).join('')}</div>`;
  }

  async function gridPage(title, subtitle, items, emptyMsg) {
    view.innerHTML = `<div class="page-top">
      <h1 class="page-title">${esc(title)}${subtitle ? `<small>${esc(subtitle)}</small>` : ''}</h1>
      ${items.length ? `<div class="grid">${items.map(card).join('')}</div>` : `<div class="empty">${emptyMsg}</div>`}
    </div>`;
  }

  async function myListPage() {
    view.innerHTML = skeleton();
    const items = await api(`/api/profiles/${state.profile.profile_id}/watchlist`);
    state.myList = new Set(items.map((t) => t.title_id));
    gridPage('My List', `${items.length} saved`, items,
      'Your list is empty. Open any title and press <strong>+</strong> to save it here.');
  }

  async function genrePage(genre) {
    view.innerHTML = skeleton();
    const items = await api(`/api/titles?genre=${encodeURIComponent(genre)}&limit=100`);
    gridPage(genre, `${items.length} titles`, items, 'Nothing in this genre for this profile.');
  }

  async function searchPage(q) {
    if (!q.trim()) { location.hash = '#/home'; return; }
    const items = await api(`/api/titles?q=${encodeURIComponent(q)}&limit=60`);
    gridPage(`Results for “${q}”`, `${items.length} found · title + description full-text search`, items,
      `No matches for <strong>${esc(q)}</strong>. Try a different word.`);
  }

  function bars(list) {
    const max = Math.max(1, ...list.map((d) => d.value));
    return `<div class="bars">${list.map((d) => `
      <div class="bar"><span class="bar-label" title="${esc(d.label)}">${esc(d.label)}</span>
        <span class="bar-track"><span class="bar-fill" data-w="${(100 * d.value) / max}"></span></span>
        <span class="bar-value">${d.value}</span></div>`).join('')}</div>`;
  }

  function columns(list) {
    const max = Math.max(1, ...list.map((d) => d.total));
    return `<div class="legend"><span><i style="background:var(--red)"></i>Movies</span>
      <span><i style="background:#f5f5f1"></i>TV Shows</span></div>
      <div class="columns">${list.map((d) => `
      <div class="col" title="${d.label}: ${d.movies} movies, ${d.shows} shows">
        <em>${d.total}</em>
        <div class="col-stack">
          <i class="movies" data-h="${(200 * d.movies) / max}"></i>
          <i class="shows" data-h="${(200 * d.shows) / max}"></i>
        </div>
        <small>${d.label}</small>
      </div>`).join('')}</div>`;
  }

  async function insightsPage() {
    view.innerHTML = skeleton();
    const s = await api('/api/stats');
    const k = s.totals;
    const kpi = (v, label) => `<div class="kpi"><b>${Number(v || 0).toLocaleString()}</b><span>${label}</span></div>`;
    const panel = (title, sql, body, wide = false) => `<section class="panel${wide ? ' panel--wide' : ''}">
      <h3>${title}</h3><p class="sql">${esc(sql)}</p>${body}</section>`;

    view.innerHTML = `<div class="page-top">
      <h1 class="page-title">Catalog Insights<small>Live queries against the normalized MySQL schema — the same SQL behind the Metabase dashboard</small></h1>
      <div class="stats">
        ${kpi(k.titles, 'Titles')}${kpi(k.movies, 'Movies')}${kpi(k.shows, 'TV Shows')}
        ${kpi(k.people, 'People')}${kpi(k.genres, 'Genres')}${kpi(k.countries, 'Countries')}
        ${panel('Titles added per year', 'SELECT * FROM v_yearly_additions', columns(s.byYear), true)}
        ${panel('Top genres', 'SELECT genre, total_titles FROM v_genre_summary', bars(s.topGenres))}
        ${panel('Top countries', 'SELECT country, total_titles FROM v_country_summary', bars(s.topCountries))}
        ${panel('Maturity ratings', 'titles ⋈ ratings GROUP BY code', bars(s.ratings))}
        ${panel('Movie length (minutes)', 'CASE buckets on duration_minutes', bars(s.movieLengths))}
        ${panel('Most-credited actors', 'SELECT * FROM v_person_credits', bars(s.topActors), true)}
      </div></div>`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      view.querySelectorAll('[data-w]').forEach((el) => { el.style.width = `${el.dataset.w}%`; });
      view.querySelectorAll('[data-h]').forEach((el) => { el.style.height = `${el.dataset.h}px`; });
    }));
  }

  function aboutPage() {
    const step = (n, title, text) => `<div class="about-step"><b>${n}</b><div><h4>${title}</h4><p>${text}</p></div></div>`;
    view.innerHTML = `<div class="page-top">
      <h1 class="page-title">About this project<small>Netflix Database &amp; GCP · Carlos Zabala</small></h1>
      <div class="about">
        <section class="panel about-video">
          <h3>Demo video (v1: Cloud SQL + Metabase)</h3>
          <div class="video-frame">
            <iframe src="https://www.youtube-nocookie.com/embed/4tRYxzllkQA?rel=0&amp;playsinline=1"
              title="Netflix Database &amp; GCP demo" loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </section>
        <section class="panel">
          <h3>From v1 to v2</h3>
          ${step('v1', 'Flat table on Cloud SQL', 'Kaggle CSV → Python (pymysql) → one <code>netflix_titles</code> table. Fixed a broken import by moving every layer to utf8mb4, and used EXPLAIN to tune the type/year index.')}
          ${step('v2', 'Normalized database', '11 tables in Third Normal Form, 5 views, stored procedures for search and “More Like This”, and a trigger that guards Kids profiles.')}
          ${step('▶', 'This app', 'FLIXDEX: Node.js + Express API on top of the procedures and views, with a vanilla JS front end. Every row you see is a live MySQL query.')}
          <div class="about-links">
            <a class="btn btn--light" href="https://github.com/carlosz98/Netflix-Database-GCP" target="_blank" rel="noopener">GitHub repo</a>
            <a class="btn btn--ghost" href="docs/v1-case-study.pdf" target="_blank" rel="noopener">v1 case study (PDF)</a>
          </div>
        </section>
        <section class="panel about-gallery">
          <h3>v1 in pictures</h3>
          <p class="sql">Cloud SQL Studio, System insights and Metabase, from the demo video (June 2025)</p>
          <div class="gallery">${V1_SHOTS.map(([file, caption]) => `
            <a href="docs/screenshots/v1/${file}" target="_blank" rel="noopener">
              <img src="docs/screenshots/v1/${file}" alt="${esc(caption)}" loading="lazy">
              <span>${esc(caption)}</span>
            </a>`).join('')}</div>
          <div class="about-bugs">
            <div><b>Bug 1: dates.</b> v1 stored every <code>date_added</code> as <code>0000-00-00</code>. Text like “September 25, 2021” can't be cast straight to DATE. v2 parses it.</div>
            <div><b>Bug 2: genres.</b> v1's genres table held whole combinations (“Action &amp; Adventure, Anime Features, …”), so the Top 10 chart was all 1s. v2 splits them into 42 real genres.</div>
          </div>
        </section>
      </div>
    </div>`;
  }

  const V1_SHOTS = [
    ['cloudsql-titles.jpg', 'titles table in Cloud SQL Studio'],
    ['cloudsql-genres.jpg', 'genres table (combined values)'],
    ['cloudsql-tv-view.jpg', 'tv_shows_summary view'],
    ['cloudsql-insights.jpg', 'System insights during import'],
    ['metabase-collection.jpg', 'Metabase “Our analytics”'],
    ['metabase-top-genres.jpg', 'Top 10 Most Common Genres'],
    ['cloudsql-studio-login.jpg', 'Cloud SQL Studio login'],
    ['cloudsql-backups.png', 'Automated + on-demand backups'],
  ];

  // -------------------------------------------------------------------
  //  Modal
  // -------------------------------------------------------------------
  const linkList = (csv, route) => (csv ? csv.split(', ').map((v) =>
    route ? `<a href="#/${route}/${encodeURIComponent(v)}">${esc(v)}</a>` : esc(v)).join(', ') : '—');

  async function openTitle(id) {
    const modal = $('#modal');
    const body = $('#modal-body');
    body.innerHTML = '<div class="modal-hero"><div class="card-art" style="background:var(--bg-3)"></div></div><div style="height:240px"></div>';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    try {
      const t = await api(`/api/titles/${id}`);
      if (t.in_list) state.myList.add(t.title_id); else state.myList.delete(t.title_id);
      const cast = t.cast_list ? t.cast_list.split(', ') : [];
      body.innerHTML = `
        <div class="modal-hero">
          <div class="card-art" style="${artStyle(t)}"></div>
          <div class="modal-hero-inner">
            <span class="kicker"><b>F</b> ${t.type === 'Movie' ? 'Film' : 'Series'}</span>
            <h2 id="modal-title">${esc(t.title)}</h2>
            <button class="icon-btn${t.in_list ? ' is-on' : ''}" data-toggle-list="${t.title_id}"
              title="${t.in_list ? 'Remove from My List' : 'Add to My List'}">${t.in_list ? '✓' : '+'}</button>
          </div>
        </div>
        <div class="modal-info">
          <div>
            <div class="meta">
              <span class="match">${matchPct(t)}% Match</span>
              <span>${esc(t.release_year || '')}</span>
              ${t.rating ? `<span class="badge">${esc(t.rating)}</span>` : ''}
              <span>${esc(t.duration_label || '')}</span>
              ${t.date_added ? `<span>Added ${new Date(t.date_added + 'T00:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>` : ''}
            </div>
            <p>${esc(t.description || 'No description.')}</p>
          </div>
          <div class="facts">
            <div>Cast: <span>${cast.length ? esc(cast.slice(0, 5).join(', ')) + (cast.length > 5 ? ', more' : '') : '—'}</span></div>
            <div>${t.directors && t.directors.includes(',') ? 'Directors' : 'Director'}: <span>${esc(t.directors || '—')}</span></div>
            <div>Genres: <span>${linkList(t.genres, 'genre')}</span></div>
            <div>Countries: <span>${esc(t.countries || '—')}</span></div>
            <div>Audience: <span>${esc(t.audience || 'Unrated')}</span></div>
          </div>
        </div>
        ${t.similar.length ? `<div class="modal-section"><h3>More Like This</h3>
          <div class="similar-grid">${t.similar.map((s) => `
            <button class="similar" data-title="${s.title_id}">
              <div class="card-art-wrap"><div class="card-art" style="${artStyle(s)}"></div>
                <span class="card-type">${s.type === 'Movie' ? 'FILM' : 'SERIES'}</span>
                <span class="card-title">${esc(s.title)}</span></div>
              <div class="similar-body">
                <div class="meta">${s.rating ? `<span class="badge">${esc(s.rating)}</span>` : ''}
                  <span>${esc(s.release_year || '')}</span><span>${esc(s.duration_label || '')}</span></div>
                <p>${esc(s.description || '')}</p>
              </div>
            </button>`).join('')}</div></div>` : ''}`;
      modal.scrollTop = 0;
    } catch (err) {
      body.innerHTML = `<div class="empty" style="padding:60px 40px">${esc(err.message)}</div>`;
    }
  }

  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
  }

  async function toggleList(titleId) {
    const pid = state.profile.profile_id;
    const inList = state.myList.has(titleId);
    try {
      if (inList) {
        await api(`/api/profiles/${pid}/watchlist/${titleId}`, { method: 'DELETE' });
        state.myList.delete(titleId);
        toast('Removed from My List');
      } else {
        await api(`/api/profiles/${pid}/watchlist`, { method: 'POST', body: { title_id: titleId } });
        state.myList.add(titleId);
        toast('Added to My List');
      }
      document.querySelectorAll(`[data-toggle-list="${titleId}"]`).forEach((btn) => {
        const on = state.myList.has(titleId);
        if (btn.classList.contains('icon-btn')) {
          btn.classList.toggle('is-on', on);
          btn.textContent = on ? '✓' : '+';
        } else {
          btn.textContent = on ? '✓ In My List' : '+ My List';
        }
      });
      if (location.hash === '#/mylist') myListPage();
    } catch (err) {
      toast(err.message, true); // e.g. the Kids-profile trigger
    }
  }

  // -------------------------------------------------------------------
  //  Profiles
  // -------------------------------------------------------------------
  async function showProfiles() {
    $('#app').hidden = true;
    $('#profiles-screen').hidden = false;
    state.profile = null;
    try {
      state.profiles = await api('/api/profiles');
      $('#profile-list').innerHTML = state.profiles.map((p) => `
        <button class="profile" data-profile="${p.profile_id}">
          <span class="avatar" style="background:${p.is_kids ? 'linear-gradient(135deg,#ff9a3c,#ff3cac)' : avatarColor(p.name)}">${esc(p.name[0])}</span>
          ${esc(p.name)}<small>${p.is_kids ? 'Kids · TV-Y to PG' : `${p.list_count} in My List`}</small>
        </button>`).join('');
    } catch (err) {
      $('#profile-list').innerHTML = `<div class="empty"><strong>Can't reach the database.</strong><br>${esc(err.message)}</div>`;
    }
  }

  async function chooseProfile(id) {
    state.profile = state.profiles.find((p) => p.profile_id === id);
    if (!state.profile) return showProfiles();
    sessionStorageSet('profile', String(id));
    const list = await api(`/api/profiles/${id}/watchlist`).catch(() => []);
    state.myList = new Set(list.map((t) => t.title_id));
    const chip = $('#profile-button');
    chip.textContent = state.profile.name[0];
    chip.style.background = state.profile.is_kids ? 'linear-gradient(135deg,#ff9a3c,#ff3cac)' : avatarColor(state.profile.name);
    $('#profiles-screen').hidden = true;
    $('#app').hidden = false;
    if (!location.hash || location.hash === '#/' || location.hash === '#/profiles') location.hash = '#/home';
    else router();
  }

  function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } }
  function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }

  // -------------------------------------------------------------------
  //  Router
  // -------------------------------------------------------------------
  async function router() {
    if (!state.profile) return;
    closeModal();
    const [, page = 'home', ...rest] = location.hash.replace(/^#/, '').split('/');
    const arg = decodeURIComponent(rest.join('/'));

    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === page));
    if (page !== 'search') $('#search-input').value = '';
    window.scrollTo(0, 0);

    try {
      switch (page) {
        case 'shows':    await homePage('TV Show'); break;
        case 'movies':   await homePage('Movie'); break;
        case 'mylist':   await myListPage(); break;
        case 'insights': await insightsPage(); break;
        case 'about':    aboutPage(); break;
        case 'genre':    await genrePage(arg); break;
        case 'search':   await searchPage(arg); break;
        case 'profiles': showProfiles(); break;
        default:         await homePage();
      }
    } catch (err) {
      errorView(err);
    }
  }

  // -------------------------------------------------------------------
  //  Events
  // -------------------------------------------------------------------
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-title]');
    const toggle = e.target.closest('[data-toggle-list]');
    const arrow = e.target.closest('[data-scroll]');
    const prof = e.target.closest('[data-profile]');

    if (toggle) { toggleList(Number(toggle.dataset.toggleList)); return; }
    if (t) { openTitle(Number(t.dataset.title)); return; }
    if (arrow) {
      const track = arrow.parentElement.querySelector('.row-track');
      track.scrollBy({ left: Number(arrow.dataset.scroll) * track.clientWidth * 0.9 });
      return;
    }
    if (prof) { chooseProfile(Number(prof.dataset.profile)); return; }
    if (e.target.closest('[data-close]')) closeModal();
    if (e.target.closest('#modal a')) closeModal();
  });

  $('#profile-button').addEventListener('click', () => { location.hash = '#/profiles'; });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
  });

  let searchTimer;
  $('#search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const q = e.target.value;
    searchTimer = setTimeout(() => {
      location.hash = q.trim() ? `#/search/${encodeURIComponent(q.trim())}` : '#/home';
    }, 300);
  });

  window.addEventListener('scroll', () => {
    $('#topbar').classList.toggle('is-solid', window.scrollY > 40);
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    if (location.hash === '#/profiles') showProfiles();
    else router();
  });

  // Boot: resume the last profile for this tab, otherwise ask.
  (async () => {
    await detectMode();
    if (staticDb) document.body.classList.add('is-static');
    await showProfiles();
    const saved = Number(sessionStorageGet('profile'));
    if (saved && location.hash !== '#/profiles' && state.profiles.some((p) => p.profile_id === saved)) {
      chooseProfile(saved);
    }
  })();
})();
