const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

// Middleware — user auth check
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

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }

    // Check existing user
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ error: 'Email already registered!' });

    // Hash password
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

    res.status(201).json({ token, user: data[0], message: 'Account created!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
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
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, city: user.city, state: user.state, pincode: user.pincode },
      message: 'Login successful!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET profile
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

// UPDATE profile
router.put('/profile', userAuth, async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ name, phone, address, city, state, pincode })
      .eq('id', req.user.id).select('id,name,email,phone,address,city,state,pincode');
    if (error) throw error;
    res.json({ user: data[0], message: 'Profile updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user orders
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

// GET cart
router.get('/cart', userAuth, async (req, res) => {
  try {
    const { data } = await supabase
      .from('user_carts').select('*').eq('user_id', req.user.id).single();
    res.json({ items: data?.items || [] });
  } catch (err) {
    res.json({ items: [] });
  }
});

// SAVE cart
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

module.exports = router;
module.exports.userAuth = userAuth;