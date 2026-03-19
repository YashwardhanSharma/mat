const Product = require('../models/product.model');
const sequelize = require('../config/db');
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const ProductImage = require('../models/productImage.model');


exports.getOrders = async (req, res) => {
  const { userId } = req.query; // Optional filter by user

  try {
    // 1. Fetch orders
    const orders = await Order.findAll({
      where: userId ? { userId } : {},
      order: [['created_at', 'DESC']],
      raw: true
    });

    if (!orders.length) return res.status(200).json({ orders: [] });

    const orderIds = orders.map(o => o.id);

    // 2. Fetch order items
    const orderItems = await OrderItem.findAll({
      where: { order_id: orderIds },
      raw: true
    });

    const productIds = orderItems.map(item => item.product_id);

    // 3. Fetch products
    const products = await Product.findAll({
      where: { id: productIds },
      raw: true
    });

    const productMap = {};
    products.forEach(p => productMap[p.id] = p);

    // 4. Fetch product images
    const productImages = await ProductImage.findAll({
      where: { productId: productIds },
      raw: true
    });

    const imageMap = {};
    productImages.forEach(img => {
      if (!imageMap[img.productId]) imageMap[img.productId] = [];
      imageMap[img.productId].push(img.image_url);
    });

    // 5. Combine data
    const ordersWithDetails = orders.map(order => {
      const items = orderItems
        .filter(item => item.order_id === order.id)
        .map(item => {
          const product = productMap[item.product_id];
          return {
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            product: {
              id: product.id,
              heading: product.heading,
              brand: product.brand,
              product_type: product.product_type,
              images: imageMap[product.id] || []
            }
          };
        });

      return {
        ...order,
        items,
      };
    });

    res.status(200).json({ orders: ordersWithDetails });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.getOrdersByUser = async (req, res) => {
    const { userId } = req.params; // userId passed in URL
  
    if (!userId) return res.status(400).json({ message: 'User ID is required' });
  
    try {
      // 1. Fetch orders for the user
      const orders = await Order.findAll({
        where: { userId },
        order: [['created_at', 'DESC']],
        raw: true
      });
  
      if (!orders.length) return res.status(200).json({ orders: [] });
  
      const orderIds = orders.map(o => o.id);
  
      // 2. Fetch order items
      const orderItems = await OrderItem.findAll({
        where: { order_id: orderIds },
        raw: true
      });
  
      const productIds = orderItems.map(item => item.product_id);
  
      // 3. Fetch products
      const products = await Product.findAll({
        where: { id: productIds },
        raw: true
      });
  
      const productMap = {};
      products.forEach(p => productMap[p.id] = p);
  
      // 4. Fetch product images
      const productImages = await ProductImage.findAll({
        where: { productId: productIds },
        raw: true
      });
  
      const imageMap = {};
      productImages.forEach(img => {
        if (!imageMap[img.productId]) imageMap[img.productId] = [];
        imageMap[img.productId].push(img.image_url);
      });
  
      // 5. Combine data
      const ordersWithDetails = orders.map(order => {
        const items = orderItems
          .filter(item => item.order_id === order.id)
          .map(item => {
            const product = productMap[item.product_id];
            return {
              id: item.id,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              product: {
                id: product.id,
                heading: product.heading,
                brand: product.brand,
                product_type: product.product_type,
                images: imageMap[product.id] || []
              }
            };
          });
  
        return {
          ...order,
          items,
        };
      });
  
      res.status(200).json({ orders: ordersWithDetails });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };

  exports.getOrderById = async (req, res) => {

    const { orderId } = req.params;
  console.log("req.params",req.params);
    if (!orderId) return res.status(400).json({"status": "error", message: 'Order ID is required' });
  
    try {
      // 1. Fetch the order
      const order = await Order.findOne({
        where: { id: orderId },
        raw: true
      });
  
      if (!order) return res.status(404).json({"status": "success", message: 'Order not found' });
  
      // 2. Fetch order items
      const orderItems = await OrderItem.findAll({
        where: { order_id: orderId },
        raw: true
      });
  
      const productIds = orderItems.map(item => item.product_id);
  
      // 3. Fetch products
      const products = await Product.findAll({
        where: { id: productIds },
        raw: true
      });
  
      const productMap = {};
      products.forEach(p => productMap[p.id] = p);
  
      // 4. Fetch product images
      const productImages = await ProductImage.findAll({
        where: { productId: productIds },
        raw: true
      });
  
      const imageMap = {};
      productImages.forEach(img => {
        if (!imageMap[img.productId]) imageMap[img.productId] = [];
        imageMap[img.productId].push(img.image_url);
      });
  
      // 5. Combine order items with product info
      const itemsWithDetails = orderItems.map(item => {
        const product = productMap[item.product_id];
        return {
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          product: {
            id: product.id,
            heading: product.heading,
            brand: product.brand,
            product_type: product.product_type,
            images: imageMap[product.id] || []
          }
        };
      });
  
      // 6. Combine into final order object
      const orderWithDetails = {
        ...order,
        items: itemsWithDetails
      };
  
      res.status(200).json({"status": "success", order: orderWithDetails });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({"status": "error", message: err.message });
    }
  };
