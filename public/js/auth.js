// ─── User Auth Functions ───────────────────────────────

function getUser() {
  const u = localStorage.getItem('sakhi_user');
  return u ? JSON.parse(u) : null;
}

function getUserToken() {
  return localStorage.getItem('sakhi_user_token');
}

function saveUser(user, token) {
  localStorage.setItem('sakhi_user', JSON.stringify(user));
  localStorage.setItem('sakhi_user_token', token);
}

function logoutUser() {
  localStorage.removeItem('sakhi_user');
  localStorage.removeItem('sakhi_user_token');
  localStorage.removeItem('sakhi_cart');
  location.href = '/';
}

function isLoggedIn() {
  return !!getUserToken();
}

// Update navbar based on login status
function updateNavAuth() {
  const user = getUser();
  const authBtn = document.getElementById('authBtn');
  if (!authBtn) return;

  if (user) {
    authBtn.innerHTML = `
      <div class="user-menu" id="userMenu">
        <button class="icon-btn user-btn" onclick="toggleUserMenu()">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--maroon);color:white;display:flex;align-items:center;justify-content:center;font-size:.85rem;font-weight:700">
            ${user.name.charAt(0).toUpperCase()}
          </div>
        </button>
        <div class="user-dropdown" id="userDropdown" style="display:none">
          <div style="padding:1rem;border-bottom:1px solid rgba(201,146,42,.15)">
            <p style="font-weight:600;color:var(--maroon-dark);font-size:.9rem">${user.name}</p>
            <p style="color:var(--text-light);font-size:.78rem">${user.email}</p>
          </div>
          <a href="/pages/profile.html" onclick="closeUserMenu()">👤 My Profile</a>
          <a href="/pages/my-orders.html" onclick="closeUserMenu()">📦 My Orders</a>
          <a href="#" onclick="logoutUser()">🚪 Logout</a>
        </div>
      </div>`;
  } else {
    authBtn.innerHTML = `
      <button class="btn btn-primary" onclick="location.href='/pages/login.html'"
        style="padding:8px 18px;font-size:.85rem">
        Login
      </button>`;
  }
}

function toggleUserMenu() {
  const dd = document.getElementById('userDropdown');
  if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

function closeUserMenu() {
  const dd = document.getElementById('userDropdown');
  if (dd) dd.style.display = 'none';
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('userMenu');
  if (menu && !menu.contains(e.target)) closeUserMenu();
});

// Sync cart with server when logged in
async function syncCart() {
  if (!isLoggedIn()) return;
  try {
    const res = await fetch(`${API_URL}/api/users/cart`, {
      headers: { Authorization: `Bearer ${getUserToken()}` }
    });
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const localCart = getCart();
      // Merge server cart with local cart
      const merged = [...localCart];
      data.items.forEach(serverItem => {
        const exists = merged.find(i => i.product_id === serverItem.product_id && i.size === serverItem.size);
        if (!exists) merged.push(serverItem);
      });
      saveCart(merged);
    }
  } catch (err) {
    console.log('Cart sync error:', err.message);
  }
}

// Save cart to server
async function saveCartToServer() {
  if (!isLoggedIn()) return;
  try {
    await fetch(`${API_URL}/api/users/cart`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getUserToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: getCart() })
    });
  } catch (err) {
    console.log('Cart save error:', err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  syncCart();
});
