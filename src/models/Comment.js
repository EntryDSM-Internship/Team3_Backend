module.exports = (sequelize, DataTypes) => sequelize.define('comment', {
  comment: {
    type: DataTypes.STRING(256),
    allowNull: false,
  },
}, {
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci',
});
