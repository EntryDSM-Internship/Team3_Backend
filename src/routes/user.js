const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('../jwt');
const fs = require('fs');
const path = require('path');
const User = require('../models').User;

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

router.patch('/img', upload.single('profileImg'), async (req, res, next) => {
    if(!req.hasOwnProperty('file')) {
        const error = new Error('사진이 없음');
        error.status = 400;
        throw error;
    }
    const token = req.get('Authorization');
    try {
        const user = await jwt.verify(token);
        const {profileImg} = await User.findOne({where:{id:user.id}});
        fs.unlink(path.join(__dirname, '..', 'profileImgs', profileImg), (err) => {
            if(err) {
                console.error(err);
            }
        });
        await User.update({profileImg: req.file.filename}, {where:{id:user.id}});
        return res.status(200).json({status: 200, message: '프로필 사진 변경 성공'});
    } catch(err) {
        next(err);
    }
});

router.delete('/img', async (req, res, next) => {
    const token = req.get('Authorization');
    try {
        const decoded = await jwt.verify(token);
        const user = await User.findOne({where:{id:decoded.id}});
        if(!user.profileImg) {
            const error = new Error('삭제할 프사가 없음');
            error.status = 409;
            throw error;
        }
        fs.unlink(path.join(__dirname, '..', 'profileImgs', user.profileImg), (err) => {
            if(err) {
                console.error(err);
            }
        });
        await User.update({profileImg:null}, {where:{id:user.id}});
        return res.status(200).json({status: 200, message: '프로필 사진 삭제 성공'});
    } catch(err) {
        next(err);
    }
});

router.patch('/dark', async (req, res, next) => {
    const token = req.get('Authorization');
    const {dark} = req.body;
    try {
        const decoded = await jwt.verify(token);
        const user = await User.findOne({where:{id:decoded.id}});
        if(dark === user.dark) {
            const error = new Error('이미 다크모드 또는 보통모드임');
            error.status = 409;
            throw error;
        }
        await User.update({dark}, {where:{id:user.id}});
        return res.status(201).json({status: 201, message: '다크모드 설정 성공', dark})
    } catch(err) {
        next(err);
    }
});

router.patch('/private', async (req, res, next) => {
    const token = req.get('Authorization');
    const {private} = req.body;
    try {
        const decoded = await jwt.verify(token);
        const user = await User.findOne({where:{id:decoded.id}});
        if(private === user.private) {
            const error = new Error('이미 공개 또는 비공개임');
            error.status = 409;
            throw error;
        }
        await User.update({private}, {where:{id:user.id}});
        return res.status(200).json({status: 200, message: '계정 상태 변경 성공', private});
    } catch(err) {
        next(err);
    }
});

router.get('/:id/followings', async (req, res, next) => {
    const token = req.get('Authorization');
    const {id} = req.params;
    try {
        const user = await User.findOne({where:{id}});
        if(!user) {
            const error = new Error('해당 유저가 존재하지 않음');
            error.status = 404;
            throw error;
        }
        const decoded = await jwt.verify(token);
        const a = await user.getFollowers();
        let arr = [];
        for(i in a) {
            let tempObj = a[i].dataValues;
            delete tempObj.refreshTok;
            delete tempObj.private;
            delete tempObj.dark;
            delete tempObj.password;
            delete tempObj.createdAt;
            delete tempObj.updatedAt;
            arr.push(tempObj);
        }
        res.json({arr});
    } catch(err) {
        next(err);
    }
});

module.exports = router;