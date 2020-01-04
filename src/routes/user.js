/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const express = require('express');

const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { isLoggedIn } = require('../middlewares/loginCheck');
const {
  User,
  Post,
  PostImgs,
  sequelize,
  Comment,
} = require('../models');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'profileImgs/');
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + new Date().valueOf() + ext);
    },
  }),
});

router.get('/:id', isLoggedIn, async (req, res, next) => {
  const { id } = req.params;
  const { decoded } = req;
  try {
    const user = await User.findOne({
      attributes: ['private', 'id', 'username', 'email', 'profileImg', 'introduction'],
      where: { id },
    });
    if (!user) {
      const error = new Error('해당 유저를 찾을 수 없음');
      error.status = 404;
      throw error;
    }
    const followings = await user.getFollowers({ attributes: ['id', 'username', 'email', 'profileImg', 'introduction', 'private'] });
    const followers = await user.getFollowings({ attributes: ['id', 'username', 'email', 'profileImg', 'introduction', 'private'] });
    const isFollow = await user.getFollowings({ where: { id: decoded.id } });
    user.dataValues.followings = followings;
    user.dataValues.followers = followers;
    user.dataValues.me = decoded.id === user.id;
    user.dataValues.isFollow = !!isFollow.length;
    res.status(200).json({ status: 200, message: '해당 유저의 프로필 불러오기 성공', user });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/posts/:page', isLoggedIn, async (req, res, next) => {
  const { id, page } = req.params;
  const { decoded } = req;
  try {
    const user = await User.findOne({
      where: { id },
    });
    if (!user) {
      const error = new Error('해당 유저를 찾을 수 없음');
      error.status = 404;
      throw error;
    }
    const posts = await Post.findAll({
      where: { userId: id },
      limit: 10,
      offset: page * 10,
      include: [
        { model: PostImgs, required: false },
        { model: User, required: true, attributes: ['id', 'username', 'email', 'private', 'profileImg', 'introduction'] },
        { model: Comment, required: false },
      ],
      order: sequelize.literal('createdAt DESC'),
    });
    for (const i in posts) {
      if ({}.hasOwnProperty.call(posts, i)) {
        const isLike = await posts[i].getUsers({ where: { id: decoded.id } });
        const like = await posts[i].getUsers();
        posts[i].dataValues.like = like.length;
        posts[i].dataValues.isLike = !!isLike.length;
        posts[i].dataValues.deletable = posts[i].userId === decoded.id;
        posts[i].dataValues.comments = posts[i].comments.length;
      }
    }
    res.status(200).json({
      status: 200, message: '불러오기 성공', posts, me: decoded.id === Number(id),
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/', isLoggedIn, async (req, res, next) => {
  const { decoded } = req;
  const { username, introduction } = req.body;
  try {
    await User.update({ username, introduction }, { where: { id: decoded.id } });
    res.status(200).json({ status: 200, message: '프로필 변경 성공' });
  } catch (err) {
    next(err);
  }
});

router.patch('/img', isLoggedIn, upload.single('profileImg'), async (req, res, next) => {
  try {
    if ({}.hasOwnProperty.call(req, 'file')) {
      const error = new Error('사진이 없음');
      error.status = 400;
      throw error;
    }
    const { decoded } = req;
    const { profileImg } = await User.findOne({ where: { id: decoded.id } });
    if (profileImg) {
      fs.unlink(path.join(__dirname, '..', 'profileImgs', profileImg), (err) => {
        if (err) {
          // eslint-disable-next-line no-console
          console.error(err);
        }
      });
    }
    await User.update({ profileImg: req.file.filename }, { where: { id: decoded.id } });
    res.status(200).json({ status: 200, message: '프로필 사진 변경 성공' });
  } catch (err) {
    next(err);
  }
});

router.delete('/img', isLoggedIn, async (req, res, next) => {
  try {
    const { decoded } = req;
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user.profileImg) {
      const error = new Error('삭제할 프사가 없음');
      error.status = 409;
      throw error;
    }
    fs.unlink(path.join(__dirname, '..', 'profileImgs', user.profileImg), (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error(err);
      }
    });
    await User.update({ profileImg: null }, { where: { id: user.id } });
    res.status(200).json({ status: 200, message: '프로필 사진 삭제 성공' });
  } catch (err) {
    next(err);
  }
});

router.patch('/dark', isLoggedIn, async (req, res, next) => {
  const { dark } = req.body;
  try {
    const { decoded } = req;
    const user = await User.findOne({ where: { id: decoded.id } });
    if (dark === user.dark) {
      const error = new Error('이미 다크모드 또는 보통모드임');
      error.status = 409;
      throw error;
    }
    await User.update({ dark }, { where: { id: user.id } });
    res.status(201).json({ status: 201, message: '다크모드 설정 성공', dark });
  } catch (err) {
    next(err);
  }
});

router.patch('/private', isLoggedIn, async (req, res, next) => {
  const { private } = req.body;
  try {
    const { decoded } = req;
    const user = await User.findOne({ where: { id: decoded.id } });
    if (private === user.private) {
      const error = new Error('이미 공개 또는 비공개임');
      error.status = 409;
      throw error;
    }
    await User.update({ private }, { where: { id: user.id } });
    res.status(200).json({ status: 200, message: '계정 상태 변경 성공', private });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/followings', isLoggedIn, async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({ where: { id } });
    if (!user) {
      const error = new Error('해당 유저가 존재하지 않음');
      error.status = 404;
      throw error;
    }
    const followings = await user.getFollowers({ attributes: ['id', 'username', 'email', 'profileImg', 'introduction', 'private'] });
    res.status(200).json({ status: 200, message: '팔로잉 리스트 불러오기 성공', followings });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/followers', isLoggedIn, async (req, res, next) => {
  const { id } = req.params;
  try {
    const user = await User.findOne({ where: { id } });
    if (!user) {
      const error = new Error('해당 유저가 존재하지 않음');
      error.status = 404;
      throw error;
    }
    const followers = await user.getFollowings({ attributes: ['id', 'username', 'email', 'profileImg', 'introduction', 'private'] });
    res.status(200).json({ status: 200, message: '팔로워 리스트 불러오기 성공', followers });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
