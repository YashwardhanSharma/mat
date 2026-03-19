const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // your sequelize instance
const User = require('./user.model');
const Order = require('./order.model');

const ReportBug = sequelize.define('ReportBug', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending','in_progress','resolved'),
    allowNull: false,
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low','medium','high'),
    allowNull: false,
    defaultValue: 'medium'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'report_bugs',
  timestamps: false
});

// Associations
ReportBug.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ReportBug.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

module.exports = ReportBug;
