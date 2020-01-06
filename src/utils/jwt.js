const jwt = require('jsonwebtoken');
const jwtBlacklist = require('jwt-blacklist')(jwt);
require('dotenv').config();

const ACCESS = 'access';
const REFRESH = 'refresh';
const EMAIL = 'email';

const generateToken = (id, username, email, sub) => jwtBlacklist.sign({
  id,
  username,
  email,
}, process.env.JWT, {
  subject: sub,
  expiresIn: sub === ACCESS ? '2h' : '7d',
});

const generateEmailToken = (email) => jwtBlacklist.sign({
  email,
}, process.env.JWT, {
  subject: 'email',
  expiresIn: '30m',
});

const verify = (token) => {
  try {
    const decoded = jwtBlacklist.verify(token, process.env.JWT);
    return decoded;
  } catch (err) {
    let error;
    if (err.name === 'TokenExpiredError') {
      error = new Error('토큰 유효기간 만료');
      error.status = 403;
    } else {
      error = new Error('유효하지 않은 토큰');
      error.status = 401;
    }
    throw error;
  }
};

const blackList = (token) => {
  jwtBlacklist.blacklist(token);
};

module.exports = {
  blackList, ACCESS, REFRESH, generateToken, EMAIL, generateEmailToken, verify,
};
