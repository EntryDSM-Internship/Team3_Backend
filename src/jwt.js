const jwt = require('jsonwebtoken');
const jwtBlacklist = require('jwt-blacklist')(jwt);
require('dotenv').config();
const ACCESS = 'access';
const REFRESH = 'refresh';
const EMAIL = 'email';

const generateToken = (id, username, email, sub) => {
    return jwtBlacklist.sign({
        id,
        username,
        email
    }, process.env.JWT, {
        subject: sub,
        expiresIn: sub === ACCESS ? '2h' : '7d'
    });
}

const generateEmailToken = (email) => {
    return jwtBlacklist.sign({
        email
    }, process.env.JWT, {
        subject: 'email',
        expiresIn: '30m'
    });
}

const verify = (token) => {
    return jwtBlacklist.verify(token, process.env.JWT);
}

const blackList = (token) => {
    jwtBlacklist.blacklist(token);
    return;
}

module.exports = {blackList, ACCESS, REFRESH, generateToken, EMAIL, generateEmailToken, verify};