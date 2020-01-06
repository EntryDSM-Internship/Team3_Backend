module.exports = (sequelize, DataTypes) => sequelize.define('post', {
  content: {
    type: DataTypes.STRING(256),
    allowNull: true,
  },
}, {
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci',
});
