const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Apply coupon
router.post('/apply', async (req, res) => {
  try {
    const { code, order_amount } = req.body;
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Invalid coupon code!' });
    if (data.used_count >= data.max_uses) return res.status(400).json({ error: 'Coupon limit reached!' });
    if (data.expires_at && new Date(data.expires_at) < new Date()) return res.status(400).json({ error: 'Coupon expired!' });
    if (order_amount < data.min_order) return res.status(400).json({ error: `Minimum order ₹${data.min_order} required!` });

    let discount = 0;
    if (data.discount_percent > 0) discount = Math.round(order_amount * data.discount_percent / 100);
    else if (data.discount_amount > 0) discount = data.discount_amount;

    res.json({
      valid: true,
      discount,
      coupon: { code: data.code, discount_percent: data.discount_percent, discount_amount: data.discount_amount },
      message: `🎉 Coupon applied! You save ₹${discount}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all coupons (admin)
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ coupons: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create coupon (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { code, discount_percent, discount_amount, min_order, max_uses, expires_at } = req.body;
    const { data, error } = await supabase.from('coupons').insert([{
      code: code.toUpperCase(),
      discount_percent: parseInt(discount_percent) || 0,
      discount_amount: parseInt(discount_amount) || 0,
      min_order: parseInt(min_order) || 0,
      max_uses: parseInt(max_uses) || 100,
      expires_at: expires_at || null,
      active: true
    }]).select();
    if (error) throw error;
    res.status(201).json({ message: 'Coupon created!', coupon: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE coupon (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await supabase.from('coupons').update({ active: false }).eq('id', req.params.id);
    res.json({ message: 'Coupon deactivated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;