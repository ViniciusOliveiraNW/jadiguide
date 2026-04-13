// ── DATA ─────────────────────────────────────────────────
const sections = {
  informativos: 's-informativos',
  'base-conhecimento': 's-base-conhecimento',
  prompts: 's-prompts',
  faq: 's-faq'
};

// ── THEME ────────────────────────────────────────────────
const html = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');
const iconSun = document.getElementById('icon-sun');
const iconMoon = document.getElementById('icon-moon');

function setTheme(dark) {
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  iconSun.style.display = dark ? 'none' : 'block';
  iconMoon.style.display = dark ? 'block' : 'none';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(saved ? saved === 'dark' : prefersDark);
themeBtn.addEventListener('click', () => setTheme(html.dataset.theme !== 'dark'));

// ── NAV ──────────────────────────────────────────────────
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(sections[id] || id);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.section === id);
  });

  clearSearch();
  document.getElementById('search-results-section').classList.remove('active');
}

document.querySelectorAll('.nav-item[data-section]').forEach(btn => {
  btn.addEventListener('click', () => {
    const sec = btn.dataset.section;
    const sub = btn.dataset.sub;
    showSection(sec);
    if (sub) {
      setTimeout(() => {
        const el = document.getElementById(sub);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
    closeSidebar();
  });
});

function scrollToSub(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── MOBILE SIDEBAR ───────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const hamburger = document.getElementById('hamburger');

hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
});
overlay.addEventListener('click', closeSidebar);

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

// ── SEARCH ───────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const searchResultsSection = document.getElementById('search-results-section');
const searchResults = document.getElementById('search-results');
const searchCount = document.getElementById('search-count');

function collectSearchData() {
  const items = [];
  document.querySelectorAll('[data-searchable]').forEach(el => {
    const sectionEl = el.closest('.section');
    const sectionId = sectionEl ? sectionEl.id : '';
    const sectionName = {
      's-base-conhecimento': 'Base de Conhecimento',
      's-prompts': 'Prompts-chave',
      's-faq': 'Duvidas Frequentes'
    }[sectionId] || 'Informativos';

    items.push({
      el,
      sectionId,
      sectionName,
      title: el.dataset.title || '',
      content: (el.dataset.content || '') + ' ' + (el.textContent || '')
    });
  });
  return items;
}

function highlight(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

let searchData = null;

function doSearch(query) {
  if (!searchData) searchData = collectSearchData();
  query = query.trim();
  if (!query) {
    clearSearch();
    const activeNav = document.querySelector('.nav-item.active');
    const sec = activeNav?.dataset.section || 'informativos';
    showSection(sec);
    return;
  }

  const q = query.toLowerCase();
  const matches = searchData.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.content.toLowerCase().includes(q)
  );

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  searchResultsSection.classList.add('active');
  searchCount.textContent = matches.length
    ? `${matches.length} resultado${matches.length > 1 ? 's' : ''} encontrado${matches.length > 1 ? 's' : ''}`
    : '';

  if (!matches.length) {
    searchResults.innerHTML = `<div class="no-results"><p>Nenhum resultado encontrado para "<strong>${query}</strong>".</p><p>Tente termos diferentes ou navegue pelas seções do menu.</p></div>`;
    return;
  }

  searchResults.innerHTML = matches.map(m => `
    <div class="result-item" onclick="goToResult('${m.sectionId}', '${m.el.id || ''}')">
      <div class="result-section">${m.sectionName}</div>
      <div class="result-title">${highlight(m.title, query)}</div>
      <div class="result-excerpt">${highlight(m.content.substring(0, 120).trim(), query)}...</div>
    </div>
  `).join('');
}

function goToResult(sectionId, elId) {
  const sectionKey = Object.entries(sections).find(([, v]) => v === sectionId)?.[0];
  if (sectionKey) showSection(sectionKey);
  if (elId) {
    setTimeout(() => {
      const el = document.getElementById(elId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.style.outline = '2px solid var(--accent)';
        setTimeout(() => el.style.outline = '', 2000);
      }
    }, 100);
  }
  clearSearch();
}

function clearSearch() {
  searchInput.value = '';
  searchClear.style.display = 'none';
  searchResults.innerHTML = '';
  searchCount.textContent = '';
  searchResultsSection.classList.remove('active');
}

searchInput.addEventListener('input', e => {
  const val = e.target.value;
  searchClear.style.display = val ? 'block' : 'none';
  doSearch(val);
});

searchClear.addEventListener('click', () => {
  clearSearch();
  const activeNav = document.querySelector('.nav-item.active');
  const sec = activeNav?.dataset.section || 'informativos';
  showSection(sec);
  searchInput.focus();
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    clearSearch();
    const activeNav = document.querySelector('.nav-item.active');
    const sec = activeNav?.dataset.section || 'informativos';
    showSection(sec);
  }
});

// Keyboard shortcut
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

// ── FAQ ──────────────────────────────────────────────────
function toggleFaq(item) {
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(f => f.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ── COPY PROMPT ──────────────────────────────────────────
function copyPrompt(btn) {
  const text = btn.closest('.prompt-card').querySelector('.prompt-text').textContent;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = 'Copiado!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copiar'; btn.classList.remove('copied'); }, 2000);
  });
}