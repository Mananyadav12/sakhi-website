// ── FESTIVAL MODE ─────────────────────────────────────────

const FESTIVALS = {
  raksha_bandhan: {
    active: true, // true = on, false = off
    name: 'Raksha Bandhan Special',
    emoji: '🎀',
    colors: {
      primary: '#D4006A',    // Pink
      secondary: '#FF6B9D',
      accent: '#FFD700',
      bg: '#FFF0F7'
    },
    banner: {
      text: '🎀 Raksha Bandhan Special Sale',
      subtext: 'Gift your sister a beautiful Sakhi kurti!',
      cta: 'Shop Gifts →',
      discount: 'Use code RAKHI20 for 20% off',
      endDate: '2026-08-25' // Sale end date
    },
    confetti: true
  },

  diwali: {
    active: false,
    name: 'Diwali Dhamaka',
    emoji: '🪔',
    colors: {
      primary: '#B8500A',
      secondary: '#FFB300',
      accent: '#FF6B00',
      bg: '#FFF8E8'
    },
    banner: {
      text: '🪔 Diwali Dhamaka Sale',
      subtext: 'Celebrate in style with Sakhi kurtis!',
      cta: 'Shop Now →',
      discount: 'Use code DIWALI25 for 25% off',
      endDate: '2026-10-25'
    },
    confetti: true
  },

  navratri: {
    active: false,
    name: 'Navratri Collection',
    emoji: '🏮',
    colors: {
      primary: '#C2185B',
      secondary: '#E91E8C',
      accent: '#FFD700',
      bg: '#FFF0F5'
    },
    banner: {
      text: '🏮 Navratri Special Collection',
      subtext: 'Dance in our vibrant handcrafted kurtis!',
      cta: 'View Collection →',
      discount: 'Use code GARBA15 for 15% off',
      endDate: '2026-10-12'
    },
    confetti: false
  }
};

// Active festival check
function getActiveFestival() {
  for (const [key, val] of Object.entries(FESTIVALS)) {
    if (val.active) {
      // Check if sale ended
      if (val.banner.endDate && new Date(val.banner.endDate) < new Date()) {
        continue;
      }
      return val;
    }
  }
  return null;
}

// Countdown timer
function getCountdown(endDate) {
  const diff = new Date(endDate) - new Date();
  if (diff <= 0) return 'Sale ended';
  const days = Math.floor(diff / (1000*60*60*24));
  const hrs = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
  const mins = Math.floor((diff % (1000*60*60)) / (1000*60));
  const secs = Math.floor((diff % (1000*60)) / 1000);
  return `${days}d ${hrs}h ${mins}m ${secs}s`;
}

// Confetti
function launchConfetti() {
  const colors = ['#D4006A','#FF6B9D','#FFD700','#7B1C2E','#C9922A'];
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.style.cssText = `
        position:fixed;
        top:-10px;
        left:${Math.random()*100}vw;
        width:${6+Math.random()*8}px;
        height:${6+Math.random()*8}px;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        z-index:9999;
        pointer-events:none;
        animation:confettiFall ${2+Math.random()*3}s linear forwards;
        transform:rotate(${Math.random()*360}deg);
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }, i * 50);
  }
}

// Apply festival
function applyFestival() {
  const fest = getActiveFestival();
  if (!fest) return;

  // Inject CSS
  const style = document.createElement('style');
  style.id = 'festivalStyles';
  style.textContent = `
    @keyframes confettiFall {
      to { transform: translateY(105vh) rotate(720deg); opacity: 0; }
    }
    @keyframes bannerPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .85; }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .festival-banner {
      background: linear-gradient(135deg, ${fest.colors.primary}, ${fest.colors.secondary});
      color: #fff;
      text-align: center;
      padding: .75rem 1rem;
      position: relative;
      z-index: 200;
      animation: bannerPulse 3s ease infinite;
    }
    .festival-banner .fest-text {
      font-size: .95rem;
      font-weight: 700;
      margin-bottom: .2rem;
    }
    .festival-banner .fest-sub {
      font-size: .78rem;
      opacity: .9;
    }
    .festival-banner .fest-discount {
      display: inline-block;
      background: rgba(255,255,255,.25);
      border: 1px solid rgba(255,255,255,.4);
      border-radius: 20px;
      padding: 3px 14px;
      font-size: .78rem;
      font-weight: 700;
      margin-top: .4rem;
      letter-spacing: .5px;
    }
    .festival-countdown {
      font-size: .72rem;
      opacity: .8;
      margin-top: .3rem;
    }
    .festival-hero-badge {
      display: inline-block;
      background: linear-gradient(135deg, ${fest.colors.primary}, ${fest.colors.accent});
      color: #fff;
      padding: 8px 20px;
      border-radius: 30px;
      font-size: .85rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
      animation: bannerPulse 2s ease infinite;
    }
    .festival-close {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,.2);
      border: none;
      color: #fff;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: .9rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    /* Navbar festival dot */
    .navbar::after {
      content: '${fest.emoji} ${fest.name}';
      display: block;
      background: ${fest.colors.bg};
      color: ${fest.colors.primary};
      font-size: .72rem;
      font-weight: 700;
      text-align: center;
      padding: 4px;
      letter-spacing: .5px;
    }
  `;
  document.head.appendChild(style);

  // Top banner
  const banner = document.createElement('div');
  banner.className = 'festival-banner';
  banner.id = 'festivalBanner';
  banner.innerHTML = `
    <button class="festival-close" onclick="closeFestivalBanner()" title="Close">×</button>
    <div class="fest-text">${fest.emoji} ${fest.banner.text}</div>
    <div class="fest-sub">${fest.banner.subtext}</div>
    <div class="fest-discount">${fest.banner.discount}</div>
    ${fest.banner.endDate ? `<div class="festival-countdown" id="festCountdown">⏰ Ends in: ${getCountdown(fest.banner.endDate)}</div>` : ''}
  `;
  document.body.insertBefore(banner, document.body.firstChild);

  // Countdown update
  if (fest.banner.endDate) {
    setInterval(() => {
      const cd = document.getElementById('festCountdown');
      if (cd) cd.textContent = `⏰ Ends in: ${getCountdown(fest.banner.endDate)}`;
    }, 1000);
  }

  // Hero badge inject
  setTimeout(() => {
    const heroEyebrow = document.querySelector('.hero-eyebrow');
    if (heroEyebrow) {
      const badge = document.createElement('div');
      badge.className = 'festival-hero-badge';
      badge.textContent = `${fest.emoji} ${fest.name}`;
      heroEyebrow.parentNode.insertBefore(badge, heroEyebrow);
    }
  }, 100);

  // Confetti on load
  if (fest.confetti) {
    setTimeout(launchConfetti, 800);
  }

  // Save dismissed state
  const dismissed = sessionStorage.getItem('festBannerClosed');
  if (dismissed) {
    const banner = document.getElementById('festivalBanner');
    if (banner) banner.style.display = 'none';
  }
}

function closeFestivalBanner() {
  const banner = document.getElementById('festivalBanner');
  if (banner) {
    banner.style.height = banner.offsetHeight + 'px';
    banner.style.transition = 'all .3s ease';
    banner.style.overflow = 'hidden';
    setTimeout(() => {
      banner.style.height = '0';
      banner.style.padding = '0';
    }, 10);
    setTimeout(() => banner.remove(), 300);
  }
  sessionStorage.setItem('festBannerClosed', 'true');
}

// Auto apply on load
document.addEventListener('DOMContentLoaded', applyFestival);