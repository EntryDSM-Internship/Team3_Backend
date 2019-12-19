module.exports = (sequelize, DataTypes) => {
    return sequelize.define('postImgs', {
        name: {
            type: DataTypes.STRING(260),
            allowNull: false
        }
    }, {
        timestamps: true,
        charset: 'utf8',
        collate: 'utf8_general_ci'
    });
}