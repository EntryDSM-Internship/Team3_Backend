const express = require('express');
const router = express.Router();
const redis = require('redis');
const client = redis.createClient();
const User = require('../models').User;
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const fs = require('fs');
const multer = require('multer');
const jwt = require('../jwt');
const path = require('path');
const jwtBlacklist = require('jwt-blacklist');
const {codeGenerator} = require('../codeGenerator');
require('dotenv').config();

fs.readdir('profileImgs', (error) => {
    if(error) {
        console.log('profileImgs 폴더 생성');
        fs.mkdirSync('profileImgs');
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'profileImgs/');
        },
        filename: function(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
        }
    })
});

router.patch('/refresh', async (req, res, next) => {
    const refreshTok = req.get('X-refresh-token');
    try {
        const decode = await jwt.verify(refreshTok);
        const user = await User.findOne({where:{id:decode.id}});
        if(user.refreshTok !== refreshTok) {
            res.status(403).json({status: 403, message: '리프레시 토큰이 유효하지 않음'});
        }
        const access_token = await jwt.generateToken(user.id, user.username, user.email, jwt.ACCESS);
        const refresh_token = await jwt.generateToken(user.id, user.username, user.email, jwt.REFRESH);
        res.status(200).json({status: 200, message: '토큰 재발급', access_token, refresh_token});
    } catch(err) {
        res.status(403).json({status: 403, message: '리프레시 토큰이 유효하지 않음'});
    }
})

router.post('/email-check', async (req, res, next) => {
    const {email} = req.body;
    try {
        const user = await User.findOne({where: {email}});
        if (user) {
            return res.status(409).json({status: 409, message: '이메일 중복'});
        }
        const authCode = codeGenerator();
        const transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        }));
        const mailOptions = {
            from: process.env.MAIL_USER,
            to: email,
            subject: 'Squeaker 이메일 인증',
            text: authCode
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if(error) {
                return res.status(400).json({status:400, message:'알맞지 않은 이메일'});
            }
            client.set(email, authCode, 'EX', 180);
            return res.status(200).json({status: 200, message: '이메일 전송 성공'});
        })
    } catch(err) {
        next(err);
    }
});

router.patch('/email-check', (req, res, next) => {
    const {email, authcode} = req.body;
    client.get(email, async (err, reply) => {
        if(authcode !== reply) {
            return res.status(409).json({status: 409, message: '인증번호 틀림'});
        }
        client.del(email);
        try {
            const token = await jwt.generateEmailToken(email);
            return res.status(200).json({status: 200, message: '이메일 인증 성공', token});
        } catch(err) {
            next(err);
        }
    });
});

router.post('/signup', upload.single('profileImg'), async (req, res, next) => {
    const token = req.get('Authorization');
    const {email, password, username, introduction} = req.body;
    try {
        const decode = await jwt.verify(token);
        if(decode.sub !== 'email' || decode.email !== email) {
            return res.status(401).json({status: 401, message: '유효하지 않은 토큰'});
        }
        await User.create({
            email,
            password,
            username,
            introduction: introduction ? introduction : null, 
            profileImg: req.hasOwnProperty('file') ? req.file.filename : null
        });
        return res.status(201).json({status: 201, message: '회원가입 성공'});
    } catch(err) {
        if(err.name === 'TokenExpiredError') {
            return res.status(403).json({status: 403, message: '토큰 유효기간 만료'});
        }
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    const {email, password} = req.body;
    try {
        const user = await User.findOne({where:{email}});
        if(!user || user.password !== password) {
            return res.status(400).json({status: 400, message: '이메일 또는 비밀번호가 틀림'});
        }
        const access_token = await jwt.generateToken(user.id, user.username, user.email, jwt.ACCESS);
        const refresh_token = await jwt.generateToken(user.id, user.username, user.email, jwt.REFRESH);
        console.log(refresh_token);
        await User.update({refreshTok:refresh_token}, {where:{id:user.id}});
        return res.status(200).json({status: 200, message: '로그인 성공', access_token, refresh_token});
    } catch(err) {
        next(err);
    }
});

router.delete('/logout', async (req, res, next) => {
    const accessTok = req.get('Authorization');
    // TODO 로그아웃 구현
});

module.exports = router;