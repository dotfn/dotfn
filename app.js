/* ── app.js ──────────────────────────────────────────
   Loads data.json and renders the phone card dynamically.
   ──────────────────────────────────────────────────── */

const phone = document.getElementById('phone');

/* ── THEME TOGGLE ──────────────────────────────────── */
const themeBtn = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
});

function updateThemeIcon(theme) {
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

/* ── SKELETON ──────────────────────────────────────── */
function renderSkeleton() {
  phone.innerHTML = `
    <div class="skeleton skeleton-featured"></div>
    <div style="padding:0 24px 20px;display:flex;flex-direction:column;align-items:center;">
      <div class="skeleton skeleton-avatar"></div>
      <div class="skeleton skeleton-text" style="width:140px;height:20px;"></div>
      <div class="skeleton skeleton-text" style="width:90px;height:11px;margin-top:6px;"></div>
      <div class="skeleton skeleton-text wide" style="width:220px;margin-top:10px;"></div>
      <div class="skeleton skeleton-text wide" style="width:180px;margin-top:4px;"></div>
    </div>
    <div style="padding:0 16px;display:flex;flex-direction:column;gap:10px;">
      ${[...Array(4)].map(() => `<div class="skeleton skeleton-btn"></div>`).join('')}
    </div>`;
}

/* ── ICON MAP (fallback monograms) ─────────────────── */
const ICON_MAP = {
  in: 'IN',
  gh: 'GH',
  pf: '◈',
  em: '✉',
};

function getIcon(code, label) {
  if (code && ICON_MAP[code]) return ICON_MAP[code];
  return label.substring(0, 2).toUpperCase();
}

/* ── IMAGE WITH FALLBACK ────────────────────────────── */
function safeImg(src, alt, cls, fallbackHTML) {
  if (!src) return fallbackHTML || `<div class="img-placeholder">${alt.toUpperCase()}</div>`;
  return `<img src="${escHtml(src)}" alt="${escHtml(alt)}" class="${cls}"
    onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'img-placeholder',textContent:'NO IMAGE'}))">`;
}

/* ── ESCAPE HELPER ──────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── RENDER ─────────────────────────────────────────── */
function render(data) {
  const linksHTML = (data.links || []).map((link, i) => {
    const icon = getIcon(link.icon, link.label);
    const desc = link.description ? `<span class="link-desc">${escHtml(link.description)}</span>` : '';
    return `
      <li class="link-item" style="animation-delay:${0.3 + i * 0.08}s">
        <a href="${escHtml(link.url)}" class="link-btn"
           target="${link.url.startsWith('mailto') ? '_self' : '_blank'}"
           rel="noopener noreferrer">
          <div class="link-icon">${escHtml(icon)}</div>
          <div class="link-text">
            <span class="link-label">${escHtml(link.label)}</span>
            ${desc}
          </div>
          <span class="link-arrow" aria-hidden="true">↗</span>
        </a>
      </li>`;
  }).join('');

  const featuredSrc = data.featuredImage || '';
  const avatarSrc   = data.avatar || '';

  phone.innerHTML = `
    <section class="featured-wrap" aria-label="Imagen destacada">
      ${safeImg(featuredSrc, 'Imagen destacada', 'featured-img')}
    </section>

    <header class="profile-header">
      <div class="avatar-ring" aria-hidden="true">
        ${safeImg(avatarSrc, data.name || '', 'avatar-img')}
      </div>
      <h1 class="profile-name">${escHtml(data.name || '')}</h1>
      ${data.username ? `<p class="profile-username">${escHtml(data.username)}</p>` : ''}
      ${data.bio      ? `<p class="profile-bio">${escHtml(data.bio)}</p>`      : ''}
    </header>

    <div class="divider" role="separator"></div>

    <nav aria-label="Links principales">
      <ul class="links-list">
        ${linksHTML}
      </ul>
    </nav>

    <footer class="site-footer">
      <span>${escHtml(data.footer || '🔧 Sitio en construcción')}</span>
    </footer>`;
}

/* ── FETCH ──────────────────────────────────────────── */
renderSkeleton();

fetch('data.json')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(data => {
    // small pause so skeleton feels intentional, not janky
    setTimeout(() => render(data), 300);
  })
  .catch(err => {
    console.error('Error loading data.json:', err);
    phone.innerHTML = `
      <div style="padding:48px 24px;text-align:center;color:#555;font-family:var(--font-body);">
        <div style="font-size:2rem;margin-bottom:12px;">⚠️</div>
        <p style="font-size:.85rem;line-height:1.6;">
          No se pudo cargar <code>data.json</code>.<br>
          Asegurate de servir los archivos desde un servidor local<br>
          (ej: <code>npx serve .</code> o VS Code Live Server).
        </p>
      </div>`;
  });