const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const cartRoutes = require('./routes/cart.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const addressRoutes = require('./routes/address.routes');
const gstnRoutes = require('./routes/gstn.routes');
const faqRoutes = require('./routes/faq.routes');
const ratingRoutes = require('./routes/rating.routes');
const cancelOrderRoutes = require('./routes/cancelOrder.routes');
const reportBugRoutes = require('./routes/reportBug.routes');
const userRoutes = require('./routes/user.routes');
const businessDetailsRoutes = require('./routes/businessDetails.route');
const authAdminRoutes = require('./routes/authAdmin.routes');
const adminRoutes = require('./routes/admin.routes');
const userFavoriteRoutes = require('./routes/favorite.routes');
const userMediaRoutes = require('./routes/userMedia.routes');


// Load environment variables
require('dotenv').config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());

// Serve static files from uploads directory
const path = require('path');
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Serving static files from:', uploadsPath);

// Ensure uploads directory exists
const fs = require('fs');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Debug middleware for static files
app.use('/uploads', (req, res, next) => {
  console.log('Request for static file:', req.path);
  const filePath = path.join(uploadsPath, req.path);
  console.log('Looking for file at:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  next();
}, express.static(uploadsPath));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Test route
app.get('/', (req, res) => {
  res.send('E-commerce API is running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/gstn', gstnRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/cancelOrders', cancelOrderRoutes);
app.use('/api/reportBugs', reportBugRoutes);
app.use('/api/user', userRoutes);
app.use('/api/business-details', businessDetailsRoutes);
app.use('/api/admin/auth', authAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorite', userFavoriteRoutes);
app.use('/api/userMedia', userMediaRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Sync database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
