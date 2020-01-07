const express = require('express');

const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isLoggedIn } = require('../middlewares/loginCheck');
const {
  Post, PostImgs, Comment, User,
} = require('../models');

fs.readdir('postImgs', (error) => {
  if (error) {
    fs.mkdirSync('postImgs');
  }
});

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'postImgs/');
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
});

router.post('/', isLoggedIn, upload.array('imgs'), async (req, res, next) => {
  const { content } = req.body;
  try {
    if (!content || content.length > 256 || req.files.length > 4) {
      const error = new Error('요청 데이터가 너무 많음');
      error.status = 400;
      throw error;
    }
    const { decoded } = req;
    const post = await Post.create({
      userId: decoded.id,
      content,
    });
    req.files.forEach(async (file) => {
      await PostImgs.create({
        name: file.filename,
        postId: post.id,
      });
    });
    res.status(201).json({ status: 201, message: '게시물 올리기 성공' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', isLoggedIn, async (req, res, next) => {
  const { id } = req.params;
  const { decoded } = req;
  try {
    const post = await Post.findOne({
      where: { id },
      include: [
        { model: PostImgs, required: false },
        { model: User, required: true, attributes: ['id', 'username', 'email', 'profileImg', 'introduction', 'private'] },
        { model: Comment, required: false },
      ],
    });
    if (!post) {
      const error = new Error('게시물이 존재하지 않음');
      error.status = 404;
      throw error;
    }
    if (post.user.private && decoded.id !== post.user.id) {
      const error = new Error('비공개 유저 게시물에 접근');
      error.status = 409;
      throw error;
    }
    const isLike = await post.getUsers({ where: { id: decoded.id } });
    const like = await post.getUsers();
    post.dataValues.like = like.length;
    post.dataValues.isLike = !!isLike.length;
    post.dataValues.deletable = post.userId === decoded.id;
    post.dataValues.comments = post.comments.length;
    res.status(200).json({ status: 200, message: '게시물 불러오기 성공', post });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', isLoggedIn, async (req, res, next) => {
  const { id } = req.params;
  try {
    const { decoded } = req;
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      const error = new Error('해당 id의 게시물이 존재하지 않음');
      error.status = 404;
      throw error;
    }
    if (post.userId !== decoded.id) {
      const error = new Error('로그인한 유저와 게시물의 유저가 불일치');
      error.status = 409;
      throw error;
    }
    const imgs = await PostImgs.findAll({ where: { postId: post.id } });
    await PostImgs.destroy({ where: { postId: post.id } });
    imgs.forEach(async (img) => {
      fs.unlink(path.join(__dirname, '..', 'postImgs', img.name), (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(err);
        }
      });
    });
    await Post.destroy({ where: { id } });
    res.status(200).json({ status: 200, message: '게시물 삭제 성공' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/like', isLoggedIn, async (req, res, next) => {
  const { decoded } = req;
  const { id } = req.params;
  try {
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      const error = new Error('해당 id의 게시물이 존재하지 않음');
      error.status = 404;
      throw error;
    }
    await post.addUsers(decoded.id);
    res.status(201).json({ status: 201, message: '게시물 좋아요 성공' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/like', isLoggedIn, async (req, res, next) => {
  const { decoded } = req;
  const { id } = req.params;
  try {
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      const error = new Error('해당 id의 게시물이 존재하지 않음');
      error.status = 404;
      throw error;
    }
    await post.removeUsers(decoded.id);
    res.status(200).json({ status: 200, message: '게시물 좋아요 취소 성공' });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/comment', isLoggedIn, async (req, res, next) => {
  const { decoded } = req;
  const { id } = req.params;
  const { comment } = req.body;
  try {
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      const error = new Error('해당 id의 게시물이 존재하지 않음');
      error.status = 404;
      throw error;
    }
    if (comment.length > 256) {
      const error = new Error('요청 데이터가 너무 많음');
      error.status = 400;
      throw error;
    }
    await Comment.create({
      comment,
      userId: decoded.id,
      postId: id,
    });
    res.status(201).json({ status: 201, message: '댓글 작성 성공' });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/comments', isLoggedIn, async (req, res, next) => {
  const { id } = req.params;
  try {
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      const error = new Error('해당 id의 게시물이 존재하지 않음');
      error.status = 404;
      throw error;
    }
    const comments = await Comment.findAll({
      where: { postId: id },
      attributes: ['id', 'comment', 'createdAt', 'userId', 'postId'],
      include: [{ model: User, required: true, attributes: ['id', 'username', 'email', 'profileImg', 'private', 'createdAt'] }],
    });
    res.status(200).json({ status: 200, message: '댓글 불러오기 성공', comments });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
