const express = require('express');

const router = express.Router();
const client = require('redis').createClient();
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt-nodejs');
const jwt = require('../utils/jwt');
const codeGenerator = require('../utils/codeGenerator');
const emailHTML = require('../utils/emailHTML');
const { User } = require('../models');
require('dotenv').config();

fs.readdir('profileImgs', (error) => {
  if (error) {
    fs.mkdirSync('profileImgs');
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'profileImgs/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
});

router.patch('/refresh', async (req, res, next) => {
  const refreshTok = req.get('X-refresh-token');
  try {
    const decode = await jwt.verify(refreshTok);
    const user = await User.findOne({ where: { id: decode.id } });
    if (user.refreshTok !== refreshTok) {
      const err = new Error('리프레시 토큰이 유효하지 않음');
      err.status = 403;
      throw err;
    }
    const accessToken = await jwt.generateToken(user.id, user.username, user.email, jwt.ACCESS);
    const refreshToken = await jwt.generateToken(user.id, user.username, user.email, jwt.REFRESH);
    await User.update({ refreshTok: refreshToken }, { where: { id: user.id } });
    res.status(200).json({
      status: 200, message: '토큰 재발급', access_token: accessToken, refresh_token: refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/email-check', async (req, res, next) => {
  const { email } = req.body;
  try {
    if (email.length > 320) {
      const error = new Error('이메일이 너무 길음');
      error.status = 400;
      throw error;
    }
    const user = await User.findOne({ where: { email } });
    if (user) {
      const err = new Error('이메일 중복');
      err.status = 409;
      throw err;
    }
    const authCode = codeGenerator();
    const transporter = nodemailer.createTransport(smtpTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    }));
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Squeaker 이메일 인증',
      html: emailHTML(authCode),
    };
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        const err = new Error('알맞지 않은 이메일');
        err.status = 400;
        throw err;
      }
      client.set(email, authCode, 'EX', 180);
      res.status(200).json({ status: 200, message: '이메일 전송 성공' });
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/email-check', (req, res, next) => {
  const { email, authcode } = req.body;
  try {
    client.get(email, async (err, reply) => {
      if (authcode !== reply) {
        const error = new Error('인증번호 틀림');
        error.status = 409;
        throw error;
      }
      client.del(email);
      const token = await jwt.generateEmailToken(email);
      res.status(200).json({ status: 200, message: '이메일 인증 성공', token });
    });
  } catch (error) {
    next(error);
  }
});

router.post('/signup', upload.single('profileImg'), async (req, res, next) => {
  const token = req.get('Authorization');
  const {
    email, password, username, introduction,
  } = req.body;
  try {
    const decode = await jwt.verify(token);
    if (decode.sub !== 'email' || decode.email !== email) {
      const error = new Error('유효하지 않은 토큰');
      error.status = 401;
      throw error;
    }
    if (username.length > 12 || password.length < 8 || introduction.length > 60 || email.length > 30) {
      const error = new Error('요청 데이터가 너무 많음');
      error.status = 400;
      throw error;
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    await User.create({
      email,
      password: hash,
      username,
      introduction: introduction || null,
      profileImg: {}.hasOwnProperty.call(req, 'file') ? req.file.filename : '기본.png',
    });
    res.status(201).json({ status: 201, message: '회원가입 성공' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(403).json({ status: 403, message: '토큰 유효기간 만료' });
    }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      const err = new Error('이메일 또는 비밀번호가 틀림');
      err.status = 400;
      throw err;
    }
    const accessToken = await jwt.generateToken(user.id, user.username, user.email, jwt.ACCESS);
    const refreshToken = await jwt.generateToken(user.id, user.username, user.email, jwt.REFRESH);
    await User.update({ refreshTok: refreshToken }, { where: { id: user.id } });
    res.status(200).json({
      status: 200, message: '로그인 성공', access_token: accessToken, refresh_token: refreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/logout', async (req, res, next) => {
  const refreshTok = req.get('X-refresh-token');
  const accessTok = req.get('Authorization');
  try {
    await User.update({ refreshTok: null }, { where: { refreshTok } });
    jwt.blackList(accessTok);
    jwt.blackList(refreshTok);
    res.status(200).json({ status: 200, message: '로그아웃 성공' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
