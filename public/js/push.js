// ── WEB PUSH NOTIFICATIONS ────────────────────────────────

async function requestPushPermission() {
  if (!('Notification' in window)) {
    console.log('Push not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    showToast('✅ Notifications already enabled!');
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    showToast('🔔 Notifications enabled!');
    localStorage.setItem('sakhi_push', 'enabled');
    updatePushBtn();
  } else {
    showToast('Notifications blocked. Enable from browser settings.', 'error');
  }
}

function sendLocalNotification(title, body, icon = '/images/logo.jpeg') {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon,
      badge: '/images/logo.jpeg',
      tag: 'sakhi-notification'
    });
  }
}

function updatePushBtn() {
  const btn = document.getElementById('pushNotifBtn');
  if (!btn) return;
  const enabled = localStorage.getItem('sakhi_push') === 'enabled';
  btn.textContent = enabled ? '🔔 Notifications ON' : '🔕 Enable Notifications';
  btn.style.background = enabled ? 'var(--gold)' : 'none';
  btn.style.color = enabled ? '#fff' : 'var(--text-mid)';
}

// Auto show push prompt after 30 seconds
setTimeout(() => {
  if (Notification.permission === 'default') {
    const banner = document.createElement('div');
    banner.id = 'pushBanner';
    banner.style.cssText = `
      position:fixed;bottom:5rem;left:1rem;right:1rem;max-width:400px;margin:0 auto;
      background:var(--white);border-radius:16px;padding:1.25rem 1.5rem;
      box-shadow:var(--shadow-lg);border:1px solid rgba(201,146,42,.2);
      z-index:500;display:flex;align-items:center;gap:1rem`;
    banner.innerHTML = `
      <span style="font-size:1.5rem;flex-shrink:0">🔔</span>
      <div style="flex:1">
        <p style="font-weight:600;color:var(--maroon-dark);margin:0 0 3px;font-size:.9rem">Stay Updated!</p>
        <p style="color:var(--text-light);font-size:.78rem;margin:0">Get notified about new arrivals & offers</p>
      </div>
      <div style="display:flex;gap:.5rem;flex-shrink:0">
        <button onclick="requestPushPermission();document.getElementById('pushBanner')?.remove()"
          class="btn btn-primary" style="padding:7px 14px;font-size:.78rem;white-space:nowrap">
          Allow
        </button>
        <button onclick="document.getElementById('pushBanner')?.remove()"
          style="background:none;border:none;cursor:pointer;color:var(--text-light);font-size:1.2rem;padding:0">
          &times;
        </button>
      </div>`;
    document.body.appendChild(banner);
    setTimeout(() => banner?.remove(), 10000);
  }
}, 30000);

document.addEventListener('DOMContentLoaded', updatePushBtn);
