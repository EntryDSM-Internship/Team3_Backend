const express = require('express');
const {isLoggedIn} = require('../middlewares/loginCheck')
const Op = require('sequelize').Op;
const {User, Post, sequelize, Sequelize, PostImgs} = require('../models');
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
        var posts = await Post.findAll({
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
            if(isLike.length) posts[i].dataValues.isLike = true;
            else posts[i].dataValues.isLike = false;
            if(posts[i].userId === decoded.id) posts[i].dataValues.deletable = true;
            else posts[i].dataValues.deletable = false;
        }
        return res.status(200).json({status: 200, message: '게시물 불러오기 성공', posts});
    } catch(err) {
        next(err);
    }
});

module.exports = router;