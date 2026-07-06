const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Login required.' });
  }
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'sakhi_secret');
    req.admin = verified;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = auth;