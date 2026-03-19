const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // your sequelize instance

// Define the model
const UserMedia = sequelize.define('UserMedia', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.ENUM('audio','video','photo'), defaultValue: 'photo', allowNull: false },
    url: { type: DataTypes.STRING(150), allowNull: false },
    name: { type: DataTypes.STRING(255) },
    text: { type: DataTypes.STRING(250), allowNull: true },
    user_name: { type: DataTypes.STRING(100), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
}, {
    tableName: 'user_media',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// **Important: export the model**
module.exports = UserMedia;
