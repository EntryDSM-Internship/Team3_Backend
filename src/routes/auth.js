const express = require('express');
const router = express.Router();
const redis = require('redis');
const client = redis.createClient();
const User = require('../models').User;
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
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

router.post('/email-check', async (req, res, next) => {
    const {email} = req.body;
    try {
        const user = await User.findOne({where: {email}});
        if (user) {
            return res.status(409).json({status: 409, message: '이메일 중복'});
        }
        const authCode = '13253';
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

router.patch('/email-check', (req, res) => {
    const {email, authcode} = req.body;
    client.get(email, (err, reply) => {
        if(authcode !== reply) {
            return res.status(409).json({status: 409, message: '인증번호 틀림'});
        }
        client.del(email);
        return res.status(200).json({status: 200, message: '이메일 인증 성공'});
    });
});

router.post('/signup', upload.single('profileImg'), async (req, res, next) => {
    // TODO 이메일 인증 성공 확인 추가
    const {email, password, username, introduction} = req.body;
    try {
        await User.create({
            email, 
            password, 
            username, 
            introduction: introduction ? introduction : null, 
            profileImg: req.hasOwnProperty('file') ? req.file.filename : null
        });
        return res.status(201).json({status: 201, message: '회원가입 성공'});
    } catch(err) {
        next(err);
    }
});

module.exports = router;