const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const https = require('https');

// Brevo HTTP API — no SMTP ports needed
const sendConfirmationEmail = async (order) => {
  try {
    const itemsHTML = order.items.map(i =>
      `<tr>
        <td style="padding:12px;border-bottom:1px solid #f0e8ee">
          <strong>${i.name}</strong>
          <p style="font-size:12px;color:#9B6070;margin:4px 0 0">Size: ${i.size}</p>
        </td>
        <td style="padding:12px;border-bottom:1px solid #f0e8ee;text-align:center">${i.quantity}</td>
        <td style="padding:12px;border-bottom:1px solid #f0e8ee;text-align:right">₹${i.price * i.quantity}</td>
      </tr>`
    ).join('');

    const emailData = JSON.stringify({
      sender: { name: 'Sakhi.co', email: process.env.EMAIL_FROM },
      to: [{ email: order.customer_email, name: order.customer_name }],
      subject: `🎉 Order Confirmed! #${order.order_number} – Sakhi.co`,
      htmlContent: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5ede0;font-family:Inter,Arial,sans-serif">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(123,28,46,0.15)">
  <div style="background:linear-gradient(135deg,#5A1220,#7B1C2E);padding:40px 30px;text-align:center">
    <h1 style="color:#E8B84B;margin:0;font-size:32px;letter-spacing:2px">sakhi.co</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;letter-spacing:1px">HANDCRAFTED KURTIS</p>
  </div>
  <div style="background:#E8B84B;padding:18px;text-align:center">
    <p style="margin:0;font-size:20px;font-weight:700;color:#5A1220">🎉 Order Confirmed!</p>
  </div>
  <div style="padding:30px 30px 0">
    <h2 style="color:#5A1220;margin:0 0 10px;font-size:22px">Hi ${order.customer_name}!</h2>
    <p style="color:#5C3040;line-height:1.7;margin:0">
      Thank you for shopping with <strong>Sakhi.co</strong> 💕 Your order is confirmed and our team is working on it.
      We will ship your beautiful kurti within <strong>2-3 business days</strong>.
    </p>
  </div>
  <div style="margin:25px 30px;background:#FDF8F2;border-radius:16px;padding:20px;border:1px solid rgba(201,146,42,0.2)">
    <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9922A;margin:0 0 15px">Order Details</p>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#9B6070;font-size:14px">Order Number</td><td style="padding:6px 0;font-weight:700;color:#5A1220;text-align:right">#${order.order_number}</td></tr>
      <tr><td style="padding:6px 0;color:#9B6070;font-size:14px">Tracking ID</td><td style="padding:6px 0;font-weight:700;color:#7B1C2E;text-align:right">${order.tracking_id}</td></tr>
      <tr><td style="padding:6px 0;color:#9B6070;font-size:14px">Payment</td>
        <td style="padding:6px 0;font-weight:700;color:#2D8A4E;text-align:right">
          ${order.payment_method && order.payment_method.toLowerCase() === 'cod' ? '💵 Cash on Delivery' : '✅ Online Payment'}
        </td>
      </tr>
      <tr><td style="padding:6px 0;color:#9B6070;font-size:14px">Delivery</td>
        <td style="padding:6px 0;font-weight:700;color:#5A1220;text-align:right">
          ${order.delivery_type === 'express' ? '⚡ Express (2-3 days)' : '📦 Standard (5-7 days)'}
        </td>
      </tr>
      <tr><td style="padding:6px 0;color:#9B6070;font-size:14px">Order Date</td>
        <td style="padding:6px 0;font-weight:600;color:#5A1220;text-align:right">
          ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
        </td>
      </tr>
    </table>
  </div>
  <div style="margin:0 30px">
    <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9922A;margin:0 0 12px">Your Items</p>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f5ede0">
        <th style="padding:12px;text-align:left;font-size:12px;color:#5C3040">Product</th>
        <th style="padding:12px;text-align:center;font-size:12px;color:#5C3040">Qty</th>
        <th style="padding:12px;text-align:right;font-size:12px;color:#5C3040">Price</th>
      </tr></thead>
      <tbody>${itemsHTML}</tbody>
    </table>
    <div style="text-align:right;padding:15px 0;border-top:2px solid #7B1C2E;margin-top:5px">
      <span style="font-size:18px;font-weight:700;color:#7B1C2E">Total: ₹${order.total_amount}</span>
    </div>
  </div>
  <div style="margin:0 30px 25px;background:#FDF8F2;border-radius:16px;padding:20px;border:1px solid rgba(201,146,42,0.2)">
    <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9922A;margin:0 0 12px">📍 Delivery Address</p>
    <p style="margin:0;color:#5C3040;line-height:1.7">
      <strong>${order.customer_name}</strong><br/>
      ${order.address}<br/>
      ${order.city}, ${order.state} – ${order.pincode}<br/>
      📱 ${order.customer_phone}
    </p>
  </div>
  <div style="margin:0 30px 25px;background:#7B1C2E;border-radius:16px;padding:20px;text-align:center">
    <p style="color:rgba(255,255,255,0.8);margin:0 0 8px;font-size:14px">Track your order anytime using</p>
    <p style="color:#E8B84B;font-size:22px;font-weight:700;margin:0;letter-spacing:2px">${order.tracking_id}</p>
  </div>
  <div style="margin:0 30px 25px">
    <p style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9922A;margin:0 0 15px">What Happens Next?</p>
    <div style="padding:12px;background:#f5ede0;border-radius:10px;margin-bottom:10px">
      <p style="margin:0;font-weight:600;color:#5A1220;font-size:14px">📦 Order Processing</p>
      <p style="margin:0;color:#9B6070;font-size:12px">We are preparing your kurti with love</p>
    </div>
    <div style="padding:12px;background:#f5ede0;border-radius:10px;margin-bottom:10px">
      <p style="margin:0;font-weight:600;color:#5A1220;font-size:14px">🚚 Shipping</p>
      <p style="margin:0;color:#9B6070;font-size:12px">You will get an email when your order is shipped</p>
    </div>
    <div style="padding:12px;background:#f5ede0;border-radius:10px">
      <p style="margin:0;font-weight:600;color:#5A1220;font-size:14px">🎉 Delivery</p>
      <p style="margin:0;color:#9B6070;font-size:12px">Enjoy your beautiful Sakhi kurti!</p>
    </div>
  </div>
  <div style="margin:0 30px 25px;padding:20px;border:1px solid rgba(201,146,42,0.2);border-radius:16px;text-align:center">
    <p style="color:#5C3040;margin:0 0 8px;font-size:14px">Need help with your order?</p>
    <p style="margin:0">
      📧 <a href="mailto:kajalbharti2605@gmail.com" style="color:#7B1C2E;font-weight:600">kajalbharti2605@gmail.com</a>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      📱 <a href="https://wa.me/919302988402" style="color:#7B1C2E;font-weight:600">WhatsApp Us</a>
    </p>
  </div>
  <div style="background:#5A1220;padding:25px;text-align:center">
    <p style="color:#E8B84B;font-size:18px;font-weight:700;margin:0 0 8px">sakhi.co</p>
    <p style="color:rgba(255,255,255,0.6);font-size:12px;margin:0 0 12px">Craft worn daily. Made for every woman.</p>
    <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0">© 2026 Sakhi.co — Made with ❤️ in India<br/>Indore, Madhya Pradesh, India</p>
  </div>
</div>
</body>
</html>`
    });

    // Brevo HTTP API call — no SMTP ports!
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
            console.log('✅ Email sent to:', order.customer_email);
            resolve(data);
          } else {
            console.log('❌ Brevo error:', res.statusCode, data);
            reject(new Error(`Brevo: ${res.statusCode} - ${data}`));
          }
        });
      });
      req.on('error', reject);
      req.write(emailData);
      req.end();
    });

  } catch (err) {
    console.log('❌ Email error:', err.message);
  }
};
// Loyalty points deduct karo if used
if (req.body.loyalty_points_used && req.body.loyalty_points_used > 0) {
  const { data: user } = await supabase
    .from('users')
    .select('id,loyalty_points')
    .eq('email', customer_email)
    .single();

  if (user) {
    const newPoints = Math.max(0, user.loyalty_points - req.body.loyalty_points_used);
    await supabase.from('users').update({ loyalty_points: newPoints }).eq('id', user.id);

    await supabase.from('loyalty_transactions').insert([{
      user_id: user.id,
      points: -req.body.loyalty_points_used,
      type: 'redeemed',
      description: `Redeemed for Order #${order_number}`,
      created_at: new Date()
    }]);
  }
}

// Earn points on this order
if (exact_method !== 'cod') {
  // Online payment ke baad earn (cod ke liye payment.js mein hoga)
} else {
  addLoyaltyPoints(customer_email, total_amount, order_number).catch(console.error);
}
// Status update email via Brevo API
const sendStatusEmail = async (order, status) => {
  try {
    const msg = status === 'shipped' ? '🚚 Your order has been shipped!' : '🎉 Order delivered!';
    const emailData = JSON.stringify({
      sender: { name: 'Sakhi.co', email: process.env.EMAIL_FROM },
      to: [{ email: order.customer_email, name: order.customer_name }],
      subject: `${msg} Order #${order.order_number} – Sakhi.co`,
      htmlContent: `
      <div style="max-width:500px;margin:0 auto;font-family:Inter,sans-serif">
        <div style="background:linear-gradient(135deg,#5A1220,#7B1C2E);padding:30px;text-align:center;border-radius:16px 16px 0 0">
          <h1 style="color:#E8B84B;margin:0;font-size:24px">sakhi.co</h1>
        </div>
        <div style="padding:30px;background:#fff">
          <h2 style="color:#7B1C2E">${msg}</h2>
          <p style="color:#5C3040">Hi <strong>${order.customer_name}</strong>,</p>
          <p style="color:#5C3040">Your order <strong>#${order.order_number}</strong> is now <strong>${status}</strong>.</p>
          <div style="background:#FDF8F2;border-radius:12px;padding:16px;margin:16px 0">
            <p style="margin:0;color:#5C3040">Tracking ID: <strong style="color:#7B1C2E">${order.tracking_id}</strong></p>
          </div>
          <p style="color:#9B6070;font-size:14px">— Team Sakhi.co ❤️</p>
        </div>
        <div style="background:#5A1220;padding:16px;text-align:center;border-radius:0 0 16px 16px">
          <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0">© 2026 Sakhi.co — Made with ❤️ in India</p>
        </div>
      </div>`
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
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error(`Brevo: ${res.statusCode}`));
        });
      });
      req.on('error', reject);
      req.write(emailData);
      req.end();
    });

    console.log('✅ Status email sent to:', order.customer_email);
  } catch (err) {
    console.log('❌ Status email error:', err.message);
  }
};
// Add loyalty points after order
async function addLoyaltyPoints(userEmail, orderAmount, orderId) {
  try {
    const points = Math.floor(orderAmount / 10); // ₹10 = 1 point
    const { data: user } = await supabase
      .from('users').select('id,loyalty_points,total_orders')
      .eq('email', userEmail).single();

    if (user) {
      await supabase.from('users').update({
        loyalty_points: (user.loyalty_points || 0) + points,
        total_orders: (user.total_orders || 0) + 1
      }).eq('id', user.id);

      await supabase.from('loyalty_transactions').insert([{
        user_id: user.id,
        points,
        type: 'earned',
        description: `Order #${orderId} — ₹${orderAmount}`,
        created_at: new Date()
      }]);

      console.log(`✅ ${points} points added to ${userEmail}`);
    }
  } catch(err) {
    console.log('Loyalty points error:', err.message);
  }
}
// POST create order
router.post('/', async (req, res) => {
  try {
    const {
      customer_name, customer_email, customer_phone,
      address, city, state, pincode, items, total_amount,
      payment_method
    } = req.body;

    const order_number = 'SKH' + Date.now().toString().slice(-8);
    const tracking_id = 'SKHI' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const exact_method = payment_method ? payment_method.toLowerCase() : 'online';

    const { data, error } = await supabase.from('orders').insert([{
      order_number, tracking_id,
      customer_name, customer_email, customer_phone,
      address, city, state, pincode,
      items: typeof items === 'string' ? JSON.parse(items) : items,
      total_amount: parseFloat(total_amount),
      status: 'pending',
      payment_method: exact_method,
      payment_status: exact_method === 'cod' ? 'cod' : 'pending'
    }]).select();

    if (error) throw error;

    // Sirf COD pe yahan email bhejo
    // Online payment email payment/verify route se jaati hai
    if (exact_method === 'cod') {
      sendConfirmationEmail(data[0]).catch(err =>
        console.log('Email error:', err.message)
      );
    }
    if (exact_method === 'cod') {
  sendConfirmationEmail(data[0]).catch(err => console.log('Email error:', err.message));
  addLoyaltyPoints(customer_email, total_amount, order_number).catch(console.error);
}

    res.status(201).json({
      success: true,
      order: data[0],
      orderId: data[0].id,
      order_number,
      tracking_id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET all orders (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update order status (admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date() })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    const order = data[0];
    if (order && ['shipped', 'delivered'].includes(status)) {
      sendStatusEmail(order, status).catch(err =>
        console.log('Status email error:', err.message)
      );
    }

    res.json({ message: 'Status updated!', order: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Cancel order by user
router.put('/:id/cancel', async (req, res) => {
  try {
    const { tracking_id, reason } = req.body;

    // Verify order belongs to user via tracking_id
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .eq('tracking_id', tracking_id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found!' });
    }

    // Only pending/confirmed orders can be cancelled
    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        error: `Cannot cancel order — already ${order.status}!`
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || 'Cancelled by customer',
        cancelled_at: new Date(),
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;

    // Send cancellation email
    const cancelEmailData = JSON.stringify({
      sender: { name: 'Sakhi.co', email: process.env.EMAIL_FROM },
      to: [{ email: order.customer_email, name: order.customer_name }],
      subject: `Order Cancelled #${order.order_number} – Sakhi.co`,
      htmlContent: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#7B1C2E;padding:30px;text-align:center;border-radius:16px 16px 0 0">
            <h1 style="color:#E8B84B;margin:0">sakhi.co</h1>
          </div>
          <div style="padding:30px;background:#fff">
            <h2 style="color:#5A1220">Order Cancelled</h2>
            <p style="color:#5C3040">Hi ${order.customer_name}, your order <strong>#${order.order_number}</strong> has been cancelled.</p>
            ${order.payment_status === 'paid' ? `
            <div style="background:#FDF8F2;border-radius:12px;padding:16px;margin:16px 0;border:1px solid rgba(201,146,42,.2)">
              <p style="color:#5C3040;margin:0"><strong>Refund:</strong> ₹${order.total_amount} will be refunded within 5-7 business days.</p>
            </div>` : ''}
            <p style="color:#9B6070">Reason: ${reason || 'Cancelled by customer'}</p>
            <p style="color:#9B6070">Need help? Contact us at <a href="mailto:${process.env.EMAIL_FROM}" style="color:#7B1C2E">${process.env.EMAIL_FROM}</a></p>
          </div>
          <div style="background:#5A1220;padding:16px;text-align:center;border-radius:0 0 16px 16px">
            <p style="color:rgba(255,255,255,.5);font-size:12px;margin:0">© 2026 Sakhi.co</p>
          </div>
        </div>`
    });

    const https = require('https');
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(cancelEmailData)
      }
    };

    const reqEmail = https.request(options, () => {});
    reqEmail.on('error', console.error);
    reqEmail.write(cancelEmailData);
    reqEmail.end();

    res.json({ success: true, message: 'Order cancelled!', order: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.sendConfirmationEmail = sendConfirmationEmail;