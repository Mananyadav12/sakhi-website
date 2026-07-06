const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

router.get('/:trackingId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('order_number,tracking_id,status,payment_status,customer_name,items,total_amount,created_at,city,state')
      .eq('tracking_id', req.params.trackingId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Order not found!' });
    }

    res.json({ order: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;