const express = require('express');
const {isLoggedIn} = require('../middlewares/loginCheck')
const Op = require('sequelize').Op;
const {User, Post, sequelize, PostImgs} = require('../models');
const router = express.Router();

router.get('/posts/:page', isLoggedIn, async (req, res, next) => {
    const decoded = req.decoded;
    const page = req.params.page * 10;
    try {
        const user = await User.findOne({where:{id:decoded.id}});
        const followings = await user.getFollowers();
        let id = [];
        for(i in followings) {
            if(followings[i].dataValues.private === false) {
                id.push({userId: followings[i].dataValues.id});
            }
        }
        id.push({userId: decoded.id});
        let posts = await Post.findAll({
            attributes: ['id', 'content', 'createdAt', 'userId'],
            where:{
                [Op.or]: id
            },
            order: sequelize.literal('createdAt DESC'),
            limit: 10,
            offset: page,
            include: [
                {model:PostImgs, required:false, attributes: ['name', 'postId']},
                {model:User, required:true, attributes: ['id', 'username', 'email', 'profileImg', 'private']}
            ]
        });
        for(i in posts) {
            let isLike = await posts[i].getUsers({where:{id:decoded.id}});
            let like = await posts[i].getUsers();
            posts[i].dataValues.like = like.length;
            posts[i].dataValues.isLike = isLike.length ? true : false;
            posts[i].dataValues.deletable = posts[i].userId === decoded.id ? true : false;
        }
        return res.status(200).json({status: 200, message: '게시물 불러오기 성공', posts});
    } catch(err) {
        next(err);
    }
});

router.get('/users', isLoggedIn, async (req, res, next) => {
    const username = req.query.username;
    try {
        const users = await User.findAll({
            where:{username},
            attributes:['id', 'username', 'email', 'profileImg', 'introduction', 'private']
        });
        res.status(200).json({status: 200, message: '유저 목록 불러오기 성공', users});
    } catch(err) {
        next(err);
    }
});

router.get('/userinfo', isLoggedIn, async (req, res, next) => {
    const decoded = req.decoded;
    try {
        const user = await User.findOne({
            where:{id:decoded.id},
            attributes:['id', 'username', 'email', 'profileImg', 'introduction', 'private', 'dark']
        });
        res.status(200).json({status: 200, message: '유저 정보', user});
    } catch(err) {
        next(err);
    }
});

module.exports = router;