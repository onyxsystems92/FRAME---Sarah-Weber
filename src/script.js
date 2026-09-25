/* Raum & Zeit — navigation behaviour, notices and restrained motion.
   No external requests, no analytics endpoint, no patient data. */

/* --- Motion capability ----------------------------------------------------
   Reveal animation is opt-in: it only exists when JavaScript runs and the
   visitor has not asked for reduced motion. Without it every element stays
   visible, so the page is complete with CSS alone. */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) document.documentElement.setAttribute('data-reveal', '');

/* --- Deep links into the treatment contexts ------------------------------- */
if (location.hash) {
  const hashTarget = document.querySelector(location.hash);
  if (hashTarget && hashTarget.tagName === 'DETAILS') hashTarget.open = true;
}

/* Arriving at an anchor should be instant; only anchor clicks made on the
   page afterwards animate. Enabled two frames after load, once the browser
   has already jumped to any fragment in the URL. */
if (!prefersReducedMotion) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.documentElement.setAttribute('data-smooth-scroll', '');
  }));
}

/* --- Mobile navigation ---------------------------------------------------- */
const menuToggle = document.querySelector('[data-menu-toggle]');
const setMenu = open => {
  document.body.classList.toggle('menu-open', open);
  if (menuToggle) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  }
};
if (menuToggle) {
  menuToggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
}
document.querySelectorAll('.nav a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (document.body.classList.contains('menu-open')) {
    setMenu(false);
    if (menuToggle) menuToggle.focus();
  }
});

/* --- FRAME navigation signals --------------------------------------------- */
const emitNavigationSignal = (name, detail) => {
  const payload = { event: name, source: 'navigation-home', ...detail };
  window.dispatchEvent(new CustomEvent(`rz:${name}`, { detail: payload }));
  if (typeof window.rzTrack === 'function') window.rzTrack(name, payload);
};

const readSessionValue = key => {
  try { return sessionStorage.getItem(key); } catch (error) { return null; }
};

const clearSessionValue = key => {
  try { sessionStorage.removeItem(key); } catch (error) {}
};

const writeIntentState = intent => {
  let firstIntent = readSessionValue('rz:first-intent');
  try {
    if (!firstIntent) { sessionStorage.setItem('rz:first-intent', intent); firstIntent = intent; }
    sessionStorage.setItem('rz:current-intent', intent);
  } catch (error) {}
  return firstIntent || intent;
};

/* --- Visitor state accordions ---------------------------------------------
   Unchanged behaviour contract: one open row at a time, a second click on
   the open row closes it, focus stays on the activated control. The panel
   now animates its own height instead of snapping, and its links stay out
   of the tab order while collapsed. */
const intentButtons = [...document.querySelectorAll('[data-intent-button]')];
const intentPanels = [...document.querySelectorAll('[data-intent-panel]')];

intentButtons.forEach(button => {
  button.addEventListener('click', () => {
    const intent = button.dataset.intentButton;
    const isOpen = button.getAttribute('aria-expanded') === 'true';

    intentButtons.forEach(item => {
      item.setAttribute('aria-pressed', 'false');
      item.setAttribute('aria-expanded', 'false');
    });
    intentPanels.forEach(panel => panel.removeAttribute('data-open'));

    if (isOpen) {
      clearSessionValue('rz:current-intent');
      return;
    }

    const firstIntent = writeIntentState(intent);
    button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-expanded', 'true');
    const activePanel = intentPanels.find(panel => panel.dataset.intentPanel === intent);
    if (activePanel) activePanel.setAttribute('data-open', '');
    emitNavigationSignal('navigation-intent-selected', { intent, firstIntent });
  });
});

document.querySelectorAll('[data-intent-route]').forEach(link => {
  link.addEventListener('click', () => {
    emitNavigationSignal('navigation-route-selected', {
      intent: readSessionValue('rz:current-intent'),
      firstIntent: readSessionValue('rz:first-intent'),
      route: link.dataset.intentRoute,
      destination: link.getAttribute('href')
    });
  });
});

/* --- Scroll reveal --------------------------------------------------------
   One quiet entrance per section, staggered inside a group. Decorative, so
   it never gates content: elements are visible unless this code runs. */
const REVEAL_ITEMS = [
  '.section-head', '.step', '.context-row', '.site-route-card', '.pillar',
  '.roster-entry', '.orientation-item', '.prose-block', '.fact',
  '.method-panel > *', '.contact-block > *', '.team-feature > *',
  '.time-mark', '.image-band .rz-figure', '.atmosphere-band .rz-figure'
].join(',');

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, self) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      self.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  const groups = [
    ...document.querySelectorAll('[data-reveal-group]'),
    ...document.querySelectorAll('.image-band, .atmosphere-band, .practice-navigation-section')
  ];
  const tracked = [];

  groups.forEach(group => {
    [...group.querySelectorAll(REVEAL_ITEMS)].forEach((item, index) => {
      item.setAttribute('data-reveal-item', '');
      item.style.setProperty('--rd', `${Math.min(index, 5) * 60}ms`);
      tracked.push(item);
      // Anything already on screen at load is shown straight away; only
      // content further down waits for the observer.
      if (item.getBoundingClientRect().top < window.innerHeight) {
        item.classList.add('is-in');
      } else {
        observer.observe(item);
      }
    });
  });

  // Failsafe: motion is decorative, so nothing may stay hidden because an
  // observer never fired (print, headless capture, odd scroll containers).
  const revealAll = () => tracked.forEach(item => item.classList.add('is-in'));
  window.addEventListener('beforeprint', revealAll);
  setTimeout(() => {
    if (tracked.some(item => !item.classList.contains('is-in') && item.getBoundingClientRect().top < window.innerHeight * 1.5)) revealAll();
  }, 4000);
}

/* --- Current practice notices --------------------------------------------- */
const currentDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const formatUpdateDate = value => {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const isActiveUpdate = (item, today) => {
  if (!item || item.status !== 'published') return false;
  if (typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.text !== 'string') return false;
  if (item.publishedAt && item.publishedAt > today) return false;
  if (item.expiresAt && item.expiresAt < today) return false;
  return true;
};

const buildUpdateCard = item => {
  const article = document.createElement('article');
  article.className = 'update-card';

  const meta = document.createElement('div');
  meta.className = 'update-meta';
  const label = document.createElement('span');
  label.textContent = 'Praxisinformation';
  meta.append(label);

  const formattedDate = formatUpdateDate(item.publishedAt);
  if (formattedDate) {
    const time = document.createElement('time');
    time.dateTime = item.publishedAt;
    time.textContent = formattedDate;
    meta.append(time);
  }

  const heading = document.createElement('h3');
  heading.textContent = item.title;
  const body = document.createElement('p');
  body.textContent = item.text;
  article.append(meta, heading, body);
  return article;
};

const renderCurrentUpdates = async () => {
  const targets = [...document.querySelectorAll('[data-updates-list]')];
  if (!targets.length) return;

  let data;
  try {
    const response = await fetch('content/aktuelles.json', { cache: 'no-store' });
    if (!response.ok) return;
    data = await response.json();
  } catch (error) { return; }

  const today = currentDateKey();
  const items = Array.isArray(data.items)
    ? data.items.filter(item => isActiveUpdate(item, today)).sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    : [];

  targets.forEach(target => {
    const scope = target.dataset.updatesScope || 'all';
    const limit = Number.parseInt(target.dataset.updatesLimit || '0', 10);
    let visible = scope === 'home' ? items.filter(item => item.showOnHomepage === true) : items;
    if (Number.isFinite(limit) && limit > 0) visible = visible.slice(0, limit);

    target.replaceChildren(...visible.map(buildUpdateCard));

    const container = target.parentElement;
    const empty = container ? container.querySelector('[data-updates-empty]') : null;
    if (empty) empty.hidden = visible.length > 0;

    if (scope === 'home') {
      const section = target.closest('[data-updates-home-section]');
      if (section) section.hidden = visible.length === 0;
    }
  });
};

renderCurrentUpdates();
