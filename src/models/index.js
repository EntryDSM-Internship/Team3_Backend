const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.User = require('./User')(sequelize, Sequelize);
db.Post = require('./Post')(sequelize, Sequelize);
db.Comment = require('./Comment')(sequelize, Sequelize);
db.PostImgs = require('./PostImgs')(sequelize, Sequelize);

db.User.hasMany(db.Post, {foreignKey:'userId', sourceKey:'id'});
db.Post.belongsTo(db.User, {foreignKey:'userId', targetKey:'id'});
db.User.hasMany(db.Comment, {foreignKey:'userId', sourceKey:'id'});
db.Comment.belongsTo(db.User, {foreignKey:'userId', targetKey:'id'});
db.Post.hasMany(db.Comment, {foreignKey:'postId', sourceKey:'id'});
db.Comment.belongsTo(db.Post, {foreignKey:'postId', targetKey:'id'});
db.User.belongsToMany(db.User, {through:'Follow', foreignKey:'followingId', as:'Followers'});
db.User.belongsToMany(db.User, {through:'Follow', foreignKey:'followerId', as:'Followings'});
db.Post.belongsToMany(db.User, {through:'like'});
db.User.belongsToMany(db.Post, {through:'like'});
db.Post.hasMany(db.PostImgs, {foreignKey:'postId', sourceKey:'id'});
db.PostImgs.belongsTo(db.Post, {foreignKey:'postId', targetKey:'id'});

module.exports = db;