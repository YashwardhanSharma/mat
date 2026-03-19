const CancelOrder = require('../models/cancelOrder.model');
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const User = require('../models/user.model');
const sequelize = require('../config/db');

//Get all cancel orders (optional: filter by userId or orderId)
exports.getAllCancelOrders = async (req, res) => {
  try {
    const { userId, orderId } = req.query;

    let replacements = {};
    let whereClause = 'WHERE 1=1';
    if (userId) {
      whereClause += ' AND co.userId = :userId';
      replacements.userId = userId;
    }
    if (orderId) {
      whereClause += ' AND co.orderId = :orderId';
      replacements.orderId = orderId;
    }

    // 1️⃣ Fetch cancel orders with user and order info
    const cancelOrdersQuery = `
      SELECT 
        co.id AS cancelOrderId,
        co.orderId AS orderId,
        co.userId AS userId,
        co.reason,
        co.status AS cancelStatus,
        co.cancelled_at,
        JSON_OBJECT(
          'id', u.id,
          'firstName', u.firstName,
          'lastName', u.lastName,
          'email', u.email
        ) AS user,
        JSON_OBJECT(
          'id', o.id,
          'total_amount', o.total_amount,
          'status', o.status,
          'shipping_address', o.shipping_address,
          'billing_address', o.billing_address
        ) AS order_info
      FROM cancel_orders co
      LEFT JOIN users u ON u.id = co.userId
      LEFT JOIN orders o ON o.id = co.orderId
      ${whereClause}
      ORDER BY co.cancelled_at DESC
    `;

    const cancelOrders = await sequelize.query(cancelOrdersQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const orderIds = cancelOrders.map(c => c.orderId);
    if (!orderIds.length) {
      return res.status(200).json({
        status: "success",
        message: "Cancel orders fetched successfully",
        data: []
      });
    }

    // 2️⃣ Fetch order items + product info
    const orderItemsQuery = `
      SELECT 
        oi.id AS orderItemId,
        oi.order_id AS orderId,
        oi.product_id AS productId,
        oi.quantity,
        oi.price,
        oi.total,
        JSON_OBJECT(
          'id', p.id,
          'name', p.heading,
          'description', p.details,
          'price', p.price,
          'mrp', p.mrp,
          'product_type', p.product_type,
          'brand', p.brand,
          'item', p.item,
          'status', p.status,
          'specification', p.specification,
          'measure', p.measure,
          'selling_measure', p.selling_measure,
          'measure_term', p.measure_term,
          'measure_value', p.measure_value,
          'selling_measure_rate', p.selling_measure_rate,
          'unit_mrp_incl_gst', p.unit_mrp_incl_gst,
          'discount_rule', p.discount_rule,
          'discount_value', p.discount_value,
          'delivery_time', p.delivery_time,
          'delivery_charges', p.delivery_charges,
          'coupon_code_apply', p.coupon_code_apply,
          'logistics_rule', p.logistics_rule,
          'gst', p.gst
        ) AS product
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id IN (:orderIds)
    `;
    const orderItems = await sequelize.query(orderItemsQuery, {
      replacements: { orderIds },
      type: sequelize.QueryTypes.SELECT
    });

    // 3️⃣ Fetch product images
    const productIds = [...new Set(orderItems.map(oi => oi.productId))];
    let productImages = [];
    if (productIds.length) {
      const imagesQuery = `
        SELECT productId, image_url
        FROM product_images
        WHERE productId IN (:productIds) AND status = 'active'
        ORDER BY is_primary DESC, display_order ASC
      `;
      productImages = await sequelize.query(imagesQuery, {
        replacements: { productIds },
        type: sequelize.QueryTypes.SELECT
      });
    }

    // Merge images into products
    const productImageMap = {};
    productImages.forEach(img => {
      if (!productImageMap[img.productId]) productImageMap[img.productId] = [];
      productImageMap[img.productId].push(img.image_url);
    });

    const orderItemsWithImages = orderItems.map(oi => {
      const product = typeof oi.product === 'string' ? JSON.parse(oi.product) : oi.product;
      product.images = productImageMap[oi.productId] || [];
      return { ...oi, product };
    });

    // Merge orderItems into orders
    const finalData = cancelOrders.map(co => {
      const orderObj = typeof co.order_info === 'string' ? JSON.parse(co.order_info) : co.order_info;
      orderObj.orderItems = orderItemsWithImages.filter(oi => oi.orderId === co.orderId);
      return { ...co, order: orderObj };
    });

    return res.status(200).json({
      status: "success",
      message: "Cancel orders fetched successfully",
      data: finalData
    });

  } catch (error) {
    console.error('Error fetching cancel orders:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cancel orders',
      error: error.message
    });
  }
};
//Add a cancel order request
exports.addCancelOrder = async (req, res) => {
  try {
    const { orderId, userId, reason } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({ status: 'error', message: 'orderId and userId are required' });
    }

    // Optional: Check if order exists
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const cancelOrder = await CancelOrder.create({ orderId, userId, reason });
    order.status = 'cancelled';
    await order.save();

    return res.status(201).json({
      status: 'success',
      message: 'Cancel order request submitted successfully',
      data: cancelOrder
    });
  } catch (error) {
    console.error('Error adding cancel order:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to submit cancel order', error: error.message });
  }
};

//Update cancel order status by ID
exports.updateCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const cancelOrder = await CancelOrder.findByPk(id);
    if (!cancelOrder) {
      return res.status(404).json({ status: 'error', message: 'Cancel order not found' });
    }

    await cancelOrder.update({ status, reason });

    return res.status(200).json({
      status: 'success',
      message: 'Cancel order updated successfully',
      data: cancelOrder
    });
  } catch (error) {
    console.error('Error updating cancel order:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update cancel order', error: error.message });
  }
};

//Delete cancel order by ID
exports.deleteCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const cancelOrder = await CancelOrder.findByPk(id);
    if (!cancelOrder) {
      return res.status(404).json({ status: 'error', message: 'Cancel order not found' });
    }

    await cancelOrder.destroy();

    return res.status(200).json({ status: 'success', message: 'Cancel order deleted successfully' });
  } catch (error) {
    console.error('Error deleting cancel order:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to delete cancel order', error: error.message });
  }
};
