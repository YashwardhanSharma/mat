const sequelize = require('../config/db');
const Product = require('../models/product.model');
const ProductImage = require('../models/productImage.model');

const getActiveProducts = async () => {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        p.id,
        p.heading,
        p.sub_heading,
        p.price,
        p.mrp,
        p.product_type,
        p.brand,
        p.item,
        pi.image_url,
        pi.is_primary
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.productId AND pi.status = 'active'
      WHERE p.status = 1
      ORDER BY 
        p.created_at DESC,
        pi.is_primary DESC,
        pi.display_order ASC
      LIMIT 30
    `);

    // Rest of your code remains the same...
    const productsMap = new Map();
    
    results.forEach(row => {
      if (!productsMap.has(row.id)) {
        productsMap.set(row.id, {
          id: row.id,
          heading: row.heading,
          sub_heading: row.sub_heading,
          price: row.price,
          mrp: row.mrp,
          product_type: row.product_type,
          brand: row.brand,
          item: row.item,
          images: [],
          primary_image: null
        });
      }
      
      const product = productsMap.get(row.id);
      if (row.image_url) {
        const image = {
          image_url: row.image_url,
          is_primary: row.is_primary
        };
        product.images.push(image);
        
        if (row.is_primary) {
          product.primary_image = row.image_url;
        }
      }
    });

    return Array.from(productsMap.values()).map(product => ({
      ...product,
      images: product.images.map(img => img.image_url),
      primary_image: product.primary_image || 
                    (product.images.length > 0 ? product.images[0].image_url : null)
    }));

  } catch (error) {
    console.error('Error in getActiveProducts:', error);
    throw new Error('Failed to fetch active products');
  }
};

module.exports = {
  getActiveProducts
};