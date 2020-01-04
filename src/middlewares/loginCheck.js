const jwt = require('../utils/jwt');

const isLoggedIn = async (req, res, next) => {
  const token = req.get('Authorization');
  try {
    const decoded = await jwt.verify(token);
    req.decoded = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { isLoggedIn };
