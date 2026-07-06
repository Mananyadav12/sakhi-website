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
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Sakhi.co" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🌸 Welcome to Sakhi.co – Thank you for visiting us! 🌸',
      html: `
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

            <p>We invite you to explore our fresh collections, and please do visit us again soon. We are constantly updating our store with love and care just for you.</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px dashed rgba(201,146,42,0.4);">
            <a href="http://localhost:5000/pages/collections.html" style="display: inline-block; background-color: #7B1C2E; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; font-size: 14px;">
              🛍️ Visit Us Again & Shop Now
            </a>
            <p style="font-size: 12px; color: #9B6070; margin-top: 20px;">
              Made with ❤️ in India | Sakhi.co Team<br/>
              Indore, Madhya Pradesh
            </p>
          </div>

        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Mail sent successfully:', info.response);
    res.json({ success: true });

  } catch (err) {
    console.log('❌ NODE MAILER CRITICAL ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});
// =============================================================

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
const nodemailer = require('nodemailer');



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Sakhi.co running on http://localhost:${PORT}`);
});