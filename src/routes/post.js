const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {isLoggedIn} = require('../middlewares/loginCheck');
const {Post, PostImgs, Comment, User} = require('../models');

fs.readdir('postImgs', (error) => {
    if(error) {
        console.log('postImgs 폴더 생성');
        fs.mkdirSync('postImgs');
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination: function(req, file, cb) {
            cb(null, 'postImgs/');
        },
        filename: function(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
        }
    })
});

router.post('/', isLoggedIn, upload.array('imgs', 4), async (req, res, next) => {
    const {content} = req.body;
    try {
        const decoded = req.decoded;
        const post = await Post.create({
            userId: decoded.id,
            content
        });
        req.files.forEach(async file => {
            await PostImgs.create({
                name: file.filename,
                postId: post.id
            });
        });
        return res.status(201).json({status: 201, message: '게시물 올리기 성공'});
    } catch(err) {
        next(err);
    }
});

router.delete('/:id', isLoggedIn, async (req, res, next) => {
    const id = req.params.id;
    try {
        const decoded = req.decoded;
        const post = await Post.findOne({where:{id}});
        if(!post) {
            const error = new Error('해당 id의 게시물이 존재하지 않음');
            error.status = 404;
            throw error;
        }
        if(post.userId !== decoded.id) {
            const error = new Error('로그인한 유저와 게시물의 유저가 불일치');
            error.status = 409;
            throw error;
        }
        const imgs = await PostImgs.findAll({where:{postId: post.id}});
        await PostImgs.destroy({where:{postId:post.id}});
        imgs.forEach(async img => {
            fs.unlink(path.join(__dirname, '..', 'postImgs', img.name), (err) => {
                if(err) {
                    console.error(err);
                }
            });
        });
        await Post.destroy({where:{id}});
        return res.status(200).json({status: 200, message: '게시물 삭제 성공'});
    } catch(err) {
        next(err);
    }
});

router.post('/:id/like', isLoggedIn, async (req, res, next) => {
    const decoded = req.decoded;
    const id = req.params.id;
    try {
        const post = await Post.findOne({where:{id}});
        if(!post) {
            const error = new Error('해당 id의 게시물이 존재하지 않음');
            error.status = 404;
            throw error;
        }
        await post.addUsers(decoded.id);
        return res.status(201).json({status: 201, message: '게시물 좋아요 성공'});
    } catch(err) {
        next(err);
    }
});

router.delete('/:id/like', isLoggedIn, async (req, res, next) => {
    const decoded = req.decoded;
    const id = req.params.id;
    try {
        const post = await Post.findOne({where:{id}});
        if(!post) {
            const error = new Error('해당 id의 게시물이 존재하지 않음');
            error.status = 404;
            throw error;
        }
        await post.removeUsers(decoded.id);
        return res.status(200).json({status: 200, message: '게시물 좋아요 취소 성공'});
    } catch(err) {
        next(err);
    }
});

router.post('/:id/comment', isLoggedIn, async (req, res, next) => {
    const decoded = req.decoded;
    const id = req.params.id;
    const comment = req.body.comment;
    try {
        const post = await Post.findOne({where:{id}});
        if(!post) {
            const error = new Error('해당 id의 게시물이 존재하지 않음');
            error.status = 404;
            throw error;
        }
        await Comment.create({
            comment,
            userId: decoded.id,
            postId: id
        });
        return res.status(201).json({status: 201, message: '댓글 작성 성공'});
    } catch(err) {
        next(err);
    }
});

router.get('/:id/comments', isLoggedIn, async (req, res, next) => {
    const id = req.params.id;
    try {
        const post = await Post.findOne({where:{id}});
        if(!post) {
            const error = new Error('해당 id의 게시물이 존재하지 않음');
            error.status = 404;
            throw error;
        }
        const comments = await Comment.findAll({
            where:{postId:id},
            attributes: ['id', 'comment', 'createdAt', 'userId', 'postId'],
            include: [{model:User, required:true, attributes: ['id', 'username', 'email', 'profileImg', 'private', 'createdAt']}]
        });
        return res.status(200).json({status: 200, message: '댓글 불러오기 성공', comments});
    } catch(err) {
        next(err);
    }
});

module.exports = router;