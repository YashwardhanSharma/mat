const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userType: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  heading: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  productImageUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  sub_heading: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  price: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { min: 0 }
  },
  mrp: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { min: 0 }
  },
  specification: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  product_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  item: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },

  /* === NEW FIELDS (all strings) === */
  measure: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  selling_measure: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  measure_term: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  measure_value: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  selling_measure_rate: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  unit_mrp_incl_gst: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  discount_rule: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'percentage' // default as requested
  },
  discount_value: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  delivery_time: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  delivery_charges: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  coupon_code_apply: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  logistics_rule: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  gst: {
    type: DataTypes.STRING(255),
    allowNull: true,
  }
  
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Associations
Product.associate = (models) => {
  Product.hasMany(models.ProductImage, {
    foreignKey: 'productId',
    as: 'images'
  });

  Product.hasMany(models.CartItem, {
    foreignKey: 'productId',
    as: 'cartItems'
  });
};

module.exports = Product;
