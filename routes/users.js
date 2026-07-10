const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const supabase = require('../config/supabase');

// ── Auth Middleware ───────────────────────────────────────
const userAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sakhi_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── Welcome Email via Brevo HTTP API ─────────────────────
const sendWelcomeEmail = async (user) => {
  try {
    const emailData = JSON.stringify({
      sender: { name: 'Sakhi.co', email: process.env.EMAIL_FROM },
      to: [{ email: user.email, name: user.name }],
      subject: `Welcome to Sakhi.co, ${user.name}! 💕`,
      htmlContent: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5ede0;font-family:Inter,Arial,sans-serif">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(123,28,46,0.15)">
  <div style="background:linear-gradient(135deg,#5A1220,#7B1C2E);padding:40px 30px;text-align:center">
    <h1 style="color:#E8B84B;margin:0;font-size:32px;letter-spacing:2px">sakhi.co</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">HANDCRAFTED KURTIS</p>
  </div>
  <div style="background:#E8B84B;padding:18px;text-align:center">
    <p style="margin:0;font-size:20px;font-weight:700;color:#5A1220">Welcome to the Sakhi family! 🎉</p>
  </div>
  <div style="padding:30px">
    <h2 style="color:#5A1220;margin:0 0 12px">Hi ${user.name}! 💕</h2>
    <p style="color:#5C3040;line-height:1.8;margin-bottom:1.5rem">
      We're so happy you joined <strong>Sakhi.co</strong>! Get ready to explore our collection of beautiful handcrafted pure cotton kurtis — made just for you.
    </p>
    <div style="background:#FDF8F2;border-radius:16px;padding:20px;margin-bottom:20px;border:1px solid rgba(201,146,42,0.2)">
      <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9922A;margin:0 0 15px">What you get as a member</p>
      <p style="margin:0 0 8px;color:#5C3040;font-size:14px">✅ &nbsp;Easy order tracking</p>
      <p style="margin:0 0 8px;color:#5C3040;font-size:14px">✅ &nbsp;Order history saved</p>
      <p style="margin:0 0 8px;color:#5C3040;font-size:14px">✅ &nbsp;Faster checkout with saved address</p>
      <p style="margin:0;color:#5C3040;font-size:14px">✅ &nbsp;Exclusive member offers</p>
    </div>
    <div style="text-align:center;margin-bottom:20px">
      <a href="${process.env.FRONTEND_URL}/pages/collections.html"
        style="background:#7B1C2E;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px;display:inline-block">
        Shop Now 👗
      </a>
    </div>
    <div style="background:#7B1C2E;border-radius:14px;padding:20px;text-align:center">
      <p style="color:rgba(255,255,255,.8);margin:0 0 8px;font-size:13px">Use code on your first order</p>
      <p style="color:#E8B84B;font-size:24px;font-weight:700;margin:0;letter-spacing:4px">WELCOME20</p>
      <p style="color:rgba(255,255,255,.6);font-size:12px;margin:8px 0 0">20% off on orders above ₹999</p>
    </div>
  </div>
  <div style="background:#5A1220;padding:25px;text-align:center">
    <p style="color:#E8B84B;font-size:18px;font-weight:700;margin:0 0 8px">sakhi.co</p>
    <p style="color:rgba(255,255,255,.6);font-size:12px;margin:0 0 8px">Craft worn daily. Made for every woman.</p>
    <p style="color:rgba(255,255,255,.4);font-size:11px;margin:0">© 2026 Sakhi.co — Made with ❤️ in India</p>
  </div>
</div>
</body>
</html>`
    });

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(emailData)
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Welcome email sent to:', user.email);
            resolve(data);
          } else {
            console.log('❌ Brevo error:', res.statusCode, data);
            reject(new Error(`Brevo: ${res.statusCode}`));
          }
        });
      });
      req.on('error', reject);
      req.write(emailData);
      req.end();
    });
  } catch (err) {
    console.log('❌ Welcome email error:', err.message);
  }
};

// ── REGISTER ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }

    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'Email already registered!' });

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from('users').insert([{
      name, email, phone, password_hash, created_at: new Date()
    }]).select('id,name,email,phone');

    if (error) throw error;

    const token = jwt.sign(
      { id: data[0].id, email: data[0].email, name: data[0].name },
      process.env.JWT_SECRET || 'sakhi_secret',
      { expiresIn: '30d' }
    );

    // Welcome email
    sendWelcomeEmail(data[0]).catch(err =>
      console.log('Welcome email error:', err.message)
    );

    res.status(201).json({ token, user: data[0], message: 'Account created!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LOGIN ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { data: user } = await supabase
      .from('users').select('*').eq('email', email).single();

    if (!user) return res.status(401).json({ error: 'Email not found!' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Wrong password!' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'sakhi_secret',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, address: user.address,
        city: user.city, state: user.state, pincode: user.pincode
      },
      message: 'Login successful!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET PROFILE ───────────────────────────────────────────
router.get('/profile', userAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id,name,email,phone,address,city,state,pincode,created_at')
      .eq('id', req.user.id).single();
    if (error) throw error;
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── UPDATE PROFILE ────────────────────────────────────────
router.put('/profile', userAuth, async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ name, phone, address, city, state, pincode })
      .eq('id', req.user.id)
      .select('id,name,email,phone,address,city,state,pincode');
    if (error) throw error;
    res.json({ user: data[0], message: 'Profile updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET USER ORDERS ───────────────────────────────────────
router.get('/orders', userAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', req.user.email)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET CART ──────────────────────────────────────────────
router.get('/cart', userAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('user_carts').select('*').eq('user_id', req.user.id).single();
    res.json({ items: data?.items || [] });
  } catch (err) {
    res.json({ items: [] });
  }
});

// ── SAVE CART ─────────────────────────────────────────────
router.post('/cart', userAuth, async (req, res) => {
  try {
    const { items } = req.body;
    const { data: existing } = await supabase
      .from('user_carts').select('id').eq('user_id', req.user.id).single();

    if (existing) {
      await supabase.from('user_carts')
        .update({ items, updated_at: new Date() })
        .eq('user_id', req.user.id);
    } else {
      await supabase.from('user_carts')
        .insert([{ user_id: req.user.id, items, updated_at: new Date() }]);
    }
    res.json({ message: 'Cart saved!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET loyalty points
router.get('/loyalty', userAuth, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('loyalty_points,total_orders')
      .eq('id', req.user.id).single();

    const { data: transactions } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      points: user?.loyalty_points || 0,
      total_orders: user?.total_orders || 0,
      transactions: transactions || [],
      value: Math.floor((user?.loyalty_points || 0) / 10) // ₹1 per 10 points
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.userAuth = userAuth;