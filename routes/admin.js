const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

// Admin login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid credentials!' });
  }

  const token = jwt.sign(
    { username, role: 'admin' },
    process.env.JWT_SECRET || 'sakhi_secret',
    { expiresIn: '7d' }
  );

  res.json({ token, message: 'Login successful!' });
});

// Dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const { count: totalOrders } = await supabase
      .from('orders').select('*', { count: 'exact', head: true });

    const { count: totalProducts } = await supabase
      .from('products').select('*', { count: 'exact', head: true }).eq('active', true);

    const { data: paidOrders } = await supabase
      .from('orders').select('total_amount').eq('payment_status', 'paid');

    const revenue = paidOrders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;

    const { data: recentOrders } = await supabase
      .from('orders').select('*')
      .order('created_at', { ascending: false }).limit(5);

    res.json({ totalOrders, totalProducts, revenue, recentOrders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;