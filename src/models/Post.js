module.exports = (sequelize, DataTypes) => {
    return sequelize.define('post', {
        content: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}