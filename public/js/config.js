// Yahan baad mein Render ka URL aayega
// Abhi local testing ke liye ye hai
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://sakhi-website.onrender.com';const RAZORPAY_KEY = 'rzp_test_placeholder'; // Baad mein real key daalna