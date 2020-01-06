module.exports = (sequelize, DataTypes) => sequelize.define('user', {
  username: {
    type: DataTypes.STRING(12),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  profileImg: {
    type: DataTypes.STRING(256),
    allowNull: true,
  },
  introduction: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  refreshTok: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  private: { // 0이면 공개, 1이면 비공개
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: 0,
  },
  dark: { // 0이면 보통모드, 1이면 다크모드
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  charset: 'utf8',
  collate: 'utf8_general_ci',
});
