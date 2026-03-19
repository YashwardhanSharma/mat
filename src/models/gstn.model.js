const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Gstn = sequelize.define('Gstn', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  gstn: {
    type: DataTypes.STRING(20),
    allowNull: false
  },

  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false
  }

}, {
  tableName: 'gstn',
  timestamps: false,

  indexes: [
    {
      unique: true,
      fields: ['gstn']
    }
  ]
});

module.exports = Gstn;