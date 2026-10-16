/* ============================================================
   ROADKILL — site logic (cart, products, drop list, countdown)
   Requires: data.js (defines window.PRODUCTS, window.STOCK, window.LIVE)
   ============================================================ */

/* ---------- DOM refs ---------- */
const $ = (sel) => document.querySelector(sel);

/* ---------- Cart state ---------- */
const CART_KEY = 'roadkill_cart_v1';
const DROP_LIST_KEY = 'roadkill_drop_list_v1';

const defaultCart = () => ({ items: [] });
const loadCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? { ...defaultCart(), ...JSON.parse(raw) } : defaultCart();
  } catch {
    return defaultCart();
  }
};
const saveCart = (cart) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* ignore quota errors */
  }
};

let cart = loadCart();

/* ---------- Helpers ---------- */
const fmt = (n) => '$' + n.toFixed(2);

function getProduct(id) {
  return window.PRODUCTS.find((p) => p.id === id);
}

function productColor(p, colorName) {
  return p.colors.find((c) => c.name === colorName) || p.colors[0];
}

/* ---------- Product card rendering ---------- */
function productCard(p, { showSoldOut = true } = {}) {
  const soldOut = !p.available;
  const img = productColor(p, p.defaultColor)?.image || 'assets/product-1.png';
  const colorToggles = p.colors.map((c) => {
    const isDefault = c.name === p.defaultColor;
    return `
      <button class="product-color" data-pid="${p.id}" data-color="${c.name}" style="--swatch:${c.hex}" ${isDefault ? 'aria-checked="true"' : ''}>
        <span class="product-color__swatch"></span>
      </button>`;
  }).join('');

  return `
    <article class="product-card" data-pid="${p.id}">
      <div class="product-card__img">
        <img src="${img}" alt="${p.name}" loading="lazy">
        <div class="product-card__frame"></div>
        ${soldOut ? '<div class="product-card__tag product-card__tag--sold">ROADKILL\'d</div>' : ''}
        ${!soldOut ? `<div class="product-card__tag product-card__tag--soon">Featured</div>` : ''}
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name">${p.name}</h3>
        <p class="product-card__price">${fmt(p.price)}</p>
        <p class="product-card__eye">${p.damageReport.whatGotChewed}</p>
        ${!soldOut ? `
          <div class="product-card__colors">${colorToggles}</div>
          <button class="product-card__buy" data-pid="${p.id}" data-color="${p.defaultColor}">Add to Cart</button>
        ` : `
          <button class="product-card__buy" disabled>ROADKILL\'d</button>
        `}
      </div>
    </article>`;
}

function renderProductGrid(container, products, opts = {}) {
  container.innerHTML = products.map((p) => productCard(p, opts)).join('');
}

/* ---------- Cart helpers ---------- */
function addToCart(pid, color) {
  const p = getProduct(pid);
  if (!p) return;
  if (!p.available) return;
  const idx = cart.items.findIndex((i) => i.pid === pid && i.color === color);
  if (idx >= 0) {
    cart.items[idx].qty += 1;
  } else {
    cart.items.push({ pid, color, qty: 1 });
  }
  saveCart(cart);
  renderCart();
  updateNavCount();
  showToast('Added to cart');
}

function removeFromCart(pid, color) {
  const idx = cart.items.findIndex((i) => i.pid === pid && i.color === color);
  if (idx >= 0) cart.items.splice(idx, 1);
  saveCart(cart);
  renderCart();
  updateNavCount();
}

function updateQty(pid, color, delta) {
  const item = cart.items.find((i) => i.pid === pid && i.color === color);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart.items.splice(cart.items.indexOf(item), 1);
  }
  saveCart(cart);
  renderCart();
  updateNavCount();
}

function getCartQuantity() {
  return cart.items.reduce((n, i) => n + i.qty, 0);
}

function getCartSubtotal() {
  return cart.items.reduce((n, i) => {
    const p = getProduct(i.pid);
    return n + (p ? p.price * i.qty : 0);
  }, 0);
}

/* ---------- Render cart ---------- */
const cartList = $('#cartList');
const cartSubtotal = $('#cartSubtotal');
const cartDrawerBody = cartDrawer.querySelector('.cart-drawer__list');
const cartDrawerFooter = cartDrawer.querySelector('.cart-drawer__footer');

function renderCart() {
  if (!cartList) return;
  if (cart.items.length === 0) {
    cartList.innerHTML = `
      <li>
        <div class="cart-drawer__empty">
          <span class="cart-drawer__empty-icon">🛒</span>
          <p>Your cart is empty.</p>
          <a href="#shop" class="btn btn--ghost btn--full" style="margin-top:8px">Shop the drop</a>
        </div>
      </li>`;
    return;
  }
  cartList.innerHTML = cart.items.map((item) => {
    const p = getProduct(item.pid);
    if (!p) return '';
    const color = productColor(p, item.color);
    const img = color?.image || 'assets/product-1.png';
    return `
      <li class="cart-drawer__item">
        <div class="cart-drawer__item-img"><img src="${img}" alt="${p.name}"></div>
        <div>
          <p class="cart-drawer__item-name">${p.name}</p>
          <p class="cart-drawer__item-desc">${item.color}</p>
        </div>
        <div class="cart-drawer__item-price">${fmt(p.price * item.qty)}</div>
        <div class="cart-drawer__item-qty">
          <button class="qty-btn" data-action="decrease" data-pid="${item.pid}" data-color="${item.color}">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-action="increase" data-pid="${item.pid}" data-color="${item.color}">+</button>
          <button class="cart-drawer__remove" data-action="remove" data-pid="${item.pid}" data-color="${item.color}">Remove</button>
        </div>
      </li>`;
  }).join('');

  cartList.querySelectorAll('[data-action]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = el.dataset.action;
      const pid = el.dataset.pid;
      const color = el.dataset.color;
      if (action === 'remove') removeFromCart(pid, color);
      else if (action === 'increase') updateQty(pid, color, 1);
      else if (action === 'decrease') updateQty(pid, color, -1);
    });
  });

  const subtotal = getCartSubtotal();
  cartSubtotal.textContent = fmt(subtotal);
}

function updateNavCount() {
  const count = getCartQuantity();
  const el = $('#navCartCount');
  if (el) el.textContent = count;
}

function openCart() {
  cartDrawer.classList.add('cart-drawer--open');
  cartOverlay.classList.add('cart-overlay--open');
  renderCart();
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartDrawer.classList.remove('cart-drawer--open');
  cartOverlay.classList.remove('cart-overlay--open');
  document.body.style.overflow = '';
}

function initCartInteractions() {
  $('#cartOpen')?.addEventListener('click', openCart);
  $('#cartClose')?.addEventListener('click', closeCart);
  $('#cartOverlay')?.addEventListener('click', closeCart);
}

/* ---------- Toast ---------- */
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('toast--visible'), 10);
  setTimeout(() => {
    t.classList.remove('toast--visible');
    setTimeout(() => t.remove(), 300);
  }, 2400);
}

/* ---------- Drop list ---------- */
function initDropList() {
  const form = $('#dropForm');
  const feedback = $('#formFeedback');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = fd.get('name').trim();
    const email = fd.get('email').trim();
    const phone = fd.get('phone')?.trim() || null;

    if (!name || !email) {
      feedback.textContent = 'Please enter both your name and email.';
      feedback.className = 'form-feedback form-feedback--err';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      feedback.textContent = 'That email doesn\'t look right.';
      feedback.className = 'form-feedback form-feedback--err';
      return;
    }

    let list = [];
    try {
      const raw = localStorage.getItem(DROP_LIST_KEY);
      list = raw ? JSON.parse(raw) : [];
    } catch {
      list = [];
    }
    list.push({ name, email, phone, source: 'web', at: new Date().toISOString() });
    try {
      localStorage.setItem(DROP_LIST_KEY, JSON.stringify(list));
    } catch {
      feedback.textContent = 'Could not save — storage is full or disabled.';
      feedback.className = 'form-feedback form-feedback--err';
      return;
    }
    feedback.textContent = `Got it, ${name}. You're on the list. We'll be in touch.`;
    feedback.className = 'form-feedback form-feedback--ok';
    form.reset();
    setTimeout(() => {
      feedback.textContent = '';
      feedback.className = 'form-feedback';
    }, 5000);
  });
}

/* ---------- Countdown ---------- */
function initCountdown() {
  const el = $('#countdown');
  if (!el) return;

  const target = new Date('2026-11-26T00:00:00-05:00').getTime();

  function tick() {
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
      el.innerHTML = `
        <span class="countdown__label">Drop live</span>
        <a href="#shop" class="btn btn--primary">Shop Now</a>`;
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `
      <div class="countdown">
        <span class="countdown__item"><span class="countdown__num">${d}</span><span class="countdown__unit">days</span></span>
        <span class="countdown__sep">:</span>
        <span class="countdown__item"><span class="countdown__num">${h}</span><span class="countdown__unit">hrs</span></span>
        <span class="countdown__sep">:</span>
        <span class="countdown__item"><span class="countdown__num">${m}</span><span class="countdown__unit">min</span></span>
        <span class="countdown__sep">:</span>
        <span class="countdown__item"><span class="countdown__num">${s}</span><span class="countdown__unit">sec</span></span>
      </div>`;
    setTimeout(tick, 1000);
  }
  tick();
}

/* ---------- FAQ ---------- */
function initFAQ() {
  document.querySelectorAll('.faq__item').forEach((item) => {
    const q = item.querySelector('.faq__q');
    q.addEventListener('click', () => {
      const open = item.querySelector('.faq__a').classList.toggle('open');
      q.setAttribute('aria-expanded', open);
    });
  });
}

/* ---------- Nav ---------- */
function initNav() {
  const toggle = $('#navToggle');
  const burger = $('#burgerToggle');
  const nav = $('#nav');
  const links = nav.querySelectorAll('.nav__link');
  const cartLink = nav.querySelector('.nav__cart');

  toggle.addEventListener('click', () => {
    const open = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', String(!open));
  });

  burger?.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
  });

  document.querySelectorAll('.nav__link, .nav__cart').forEach((a) => {
    a.addEventListener('click', () => {
      nav.setAttribute('aria-expanded', 'false');
      burger?.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- Swipe-to-close cart ---------- */
function initSwipeCart() {
  let startX = 0;
  const overlay = $('#cartOverlay');
  document.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (cartDrawer.classList.contains('cart-drawer--open') && dx < -60) {
      closeCart();
    }
  }, { passive: true });
}

/* ---------- Shop filtering ---------- */
function initShopFiltering() {
  const shop = document.getElementById('shop');
  if (!shop) return;

  const grid = shop.querySelector('.product-grid');
  const colorSelect = shop.querySelector('#colorFilter');
  const statusLabel = $('#statusLabel');
  if (!grid || !colorSelect) return;

  const catSelect = document.createElement('select');
  catSelect.id = 'categoryFilter';
  catSelect.className = 'input';
  catSelect.setAttribute('aria-label', 'Filter by category');
  const allCategories = ['All', ...new Set(window.PRODUCTS.map((p) => p.category))];
  allCategories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    catSelect.appendChild(opt);
  });

  const filterBar = document.createElement('div');
  filterBar.className = 'shop-filter';
  filterBar.appendChild(catSelect);
  filterBar.appendChild(colorSelect);
  const status = document.createElement('p');
  status.id = 'statusLabel';
  status.style.margin = '0 0 var(--space-lg)';
  filterBar.appendChild(status);

  grid.closest('.container').insertBefore(filterBar, grid);

  const render = () => {
    const cat = catSelect.value;
    const color = colorSelect.value;
    const filtered = window.PRODUCTS.filter((p) => {
      if (cat !== 'All' && p.category !== cat) return false;
      if (color !== 'All' && p.colors.find((c) => c.name === color) === undefined) return false;
      return true;
    });
    status.textContent = filtered.length
      ? `${filtered.length} product${filtered.length > 1 ? 's' : ''}`
      : 'No products match.';
    grid.innerHTML = filtered.map((p) => productCard(p)).join('');
  };

  catSelect.addEventListener('change', render);
  colorSelect.addEventListener('change', render);
  render();
}

/* ---------- Init all ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Featured products on home
  const featuredGrid = $('#featuredGrid');
  if (featuredGrid) {
    renderProductGrid(featuredGrid, window.PRODUCTS.filter((p) => p.featured));
  }

  // Shop grid
  const shopGrid = $('#shopGrid');
  if (shopGrid) {
    renderProductGrid(shopGrid, window.PRODUCTS);
  }

  // Cart
  initCartInteractions();
  initSwipeCart();

  // Drop list
  initDropList();

  // FAQ
  initFAQ();

  // Nav
  initNav();

  // Countdown
  initCountdown();

  // Shop filtering
  initShopFiltering();

  // Update nav count
  updateNavCount();

  // Cart drawer initially hidden
  if (cartDrawer.classList.contains('cart-drawer--open')) {
    renderCart();
  }
});

/* ---------- Global: add to cart via data-pid buttons only ---------- */
document.addEventListener('click', (e) => {
  const buyBtn = e.target.closest('button[data-pid]');
  if (!buyBtn) return;
  const pid = buyBtn.dataset.pid;
  const color = buyBtn.dataset.color || getProduct(pid)?.defaultColor;
  if (!color) return;
  addToCart(pid, color);
});

/* ---------- Endcap: text reveals + LERP cursor ---------- */
(() => {
  const endcap = document.getElementById('endcap');
  if (!endcap) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    // Split headline into words (keeping <br>)
    const title = endcap.querySelector('.endcap__title');
    if (title) {
      let i = 0;
      title.innerHTML = title.innerHTML
        .split(/<br\s*\/?>/i)
        .map(line => line.trim().split(/\s+/).filter(Boolean)
          .map(w => `<span class="word-wrapper"><span class="word-inner" style="--i:${i++}">${w}</span></span>`)
          .join(' '))
        .join('<br>');
    }

    // Split wordmark into letters
    const mark = endcap.querySelector('.endcap__wordmark');
    if (mark) {
      mark.innerHTML = [...mark.textContent.trim()]
        .map((ch, i) => `<span class="letter-wrapper"><span class="letter-inner" style="--i:${i}">${ch}</span></span>`)
        .join('');
    }

    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        endcap.classList.add('is-in');
        io.disconnect();
      }
    }, { threshold: .35 });
    io.observe(endcap);
  } else {
    endcap.classList.add('is-in');
  }

  // Cursor: ring follows exactly, glass pill trails with LERP
  const ring = document.getElementById('endcapRing');
  const pill = document.getElementById('endcapPill');
  if (!ring || !pill || reduceMotion) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  endcap.classList.add('has-cursor');

  let mx = 0, my = 0, px = 0, py = 0;
  let scale = 0, targetScale = 0, ringScale = 0;
  let inside = false, onLink = false, raf = 0;

  const tick = () => {
    px += (mx - px) * .08;
    py += (my - py) * .08;
    scale += (targetScale - scale) * .15;
    const ringTarget = inside ? (onLink ? 1.6 : 1) : 0;
    ringScale += (ringTarget - ringScale) * .15;

    pill.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%) scale(${scale})`;
    ring.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%) scale(${ringScale})`;

    const settled = Math.abs(targetScale - scale) < .001 && Math.abs(ringTarget - ringScale) < .001
      && Math.abs(mx - px) < .1 && Math.abs(my - py) < .1;
    if (inside || !settled) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      ring.classList.remove('is-active');
      pill.classList.remove('is-active');
    }
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(tick); };

  endcap.addEventListener('mouseenter', (e) => {
    mx = e.clientX; my = e.clientY;
    if (!raf) { px = mx; py = my; }
    inside = true;
    targetScale = onLink ? 0 : 1;
    ring.classList.add('is-active');
    pill.classList.add('is-active');
    start();
  });
  endcap.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    start();
  });
  endcap.addEventListener('mouseleave', () => {
    inside = false;
    onLink = false;
    targetScale = 0;
    ring.classList.remove('expanded');
    start();
  });

  endcap.querySelectorAll('a').forEach((a) => {
    a.addEventListener('mouseenter', () => {
      onLink = true;
      targetScale = 0;
      ring.classList.add('expanded');
    });
    a.addEventListener('mouseleave', () => {
      onLink = false;
      if (inside) targetScale = 1;
      ring.classList.remove('expanded');
    });
  });
})();
