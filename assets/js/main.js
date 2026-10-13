const Auth = {
  key: 'bnan_user',
  adminKey: 'bnan_is_admin',
  load() { try { return JSON.parse(localStorage.getItem(this.key)||'null'); } catch { return null; } },
  save(u) { localStorage.setItem(this.key, JSON.stringify(u)); this.render(); },
  async login(username, password) {
    // عبر الخادم الحقيقي (عند توفر الاتصال)
    if (!window.BnanOffline) {
      const res = await window.BnanAPI.login({ username: username.trim(), password });
      localStorage.setItem('bnan_token', res.token);
      this.save(res.user);
      return res.user;
    }
    // وضع محلي تجريبي (بدون خادم: Pages / ملف مباشر) — عرض فقط بلا صلاحية أدمن
    const u = { email: username, name: username.split('@')[0] };
    this.save(u);
    return u;
  },
  async register({ name, username, password }) {
    if (!window.BnanOffline) {
      const res = await window.BnanAPI.register({ name, username: username.trim(), password });
      localStorage.setItem('bnan_token', res.token);
      this.save(res.user);
      return res.user;
    }
    const u = { email: username, name: name || username.split('@')[0] };
    this.save(u);
    return u;
  },
  logout() { localStorage.removeItem(this.key); localStorage.removeItem(this.adminKey); localStorage.removeItem('bnan_token'); this.render(); },
  isAdmin() {
    const u = this.load();
    return !!u && (u.role === 'admin' || localStorage.getItem(this.adminKey) === '1');
  },
  render() {
    const btn = document.getElementById('authBtn');
    const ab = document.getElementById('adminBtn');
    const u = this.load();
    const online = !window.BnanOffline;
    const onlineAdmin = online && !!u && u.role === 'admin';
    const offlineAdmin = localStorage.getItem(this.adminKey) === '1';
    if (btn) {
      btn.textContent = u
        ? ('تسجيل الخروج (' + (u.full_name || u.name || u.username || u.email || 'مستخدم') + ')')
        : 'تسجيل الدخول';
    }
    /* زر لوحة التحكم: أدمن عبر الخادم → /admin | أدمن تجريبي محلي → لوحة سريعة */
    if (ab) {
      if (onlineAdmin) {
        ab.textContent = 'لوحة التحكم';
        ab.href = (window.BNAN_ADMIN_URL || 'admin/');
        ab.style.display = '';
        ab.onclick = null;
      } else if (offlineAdmin) {
        ab.textContent = 'إدارة المنتجات';
        ab.href = '#';
        ab.style.display = '';
        ab.onclick = e => { e.preventDefault(); openAdmin(); };
      } else {
        ab.style.display = 'none';
        ab.onclick = null;
      }
    }
  }
};

/* ==========================================================
   Bnan Brand — منطق التطبيق
   سلة، تصفية، نوافذ، تحقق النماذج
   ========================================================== */

/* ---------- عناصر مشتركة (الهيدر والفوتر) ---------- */
const navLinks = [
  { label: 'المنتجات', href: 'index.html', page: 'index' },
  { label: 'تواصل معنا', href: 'contact.html', page: 'contact' }
];

function currentPage() {
  const f = location.pathname.split('/').pop() || 'index.html';
  return f.replace('.html', '');
}

const Cart = {
  key: 'bnan_cart',
  items: [],
  load() {
    try { this.items = JSON.parse(localStorage.getItem(this.key)) || []; }
    catch { this.items = []; }
  },
  save() {
    localStorage.setItem(this.key, JSON.stringify(this.items));
    this.render();
  },
  lineKey(id, variant = '') { return id + '::' + (variant || ''); },
  find(key) { return this.items.find(i => this.lineKey(i.id, i.variant) === key); },
  unitPrice(p) { return p.discount && p.discount > 0 ? (p.price * (1 - p.discount / 100)) : p.price; },
  add(id, qty = 1, variant = '') {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const key = this.lineKey(id, variant);
    const found = this.find(key);
    if (found) found.qty += qty;
    else this.items.push({ id, qty, variant: variant || '' });
    this.save();
    this.open();
  },
  setQty(key, qty) {
    const item = this.find(key);
    if (!item) return;
    if (qty <= 0) this.items = this.items.filter(i => this.lineKey(i.id, i.variant) !== key);
    else item.qty = Math.min(qty, 9999);
    this.save();
  },
  remove(key) { this.items = this.items.filter(i => this.lineKey(i.id, i.variant) !== key); this.save(); },
  clear() { this.items = []; this.save(); },
  get count() { return this.items.reduce((s, i) => s + i.qty, 0); },
  get total() {
    return this.items.reduce((s, i) => {
      const p = PRODUCTS.find(x => x.id === i.id);
      if (!p) return s;
      return s + this.unitPrice(p) * i.qty;
    }, 0);
  },
  open() {
    const p = document.getElementById('cartPanel');
    p.classList.add('is-on');
    p.removeAttribute('inert');
    document.getElementById('overlay').classList.add('is-on');
  },
  render() {
    const body = document.getElementById('cartBody');
    const foot = document.getElementById('cartFoot');
    const badge = document.querySelector('[data-count]');
    if (badge) {
      badge.textContent = this.count;
      badge.dataset.count = this.count;
    }
    if (!body || !foot) return;

    if (!this.items.length) {
      body.innerHTML = `<div class="cart-empty">${ICONS.boxEmpty}
        <p><b>سلتك فارغة</b></p>
        <p style="font-size:.9rem">أضف بعض المنتجات لتبدأ طلبك.</p>
        <a href="index.html" class="btn btn--ghost btn--sm" data-close-cart>تصفح المنتجات</a></div>`;
      foot.innerHTML = '';
      return;
    }

    body.innerHTML = this.items.map(i => {
      const p = PRODUCTS.find(x => x.id === i.id);
      if (!p) return '';
      const key = this.lineKey(i.id, i.variant);
      const media = p.image
        ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
        : BOX_ART((p.colors && p.colors[0]) || "#FFB6D9", (p.colors && p.colors[0]) || "#FFB6D9", (p.colors && p.colors[1]) || "#E75480");
      return `<div class="cart-item">
        <div class="cart-item__img">${media}</div>
        <div class="cart-item__info">
          <b>${p.name}</b>
          <span>${p.sku} · ${formatPrice(this.unitPrice(p))} ${p.unit}</span>
          ${i.variant ? `<span class="cart-item__variant">${i.variant}</span>` : ''}
          <div class="qty" style="margin-top:.4rem">
            <button data-qty-up="${key}" aria-label="زيادة">+</button>
            <span>${i.qty}</span>
            <button data-qty-down="${key}" aria-label="إنقاص">−</button>
          </div>
        </div>
        <div class="cart-item__side">
          <span class="cart-item__price">${formatPrice(this.unitPrice(p) * i.qty)}</span>
          <button class="cart-close" data-remove="${key}" aria-label="حذف" style="color:var(--danger)">${ICONS.close}</button>
        </div>
      </div>`;
    }).join('');

    foot.innerHTML = `
      <div class="cart-total"><span>الإجمالي</span><span>${formatPrice(this.total)}</span></div>
      <p class="cart-note">لا يشمل تكلفة التوصيل — تُحتسب عند إتمام الطلب.</p>
      <div style="display:grid;gap:.5rem">
        <button class="btn btn--primary btn--block" data-checkout>${ICONS.cart} إتمام الطلب</button>
        <a class="btn btn--ghost btn--block" href="https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent('مرحباً، أرغب بالطلب من متجر BnanBrand')}" target="_blank" rel="noopener" data-close-cart>طلب عبر واتساب</a>
        <button class="btn btn--sm btn--ghost btn--block" data-clear-cart>إفراغ السلة</button>
      </div>`;
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await (window.__bnanReady || Promise.resolve());
  injectSharedUI();
  rewriteLocalLinks();
  initHeader();
  initReveal();
  initToTop();
  initCart();
  initProductsPage();
  initHome();
  initForms();
  initCounters();
  Auth.render();
  initYear();
  // admin actions
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-adm-save]')) {
      const id = t.closest('[data-adm-save]').dataset.admSave;
      const p = PRODUCTS.find(x=>x.id===id);
      const pr = document.querySelector(`[data-adm-price="${id}"]`);
      const dc = document.querySelector(`[data-adm-disc="${id}"]`);
      if (p) { p.price = parseFloat(pr?.value||0)||0; p.discount = Math.max(0,Math.min(99,parseFloat(dc?.value||0)||0)); localStorage.setItem('bnan_products', JSON.stringify(PRODUCTS)); if (typeof initProductsPage==='function') initProductsPage(); if (typeof initHome==='function') initHome(); renderAdminTable(); toast('تم الحفظ'); }
    }
    if (t.closest('[data-adm-del]')) {
      PRODUCTS = PRODUCTS.filter(x=>x.id!==t.closest('[data-adm-del]').dataset.admDel);
      localStorage.setItem('bnan_products', JSON.stringify(PRODUCTS)); if (typeof initProductsPage==='function') initProductsPage(); if (typeof initHome==='function') initHome(); renderAdminTable(); toast('تم الحذف');
    }
    if (t.closest('[data-adm-edit]')) {
      const id = t.closest('[data-adm-edit]').dataset.admEdit;
      const p = PRODUCTS.find(x=>x.id===id);
      if (p) {
        const set = (idv,v)=>{ const el=document.getElementById(idv); if(el) el.value = v!==undefined?v:''; };
        set('admName', p.name); set('admPrice', p.price); set('admCat', p.category); set('admGroup', p.group||'default');
        set('admSku', p.sku); set('admDisc', p.discount||0); set('admStock', p.stock||0); set('admShort', p.short||'');
        const eid = document.getElementById('admEditId'); if(eid) eid.value = id;
        toast('تم تحميل المنتج للتعديل');
      }
    }
    if (t.closest('#admAdd')) {
      const name = document.getElementById('admName').value.trim();
      const price = parseFloat(document.getElementById('admPrice').value)||0;
      const cat = document.getElementById('admCat').value;
      const group = document.getElementById('admGroup').value;
      const sku = document.getElementById('admSku').value.trim()||('BN'+Date.now().toString().slice(-6));
      const disc = parseFloat(document.getElementById('admDisc').value)||0;
      const stock = parseFloat(document.getElementById('admStock').value)||0;
      const short = document.getElementById('admShort')?.value||'';
      const eid = document.getElementById('admEditId')?.value||'';
      if (eid) {
        const p = PRODUCTS.find(x=>x.id===eid);
        if (p) {
          p.name=name||p.name; p.price=price; p.category=cat; p.group=group; p.sku=sku; p.discount=disc; p.stock=stock; p.short=short;
        }
      } else {
        const nid = 'bn-'+Math.random().toString(36).slice(2,8);
        PRODUCTS.unshift({id:nid,sku,name:name||'منتج جديد',category:cat,price,oldPrice:null,unit:'للقطعة',rating:4.5,reviews:0,stock,badge:'',material:'كرتون',dims:'-',weight:'-',short,desc:'',features:[],colors:['#c98f4e','#8a5a2b','#d9b48a'],discount:disc,group});
      }
      localStorage.setItem('bnan_products', JSON.stringify(PRODUCTS)); if (typeof initProductsPage==='function') initProductsPage(); if (typeof initHome==='function') initHome(); renderAdminTable(); toast(eid ? 'تم التعديل' : 'تمت الإضافة');
      ['admName','admSku','admShort','admEditId','admPrice','admDisc','admStock'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
    }
  });
});

function rewriteLocalLinks() {
  // عند فتح الصفحة كملف (file://) لا يوجد خادم. نحوّل الروابط التي تبدأ بـ "/"
  // إلى عنوان الخادم المحلي حتى تعمل روابط لوحة التحكم.
  if (location.protocol !== 'file:') return;
  const base = 'http://localhost:4000';
  document.querySelectorAll('a[href^="/"]').forEach(a => {
    const h = a.getAttribute('href');
    if (h && h.startsWith('/')) a.setAttribute('href', base + h);
  });
}

function injectSharedUI() {
  const header = document.getElementById('site-header');
  if (header) header.innerHTML = headerTemplate();
  const footer = document.getElementById('site-footer');
  if (footer) footer.innerHTML = footerTemplate();

  const cartPanel = document.createElement('aside');
  cartPanel.className = 'cart-panel';
  cartPanel.id = 'cartPanel';
  cartPanel.setAttribute('inert', '');
  cartPanel.innerHTML = cartPanelTemplate();
  document.body.appendChild(cartPanel);

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.id = 'overlay';
  document.body.appendChild(overlay);

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'productModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = '<div class="modal__card"><button class="modal__close" data-close-modal aria-label="إغلاق">' + ICONS.close + '</button><div id="modalContent"></div></div>';
  document.body.appendChild(modal);

  const authModal = document.createElement('div');
  authModal.className = 'modal';
  authModal.id = 'authModal';
  authModal.setAttribute('role', 'dialog');
  authModal.setAttribute('aria-modal', 'true');
  authModal.innerHTML = `<div class="modal__card" style="max-width:480px"><button class="modal__close" data-close-auth aria-label="إغلاق">${ICONS.close}</button><div class="modal__body">
    <h2 id="authTitle">تسجيل الدخول</h2>
    <p style="color:var(--muted);margin-bottom:1.5rem" id="authSub">مرحباً بعودتك إلى عالم BnanBrand</p>
    <div class="field" id="authNameField" style="display:none"><label for="authName">الاسم الكامل</label><input id="authName" type="text" placeholder="اسمك أو لقبك"></div>
    <div class="field"><label for="authEmail">البريد الإلكتروني</label><input id="authEmail" type="email" placeholder="example@domain.com" autocomplete="email"></div>
    <div class="field"><label for="authPass">كلمة المرور</label><input id="authPass" type="password" placeholder="********" autocomplete="current-password"></div>
    <button class="btn btn--primary btn--block" id="loginBtn">تسجيل الدخول</button>
    <button class="btn btn--primary btn--block" id="signupBtn" style="display:none">إنشاء الحساب</button>
    <p class="form__note" id="authMsg"></p>
    <div class="text-center" style="margin-top:.75rem">
      <button class="btn btn--ghost btn--sm" id="toggleAuthMode">ليس لديك حساب؟ أنشئيه الآن</button>
    </div>
  </div></div>`;
  document.body.appendChild(authModal);

  const adminModal = document.createElement('div');
  adminModal.className = 'modal';
  adminModal.id = 'adminModal';
  adminModal.setAttribute('role', 'dialog');
  adminModal.setAttribute('aria-modal', 'true');
  adminModal.innerHTML = `<div class="modal__card" style="max-width:1100px"><button class="modal__close" data-close-admin aria-label="إغلاق">${ICONS.close}</button><div class="modal__body"><h2>لوحة تحكم الأدمن - إدارة المنتجات</h2><div class="form__row"><div class="field"><label>اسم المنتج</label><input id="admName"></div><div class="field"><label>السعر (شيكل)</label><input id="admPrice" type="number" step="0.01"></div></div><div class="form__row"><div class="field"><label>التصنيف</label><select id="admCat">${CATEGORIES.map(c=>c.id!=='all'?`<option value="${c.id}">${c.name}</option>`:'').join('')}</select></div><div class="field"><label>المجموعة</label><select id="admGroup">${PRODUCT_GROUPS.map(g=>`<option value="${g.id}">${g.name}</option>`).join('')}</select></div></div><div class="field"><label>رقم SKU</label><input id="admSku"></div><div class="form__row"><div class="field"><label>خصم (%)</label><input id="admDisc" type="number" min="0" max="99" value="0"></div><div class="field"><label>مخزون</label><input id="admStock" type="number" value="0"></div></div><div class="form__row"><div class="field"><label>الوحدة</label><input id="admUnit" placeholder="للقطعة"></div><div class="field"><label>وصف مختصر</label><input id="admShort" placeholder=""></div></div><div class="form__row"><div class="field"><label>معرف للتعديل (فارغ للإضافة)</label><input id="admEditId" placeholder=""></div><button class="btn btn--primary" id="admAdd">حفظ المنتج</button></div><hr style="margin:1rem 0"><div class="size-table-wrap"><table class="size-table"><thead><tr><th>SKU</th><th>الاسم</th><th>التصنيف</th><th>المجموعة</th><th>السعر</th><th>خصم %</th><th>إجراءات</th></tr></thead><tbody id="admTable"></tbody></table></div></div></div>`;
  document.body.appendChild(adminModal);

  const fab = document.createElement('a');
  fab.className = 'whatsapp-fab';
  fab.href = 'https://wa.me/' + CONTACT.whatsapp;
  fab.target = '_blank';
  fab.rel = 'noopener';
  fab.setAttribute('aria-label', 'تواصل عبر واتساب');
  fab.innerHTML = ICONS.whatsapp;
  document.body.appendChild(fab);

  const toTop = document.createElement('button');
  toTop.className = 'to-top';
  toTop.id = 'toTop';
  toTop.setAttribute('aria-label', 'العودة للأعلى');
  toTop.innerHTML = ICONS.up;
  document.body.appendChild(toTop);

  const mobNav = document.createElement('aside');
  mobNav.className = 'mobile-nav';
  mobNav.id = 'mobileNav';
  mobNav.setAttribute('inert', '');
  mobNav.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
      <div class="brand"><span class="brand__mark">${LOGO_MARK}</span>
      <span class="brand__text">Bnan Brand</span></div>
      <button class="cart-close" data-close-mobile aria-label="إغلاق">${ICONS.close}</button>
    </div>
    ${navLinks.map(l => `<a href="${l.href}"${l.page === currentPage() ? ' style="background:var(--brand-light);color:var(--brand-dark)"' : ''}>${l.label}</a>`).join('')}
    <a class="btn btn--primary btn--block" style="margin-top:1.2rem" href="#contact">اطلب عرض سعر</a>
    <div class="socials">
      <a href="https://www.instagram.com/bananqodemat?srtk=MTlwY21uc2dzdTBzag==" target="_blank" rel="noopener" aria-label="انستغرام">${ICONS.instagram}</a>
      <a href="https://www.facebook.com" target="_blank" rel="noopener" aria-label="فيسبوك">${ICONS.facebook}</a>
      <a href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener" aria-label="واتساب">${ICONS.whatsapp}</a>
    </div>`;
  document.body.appendChild(mobNav);
}


function headerTemplate() {
  const page = currentPage();
  return `
  <div class="topbar" style="display:none">
    <div class="container">
      <div class="topbar-items">
        <span>${ICONS.truck} توصيل سريع لجميع المناطق</span>
        <span>${ICONS.shield} جودة مضمونة 100%</span>
        <span>${ICONS.refresh} إمكانية الإرجاع خلال 7 أيام</span>
      </div>
      <div class="topbar-items">
        <span>${ICONS.phone} <a href="tel:${CONTACT.phone.replace(/\s/g, '')}" dir="ltr">${CONTACT.phone}</a></span>
      </div>
    </div>
  </div>
  <div class="header-inner container">
    <a class="brand" href="index.html">
      <span class="brand__mark">${LOGO_MARK}</span>
      <span class="brand__text">Bnan Brand<span>متجر أنيق لأكسسوارات المنزل</span></span>
    </a>
    <nav class="main-nav" aria-label="القائمة الرئيسية">
      <ul>${navLinks.map(l => `<li><a href="${l.href}" class="${l.page === page ? 'is-active' : ''}">${l.label}</a></li>`).join('')}</ul>
    </nav>
    <div class="header-actions">
      <button class="icon-btn" id="cartToggle" aria-label="سلة المشتريات">${ICONS.cart}<span class="icon-btn__badge" data-count="0"></span></button>
      <button class="btn btn--ghost btn--sm" id="authBtn" aria-label="تسجيل الدخول">تسجيل الدخول</button>
      <a class="btn btn--primary btn--sm" id="adminBtn" href="admin/" style="display:none">لوحة التحكم</a>
      <a class="btn btn--primary btn--sm" href="index.html">تسوّق الآن</a>
      <button class="icon-btn burger" id="burger" aria-label="القائمة">${ICONS.menu}</button>
    </div>
  </div>`;
}

function footerTemplate() {
  const year = new Date().getFullYear();
  return `
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="brand"><span class="brand__mark">${LOGO_MARK}</span>
        <span class="brand__text">Bnan Brand<span>منتجات نسائية أنيقة</span></span></div>
        <p>متجر Bnan Brand — إكسسوارات وهدايا وصناديق أنيقة بتصميم أنثوي راقٍ، نختار كل قطعة بعناية لتناسب ذوقك وتمنحك تجربة تسوّق سلسة وآمنة.</p>
        <div class="socials">
          <a href="https://www.instagram.com/bananqodemat?srtk=MTlwY21uc2dzdTBzag==" target="_blank" rel="noopener" aria-label="انستغرام">${ICONS.instagram}</a>
          <a href="https://www.facebook.com" target="_blank" rel="noopener" aria-label="فيسبوك">${ICONS.facebook}</a>
          <a href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener" aria-label="واتساب">${ICONS.whatsapp}</a>
        </div>
      </div>
      <div>
        <h3>روابط سريعة</h3>
        <ul>
          <li><a href="index.html">جميع المنتجات</a></li>
          <li><a href="contact.html">تواصل معنا</a></li>
        </ul>
      </div>
      <div>
        <h3>التصنيفات</h3>
        <ul>
          ${CATEGORIES.filter(c => c.id !== 'all').slice(0, 6).map(c => `<li><a href="index.html?cat=${c.id}">${c.name}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <h3>تواصل معنا</h3>
        <ul class="footer-contact">
          <li>${ICONS.phone}<a href="tel:${CONTACT.phone.replace(/\s/g, '')}" dir="ltr">${CONTACT.phone}</a></li>
          <li>${ICONS.mailIcon}<a href="mailto:${CONTACT.email}">${CONTACT.email}</a></li>
          <li>${ICONS.pin}${CONTACT.address}</li>
          <li>${ICONS.clock}${CONTACT.hours}</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${year} Bnan Brand — جميع الحقوق محفوظة.</span>
      <span><a href="#">سياسة الخصوصية</a> · <a href="#">الشروط والأحكام</a> · <a href="#">سياسة الضمان</a></span>
    </div>
  </div>`;
}

function cartPanelTemplate() {
  return `
  <div class="cart-panel__head">
    <h3>سلة المشتريات</h3>
    <button class="cart-close" data-close-cart aria-label="إغلاق السلة">${ICONS.close}</button>
  </div>
  <div class="cart-panel__body" id="cartBody"></div>
  <div class="cart-panel__foot" id="cartFoot"></div>`;
}

/* ---------- الهيدر ---------- */
function initHeader() {
  const header = document.getElementById('site-header');
  const onScroll = () => header && header.classList.toggle('is-stuck', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = document.getElementById('burger');
  const mobNav = document.getElementById('mobileNav');
  const overlay = document.getElementById('overlay');
  burger && burger.addEventListener('click', () => {
    mobNav.classList.remove('inert');
    mobNav.classList.add('is-on');
    overlay.classList.add('is-on');
  });
  mobNav && mobNav.addEventListener('click', e => {
    if (e.target.matches('[data-close-mobile]') || e.target.tagName === 'A') closeAll();
  });
}

function closeAll() {
  document.querySelectorAll('.cart-panel, .mobile-nav, .overlay, .modal')
    .forEach(el => el.classList.remove('is-on'));
  const panel = document.getElementById('cartPanel');
  if (panel) panel.setAttribute('inert', '');
  const mob = document.getElementById('mobileNav');
  if (mob) mob.setAttribute('inert', '');
}


function openAuth() { document.getElementById('authModal').classList.add('is-on'); document.getElementById('overlay').classList.add('is-on'); }
function openAdmin() { document.getElementById('adminModal').classList.add('is-on'); document.getElementById('overlay').classList.add('is-on'); renderAdminTable(); }
function renderAdminTable() {
  const tbody = document.getElementById('admTable');
  if (!tbody) return;
  tbody.innerHTML = PRODUCTS.map(p=>`<tr><td>${p.sku}</td><td>${p.name}</td><td>${p.category}</td><td>${p.group||'default'}</td><td><input data-adm-price="${p.id}" type="number" step="0.01" value="${p.price}"></td><td><input data-adm-disc="${p.id}" type="number" min="0" max="99" value="${p.discount||0}"></td><td>${p.stock||0}</td><td><button class="btn btn--sm btn--ghost" data-adm-save="${p.id}">حفظ</button> <button class="btn btn--sm btn--ghost" data-adm-edit="${p.id}">تعديل</button> <button class="btn btn--sm" style="background:var(--danger);border-color:var(--danger)" data-adm-del="${p.id}">حذف</button></td></tr>`).join('');
}
function persistProducts() {
  localStorage.setItem('bnan_products', JSON.stringify(PRODUCTS));
  if (typeof initProductsPage === 'function') initProductsPage();
  if (typeof initHome === 'function') initHome();
  renderAdminTable();
}

/* ---------- كشف العناصر الظاهرة في الشاشة ----------
   يستخدم IntersectionObserver مع بديل يعمل عند التمرير،
   لأن بعض المتصفحات لا تطلق الحدث فيConditions معينة */
function observeVisible(elements, callback, options = {}) {
  const els = [...elements];
  if (!els.length) return;
  const pending = new Set(els);
  const done = el => { if (pending.has(el)) { pending.delete(el); callback(el); } };

  // نعتبر العنصر ظاهراً إذا كان داخل الشاشة أو مرّ أمامها (لتفادي تخطيه عند التمرير السريع)
  const inView = el => el.getBoundingClientRect().top < innerHeight * 0.92;

  const check = () => pending.forEach(el => { if (inView(el)) done(el); });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { done(e.target); io.unobserve(e.target); } });
    }, { threshold: options.threshold ?? .12, rootMargin: options.rootMargin ?? '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));

    // بديل احتياطي يعمل بالتمرير وتغيير الحجم
    const pass = () => {
      [...pending].forEach(el => { if (inView(el)) { done(el); io.unobserve(el); } });
      if (!pending.size) {
        window.removeEventListener('scroll', pass);
        window.removeEventListener('resize', pass);
      }
    };
    window.addEventListener('scroll', pass, { passive: true });
    window.addEventListener('resize', pass);
    requestAnimationFrame(check);
    // شبكة أمان: بعد التحميل نكشف كل ما مرّ أمام الشاشة، وبعد 4 ثوانٍ نكشف الباقي
    window.addEventListener('load', pass);
    setTimeout(pass, 1500);
    setTimeout(() => { [...pending].forEach(el => done(el)); }, 4000);
  } else {
    const onScroll = () => {
      [...pending].forEach(el => { if (inView(el)) done(el); });
      if (!pending.size) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    requestAnimationFrame(check);
    setTimeout(() => { [...pending].forEach(el => done(el)); }, 4000);
  }
}

function initReveal() {
  const els = document.querySelectorAll('.reveal:not(.is-visible)');
  if (!els.length) return;
  observeVisible(els, el => el.classList.add('is-visible'));
}

/* ---------- زر الرجوع للأعلى ---------- */
function initToTop() {
  const btn = document.getElementById('toTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('is-on', window.scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- العدادات ---------- */
function initCounters() {
  const els = document.querySelectorAll('[data-count-to]');
  if (!els.length) return;
  observeVisible(els, el => {
    const target = parseFloat(el.dataset.countTo);
    const suffix = el.dataset.suffix || '';
    const dec = el.dataset.decimals | 0;
    const dur = 1400;
    let start = null;
    const render = val => {
      el.textContent = dec ? val.toFixed(dec) : Math.round(val).toLocaleString('ar-EG') + suffix;
    };
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      render(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    // بديل: لو تبطّئ المتصفح الإطارات (تبويب في الخلفية) نعرض القيمة النهائية مباشرة
    setTimeout(() => render(target), dur + 250);
  }, { threshold: .5, rootMargin: '0px' });
}

function initYear() {
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}

/* ---------- السلة ---------- */


function formatPrice(n) {
  const v = Number(n) || 0;
  const currency = window.BnanCurrency || 'شيكل';
  return v.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;
}





function initCart() {
  Cart.load();
  Cart.render();
  document.getElementById('cartToggle')?.addEventListener('click', () => Cart.open());
  document.getElementById('overlay')?.addEventListener('click', closeAll);
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-close-auth]')) { document.getElementById('authModal').classList.remove('is-on'); document.getElementById('overlay').classList.remove('is-on'); }
    if (t.closest('[data-close-admin]')) { const am = document.getElementById('adminModal'); if (am) am.classList.remove('is-on'); document.getElementById('overlay').classList.remove('is-on'); }
    const up = t.closest('[data-qty-up]');
    const down = t.closest('[data-qty-down]');
    const rm = t.closest('[data-remove]');
    if (up) Cart.setQty(up.dataset.qtyUp, (Cart.find(up.dataset.qtyUp)?.qty || 0) + 1);
    if (down) Cart.setQty(down.dataset.qtyDown, (Cart.find(down.dataset.qtyDown)?.qty || 0) - 1);
    if (rm) Cart.remove(rm.dataset.remove);
    if (t.closest('[data-close-cart]')) closeAll();
    if (t.closest('[data-clear-cart]')) Cart.clear();
    if (t.closest('[data-checkout]')) { closeAll(); openCheckout(); }
    if (t.closest('[data-add-cart]')) {
      const addBtn = t.closest('[data-add-cart]');
      const selects = [...document.querySelectorAll('#productModal .product-variant')];
      const variant = selects.map(s => `${s.dataset.variantName}: ${s.value}`).join('، ');
      Cart.add(addBtn.dataset.addCart, 1, variant);
      toast('تمت الإضافة إلى السلة');
    }
    if (t.closest('[data-open-product]')) {
      openProduct(t.closest('[data-open-product]').dataset.openProduct);
    }
    const fav = t.closest('[data-fav]');
    if (fav) {
      fav.classList.toggle('is-on');
      toast(fav.classList.contains('is-on') ? 'أُضيف إلى المفضلة' : 'أُزيل من المفضلة');
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
  // auth buttons
  document.getElementById('authBtn')?.addEventListener('click', () => {
    const u = Auth.load();
    if (u) { Auth.logout(); toast('تم تسجيل الخروج'); }
    else openAuth();
  });
  // زر لوحة التحكم — سلوكه يحدده Auth.render (أدمن عبر الخادم → /admin، أدمن محلي → لوحة سريعة)
  document.getElementById('adminBtn')?.addEventListener('click', e => {
    if (window.BnanOffline && localStorage.getItem('bnan_is_admin') === '1') {
      e.preventDefault();
      openAdmin();
    }
  });
  // تبديل وضع النافذة: تسجيل دخول ↔ إنشاء حساب
  let authMode = 'login';
  const setAuthMode = mode => {
    authMode = mode;
    const signup = mode === 'signup';
    document.getElementById('authTitle').textContent = signup ? 'إنشاء حساب جديد' : 'تسجيل الدخول';
    document.getElementById('authSub').textContent = signup ? 'انضمي إلينا وابدئي تجربة تسوّق خاصة بك' : 'مرحباً بعودتك إلى عالم BnanBrand';
    document.getElementById('authNameField').style.display = signup ? '' : 'none';
    document.getElementById('loginBtn').style.display = signup ? 'none' : '';
    document.getElementById('signupBtn').style.display = signup ? '' : 'none';
    document.getElementById('toggleAuthMode').textContent = signup ? 'لديك حساب؟ سجّلي الدخول' : 'ليس لديك حساب؟ أنشئيه الآن';
  };
  document.getElementById('toggleAuthMode')?.addEventListener('click', () => setAuthMode(authMode === 'login' ? 'signup' : 'login'));
  document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authPass').value.trim();
    const msg = document.getElementById('authMsg');
    if (!email || !pass) return toast('املأ البريد وكلمة المرور');
    if (msg) msg.textContent = '';
    try {
      const user = await Auth.login(email, pass);
      if (msg) msg.textContent = 'تم تسجيل الدخول';
      // أدمن → الانتقال لواجهة الإدارة (لوحة التحكم عبر الخادم، أو واجهة الإدارة المحلية بدونه)
      if (user.role === 'admin') {
        toast('مرحباً بك في لوحة التحكم');
        if (window.BnanOffline) {
          setTimeout(() => { closeAll(); openAdmin(); }, 500);
        } else {
          setTimeout(() => { closeAll(); location.href = (window.BNAN_ADMIN_URL || 'admin/'); }, 600);
        }
        return;
      }
      toast('تم تسجيل الدخول');
      setTimeout(() => { document.getElementById('authModal').classList.remove('is-on'); document.getElementById('authMsg').textContent=''; closeAll(); }, 600);
      Auth.render();
    } catch (err) {
      if (msg) msg.textContent = err.message;
      toast(err.message);
    }
  });
  document.getElementById('signupBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('authName').value.trim();
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authPass').value.trim();
    const msg = document.getElementById('authMsg');
    if (!name) return toast('الرجاء إدخال الاسم');
    if (!email) return toast('الرجاء إدخال البريد الإلكتروني');
    if (pass.length < 6) return toast('كلمة المرور 6 أحرف على الأقل');
    if (msg) msg.textContent = '';
    try {
      const user = await Auth.register({ name, username: email, password: pass });
      if (msg) msg.textContent = 'تم إنشاء الحساب وتسجيل الدخول';
      if (user.role === 'admin') {
        toast('مرحباً بك في لوحة التحكم');
        if (window.BnanOffline) {
          setTimeout(() => { closeAll(); openAdmin(); }, 500);
        } else {
          setTimeout(() => { closeAll(); location.href = (window.BNAN_ADMIN_URL || 'admin/'); }, 600);
        }
        return;
      }
      toast('تم إنشاء الحساب');
      setTimeout(() => { document.getElementById('authModal').classList.remove('is-on'); document.getElementById('authMsg').textContent=''; closeAll(); }, 600);
      Auth.render();
    } catch (err) {
      if (msg) msg.textContent = err.message;
      toast(err.message);
    }
  });
  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest('[data-adm-save]')) {
      const id = t.closest('[data-adm-save]').dataset.admSave;
      const p = PRODUCTS.find(x=>x.id===id);
      const priceInp = document.querySelector(`[data-adm-price="${id}"]`);
      const discInp = document.querySelector(`[data-adm-disc="${id}"]`);
      if (p) { p.price = parseFloat(priceInp.value)||0; p.discount = Math.max(0,Math.min(99,parseFloat(discInp.value)||0)); persistProducts(); toast('تم الحفظ'); }
    }
    if (t.closest('[data-adm-del]')) {
      const id = t.closest('[data-adm-del]').dataset.admDel;
      PRODUCTS = PRODUCTS.filter(x=>x.id!==id);
      persistProducts(); toast('تم الحذف');
    }
    if (t.closest('#admAdd')) {
      const name = document.getElementById('admName').value.trim();
      const price = parseFloat(document.getElementById('admPrice').value)||0;
      const cat = document.getElementById('admCat').value;
      const group = document.getElementById('admGroup').value;
      const sku = document.getElementById('admSku').value.trim() || ('BN'+Date.now().toString().slice(-6));
      const disc = parseFloat(document.getElementById('admDisc').value)||0;
      const stock = parseFloat(document.getElementById('admStock').value)||0;
      const nid = 'bn-' + Math.random().toString(36).slice(2,7);
      PRODUCTS.unshift({ id:nid, sku, name:name||'منتج جديد', category:cat, price, oldPrice:null, unit:'للقطعة', rating:4.5, reviews:0, stock, badge:'', material:'كرتون', dims:'-', weight:'-', short:'', desc:'', features:[], colors:['#c98f4e','#8a5a2b'], discount:disc, group });
      persistProducts(); toast('تمت الإضافة');
      ['admName','admSku'].forEach(id=>document.getElementById(id).value='');
    }
    if (t.closest('[data-close-auth]')) { document.getElementById('authModal').classList.remove('is-on'); closeAll(); }
    if (t.closest('[data-close-admin]')) { document.getElementById('adminModal').classList.remove('is-on'); closeAll(); }
  });
}

/* ---------- نافذة تفاصيل المنتج ---------- */
function openProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const cat = CATEGORIES.find(c => c.id === p.category);
  const media = p.image
    ? `<img src="${p.image}" alt="${p.name}">`
    : BOX_ART((p.colors && p.colors[0]) || "#FFB6D9", (p.colors && p.colors[0]) || "#FFB6D9", (p.colors && p.colors[1]) || "#E75480");
  const variantsHtml = (p.variants || []).map(v => `
    <div class="field">
      <label>${v.name}</label>
      <select class="product-variant" data-variant-name="${v.name}">
        ${(v.options || []).map(o => `<option value="${o}">${o}</option>`).join('')}
      </select>
    </div>`).join('');
  const html = `
  <div class="modal__grid">
    <div class="modal__media">
      ${media}
      ${p.badge ? `<span class="product__badge" style="inset-inline-start:1.5rem;top:1.5rem">${p.badge}</span>` : ''}
    </div>
    <div class="modal__body">
      <span class="product__cat">${cat ? cat.name : ''} · ${p.sku}</span>
      <h2>${p.name}</h2>
      <div class="product__meta">
        <span class="rating">${ICONS.star} ${p.rating} <small>(${p.reviews} تقييم)</small></span>
        <span>${ICONS.tag} ${p.stock > 0 ? `متوفر (${p.stock} قطعة)` : 'غير متوفر'}</span>
      </div>
      <p>${p.desc}</p>
      <div class="modal__price">
        <strong>${p.price > 0 ? formatPrice(p.discount && p.discount > 0 ? (p.price * (1 - p.discount/100)) : p.price) : 'حسب الطلب'}</strong>${p.discount && p.discount > 0 ? `<span style="margin-inline-start:.5rem;color:var(--muted);text-decoration:line-through;font-weight:600">${formatPrice(p.price)}</span><span class="badge" style="margin-inline-start:.4rem">خصم ${p.discount}%</span>` : ''}
        <small style="color:var(--ink-500)">${p.unit}</small>
      </div>
      ${variantsHtml ? `<div class="product-variants">${variantsHtml}</div>` : ''}
      <div class="specs">
        <div class="spec">${ICONS.tag}<b>التصنيف:</b><span>${cat ? cat.name : '-'}</span></div>
        <div class="spec">${ICONS.layers}<b>الخامة:</b><span>${p.material || '-'}</span></div>
        <div class="spec">${ICONS.box}<b>التوفّر:</b><span>${p.stock > 0 ? p.stock + ' قطعة' : 'غير متوفر'}</span></div>
      </div>
      <ul class="feature-list">${(p.features || []).map(f => `<li>${ICONS.checkCircle}<span>${f}</span></li>`).join('')}</ul>
      <div class="modal__actions">
        ${p.price > 0 && !p.soldOut
          ? `<button class="btn btn--primary" data-add-cart="${p.id}">${ICONS.cart} أضف إلى السلة</button>`
          : `<a class="btn btn--primary" href="https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`مرحباً، أرغب بالاستفسار عن: ${p.name} (${p.sku})`)}" target="_blank" rel="noopener">${ICONS.whatsapp} اطلب عبر واتساب</a>`}
        <a class="btn btn--ghost" href="https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(`مرحباً، أرغب بالاستفسار عن: ${p.name} (${p.sku})`)}" target="_blank" rel="noopener">${ICONS.whatsapp} استفسر الآن</a>
      </div>
    </div>
  </div>`;
  const modal = document.getElementById('productModal');
  document.getElementById('modalContent').innerHTML = html;
  modal.classList.add('is-on');
  document.getElementById('overlay').classList.add('is-on');
}

/* ---------- إتمام الطلب (Checkout) ---------- */
function openCheckout() {
  if (!Cart.items.length) { toast('سلتك فارغة'); return; }
  let modal = document.getElementById('checkoutModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'checkoutModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `<div class="modal__card" style="max-width:620px">
      <button class="modal__close" data-close-checkout aria-label="إغلاق">${ICONS.close}</button>
      <div class="modal__body">
        <h2>إتمام الطلب</h2>
        <p style="color:var(--ink-500);margin-bottom:1rem">أدخل بيانات التوصيل وسنتواصل معك لتأكيد الطلب.</p>
        <form id="checkoutForm" class="checkout-form">
          <div class="form__row">
            <div class="field"><label>الاسم الكامل *</label><input name="customer_name" required></div>
            <div class="field"><label>رقم الهاتف *</label><input name="phone" required inputmode="tel" dir="ltr"></div>
          </div>
          <div class="form__row">
            <div class="field"><label>البريد الإلكتروني</label><input name="email" type="email" dir="ltr"></div>
            <div class="field"><label>المدينة</label><input name="city"></div>
          </div>
          <div class="field"><label>عنوان التوصيل *</label><input name="address" required></div>
          <div class="field"><label>ملاحظات</label><textarea name="notes" rows="2"></textarea></div>
          <div class="checkout-summary">
            <div class="cart-total"><span>الإجمالي المبدئي</span><span>${formatPrice(Cart.total)}</span></div>
            <p class="cart-note">تُضاف رسوم التوصيل عند تأكيد الطلب.</p>
          </div>
          <p class="form__note" id="checkoutMsg"></p>
          <button type="submit" class="btn btn--primary btn--block">${ICONS.checkCircle} تأكيد الطلب</button>
        </form>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-close-checkout]').addEventListener('click', closeAll);
    modal.querySelector('#checkoutForm').addEventListener('submit', submitCheckout);
  }
  modal.classList.add('is-on');
  document.getElementById('overlay').classList.add('is-on');
}

async function submitCheckout(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const msg = document.getElementById('checkoutMsg');
  const data = Object.fromEntries(new FormData(form).entries());
  const address = [data.city, data.address].filter(Boolean).join('، ');
  const items = Cart.items.map(i => ({ product_id: Number(i.id), quantity: i.qty, variant: i.variant || '' }));
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true; btn.style.opacity = '.7';
  if (msg) msg.textContent = '';
  try {
    const res = await window.BnanAPI.submitOrder({
      customer_name: data.customer_name,
      phone: data.phone,
      email: data.email || '',
      address,
      notes: data.notes || '',
      items,
    });
    Cart.clear();
    closeAll();
    showOrderSuccess(res.order);
  } catch (err) {
    if (msg) msg.textContent = err.message;
    toast(err.message);
  } finally {
    btn.disabled = false; btn.style.opacity = '1';
  }
}

function showOrderSuccess(order) {
  const modal = document.getElementById('productModal');
  document.getElementById('modalContent').innerHTML = `
    <div class="modal__body" style="text-align:center;padding:2rem 1rem">
      <div class="order-success__icon">${ICONS.checkCircle}</div>
      <h2>تم استلام طلبك بنجاح</h2>
      <p style="color:var(--ink-500)">شكراً لك! سيتواصل معك فريقنا قريباً لتأكيد الطلب.</p>
      <div class="order-code">رقم الطلب: <b dir="ltr">${order.order_number}</b></div>
      <p>الإجمالي: <b>${formatPrice(order.total)}</b></p>
      <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:1rem">
        <a class="btn btn--primary" href="index.html">مواصلة التسوق</a>
        <a class="btn btn--ghost" href="https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent('مرحباً، لدي طلب رقم ' + order.order_number)}" target="_blank" rel="noopener">تأكيد عبر واتساب</a>
      </div>
    </div>`;
  modal.classList.add('is-on');
  document.getElementById('overlay').classList.add('is-on');
  toast('تم إرسال الطلب بنجاح');
}

/* ---------- الصفحة الرئيسية ---------- */
function initHome() {
  const catsWrap = document.getElementById('homeCats');
  const featWrap = document.getElementById('featuredGrid');

  /* عرض كل المنتجات مباشرة على الواجهة الرئيسية + تصفية فورية حسب التصنيف */
  function renderHomeProducts(list) {
    if (!featWrap) return;
    featWrap.innerHTML = list.map((p, i) => productCard(p, i)).join('');
    initReveal();
  }
  renderHomeProducts(PRODUCTS);

  if (catsWrap) {
    catsWrap.innerHTML = CATEGORIES.map(c =>
      `<a class="cat-chip${c.id === 'all' ? ' is-active' : ''}" data-cat="${c.id}" href="#">${ICONS[c.icon] || ICONS.box} ${c.name}</a>`).join('');
    catsWrap.addEventListener('click', e => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;
      e.preventDefault();
      catsWrap.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      renderHomeProducts(chip.dataset.cat === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === chip.dataset.cat));
      featWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const tWrap = document.getElementById('testimonialsGrid');
  if (tWrap) {
    tWrap.innerHTML = TESTIMONIALS.map((t, i) => `
      <article class="testimonial reveal">
        <div class="testimonial__stars">
          ${Array.from({ length: 5 }, (_, k) => ICONS.star.replace('<svg', k < t.rating ? '<svg' : '<svg class="is-empty"')).join('')}
        </div>
        <p>${t.text}</p>
        <div class="testimonial__person">
          <span class="avatar">${t.initials}</span>
          <div><b>${t.name}</b><span>${t.role}</span></div>
        </div>
      </article>`).join('');
    initReveal();
  }

}

/* ---------- صفحة المنتجات ---------- */
function initProductsPage() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const countEl = document.getElementById('resultCount');
  const chipsWrap = document.getElementById('filterChips');
  const emptyState = document.getElementById('emptyState');

  const params = new URLSearchParams(location.search);
  let activeCat = params.get('cat') || 'all';
  if (!CATEGORIES.some(c => c.id === activeCat)) activeCat = 'all';

  if (chipsWrap) {
    chipsWrap.innerHTML = CATEGORIES.map(c =>
      `<button class="cat-chip ${c.id === activeCat ? 'is-active' : ''}" data-cat="${c.id}">${ICONS[c.icon] || ICONS.box} ${c.name}</button>`).join('');
    chipsWrap.addEventListener('click', e => {
      const chip = e.target.closest('[data-cat]');
      if (!chip) return;
      activeCat = chip.dataset.cat;
      chipsWrap.querySelectorAll('[data-cat]').forEach(c => c.classList.toggle('is-active', c === chip));
      const u = new URL(location.href);
      if (activeCat === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', activeCat);
      history.replaceState({}, '', u);
      render();
    });
  }

  function currentList() {
    let list = PRODUCTS.filter(p => activeCat === 'all' || p.category === activeCat);
    const q = (searchInput?.value || '').trim().toLowerCase();
    if (q) list = list.filter(p =>
      (p.name + ' ' + p.sku + ' ' + p.desc + ' ' + p.material).toLowerCase().includes(q));
    const sort = sortSelect?.value || 'featured';
    // المنتجات بسعر 0 (حسب الطلب) تُعامل كأنها الأعلى سعراً
    const p = x => (x.price > 0 ? x.price : Infinity);
    const cmp = {
      'price-asc': (a, b) => p(a) - p(b),
      'price-desc': (a, b) => p(b) - p(a),
      rating: (a, b) => b.rating - a.rating,
      name: (a, b) => a.name.localeCompare(b.name, 'ar')
    }[sort];
    return cmp ? [...list].sort(cmp) : list;
  }

  function render() {
    const list = currentList();
    grid.innerHTML = list.map((p, i) => productCard(p, i)).join('') || '';
    if (emptyState) emptyState.style.display = list.length ? 'none' : 'block';
    if (countEl) countEl.innerHTML = `عرض <strong>${list.length}</strong> من ${PRODUCTS.length} منتج`;
    initReveal();
  }

  searchInput?.addEventListener('input', render);
  sortSelect?.addEventListener('change', render);
  render();
}

function productCard(p, i = 0) {
  const badgeClass = p.discount ? ' product__badge--sale' : (p.badge === 'جديد' ? ' product__badge--new' : '');
  const media = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
    : BOX_ART((p.colors && p.colors[0]) || "#FFB6D9", (p.colors && p.colors[0]) || "#FFB6D9", (p.colors && p.colors[1]) || "#E75480");
  return `
  <article class="product reveal" style="transition-delay:${Math.min(i, 5) * 0.06}s">
    <div class="product__media" data-open-product="${p.id}" role="button" tabindex="0" aria-label="عرض تفاصيل ${p.name}">
      ${p.badge ? `<span class="product__badge${badgeClass}">${p.badge}</span>` : ''}
      <button class="product__fav" data-fav aria-label="أضف إلى المفضلة">${ICONS.heart}</button>
      ${media}
    </div>
    <div class="product__body">
      <span class="product__cat">${p.sku}</span>
      <h3 class="product__title"><a href="#" data-open-product="${p.id}">${p.name}</a></h3>
      <div class="product__meta">
        <span class="rating">${ICONS.star} ${p.rating} <small>(${p.reviews})</small></span>
        ${p.variantSummary ? `<span>${p.variantSummary}</span>` : ''}
      </div>
      <div class="product__footer">
        <div class="price">
          <strong>${p.price > 0 ? formatPrice(p.discount && p.discount > 0 ? (p.price * (1 - p.discount/100)) : p.price) : 'حسب الطلب'}</strong>${p.discount && p.discount > 0 ? `<span style="margin-inline-start:.5rem;color:var(--muted);text-decoration:line-through;font-weight:600">${formatPrice(p.price)}</span><span class="badge" style="margin-inline-start:.4rem">خصم ${p.discount}%</span>` : ''}
          <small>${p.unit}</small>
        </div>
        <div class="product__actions">
          <button class="icon-action" data-open-product="${p.id}" aria-label="عرض سريع">${ICONS.eye}</button>
          ${p.price > 0 && !p.soldOut
            ? `<button class="icon-action" data-add-cart="${p.id}" aria-label="أضف إلى السلة">${ICONS.cart}</button>`
            : `<a class="icon-action" href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener" aria-label="استفسر">${ICONS.phone}</a>`}
        </div>
      </div>
    </div>
  </article>`;
}

/* ---------- النماذج ---------- */
function initForms() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    const name = form.elements.name, email = form.elements.email, phone = form.elements.phone, message = form.elements.message;

    validate(name, name.value.trim().length >= 3, 'الرجاء إدخال الاسم (3 أحرف على الأقل)');
    validate(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), 'الرجاء إدخال بريد إلكتروني صحيح');
    validate(phone, phone.value.replace(/\D/g, '').length >= 9, 'الرجاء إدخال رقم جوال صحيح');
    validate(message, message.value.trim().length >= 10, 'أخبرنا بتفاصيل طلبك (10 أحرف على الأقل)');

    function validate(el, ok, msg) {
      const field = el.closest('.field');
      if (!field) return;
      field.classList.toggle('is-invalid', !ok);
      let err = field.querySelector('.field__error');
      if (!err) { err = document.createElement('div'); err.className = 'field__error'; field.appendChild(err); }
      err.textContent = ok ? '' : msg;
      if (!ok) valid = false;
    }

    if (!valid) {
      form.querySelector('.is-invalid input, .is-invalid select, .is-invalid textarea')?.focus();
      return;
    }

    const data = new FormData(form);
    const lines = [
      `الاسم: ${data.get('name')}`,
      `الجوال: ${data.get('phone')}`,
      `البريد: ${data.get('email')}`,
      `نوع الطلب: ${data.get('type')}`,
      `الكمية: ${data.get('qty')}`,
      `الرسالة: ${data.get('message')}`
    ].join('\n');

    const ok = document.getElementById('formSuccess');
    if (ok) {
      ok.classList.add('is-on');
      ok.innerHTML = `${ICONS.checkCircle} شكراً لك ${data.get('name')}! تم استلام طلبك بنجاح، وسيتواصل معك فريقنا خلال 24 ساعة على رقم <b dir="ltr">${data.get('phone')}</b>.`;
    }
    window.open('https://wa.me/' + CONTACT.whatsapp + '?text=' + encodeURIComponent(lines), '_blank');
    form.reset();
    setTimeout(() => ok?.classList.remove('is-on'), 12000);
  });
}

/* ---------- تنبيه صغير ---------- */
let toastTimer;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:90px;inset-inline-start:50%;transform:translateX(50%);background:var(--ink-900);color:#fff;padding:.8rem 1.4rem;border-radius:999px;z-index:300;font-weight:700;font-size:.92rem;box-shadow:var(--shadow-lg);transition:opacity .3s,transform .3s;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  el.style.transform = 'translateX(50%) translateY(0)';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(50%) translateY(10px)';
  }, 2200);
}
