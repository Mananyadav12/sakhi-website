const express = require('express');
const router = express.Router();
const https = require('https');

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, business, city, quantity, interests, message } = req.body;

    // Email to admin via Brevo
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
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Email</td><td style="padding:8px 0;font-weight:600;color:#5A1220">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Business</td><td style="padding:8px 0;color:#5A1220">${business || 'Not specified'}</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">City</td><td style="padding:8px 0;color:#5A1220">${city}</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Quantity</td><td style="padding:8px 0;font-weight:600;color:#2D8A4E">${quantity} pieces</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Interested In</td><td style="padding:8px 0;color:#5A1220">${interests || 'Not specified'}</td></tr>
              <tr><td style="padding:8px 0;color:#9B6070;font-size:14px">Message</td><td style="padding:8px 0;color:#5A1220">${message || 'No message'}</td></tr>
            </table>
            <div style="margin-top:1.5rem;padding:1rem;background:#f5ede0;border-radius:10px;text-align:center">
              <a href="https://wa.me/91${phone.replace(/[^0-9]/g,'')}" 
                style="background:#25D366;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
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
        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) resolve(data);
          else reject(new Error(`Brevo: ${response.statusCode}`));
        });
      });
      req.on('error', reject);
      req.write(emailData);
      req.end();
    });

    console.log('✅ Wholesale enquiry from:', name, phone);
    res.json({ success: true, message: 'Enquiry sent!' });
  } catch (err) {
    console.log('❌ Wholesale error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;