/* RC CENTER - public site. Everything editable comes from data/site-data.json */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let DATA = null;
  let state = { year: 'all', event: 'all', videoYear: 'all', videoEvent: 'all' };
  let visible = [];
  let lbIndex = 0;

  async function loadData() {
    try {
      const res = await fetch('data/site-data.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (err) {
      console.error('Could not load site data:', err);
      return null;
    }
  }

  // ---------- Theme (colours from data file) ----------
  function applyTheme() {
    const t = DATA.theme || {};
    const map = { primary: '--primary', primaryDark: '--primary-dark', accent: '--accent', gold: '--gold', bg: '--bg', ink: '--ink', muted: '--muted' };
    Object.entries(map).forEach(([key, cssVar]) => {
      if (t[key]) document.documentElement.style.setProperty(cssVar, t[key]);
    });
    const meta = document.querySelector('meta[name="theme-color"]') || document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = t.primary || '#7A1020';
    document.head.appendChild(meta);
  }

  // ---------- Text (from data file) ----------
  function applyText() {
    const T = DATA.text || {};
    document.querySelectorAll('[data-text]').forEach((el) => {
      el.textContent = T[el.dataset.text] || '';
    });
    document.querySelectorAll('[data-text-list]').forEach((el) => {
      const items = T[el.dataset.textList] || [];
      el.innerHTML = items.map((p) => `<p>${esc(p)}</p>`).join('');
    });
    // Lists: <ul>/<ol> get <li> items, other elements get <p> items
    document.querySelectorAll('[data-list]').forEach((el) => {
      const items = T[el.dataset.list] || [];
      const tag = el.tagName === 'UL' || el.tagName === 'OL' ? 'li' : 'p';
      el.innerHTML = items.map((p) => `<${tag}>${esc(p)}</${tag}>`).join('');
    });
    // Pictures from the admin (hero banner and extra picture slots)
    const imgs = DATA.images || {};
    document.querySelectorAll('[data-img]').forEach((el) => {
      if (imgs[el.dataset.img]) el.src = imgs[el.dataset.img];
    });
    if (DATA.hero && DATA.hero.image) {
      document.querySelectorAll('[data-hero-img]').forEach((el) => { el.src = DATA.hero.image; });
    }
    // Scrolling ticker band (words repeated so it loops smoothly)
    const words = T.tickerWords || [];
    const track = document.getElementById('ticker');
    if (track && words.length) {
      const row = words.map((w) => `<span>${esc(w)}</span>`).join('<span>&#9733;</span>');
      track.innerHTML = row + '<span>&#9733;</span>' + row + '<span>&#9733;</span>';
    }
  }

  // ---------- Renderers ----------
  function renderEvents() {
    $('#event-grid').innerHTML = DATA.events.map((e) => `
      <article class="event-card reveal">
        <div class="event-icon" aria-hidden="true">${esc(e.icon)}</div>
        <h3>${esc(e.name)}</h3>
        <p>${esc(e.description)}</p>
      </article>`).join('');
  }

  function sortedPhotos() {
    return [...DATA.photos].sort((a, b) => b.year - a.year);
  }

  function renderYearFilter() {
    const years = [...DATA.years].sort((a, b) => b.year - a.year);
    const chips = [{ key: 'all', label: 'All Years' }, ...years.map((y) => ({ key: String(y.year), label: String(y.year) }))];
    $('#year-filter').innerHTML = chips.map((c) =>
      `<button class="chip" role="tab" data-year="${esc(c.key)}" aria-selected="${state.year === c.key}">${esc(c.label)}</button>`).join('');
  }

  function renderEventFilter() {
    const used = new Set(DATA.photos.filter((p) => state.year === 'all' || String(p.year) === state.year).map((p) => p.event));
    const chips = [{ key: 'all', label: 'All Events' }, ...DATA.events.filter((e) => used.has(e.id)).map((e) => ({ key: e.id, label: e.name }))];
    if (!chips.some((c) => c.key === state.event)) state.event = 'all';
    $('#event-filter').innerHTML = chips.map((c) =>
      `<button class="chip" role="tab" data-event="${esc(c.key)}" aria-selected="${state.event === c.key}">${esc(c.label)}</button>`).join('');
  }

  function photoCard(p, i, extraClass = '') {
    return `
      <button class="photo-card ${extraClass}" data-index="${i}" style="animation-delay:${Math.min(i * 60, 600)}ms" aria-label="View ${esc(p.caption)}">
        <img src="${esc(p.src)}" alt="${esc(p.alt || p.caption)}" loading="lazy" decoding="async">
        <span class="overlay"><strong>${esc(p.caption)}</strong><span>${esc(p.year)}</span></span>
      </button>`;
  }

  function renderGallery() {
    const eventName = Object.fromEntries(DATA.events.map((e) => [e.id, e.name]));
    visible = sortedPhotos().filter((p) =>
      (state.year === 'all' || String(p.year) === state.year) &&
      (state.event === 'all' || p.event === state.event));
    $('#gallery-empty').hidden = visible.length > 0;
    $('#gallery-grid').innerHTML = visible.map((p, i) => photoCard(p, i).replace(
      '<span>' + esc(p.year) + '</span>', '<span>' + esc(eventName[p.event] || '') + ' &middot; ' + esc(p.year) + '</span>')).join('');
  }

  function renderVideoFilters() {
    const years = [...DATA.years].sort((a, b) => b.year - a.year);
    const chips = [{ key: 'all', label: 'All Years' }, ...years.map((y) => ({ key: String(y.year), label: String(y.year) }))];
    $('#video-year-filter-public').innerHTML = chips.map((c) =>
      `<button class="chip" role="tab" data-video-year="${esc(c.key)}" aria-selected="${state.videoYear === c.key}">${esc(c.label)}</button>`).join('');

    const used = new Set((DATA.videos || []).filter((v) => state.videoYear === 'all' || String(v.year) === state.videoYear).map((v) => v.event));
    const eventChips = [{ key: 'all', label: 'All Events' }, ...DATA.events.filter((e) => used.has(e.id)).map((e) => ({ key: e.id, label: e.name }))];
    if (!eventChips.some((c) => c.key === state.videoEvent)) state.videoEvent = 'all';
    $('#video-event-filter').innerHTML = eventChips.map((c) =>
      `<button class="chip" role="tab" data-video-event="${esc(c.key)}" aria-selected="${state.videoEvent === c.key}">${esc(c.label)}</button>`).join('');
  }

  function renderVideoGallery() {
    const eventName = Object.fromEntries(DATA.events.map((e) => [e.id, e.name]));
    const videos = (DATA.videos || []).filter((v) =>
      (state.videoYear === 'all' || String(v.year) === state.videoYear) &&
      (state.videoEvent === 'all' || v.event === state.videoEvent))
      .sort((a, b) => b.year - a.year);
    $('#video-gallery-empty').hidden = videos.length > 0;
    $('#video-gallery-grid').innerHTML = videos.map((v) => `
      <article class="video-card reveal">
        <video controls preload="metadata" data-src="${esc(v.src)}"></video>
        <div class="video-card-body">
          <strong>${esc(v.caption)}</strong>
          <span>${esc(eventName[v.event] || '')} &middot; ${esc(v.year)}</span>
          <span class="video-load-error" hidden>Video could not be played. Please check the video file and try an MP4 (H.264) format.</span>
        </div>
      </article>`).join('');
    $('#video-gallery-grid').querySelectorAll('video').forEach((video) => {
      video.addEventListener('error', () => {
        video.parentElement.querySelector('.video-load-error').hidden = false;
      }, { once: true });
      video.src = video.dataset.src;
    });
  }

  // Highlights: latest memories, photos and reels
  function renderHighlights() {
    const mem = [...DATA.memories].sort((a, b) => b.year - a.year).slice(0, 3);
    $('#highlight-memories').innerHTML = mem.length ? mem.map(memoryCard).join('') : '<p class="empty-note">Memories will appear here.</p>';

    const photos = sortedPhotos().slice(0, 6);
    $('#highlight-photos').innerHTML = photos.length
      ? photos.map((p) => photoCard(p, -1).replace('data-index="-1"', 'data-highlight="' + esc(p.src) + '"')).join('')
      : '<p class="empty-note">Photos will appear here.</p>';

    renderReelsInto($('#highlight-reels'), (DATA.reels || []).slice(0, 2));
  }

  // Instagram reels: official embed script
  function renderReelsInto(el, reels) {
    if (!reels.length) {
      el.innerHTML = `
        <div class="reel-empty reveal">
          <p>Our celebration reels are coming soon.</p>
          <p>Follow <a href="https://www.instagram.com/rc_center_official" target="_blank" rel="noopener">@rc_center_official</a> to watch them first.</p>
        </div>`;
      return;
    }
    el.innerHTML = reels.map((r) => `
      <article class="reel-card reveal">
        <blockquote class="instagram-media" data-instgrm-permalink="${esc(r.url)}" data-instgrm-version="14"
          style="background:#FFF;border:0;border-radius:12px;margin:0;max-width:540px;min-width:280px;width:100%;">
          <a href="${esc(r.url)}" target="_blank" rel="noopener">View this reel on Instagram</a>
        </blockquote>
        <h3>${esc(r.title)}${r.year ? ' &middot; ' + esc(r.year) : ''}</h3>
      </article>`).join('');
    loadInstagramEmbeds();
  }

  function renderReels() {
    renderReelsInto($('#reel-grid'), DATA.reels || []);
  }

  function loadInstagramEmbeds() {
    if (window.instgrm && window.instgrm.Embeds) { window.instgrm.Embeds.process(); return; }
    if (document.getElementById('ig-embed-script')) return;
    const s = document.createElement('script');
    s.id = 'ig-embed-script';
    s.async = true;
    s.src = 'https://www.instagram.com/embed.js';
    document.body.appendChild(s);
  }

  function memoryCard(m) {
    return `
      <article class="memory-card reveal">
        <img src="${esc(m.cover)}" alt="${esc(m.title)}" loading="lazy">
        <div class="memory-body">
          <span class="memory-year">${esc(m.year)}</span>
          <h3>${esc(m.title)}</h3>
          <p>${esc(m.text)}</p>
        </div>
      </article>`;
  }

  function renderMemories() {
    $('#memory-grid').innerHTML = [...DATA.memories].sort((a, b) => b.year - a.year).map(memoryCard).join('');
  }

  let quoteIdx = 0;
  let quoteTimer = null;
  function showQuote(i) {
    const q = DATA.quotes[i];
    $('#quote-stage').innerHTML = `<figure class="quote-item" style="margin:0"><blockquote>&ldquo;${esc(q.text)}&rdquo;</blockquote><cite>&mdash; ${esc(q.source)}</cite></figure>`;
    document.querySelectorAll('#quote-dots button').forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
    quoteIdx = i;
  }
  function renderQuotes() {
    $('#quote-dots').innerHTML = DATA.quotes.map((_, i) => `<button aria-label="Quote ${i + 1}" data-q="${i}"></button>`).join('');
    showQuote(0);
    clearInterval(quoteTimer);
    quoteTimer = setInterval(() => showQuote((quoteIdx + 1) % DATA.quotes.length), 7000);
  }

  function renderContact() {
    const c = DATA.contact || {};
    const rows = [];
    if (c.address) rows.push(`<p><strong>Address</strong>${esc(c.address)}</p>`);
    if (c.phone) rows.push(`<p><strong>Phone</strong>${esc(c.phone)}</p>`);
    if (c.email) rows.push(`<p><strong>Email</strong>${esc(c.email)}</p>`);
    if (c.instagram) rows.push(`<p><strong>Instagram</strong>${esc(c.instagram)}</p>`);
    $('#contact-info').innerHTML = rows.join('');
    $('#footer-address').textContent = c.address || '';
  }

  // ---------- Background music (mute / unmute) ----------
  function setupMusic() {
    const m = DATA.music || {};
    const player = $('#music-player');
    if (!m.enabled || !m.src) return;

    const audio = $('#bg-music');
    const playBtn = $('#music-toggle');
    const muteBtn = $('#mute-toggle');
    audio.src = m.src;
    $('#music-title').textContent = '♪ ' + (m.title || 'Devotional music');
    player.hidden = false;

    // Remember mute choice for this visitor
    let savedMuted = false;
    try { savedMuted = localStorage.getItem('rc-muted') === '1'; } catch (_) { /* blocked */ }
    audio.muted = savedMuted;
    const paintMute = () => {
      muteBtn.innerHTML = audio.muted ? '&#128263;' : '&#128266;';
      muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute music' : 'Mute music');
    };
    paintMute();

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch((err) => console.warn('Music could not play:', err));
      } else {
        audio.pause();
      }
    });
    muteBtn.addEventListener('click', () => {
      audio.muted = !audio.muted;
      try { localStorage.setItem('rc-muted', audio.muted ? '1' : '0'); } catch (_) { /* blocked */ }
      paintMute();
    });
    audio.addEventListener('play', () => {
      playBtn.innerHTML = '&#10074;&#10074; Pause';
      playBtn.setAttribute('aria-pressed', 'true');
      player.classList.add('playing');
    });
    audio.addEventListener('pause', () => {
      playBtn.innerHTML = '&#9654; Play Music';
      playBtn.setAttribute('aria-pressed', 'false');
      player.classList.remove('playing');
    });
    // If the MP3 is not uploaded yet, hide the player instead of showing an error to visitors
    audio.addEventListener('error', () => {
      console.warn('Background music file not found:', m.src);
      player.hidden = true;
    });
  }

  // ---------- Lightbox ----------
  function openLightbox(i) {
    lbIndex = i;
    updateLightbox();
    $('#lightbox').hidden = false;
    document.body.style.overflow = 'hidden';
    $('.lb-close').focus();
  }
  function closeLightbox() {
    $('#lightbox').hidden = true;
    document.body.style.overflow = '';
  }
  function updateLightbox() {
    const p = visible[lbIndex];
    if (!p) return;
    $('#lb-img').src = p.src;
    $('#lb-img').alt = p.alt || p.caption;
    $('#lb-caption').textContent = `${p.caption} · ${p.year}`;
  }
  function stepLightbox(d) {
    if (!visible.length) return;
    lbIndex = (lbIndex + d + visible.length) % visible.length;
    updateLightbox();
  }

  // ---------- Interactions ----------
  function bindEvents() {
    $('#year-filter').addEventListener('click', (e) => {
      const b = e.target.closest('[data-year]'); if (!b) return;
      state.year = b.dataset.year; renderYearFilter(); renderEventFilter(); renderGallery();
    });
    $('#event-filter').addEventListener('click', (e) => {
      const b = e.target.closest('[data-event]'); if (!b) return;
      state.event = b.dataset.event; renderEventFilter(); renderGallery();
    });
    $('#video-year-filter-public').addEventListener('click', (e) => {
      const b = e.target.closest('[data-video-year]'); if (!b) return;
      state.videoYear = b.dataset.videoYear; renderVideoFilters(); renderVideoGallery();
      setupReveal();
    });
    $('#video-event-filter').addEventListener('click', (e) => {
      const b = e.target.closest('[data-video-event]'); if (!b) return;
      state.videoEvent = b.dataset.videoEvent; renderVideoFilters(); renderVideoGallery();
      setupReveal();
    });
    $('#gallery-grid').addEventListener('click', (e) => {
      const b = e.target.closest('.photo-card'); if (b) openLightbox(Number(b.dataset.index));
    });
    // Highlight photos open in the lightbox over the full list
    $('#highlight-photos').addEventListener('click', (e) => {
      const b = e.target.closest('.photo-card'); if (!b) return;
      state.year = 'all'; state.event = 'all';
      renderYearFilter(); renderEventFilter(); renderGallery();
      const idx = visible.findIndex((p) => p.src === b.dataset.highlight);
      openLightbox(Math.max(idx, 0));
    });
    $('#quote-dots').addEventListener('click', (e) => {
      const b = e.target.closest('[data-q]'); if (b) showQuote(Number(b.dataset.q));
    });

    $('.lb-close').addEventListener('click', closeLightbox);
    $('.lb-prev').addEventListener('click', () => stepLightbox(-1));
    $('.lb-next').addEventListener('click', () => stepLightbox(1));
    $('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if ($('#lightbox').hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    });

    const toggle = document.querySelector('.nav-toggle');
    const nav = $('#nav');
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });

    const header = document.querySelector('.site-header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    $('#contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const to = (DATA.contact && DATA.contact.email) || 'rccenterofficial@gmail.com';
      const subject = encodeURIComponent('Website enquiry from ' + f.get('name'));
      const body = encodeURIComponent(`${f.get('message')}\n\n— ${f.get('name')} (${f.get('email')})`);
      window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    });

    $('#year').textContent = new Date().getFullYear();
  }

  function setupReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { items.forEach((i) => i.classList.add('visible')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    items.forEach((i) => io.observe(i));
  }

  async function init() {
    DATA = await loadData();
    if (!DATA) {
      document.querySelector('main').insertAdjacentHTML('afterbegin',
        '<p style="padding:40px;text-align:center">Content could not be loaded. Please open the site through a web server (see the guide).</p>');
      return;
    }
    applyTheme();
    applyText();
    renderEvents();
    renderYearFilter();
    renderEventFilter();
    renderGallery();
    DATA.videos = DATA.videos || [];
    renderVideoFilters();
    renderVideoGallery();
    renderHighlights();
    renderReels();
    renderMemories();
    renderQuotes();
    renderContact();
    setupMusic();
    bindEvents();
    setupReveal();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
