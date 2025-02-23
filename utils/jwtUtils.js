const jwt = require('jsonwebtoken');

const validateToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded; // Return decoded user details if token is valid
  } catch (error) {
    console.error('Token validation error:', error);
    return null; // Return null if token is invalid or expired
  }
};

module.exports = { validateToken };
