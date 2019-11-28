const express = require('express');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const sequelize = require('./models').sequelize;
const hpp = require('hpp');
const logger = require('./logger');
const cors = require('cors');
require('dotenv').config();

const app = express();
sequelize.sync();

const indexRouter = require('./routes');
const authRouter = require('./routes/auth');
const followRouter = require('./routes/follow');
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');

app.set('port', process.env.PORT || 3001);
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/profiles', express.static(path.join(__dirname, 'profileImgs')));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
if(process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
    app.use(hpp());
    app.use(helmet());
} else {
    app.use(morgan('dev'));
}
app.use(cors());

app.use('/', indexRouter);
app.use('/follow', followRouter);
app.use('/post', postRouter);
app.use('/user', userRouter);
app.use('/auth', authRouter);

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    logger.info(req.method + ' ' + req.url + 'Error: ' + err.message);
    next(err);
});

app.use((err, req, res) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.json({status: err.status, message: err.message});
});

app.listen(app.get('port'), () => {
    console.log(`${app.get('port')}번 포트`);
});