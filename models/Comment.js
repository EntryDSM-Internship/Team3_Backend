module.exports = (sequelize, DataTypes) => {
    return sequelize.define('comment', {
        comment: {
            type: DataTypes.STRING(256),
            allowNull: false
        }
    }, {
        timestamps: true
    });
}