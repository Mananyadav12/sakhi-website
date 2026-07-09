// Cart functions - sab pages pe kaam karta hai

function getCart() {
  return JSON.parse(localStorage.getItem('sakhi_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('sakhi_cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, size, qty = 1) {
  if (!size) {
    showToast('Please select a size!', 'error');
    return;
  }
  const cart = getCart();
  const existing = cart.find(i => i.product_id === product.id && i.size === size);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || '',
      size,
      quantity: qty
    });
  }
  saveCart(cart);
  showToast('Added to cart! 🛍️');
}

function removeFromCart(productId, size) {
  const cart = getCart().filter(i => !(i.product_id === productId && i.size === size));
  saveCart(cart);
}

function updateQty(productId, size, qty) {
  const cart = getCart();
  const item = cart.find(i => i.product_id === productId && i.size === size);
  if (item) {
    item.quantity = qty;
    if (item.quantity <= 0) removeFromCart(productId, size);
    else saveCart(cart);
  }
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

function updateCartBadge() {
  const count = cartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function showToast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 2800);
}
// ── WISHLIST ──────────────────────────────────────────────

function getWishlist() {
  return JSON.parse(localStorage.getItem('sakhi_wishlist') || '[]');
}

function saveWishlist(list) {
  localStorage.setItem('sakhi_wishlist', JSON.stringify(list));
  updateWishlistBadge();
}

function toggleWishlist(id, name, price, image, btn) {
  const wishlist = getWishlist();
  const exists = wishlist.findIndex(w => w.id === id);

  if (exists !== -1) {
    wishlist.splice(exists, 1);
    if (btn) btn.innerHTML = '🤍';
    showToast('Removed from wishlist');
  } else {
    wishlist.push({ id, name, price, image });
    if (btn) btn.innerHTML = '❤️';
    showToast('Added to wishlist ❤️');
  }
  saveWishlist(wishlist);
}

function updateWishlistBadge() {
  const count = getWishlist().length;
  document.querySelectorAll('.wishlist-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function isWishlisted(id) {
  return getWishlist().some(w => w.id === id);
}

document.addEventListener('DOMContentLoaded', updateCartBadge);