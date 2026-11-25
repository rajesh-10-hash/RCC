/* ===========================================================
   RC Center Admin Panel
   -----------------------------------------------------------
   CHANGE THIS PASSWORD before going live.
   Note: this is a simple browser-side lock suitable for keeping
   casual visitors out. Anyone determined can view the code, so
   host the admin folder privately if you need stronger security
   (see the guide, section "Securing the admin panel").
   =========================================================== */
const ADMIN_PASSWORD = 'RC@2026';

const DRAFT_KEY = 'rc-center-draft';
const IMAGE_MAX_WIDTH = 1600;   // gallery photos
const IMAGE_QUALITY = 0.82;     // JPEG quality (0-1)

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const slug = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'photo';

let DRAFT = null;
const pendingPreview = {}; // src path -> object URL, for images selected in this session
let videoPreviewUrl = null;

// ---------- Login ----------
function showApp() {
  $('#login').hidden = true;
  $('#app').hidden = false;
  init();
}
$('#login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if ($('#password').value === ADMIN_PASSWORD) {
    sessionStorage.setItem('rc-admin', '1');
    showApp();
  } else {
    $('#login-error').hidden = false;
  }
});
$('#logout').addEventListener('click', () => { sessionStorage.removeItem('rc-admin'); location.reload(); });

// ---------- Data ----------
async function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) { /* ignore */ }
  const res = await fetch('../data/site-data.json', { cache: 'no-cache' });
  return res.json();
}
function saveDraft(msg) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(DRAFT)); } catch (_) { /* storage full or blocked */ }
  if (msg) setStatus(msg);
}
function setStatus(msg) {
  $('#status').textContent = msg;
  clearTimeout(setStatus.t);
  setStatus.t = setTimeout(() => ($('#status').textContent = ''), 4000);
}

// ---------- Image optimisation (done in the browser, no server needed) ----------
function optimizeImage(file, maxWidth = IMAGE_MAX_WIDTH, quality = IMAGE_QUALITY) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.naturalWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        blob ? resolve({ blob, width: canvas.width, height: canvas.height }) : reject(new Error('Could not process image'));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unsupported image file')); };
    img.src = url;
  });
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function fmtKB(bytes) { return (bytes / 1024).toFixed(0) + ' KB'; }

// Shows a live preview and optimisation info for a chosen file
async function previewFile(input, previewEl, hintEl, maxWidth) {
  const file = input.files[0];
  if (!file) { previewEl.innerHTML = '<span class="muted">No file selected</span>'; hintEl.textContent = ''; return null; }
  previewEl.innerHTML = '<span class="muted">Optimising...</span>';
  try {
    const out = await optimizeImage(file, maxWidth);
    const url = URL.createObjectURL(out.blob);
    previewEl.innerHTML = `<img src="${url}" alt="Preview">`;
    hintEl.textContent = `Original ${fmtKB(file.size)} → optimised ${fmtKB(out.blob.size)} (${out.width}×${out.height}).`;
    return out;
  } catch (err) {
    previewEl.innerHTML = `<span class="error">${esc(err.message)}</span>`;
    return null;
  }
}

// ---------- Helpers to fill selects ----------
function yearOptions(selected) {
  const years = [...DRAFT.years].sort((a, b) => b.year - a.year);
  return years.map((y) => `<option value="${y.year}" ${Number(selected) === y.year ? 'selected' : ''}>${y.year} - ${esc(y.title)}</option>`).join('');
}
function fillYearSelects() {
  $$('select[name="year"]').forEach((s) => { const cur = s.value; s.innerHTML = yearOptions(cur || DRAFT.years[0]?.year); });
  ['photo-year-filter', 'video-year-filter'].forEach((id) => {
    const f = $('#' + id);
    const cur = f.value || 'all';
    f.innerHTML = `<option value="all">All years</option>` + DRAFT.years.map((y) => `<option value="${y.year}">${y.year}</option>`).join('');
    f.value = cur;
  });
}
function fillEventSelect() {
  $$('select[name="event"]').forEach((s) => {
    s.innerHTML = DRAFT.events.map((e) => `<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');
  });
}
function imgSrc(src) {
  return pendingPreview[src] || (/^https?:/.test(src) ? src : '../' + src);
}

// ---------- Renderers ----------
function renderPhotos() {
  const f = $('#photo-year-filter').value;
  const list = DRAFT.photos.filter((p) => f === 'all' || String(p.year) === f);
  const eventName = Object.fromEntries(DRAFT.events.map((e) => [e.id, e.name]));
  $('#photo-list').innerHTML = list.length ? list.map((p) => `
    <div class="item">
      <img src="${esc(imgSrc(p.src))}" alt="" loading="lazy">
      <div class="item-body">
        <strong>${esc(p.caption)}</strong>
        <span class="muted">${esc(eventName[p.event] || p.event)} &middot; ${p.year}</span>
        <span class="muted">${esc(p.src)}</span>
        <button class="btn btn-danger" data-del="photos" data-id="${esc(p.id)}">Delete</button>
      </div>
    </div>`).join('') : '<p class="empty">No photos for this year yet.</p>';
}
function renderUploadedVideos() {
  const f = $('#video-year-filter').value;
  const list = DRAFT.videos.filter((v) => f === 'all' || String(v.year) === f);
  const eventName = Object.fromEntries(DRAFT.events.map((e) => [e.id, e.name]));
  $('#uploaded-video-list').innerHTML = list.length ? list.map((v) => `
    <div class="item">
      <video data-src="${esc(imgSrc(v.src))}" controls preload="metadata"></video>
      <div class="item-body">
        <strong>${esc(v.caption)}</strong>
        <span class="muted">${esc(eventName[v.event] || v.event)} &middot; ${v.year}</span>
        <span class="muted">${esc(v.src)}</span>
        <span class="video-load-error" hidden>Video could not be played. Check that the file exists at this path and uses a browser-supported format.</span>
        <button class="btn btn-danger" data-del="videos" data-id="${esc(v.id)}">Delete</button>
      </div>
    </div>`).join('') : '<p class="empty">No videos for this year yet.</p>';
  $$('#uploaded-video-list video').forEach((video) => {
    video.addEventListener('error', () => {
      video.parentElement.querySelector('.video-load-error').hidden = false;
    }, { once: true });
    video.src = video.dataset.src;
  });
}
function renderVideos() {
  $('#video-list').innerHTML = DRAFT.reels.length ? DRAFT.reels.map((r) => `
    <div class="item">
      <div class="item-body">
        <strong>${esc(r.title)}</strong>
        <span class="muted">${r.year} &middot; <a href="${esc(r.url)}" target="_blank" rel="noopener">Open on Instagram</a></span>
        <button class="btn btn-danger" data-del="reels" data-id="${esc(r.id)}">Delete</button>
      </div>
    </div>`).join('') : '<p class="empty">No reels yet.</p>';
}
function renderMemories() {
  $('#memory-list').innerHTML = DRAFT.memories.length ? DRAFT.memories.map((m) => `
    <div class="item">
      <img src="${esc(imgSrc(m.cover))}" alt="" loading="lazy">
      <div class="item-body">
        <strong>${esc(m.title)}</strong>
        <span class="muted">${m.year}</span>
        <span class="muted">${esc(m.text).slice(0, 110)}</span>
        <button class="btn btn-danger" data-del="memories" data-id="${esc(m.id)}">Delete</button>
      </div>
    </div>`).join('') : '<p class="empty">No memories yet.</p>';
}
function renderYears() {
  $('#year-list').innerHTML = DRAFT.years.map((y) => {
    const count = DRAFT.photos.filter((p) => p.year === y.year).length;
    return `<div class="item"><div class="item-body">
      <strong>${y.year}</strong><span>${esc(y.title)}</span>
      <span class="muted">${count} photo(s)</span>
      <button class="btn btn-danger" data-del="years" data-id="${y.year}">Delete year</button>
    </div></div>`;
  }).join('');
}
function renderEvents() {
  $('#event-list').innerHTML = DRAFT.events.map((e) => `
    <div class="item"><div class="item-body">
      <label class="item-edit-label">Icon <input class="item-edit" data-ev="${esc(e.id)}" data-field="icon" value="${esc(e.icon)}"></label>
      <label class="item-edit-label">Name <input class="item-edit" data-ev="${esc(e.id)}" data-field="name" value="${esc(e.name)}"></label>
      <label class="item-edit-label">Description <textarea class="item-edit" rows="3" data-ev="${esc(e.id)}" data-field="description">${esc(e.description)}</textarea></label>
    </div></div>`).join('');
}
function renderQuotes() {
  $('#quote-list').innerHTML = DRAFT.quotes.map((q, i) => `
    <div class="item"><div class="item-body">
      <span>&ldquo;${esc(q.text)}&rdquo;</span><span class="muted">${esc(q.source)}</span>
      <button class="btn btn-danger" data-del="quotes" data-id="${i}">Delete</button>
    </div></div>`).join('');
}
function renderAll() {
  bindDataFields();
  fillYearSelects();
  fillEventSelect();
  renderPhotos(); renderUploadedVideos(); renderVideos(); renderMemories(); renderYears(); renderEvents(); renderQuotes();
}

// ---------- Actions ----------
function bindForms() {
  // Tabs
  $$('.tab').forEach((t) => t.addEventListener('click', () => {
    $$('.tab').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    $$('.panel').forEach((p) => (p.hidden = p.dataset.panel !== t.dataset.tab));
  }));

  $('#photo-year-filter').addEventListener('change', renderPhotos);

  $('#video-year-filter').addEventListener('change', renderUploadedVideos);
  $('#video-file-form input[name="file"]').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = $('#video-file-preview');
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    videoPreviewUrl = null;
    if (!file) {
      preview.innerHTML = '<span class="muted">Choose a video file to preview.</span>';
      $('#video-file-hint').textContent = '';
      return;
    }
    videoPreviewUrl = URL.createObjectURL(file);
    preview.innerHTML = `<video src="${esc(videoPreviewUrl)}" controls preload="metadata"></video>`;
    $('#video-file-hint').textContent = `Selected video: ${fmtKB(file.size)}.`;
  });

  $('#video-file-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const formData = new FormData(f);
    const file = formData.get('file');
    const caption = String(formData.get('caption') || '').trim();
    const event = String(formData.get('event') || '');
    const year = Number(formData.get('year'));
    if (!(file instanceof File) || file.size === 0) return setStatus('Choose a video file first.');
    const extension = file.name.match(/\.[a-z0-9]{1,8}$/i);
    if (!extension) return setStatus('The selected video must have a file extension, such as .mp4 or .webm.');
    if (file.type && !file.type.startsWith('video/')) return setStatus('Choose a valid video file.');
    const filename = `${slug(caption)}-${Date.now().toString(36).slice(-4)}${extension[0].toLowerCase()}`;
    const src = `videos/gallery/${year}/${filename}`;
    pendingPreview[src] = URL.createObjectURL(file);
    DRAFT.videos.push({ id: uid('v'), year, event, src, caption, alt: caption });
    saveDraft();
    downloadBlob(file, filename);
    f.reset();
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    videoPreviewUrl = null;
    $('#video-file-preview').innerHTML = '<span class="muted">Video added. Choose another to continue.</span>';
    $('#video-file-hint').textContent = `Save "${filename}" in videos/gallery/${year}/, then publish the updated site-data.json.`;
    fillYearSelects();
    $('#video-year-filter').value = String(year);
    renderUploadedVideos();
    setStatus(`Video added. Save the downloaded file to videos/gallery/${year}/ and publish site-data.json.`);
  });

  // Photo preview
  $('#photo-form input[name="file"]').addEventListener('change', (e) =>
    previewFile(e.target, $('#photo-preview'), $('#photo-hint'), IMAGE_MAX_WIDTH));

  // Add photo
  $('#photo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const input = f.file;
    const out = await previewFile(input, $('#photo-preview'), $('#photo-hint'), IMAGE_MAX_WIDTH);
    if (!out) return;
    const year = Number(f.year.value);
    const filename = `${slug(f.caption.value)}-${Date.now().toString(36).slice(-4)}.jpg`;
    const src = `images/gallery/${year}/${filename}`;
    pendingPreview[src] = URL.createObjectURL(out.blob);
    DRAFT.photos.push({ id: uid('p'), year, event: f.event.value, src, caption: f.caption.value.trim(), alt: f.caption.value.trim() });
    saveDraft();
    downloadBlob(out.blob, filename);
    f.reset();
    $('#photo-preview').innerHTML = '<span class="muted">Photo added. Choose another to continue.</span>';
    $('#photo-hint').textContent = `Upload "${filename}" to images/gallery/${year}/ in your project.`;
    fillYearSelects();
    $('#photo-year-filter').value = String(year);
    renderPhotos();
    setStatus('Photo added. Download the optimised file and upload it to your project.');
  });

  // Video
  $('#video-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const id = extractReelUrl(f.reel.value);
    if (!id) return setStatus('That does not look like an Instagram reel link. Example: https://www.instagram.com/reel/XXXX/');
    DRAFT.reels.push({ id: uid('r'), year: Number(f.year.value), title: f.elements.title.value.trim(), url: id });
    saveDraft('Reel added.');
    f.reset(); fillYearSelects(); renderVideos();
  });

  // Memory
  $('#memory-form input[name="file"]').addEventListener('change', (e) =>
    previewFile(e.target, $('#memory-preview'), $('#memory-hint'), 1200));
  $('#memory-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const out = await previewFile(f.file, $('#memory-preview'), $('#memory-hint'), 1200);
    if (!out) return;
    const year = Number(f.year.value);
    const filename = `memory-${year}-${slug(f.elements.title.value)}.jpg`;
    const src = `images/gallery/${year}/${filename}`;
    pendingPreview[src] = URL.createObjectURL(out.blob);
    DRAFT.memories.push({ id: uid('m'), year, title: f.elements.title.value.trim(), text: f.text.value.trim(), cover: src });
    saveDraft();
    downloadBlob(out.blob, filename);
    f.reset(); $('#memory-preview').innerHTML = '<span class="muted">Memory added.</span>';
    renderMemories();
    setStatus('Memory added. Upload the cover image to your project.');
  });

  // Years
  $('#year-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const year = Number(f.year.value);
    if (DRAFT.years.some((y) => y.year === year)) return setStatus('That year already exists.');
    DRAFT.years.push({ year, title: f.elements.title.value.trim(), theme: '' });
    saveDraft('Year added.');
    f.reset(); renderAll();
  });

  // Pictures: hero banner plus About, Facts and Heart pictures
  $('#hero-form input[name="file"]').addEventListener('change', (e) =>
    previewFile(e.target, $('#hero-preview'), $('#hero-hint'), 1600));
  $('#hero-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const slot = f.slot.value;
    const out = await previewFile(f.file, $('#hero-preview'), $('#hero-hint'), 1600);
    if (!out) return;
    const filename = `${slot}-${Date.now().toString(36)}.jpg`;
    const src = slot === 'hero' ? `images/hero/${filename}` : `images/site/${filename}`;
    pendingPreview[src] = URL.createObjectURL(out.blob);
    if (slot === 'hero') DRAFT.hero = { image: src };
    else { DRAFT.images = DRAFT.images || {}; DRAFT.images[slot] = src; }
    saveDraft();
    downloadBlob(out.blob, filename);
    setStatus(`Picture saved. Upload "${filename}" to ${slot === 'hero' ? 'images/hero/' : 'images/site/'} in your project.`);
  });

  // Quotes
  $('#quote-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    DRAFT.quotes.push({ text: f.text.value.trim(), source: f.source.value.trim() });
    saveDraft('Quote added.');
    f.reset(); renderQuotes();
  });

  // Events (inline edit)
  $('#event-list').addEventListener('change', (e) => {
    const el = e.target;
    if (!el.dataset.ev) return;
    const ev = DRAFT.events.find((x) => x.id === el.dataset.ev);
    if (ev) { ev[el.dataset.field] = el.value; saveDraft('Event updated.'); }
  });

  // Deletes (event delegation)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    const type = b.dataset.del;
    if (!confirm('Delete this item? This cannot be undone.')) return;
    const id = b.dataset.id;
    if (type === 'photos') DRAFT.photos = DRAFT.photos.filter((x) => x.id !== id);
    if (type === 'videos') DRAFT.videos = DRAFT.videos.filter((x) => x.id !== id);
    if (type === 'reels') DRAFT.reels = DRAFT.reels.filter((x) => x.id !== id);
    if (type === 'memories') DRAFT.memories = DRAFT.memories.filter((x) => x.id !== id);
    if (type === 'years') DRAFT.years = DRAFT.years.filter((x) => String(x.year) !== id);
    if (type === 'quotes') DRAFT.quotes = DRAFT.quotes.filter((_, i) => String(i) !== id);
    saveDraft('Deleted.');
    renderAll();
  });

  // Publish
  $('#download-json').addEventListener('click', () => {
    downloadBlob(new Blob([JSON.stringify(DRAFT, null, 2)], { type: 'application/json' }), 'site-data.json');
    setStatus('site-data.json downloaded. Replace data/site-data.json in your project.');
  });
  $('#import-btn').addEventListener('click', () => $('#import-file').click());
  $('#import-file').addEventListener('change', async (e) => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      if (!Array.isArray(data.photos)) throw new Error('Invalid file');
      DRAFT = data; saveDraft('Imported. Your changes now continue from this file.'); renderAll();
    } catch (err) { setStatus('Could not import: ' + err.message); }
    e.target.value = '';
  });
  $('#reset-draft').addEventListener('click', async () => {
    if (!confirm('Discard all unsaved changes and reload the live content?')) return;
    localStorage.removeItem(DRAFT_KEY);
    DRAFT = await loadDraft();
    renderAll();
    setStatus('Reset to the live content.');
  });
}

// Accepts instagram.com/reel/CODE, /reels/CODE or /p/CODE links and returns a clean permalink
function extractReelUrl(input) {
  const m = input.trim().match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p)\/([\w-]+)/i);
  if (!m) return null;
  const type = m[1].toLowerCase() === 'p' ? 'p' : 'reel';
  return `https://www.instagram.com/${type}/${m[2]}/`;
}

// ---------- Init ----------
let initialised = false;
async function init() {
  if (initialised) return;
  initialised = true;
  DRAFT = await loadDraft();
  DRAFT.hero = DRAFT.hero || { image: 'images/hero/hero-ganesha.svg' };
  DRAFT.events = DRAFT.events || [];
  DRAFT.videos = DRAFT.videos || [];
  DRAFT.reels = DRAFT.reels || [];
  DRAFT.theme = { ...DEFAULT_THEME, ...(DRAFT.theme || {}) };
  DRAFT.music = { enabled: true, title: 'Om Ganeshaya Namah', src: 'audio/om-ganeshaya-namah.mp3', ...(DRAFT.music || {}) };
  DRAFT.text = { ...(DRAFT.text || {}) };
  bindForms();
  bindTextAndTheme();
  renderAll();
}

if (sessionStorage.getItem('rc-admin') === '1') showApp();


/* ===========================================================
   Text, colour and music editing (fields with data-bind)
   Any input with data-bind="a.b" is read from and saved to
   DRAFT.a.b. Textareas with data-list are split into lines.
   =========================================================== */
const DEFAULT_THEME = {
  primary: '#B3121E', primaryDark: '#0B0B0B', accent: '#FF9933',
  gold: '#FFB300', bg: '#FFFFFF', ink: '#111111', muted: '#555555'
};

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let target = obj;
  keys.forEach((k) => { if (typeof target[k] !== 'object' || target[k] === null) target[k] = {}; target = target[k]; });
  target[last] = value;
}

function bindDataFields() {
  if (!DRAFT) return;
  $$('[data-bind]').forEach((el) => {
    const v = getPath(DRAFT, el.dataset.bind);
    if (el.type === 'checkbox') el.checked = !!v;
    else if (el.dataset.list !== undefined && Array.isArray(v)) el.value = v.join('\n');
    else el.value = v == null ? '' : v;
  });
}

function bindTextAndTheme() {
  const onEdit = (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.bind) return;
    let value;
    if (el.type === 'checkbox') value = el.checked;
    else if (el.dataset.list !== undefined) value = el.value.split('\n').map((x) => x.trim()).filter(Boolean);
    else value = el.value;
    setPath(DRAFT, el.dataset.bind, value);
    saveDraft();
    setStatus('Saved. Publish to show these changes on the website.');
  };
  document.addEventListener('input', onEdit);
  document.addEventListener('change', onEdit);

  $('#reset-theme').addEventListener('click', () => {
    DRAFT.theme = { ...DEFAULT_THEME };
    saveDraft('Colours reset to devotional default.');
    bindDataFields();
  });
}
