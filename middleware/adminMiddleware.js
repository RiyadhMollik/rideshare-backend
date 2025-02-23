const jwt = require('jsonwebtoken');
require('dotenv').config();

const adminOnly = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Invalid token format.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token.' });
    }

    // Attach the user object to the request
    req.user = user;

    // Check if the user is an admin
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // If everything is fine, proceed to the next middleware
    next();
  });
};

module.exports = { adminOnly };
