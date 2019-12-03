const express = require('express');
const router = express.Router();
const jwt = require('../jwt');
const User = require('../models').User;

router.post('/:id', async (req, res, next) => {
    const id = req.params.id; // 팔로우 당할 유저의 id
    const token = req.get('Authorization');
    try {
        const user = await jwt.verify(token);
        if(user.id === Number(id)) {
            const error = new Error('자신을 팔로우할 수는 없음');
            error.status = 400;
            throw error;
        }
        const followed = await User.findOne({where:{id}});
        if(!followed) {
            const error = new Error('해당 id의 유저가 존재하지 않음');
            error.status = 404;
            throw error;
        }
        if(followed.private === 1) {
            const error = new Error('비공개 계정에 팔로우를 시도함');
            error.status = 409;
            throw error;
        }
        await followed.setFollowings(user.id);
        return res.status(201).json({status: 201, message: '팔로우 성공'});
    } catch(err) {
        next(err);
    }
});

router.delete('/:id', async (req, res, next) => {
    const id = req.params.id; // 팔로우 취소 당할 유저의 id
    const token = req.get('Authorization'); 
    try {
        const user = await jwt.verify(token);
        const deleted = await User.findOne({where:{id}});
        if(!deleted) {
            const error = new Error('해당 id의 유저가 존재하지 않음');
            error.status = 404;
            throw error;
        }
        await deleted.removeFollowings(user.id);
        return res.status(200).json({status: 200, message: '팔로우 취소 성공'});
    } catch(err) {
        next(err);
    }
});

module.exports = router;