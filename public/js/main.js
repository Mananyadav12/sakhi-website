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

  return `
    <div class="product-card" onclick="location.href='pages/product.html?id=${p.id}'">
      ${imgHTML}
      <div class="product-info">
        <span class="product-badge">New</span>
        <div class="product-name">${p.name}</div>
        <div class="product-type">${p.category}</div>
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

// Run on homepage
document.addEventListener('DOMContentLoaded', loadFeaturedProducts);