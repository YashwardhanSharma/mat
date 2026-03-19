const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // your sequelize instance
const User = require('./user.model');
const Order = require('./order.model');

const CancelOrder = sequelize.define('CancelOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending','approved','rejected', 'cancelled'),
    defaultValue: 'cancelled',
    allowNull: false
  },
  cancelled_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'cancel_orders',
  timestamps: false
});

// Associations
CancelOrder.belongsTo(User, { foreignKey: 'userId', as: 'user' });
CancelOrder.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

module.exports = CancelOrder;
