const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userType: {
    type: DataTypes.ENUM('customer', 'vendor', 'admin', 'subAdmin'),
    allowNull: false,
    defaultValue: 'customer',
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  photo: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  notificationSetting: {
    type: DataTypes.BOOLEAN, // tinyint(1) → boolean
    allowNull: false,
    defaultValue: true, // 1 = ON
    comment: '1=ON, 0=OFF',
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  otp: {
    type: DataTypes.STRING(4),
    allowNull: true,
    validate: {
      isNumeric: true,
      len: [4, 4],
    },
  },
  status: {
    type: DataTypes.ENUM('0', '1'),
    allowNull: false,
    defaultValue: '0', // 0 = Inactive, 1 = Active
  },
  otpExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Associations
User.associate = (models) => {
  User.hasMany(models.Order, {
    foreignKey: 'user_id',
    as: 'orders',
  });

  User.hasMany(models.Product, {
    foreignKey: 'userId',
    as: 'products',
  });
};

module.exports = User;
