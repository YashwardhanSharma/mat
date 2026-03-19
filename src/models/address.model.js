const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // your sequelize instance

// Define the model
const Address = sequelize.define('Address', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    address_line1: { type: DataTypes.STRING(255), allowNull: false },
    address_line2: { type: DataTypes.STRING(255) },
    city: { type: DataTypes.STRING(100), allowNull: false },
    state: { type: DataTypes.STRING(100), allowNull: false },
    postal_code: { type: DataTypes.STRING(20), allowNull: false },
    country: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'India' },
    latitude: { type: DataTypes.DECIMAL(10, 7) },
    longitude: { type: DataTypes.DECIMAL(10, 7) },
    houseNumber: { type: DataTypes.STRING(250), allowNull: true },
    floor: { type: DataTypes.STRING(250), allowNull: true },
    towar: { type: DataTypes.STRING(250), allowNull: true },
    landmark: { type: DataTypes.STRING(250), allowNull: true },
    description: { type: DataTypes.STRING(250), allowNull: true },
    recipientName: { type: DataTypes.STRING(250), allowNull: true },
    recipientPhoneNumber: { type: DataTypes.STRING(250), allowNull: true },
    address_type: { type: DataTypes.ENUM('home', 'work', 'other'), defaultValue: 'home' },
    is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: { type: DataTypes.ENUM('active', 'inactive'), defaultValue: 'active' }
}, {
    tableName: 'addresses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// **Important: export the model**
module.exports = Address;
