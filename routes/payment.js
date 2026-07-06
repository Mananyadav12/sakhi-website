const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { sendConfirmationEmail } = require('./orders');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder'
});

// Create payment order
router.post('/create-order', async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: orderId
    };
    const order = await razorpay.orders.create(options);
    res.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify payment
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder')
      .update(body).digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification failed!' });
    }

    const { data, error } = await supabase.from('orders').update({
      payment_status: 'paid',
      payment_id: razorpay_payment_id,
      status: 'confirmed',
      updated_at: new Date()
    }).eq('id', orderId).select();

    if (error) throw error;

    if (data[0]) sendConfirmationEmail(data[0]).catch(console.error);

    res.json({ success: true, message: 'Payment confirmed! Order placed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;