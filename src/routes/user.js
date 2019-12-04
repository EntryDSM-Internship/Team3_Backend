const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('../jwt');
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
    const token = req.get('Authorization');
    try {
        const user = await jwt.verify(token);
        
    } catch(err) {
        next(err);
    }
});

module.exports = router;