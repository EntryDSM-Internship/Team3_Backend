const jwt = require('jsonwebtoken');
require('dotenv').config();
const ACCESS = 'access';
const REFRESH = 'refresh';

const generateToken = async (id, username, email, sub) => {
    return await jwt.sign({
        id,
        username,
        email
    }, process.env.JWT, {
        subject: sub,
        expiresIn: sub === ACCESS ? '2h' : '7d'
    });
}

module.exports = {ACCESS, REFRESH, generateToken};