const jwt = require('jsonwebtoken');
require('dotenv').config();
const ACCESS = 'access';
const REFRESH = 'refresh';
const EMAIL = 'email';

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

const generateEmailToken = async (email) => {
    return await jwt.sign({
        email
    }, process.env.JWT, {
        subject: 'email',
        expiresIn: '30m'
    });
}

const verify = async (token) => {
    return await jwt.verify(token, process.env.JWT);
}

module.exports = {ACCESS, REFRESH, generateToken, EMAIL, generateEmailToken, verify};