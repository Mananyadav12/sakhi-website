const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// GET reviews for a product
router.get('/:productId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', req.params.productId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const avg = data.length > 0
      ? (data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1)
      : 0;

    res.json({ reviews: data || [], average: avg, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add review
router.post('/', async (req, res) => {
  try {
    const { product_id, user_name, user_email, rating, review } = req.body;
    if (!product_id || !user_name || !rating) {
      return res.status(400).json({ error: 'Name and rating required!' });
    }
    const { data, error } = await supabase.from('reviews').insert([{
      product_id, user_name, user_email,
      rating: parseInt(rating), review,
      created_at: new Date()
    }]).select();
    if (error) throw error;
    res.status(201).json({ message: 'Review added! Thank you 💕', review: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE review (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await supabase.from('reviews').delete().eq('id', req.params.id);
    res.json({ message: 'Review deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;