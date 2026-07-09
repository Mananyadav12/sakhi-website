// Navbar scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Hamburger menu
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }
});

// Newsletter form
async function handleNewsletter(e) {
  e.preventDefault();
  const emailInput = e.target.querySelector('input[type="email"]');
  const email = emailInput.value;

  try {
    const res = await fetch(`${API_URL}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (res.ok) {
      showToast('🎉 Subscribed! Watch your inbox.');
      e.target.reset();
    } else {
      showToast('❌ Mail sending failed.', 'error');
    }
  } catch (err) {
    showToast('❌ Server error.', 'error');
  }
}
// Load featured products on homepage
async function loadFeaturedProducts() {
  const el = document.getElementById('featuredProducts');
  if (!el) return;

  try {
    const res = await fetch(`${API_URL}/api/products`);
    const data = await res.json();
    const products = (data.products || []).slice(0, 8);

    if (products.length === 0) {
      el.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-light)">
          <p style="font-size:3rem">👗</p>
          <p>Products coming soon!</p>
        </div>`;
      return;
    }

    el.innerHTML = products.map(p => productCard(p)).join('');
  } catch (err) {
    el.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-light)">
        <p>Could not load products. Please refresh.</p>
      </div>`;
  }
}

// Product card HTML
function productCard(p) {
  const discount = p.mrp > p.price
    ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
    : 0;

  const imgHTML = p.images && p.images.length > 0
    ? `<img src="${p.images[0]}" alt="${p.name}" class="product-img" loading="lazy"/>`
    : `<div class="product-img-placeholder"><span>👗</span><small>Sakhi.co</small></div>`;

  // Shareable product link
  const productLink = `${window.location.origin}/pages/product.html?id=${p.id}`;

  return `
    <div class="product-card" onclick="location.href='/pages/product.html?id=${p.id}'">
      ${imgHTML}
      <div class="product-info">
        <span class="product-badge">New</span>
        <div class="product-name">${p.name}</div>
        <div class="product-type" style="text-transform:capitalize">${p.category}</div>
        <div class="product-price-row">
          <div style="display:flex;align-items:center;gap:6px">
            <span class="product-price">₹${p.price}</span>
            ${p.mrp ? `<span class="product-mrp">₹${p.mrp}</span>` : ''}
          </div>
          ${discount > 0 ? `<span class="product-discount">${discount}% off</span>` : ''}
        </div>
        <!-- Share Button -->
        <button onclick="event.stopPropagation();shareProduct('${p.id}','${p.name.replace(/'/g,"\\'")}','${productLink}')"
          style="margin-top:.75rem;background:none;border:1px solid rgba(201,146,42,.3);border-radius:8px;padding:6px 12px;cursor:pointer;font-size:.78rem;color:var(--text-mid);display:flex;align-items:center;gap:5px;transition:all .2s;width:100%;justify-content:center"
          onmouseover="this.style.borderColor='var(--maroon)';this.style.color='var(--maroon)'"
          onmouseout="this.style.borderColor='rgba(201,146,42,.3)';this.style.color='var(--text-mid)'">
          🔗 Share this kurti
        </button>
      </div>
    </div>`;
}

// Share product function
function shareProduct(id, name, link) {
  if (navigator.share) {
    // Native share on mobile
    navigator.share({
      title: `${name} – Sakhi.co`,
      text: `Check out this beautiful kurti from Sakhi.co! 👗`,
      url: link
    }).catch(() => copyToClipboard(link));
  } else {
    // Copy to clipboard on desktop
    copyToClipboard(link);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('🔗 Link copied! Share it with your friends.');
  }).catch(() => {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('🔗 Link copied!');
  });
}
function productCard(p) {
  const discount = p.mrp > p.price
    ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
    : 0;

  const imgHTML = p.images && p.images.length > 0
    ? `<img src="${p.images[0]}" alt="${p.name}" class="product-img" loading="lazy"/>`
    : `<div class="product-img-placeholder"><span>👗</span><small>Sakhi.co</small></div>`;

  const productLink = `${window.location.origin}/pages/product.html?id=${p.id}`;
  const wishlist = getWishlist();
  const isWished = wishlist.some(w => w.id === p.id);

  return `
    <div class="product-card" onclick="location.href='/pages/product.html?id=${p.id}'">
      <!-- Wishlist + Share buttons on image -->
      <div style="position:relative">
        ${imgHTML}
        <div style="position:absolute;top:10px;right:10px;display:flex;flex-direction:column;gap:6px">
          <!-- Wishlist Heart -->
          <button onclick="event.stopPropagation();toggleWishlist('${p.id}','${p.name.replace(/'/g,"\\'")}','${p.price}','${p.images?.[0]||''}',this)"
            style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.95);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.1rem;box-shadow:0 2px 8px rgba(0,0,0,.15);transition:transform .2s"
            onmouseover="this.style.transform='scale(1.1)'"
            onmouseout="this.style.transform='scale(1)'"
            id="wish-${p.id}">
            ${isWished ? '❤️' : '🤍'}
          </button>
          <!-- Share -->
          <button onclick="event.stopPropagation();shareProduct('${p.id}','${p.name.replace(/'/g,"\\'")}','${productLink}')"
            style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.95);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1rem;box-shadow:0 2px 8px rgba(0,0,0,.15);transition:transform .2s"
            onmouseover="this.style.transform='scale(1.1)'"
            onmouseout="this.style.transform='scale(1)'">
            🔗
          </button>
        </div>
      </div>
      <div class="product-info">
        <span class="product-badge">New</span>
        <div class="product-name">${p.name}</div>
        <div class="product-type" style="text-transform:capitalize">${p.category}</div>
        <div class="product-price-row">
          <div style="display:flex;align-items:center;gap:6px">
            <span class="product-price">₹${p.price}</span>
            ${p.mrp ? `<span class="product-mrp">₹${p.mrp}</span>` : ''}
          </div>
          ${discount > 0 ? `<span class="product-discount">${discount}% off</span>` : ''}
        </div>
      </div>
    </div>`;
}

// Share function
function shareProduct(id, name, link) {
  if (navigator.share) {
    navigator.share({
      title: `${name} – Sakhi.co`,
      text: `Check out this beautiful kurti from Sakhi.co! 👗`,
      url: link
    }).catch(() => copyToClipboard(link));
  } else {
    copyToClipboard(link);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('🔗 Link copied! Share with your friends.');
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('🔗 Link copied!');
  });
}

// Run on homepage
document.addEventListener('DOMContentLoaded', loadFeaturedProducts);