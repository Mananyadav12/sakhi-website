require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Serve frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/track', require('./routes/tracking'));
// ==================== NEWSLETTER ENDPOINT ====================
// ✉️ Contact Form API Endpoint (Direct Brevo API)
app.post('/api/contact', async (req, res) => {
  const { name, email, topic, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  try {
    const https = require('https');

    // Brevo API ke liye data structure taiyar karo
    const emailData = JSON.stringify({
      sender: { name: 'Sakhi Store Support', email: process.env.EMAIL_FROM || 'kajalbharti2605@gmail.com' },
      to: [{ email: 'kajalbharti2605@gmail.com' }], // Jahan aapko customer ka message chahiye
      subject: `🌸 New Website Inquiry: ${topic}`,
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; border: 2px solid #7B1C2E; padding: 25px; border-radius: 12px; background-color: #FDF8F2;">
          <h3 style="color: #7B1C2E; border-bottom: 2px solid #7B1C2E; padding-bottom: 10px;">New Contact Form Submission</h3>
          <p style="font-size: 15px;"><strong>Customer Name:</strong> ${name}</p>
          <p style="font-size: 15px;"><strong>Customer Email:</strong> ${email}</p>
          <p style="font-size: 15px;"><strong>Topic/Issue:</strong> ${topic}</p>
          <div style="background-color: #F5EDE0; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #C9922A;">
            <p style="margin: 0; font-weight: bold; color: #5C3040;">Message:</p>
            <p style="margin-top: 5px; line-height: 1.6; color: #1A0A0F;">${message}</p>
          </div>
        </div>
      `
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

    // Brevo ko direct request bhejo
    await new Promise((resolve, reject) => {
      const brevoReq = https.request(options, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => {
          if (r.statusCode >= 200 && r.statusCode < 300) resolve(data);
          else reject(new Error(`Brevo API: ${r.statusCode} - ${data}`));
        });
      });
      brevoReq.on('error', reject);
      brevoReq.write(emailData);
      brevoReq.end();
    });

    console.log('✅ Contact form message sent successfully from:', email);
    res.status(200).json({ message: 'Message sent successfully!' });

  } catch (error) {
    console.error('❌ Contact API Error:', error.message);
    res.status(500).json({ message: 'Internal server error, couldn\'t send mail.' });
  }
});
// ==================== NEWSLETTER ENDPOINT (Brevo) ====================
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const https = require('https');

    const emailData = JSON.stringify({
      sender: { name: 'Sakhi.co', email: process.env.EMAIL_FROM },
      to: [{ email }],
      subject: '🌸 Welcome to Sakhi.co – Thank you for visiting us! 🌸',
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; border: 2px solid #C9922A; padding: 30px; border-radius: 16px; background-color: #FDF8F2; color: #1A0A0F;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #7B1C2E; font-size: 24px; margin-bottom: 5px;">Namaste & Welcome to Sakhi! ✨</h2>
            <p style="color: #9B6070; font-size: 14px; font-style: italic; margin: 0;">Thank you so much for visiting our store today.</p>
          </div>
          <div style="font-size: 15px; line-height: 1.8; color: #5C3040;">
            <p>We are absolutely thrilled to welcome you to the <strong>Sakhi Sisterhood</strong>. Our goal is to bring you handcrafted, pure cotton kurtis that become your favorite daily companion—whether you are heading to college, office, or just out for a chai break! 🌿</p>
            <p style="background-color: #F5EDE0; border-left: 4px solid #7B1C2E; padding: 12px; border-radius: 8px; font-weight: 500;">
              🎁 As a warm greeting, keep an eye out for your first special discount code in our next drop!
            </p>
            <p>We invite you to explore our fresh collections, and please do visit us again soon.</p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px dashed rgba(201,146,42,0.4);">
            <p style="font-size: 12px; color: #9B6070; margin-top: 20px;">
              Made with ❤️ in India | Sakhi.co Team<br/>Indore, Madhya Pradesh
            </p>
          </div>
        </div>
      `
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
      const req = https.request(options, (r) => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => {
          if (r.statusCode >= 200 && r.statusCode < 300) resolve(data);
          else reject(new Error(`Brevo: ${r.statusCode} - ${data}`));
        });
      });
      req.on('error', reject);
      req.write(emailData);
      req.end();
    });

    console.log('✅ Newsletter mail sent to:', email);
    res.json({ success: true });

  } catch (err) {
    console.log('❌ Newsletter mail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// =============================================================
// =============================================================

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Sakhi.co running on http://localhost:${PORT}`);
});