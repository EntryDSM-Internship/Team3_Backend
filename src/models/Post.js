module.exports = (sequelize, DataTypes) => {
    return sequelize.define('post', {
        content: {
            type: DataTypes.STRING(512),
            allowNull: false
        },
        imgs: {
            type: DataTypes.STRING(512),
            allowNull: true
        }
    }, {
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}