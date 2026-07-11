const express = require('express');
const router = express.Router();
const https = require('https');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, business, city, quantity, interests, message } = req.body;

    // DB mein save karo
    await supabase.from('wholesale_enquiries').insert([{
      name, phone, email, business, city, quantity, interests, message,
      created_at: new Date()
    }]);

    // Email to admin
    const emailData = JSON.stringify({
      sender: { name: 'Sakhi.co Website', email: process.env.EMAIL_FROM },
      to: [{ email: process.env.EMAIL_FROM, name: 'Sakhi Admin' }],
      subject: `🏪 New Wholesale Enquiry from ${name}`,
      htmlContent: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
          <div style="background:#7B1C2E;padding:24px;text-align:center">
            <h1 style="color:#E8B84B;margin:0;font-size:24px">sakhi.co</h1>
            <p style="color:rgba(255,255,255,.8);margin:6px 0 0">New Wholesale Enquiry!</p>
          </div>
          <div style="padding:24px">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px;width:40%">Name</td><td style="padding:8px 0;font-weight:600;color:#5A1220">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Phone</td><td style="padding:8px 0;font-weight:600;color:#5A1220">${phone}</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Email</td><td style="padding:8px 0;color:#5A1220">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Business</td><td style="padding:8px 0;color:#5A1220">${business || 'Not specified'}</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">City</td><td style="padding:8px 0;color:#5A1220">${city}</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Quantity</td><td style="padding:8px 0;font-weight:600;color:#2D8A4E">${quantity} pieces</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Interested In</td><td style="padding:8px 0;color:#5A1220">${interests || 'Not specified'}</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Message</td><td style="padding:8px 0;color:#5A1220">${message || 'No message'}</td></tr>
            </table>
            <div style="margin-top:1.5rem;text-align:center">
              <a href="https://wa.me/91${phone.replace(/[^0-9]/g,'')}"
                style="background:#25D366;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
                💬 Reply on WhatsApp
              </a>
            </div>
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
      const req = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(emailData);
      req.end();
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all enquiries (admin)
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wholesale_enquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ enquiries: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update status (admin)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    await supabase.from('wholesale_enquiries')
      .update({ status }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;