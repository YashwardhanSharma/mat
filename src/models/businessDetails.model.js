const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user.model'); // assuming user.model.js exists

const BusinessDetails = sequelize.define('BusinessDetails', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  panNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  gstNumber: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  companyAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pinCode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  cinNumber: {
    type: DataTypes.STRING(30),
    allowNull: true
  }
}, {
  tableName: 'business_details',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
BusinessDetails.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasOne(BusinessDetails, { foreignKey: 'userId', onDelete: 'CASCADE' });

module.exports = BusinessDetails;
