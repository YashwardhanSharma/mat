const User = require('../models/user.model');
const Product = require('../models/product.model');
const ProductImage = require('../models/productImage.model');
const sequelize = require('../config/db');
const Order = require('../models/order.model');
const OrderItem = require('../models/orderItem.model');
const AdminProductImage = require('../models/admin_product_images.model');
const Category = require('../models/category.model');
const Subcategory = require('../models/subcategory.model');
const constant = require('../config/constant');
const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config();

const DEFAULT_PRODUCT_IMAGE_DIR = path.join(__dirname, '..', 'uploads', 'products', 'default', 'images');
const DEFAULT_PRODUCT_IMAGE_URL_PATH = '/uploads/products/default/images';
const IMAGE_PLACEHOLDERS = new Set(['', 'na', 'n/a', 'n_a', 'null', 'undefined', 'none', '-']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

const normalizeImageKey = (value) => String(value || '')
  .trim()
  .replace(/\s+/g, ' ')
  .replace(/[\s_/]+/g, '_')
  .replace(/\.+$/, '')
  .toLowerCase();

const stripImageExtension = (value) => {
  const ext = path.extname(value).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext) ? value.slice(0, -ext.length) : value;
};

const stripCopySuffix = (value) => value.replace(/\s*\(\d+\)$/, '');

const buildImageLookup = async () => {
  const files = await fs.readdir(DEFAULT_PRODUCT_IMAGE_DIR);
  const lookup = new Map();

  files.forEach((file) => {
    const parsed = path.parse(file);
    const cleanName = stripCopySuffix(parsed.name).trim();
    const keys = [
      file,
      parsed.name,
      `${parsed.name}${parsed.ext}`,
      parsed.name.trim(),
      `${parsed.name.trim()}${parsed.ext}`,
      cleanName,
      `${cleanName}${parsed.ext}`
    ];

    keys.forEach((key) => {
      const normalizedKey = normalizeImageKey(key);
      if (normalizedKey && !lookup.has(normalizedKey)) {
        lookup.set(normalizedKey, file);
      }
    });
  });

  return lookup;
};

const resolveProductImageFile = (imageValue, imageLookup) => {
  const rawValue = String(imageValue || '').trim();
  const normalizedValue = normalizeImageKey(rawValue);

  if (IMAGE_PLACEHOLDERS.has(normalizedValue)) {
    return null;
  }

  return imageLookup.get(normalizedValue) || imageLookup.get(normalizeImageKey(stripImageExtension(rawValue))) || null;
};

const toDefaultProductImageUrl = (hostName, filename) =>
  `${hostName}${DEFAULT_PRODUCT_IMAGE_URL_PATH}/${encodeURIComponent(filename)}`;

// Upload product images
exports.uploadProductImages = async (req, res) => {
    try {
      // The files and form data are already processed by multer middleware
      const baseUrl = `${constant.HOST}`;
      const userId = req.body.userId || 'default';
      const productId = req.body.productId; // Get productId from form data if provided
  
      // Get the uploaded files
      const files = req.files || [];
  
      if (files.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No files were uploaded.'
        });
      }
  
      // Create array of image URLs and file info
      const uploadedImages = files.map(file => {
        const imageUrl = `${baseUrl}/uploads/products/${userId}/${file.filename}`;
        return {
          url: imageUrl,
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          // Add productId to each image if provided
          ...(productId && { productId })
        };
      });
  
      // Here you could save the image references to your database
      // Example: await ProductImage.bulkCreate(uploadedImages);
  
      res.status(200).json({
        status: 'success',
        message: 'Product images uploaded successfully!',
        images: uploadedImages
      });
  
    } catch (error) {
      console.error('Upload product images error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload product images',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  };


//Add Bulke Product
exports.addBulkeProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Excel file is required' });
    }

    const userId = req.body.userId || 'default';
    const filePath = req.file.path;

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No data found in the Excel file' });
    }

    const imageLookup = await buildImageLookup();
    const missingImages = new Set();

    for (const row of rows) {

      const product_type = row["Category"] || "N/A";
      const subcategory_name = row["Sub Category"] || "N/A";

      // ✅ FULL SPECIFICATION FIX
      const specification = {
        title: row["Sub Variant Title"] || "",
        value: row["Sub Variant Value"] || "",
        title1: row["Sub Variant Title.1"] || "",
        value1: row["Sub Variant Value.1"] || "",
        title2: row["Sub Variant Title.2"] || "",
        value2: row["Sub Variant Value.2"] || "",
        value3: row["Sub Variant Value.3"] || ""
      };

      // ✅ CATEGORY
      if (product_type && product_type !== "N/A") {
        const existing = await Category.findOne({ where: { name: product_type } });
        if (!existing) {
          await Category.create({
            name: product_type,
            description: "",
            status: "ACTIVE"
          });
        }
      }

      // ✅ SUBCATEGORY
      if (subcategory_name && product_type) {
        const subcategory = await Subcategory.findOne({
          where: { category_name: product_type, name: subcategory_name }
        });

        if (!subcategory) {
          await Subcategory.create({
            category_name: product_type,
            name: subcategory_name,
            description: "",
            status: "ACTIVE"
          });
        }
      }

      const user = await User.findByPk(userId);

      // ✅ PRODUCT CREATE (ALL FIELDS COVERED)
      const product = await Product.create({
        userId,
        userType: user?.userType || 'admin',
        productImageUrl: "",

        // BASIC
        heading: row["Product Name"] || "",
        sub_heading: row["Sub Product Name"] || "",
        details: row["Product Description"] || "",

        // 🔥 NEW FIELDS
        alternate_names: row["Alternate Names (for search)"] || "",
        variant_title: row["Variant Title"] || "",
        size: row["Size"] || "",
        product_code: row["Product Code"] || "",
        bulk_application: row["Bulk application"] || "",
        unit_weight: row["Unit Weight (in gm)"] || "",
        supplied_with: row["Supplied With"] || "",
        suitable_for: row["Suitable For"] || "",
        hsn_code: row["HSN Code"] || "",

        // PRODUCT
        product_type,
        brand: row["Brand"] || "",
        item: row["Variant Value"] || "",

        // STOCK
        stock_quantity: row["Pack of"] || 0,

        // PRICE
        price: row["Price after discount"] || 0,
        mrp: row["Buying Price"] || 0,
        sale_price: row["Sale Price"] || 0,
        rev_margin: row["Rev Margin"] || "",
        margin_value: row["Margin Value"] || "",

        // DISCOUNT
        discount_rule: row["Discount Rule"] || "percentage",
        discount_value: row["Discount Value"] || "",
        discount_rate: row["Discount Rate"] || "",

        // TAX
        gst: row["GST"] || "",

        // MEASURE
        measure: row["Measure"] || "",
        selling_measure: row["Selling Measure"] || "",
        measure_term: row["Measure Term"] || "",
        measure_value: row["Measure Value"] || "",
        selling_measure_rate: row["Selling Measure Rate"] || "",

        // ✅ FIXED COLUMN NAME
        unit_mrp_incl_gst: row["MRP (Incl GST)"] || "",

        // LOGISTICS
        delivery_time: row["Delivery Time"] || "",
        logistics_rule: row["Logistics Rule"] || "",
        returns: row["Returns"] || "",

        // STATUS
        status: row["Status"]?.toLowerCase() === "active" ? "active" : "inactive",

        coupon_code_apply: row["Coupon Code Apply"] || "No",

        // SPEC
        specification: JSON.stringify(specification)
      });

      const imageField = row["IMAGES  35 Images left"];

      if (imageField) {
        const images = String(imageField)
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

        if (images.length > 0) {
          const hostName = constant.HOST;
          const resolvedImages = images
            .map((image) => {
              const filename = resolveProductImageFile(image, imageLookup);
              if (!filename) {
                const normalizedImage = normalizeImageKey(image);
                if (!IMAGE_PLACEHOLDERS.has(normalizedImage)) {
                  missingImages.add(image);
                }
                return null;
              }
              return filename;
            })
            .filter(Boolean);

          const imageData = resolvedImages.map((filename, index) => ({
            productId: product.id,
            image_url: toDefaultProductImageUrl(hostName, filename),
            is_primary: index === 0,
            display_order: index,
            status: 'active'
          }));

          if (imageData.length > 0) {
            await ProductImage.bulkCreate(imageData);
          }
        }
      }
    }

    return res.status(200).json({
      status: 'success',
      message: 'Bulk Product added successfully',
      rows: rows.length,
      missingImages: Array.from(missingImages)
    });

  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add product',
      error: error.message
    });
  }
};

  // Add a new product
exports.addProduct = async (req, res) => {
    try {
      const {
        userId,
        heading,
        productImageUrl,
        sub_heading,
        alternate_names,
        variant_title,
        size,
        product_code,
        bulk_application,
        unit_weight,
        supplied_with,
        suitable_for,
        hsn_code,
        details,
        price,
        mrp,
        sale_price,
        rev_margin,
        margin_value,
        specification,
        product_type,
        brand,
        item,
        status = 'active',
        stock_quantity = 0,
        measure,
        selling_measure,
        measure_term,
        measure_value,
        selling_measure_rate,
        unit_mrp_incl_gst,
        discount_rule,
        discount_value,
        discount_rate,
        delivery_time,
        logistics_rule,
        returns,
        gst,
        delivery_charges,
        coupon_code_apply,
        images = [] // optional array of image URLs
      } = req.body;
  
      // Basic validation
      if (!userId || !heading || !price || !mrp || !product_type || !brand || !item) {
        return res.status(400).json({
          status: 'error',
          message: 'Required fields: userId, heading, price, mrp, product_type, brand, item'
        });
      }
      console.log("req.body", req.body);
      const user = await User.findByPk(userId);
      console.log("user", user);

      // Create the product
      const product = await Product.create({
        userId,
        productImageUrl,
        userType:user?.userType || 'admin',
        heading,
        sub_heading: sub_heading || null,
        alternate_names: alternate_names || null,
        variant_title: variant_title || null,
        size: size || null,
        product_code: product_code || null,
        bulk_application: bulk_application || null,
        unit_weight: unit_weight || null,
        supplied_with: supplied_with || null,
        suitable_for: suitable_for || null,
        hsn_code: hsn_code || null,
        details: details || null,
        price,
        mrp,
        sale_price: sale_price || null,
        rev_margin: rev_margin || null,
        margin_value: margin_value || null,
        specification: specification ? JSON.stringify(specification) : null,
        product_type,
        brand,
        item,
        status,
        stock_quantity,
        measure,
        selling_measure,
        measure_term,
        measure_value,
        selling_measure_rate,
        unit_mrp_incl_gst,
        discount_rule: discount_rule || 'percentage',
        discount_value,
        discount_rate,
        delivery_time,
        logistics_rule,
        returns,
        gst,
        delivery_charges,
        coupon_code_apply,
      });
  
      // If images array is provided, save them in ProductImage table
      const imageList = Array.isArray(images) ? images : [];
      if (imageList.length > 0) {
        const imageData = imageList.map((url, index) => ({
          productId: product.id,
          image_url: url,
          is_primary: index === 0 ? true : false, // first image primary
          display_order: index,
          status: 'active'
        }));
        await ProductImage.bulkCreate(imageData);
      }
  
      res.status(201).json({
        status: 'success',
        message: 'Product added successfully',
        data: { productId: product.id }
      });
  
    } catch (error) {
      console.error('Add product error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to add product',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
};

// controllers/product.controller.js

exports.updateProduct = async (req, res) => {
    try {
      const {
        productId,
        heading,
        productImageUrl,
        sub_heading,
        alternate_names,
        variant_title,
        size,
        product_code,
        bulk_application,
        unit_weight,
        supplied_with,
        suitable_for,
        hsn_code,
        details,
        price,
        mrp,
        sale_price,
        rev_margin,
        margin_value,
        specification,
        product_type,
        brand,
        item,
        status,
        stock_quantity,
        measure,
        selling_measure,
        measure_term,
        measure_value,
        selling_measure_rate,
        unit_mrp_incl_gst,
        discount_rule,
        discount_value,
        discount_rate,
        delivery_time,
        logistics_rule,
        returns,
        gst,
        delivery_charges,
        coupon_code_apply,
        images = []
      } = req.body;
  
      // Basic validation
      if (!productId) {
        return res.status(400).json({
          status: 'error',
          message: 'Product ID is required'
        });
      }
  
      // Find the existing product
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }
  
      // Update only provided fields
      product.productImageUrl = productImageUrl || product.productImageUrl;
      product.heading = heading || product.heading;
      product.sub_heading = sub_heading || product.sub_heading;
      if (typeof alternate_names !== 'undefined') product.alternate_names = alternate_names;
      if (typeof variant_title !== 'undefined') product.variant_title = variant_title;
      if (typeof size !== 'undefined') product.size = size;
      if (typeof product_code !== 'undefined') product.product_code = product_code;
      if (typeof bulk_application !== 'undefined') product.bulk_application = bulk_application;
      if (typeof unit_weight !== 'undefined') product.unit_weight = unit_weight;
      if (typeof supplied_with !== 'undefined') product.supplied_with = supplied_with;
      if (typeof suitable_for !== 'undefined') product.suitable_for = suitable_for;
      if (typeof hsn_code !== 'undefined') product.hsn_code = hsn_code;
      product.details = details || product.details;
      product.price = price || product.price;
      product.mrp = mrp || product.mrp;
      if (typeof sale_price !== 'undefined') product.sale_price = sale_price;
      if (typeof rev_margin !== 'undefined') product.rev_margin = rev_margin;
      if (typeof margin_value !== 'undefined') product.margin_value = margin_value;
      product.specification = specification
        ? JSON.stringify(specification)
        : product.specification;
      product.product_type = product_type || product.product_type;
      product.brand = brand || product.brand;
      product.item = item || product.item;
      product.status = status || product.status;
      product.stock_quantity =
        typeof stock_quantity !== 'undefined'
          ? stock_quantity
          : product.stock_quantity;
      // new fields
      if (typeof measure !== 'undefined') product.measure = measure;
      if (typeof selling_measure !== 'undefined') product.selling_measure = selling_measure;
      if (typeof measure_term !== 'undefined') product.measure_term = measure_term;
      if (typeof measure_value !== 'undefined') product.measure_value = measure_value;
      if (typeof selling_measure_rate !== 'undefined') product.selling_measure_rate = selling_measure_rate;
      if (typeof unit_mrp_incl_gst !== 'undefined') product.unit_mrp_incl_gst = unit_mrp_incl_gst;
      if (typeof discount_rule !== 'undefined') product.discount_rule = discount_rule || 'percentage';
      if (typeof discount_value !== 'undefined') product.discount_value = discount_value;
      if (typeof discount_rate !== 'undefined') product.discount_rate = discount_rate;
      if (typeof delivery_time !== 'undefined') product.delivery_time = delivery_time;
      if (typeof logistics_rule !== 'undefined') product.logistics_rule = logistics_rule;
      if (typeof returns !== 'undefined') product.returns = returns;
      if (typeof gst !== 'undefined') product.gst = gst;
      if (typeof delivery_charges !== 'undefined') product.delivery_charges = delivery_charges;
      if (typeof coupon_code_apply !== 'undefined') product.coupon_code_apply = coupon_code_apply;
  
      await product.save();
  
      // Update product images if provided
      const imageList = Array.isArray(images) ? images : [];
      if (imageList.length > 0) {
        // Remove old images
        await ProductImage.destroy({ where: { productId: product.id } });
  
        // Add new images
        const imageData = imageList.map((url, index) => ({
          productId: product.id,
          image_url: url,
          is_primary: index === 0 ? true : false,
          display_order: index,
          status: 'active'
        }));
  
        await ProductImage.bulkCreate(imageData);
      }
  
      res.status(200).json({
        status: 'success',
        message: 'Product updated successfully',
        data: { productId: product.id }
      });
  
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update product',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  };
  

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
      const { id } = req.params; // product ID from route
  
      if (!id) {
        return res.status(400).json({ status: 'error', message: 'Product ID is required' });
      }
  
      const query = `
        SELECT 
          p.id,
          p.userId,
          p.heading AS name,
          p.sub_heading,
          p.details AS description,
          p.price,
          p.mrp,
          p.specification,
          p.product_type,
          p.brand,
          p.item,
          p.status,
          p.productImageUrl,
          p.measure,
          p.selling_measure,
          p.measure_term,
          p.measure_value,
          p.selling_measure_rate,
          p.unit_mrp_incl_gst,
          p.discount_rule,
          p.discount_value,
          p.delivery_time,
          p.logistics_rule,
          p.gst,
          p.delivery_charges,
          p.coupon_code_apply,
          GROUP_CONCAT(pi.image_url ORDER BY pi.is_primary DESC, pi.display_order ASC, pi.id ASC) AS images
        FROM products p
        LEFT JOIN product_images pi
          ON pi.productId = p.id AND pi.status = 'active'
        WHERE p.id = :id AND p.status = 'active'
        GROUP BY p.id
        LIMIT 1
      `;
  
      const [product] = await sequelize.query(query, {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT
      });
  
      if (!product) {
        return res.status(404).json({ status: 'error', message: 'Product not found' });
      }
  
      // Format product
      const formattedProduct = {
        id: product.id,
        name: product.name,
        sub_heading: product.sub_heading,
        description: product.description,
        price: parseFloat(product.price),
        mrp: parseFloat(product.mrp || product.price),
        specification: product.specification,
        discount: product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0,
        product_type: product.product_type,
        brand: product.brand,
        item: product.item,
        status: product.status,
        productImageUrl: product.productImageUrl,
        measure: product.measure,
        selling_measure: product.selling_measure,
        measure_term: product.measure_term,
        measure_value: product.measure_value,
        selling_measure_rate: product.selling_measure_rate,
        unit_mrp_incl_gst: product.unit_mrp_incl_gst,
        discount_rule: product.discount_rule,
        discount_value: product.discount_value,
        delivery_time: product.delivery_time,
        logistics_rule: product.logistics_rule,
        gst: product.gst,
        delivery_charges: product.delivery_charges,
        coupon_code_apply: product.coupon_code_apply,
        images: product.images ? product.images.split(',') : []
      };
  
      res.status(200).json({
        status: 'success',
        data: formattedProduct
      });
  
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch product',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  };


  // Get all products by user Id
exports.getAllProducts = async (req, res) => {
    try {
      const { 
        userType,
        userId,
        page = 1, 
        limit = 10, 
        product_type, 
        item,
        brand, 
        price, 
        // maxPrice, 
        search, 
        sortBy = 'created_at', 
        order = 'DESC' 
      } = req.query;
      const offset = (page - 1) * limit;
  
      // Build WHERE clause
      let whereClause = `WHERE p.status = 'active'`;
      const replacements = {};

    if (userType && userType.trim() !== "") {
        whereClause += ` AND p.userType = :userType`;
        replacements.userType = userType.trim();
    }     

    if (userId && userId.trim() !== "" && userId.trim() !== '""') {
        whereClause += ` AND p.userId = :userId`;
        replacements.userId = userId;
    }

    if (product_type && product_type.trim() !== "" && product_type.trim() !== '""') {
        whereClause += ` AND TRIM(p.product_type) = :product_type`;
        replacements.product_type = product_type.trim();
    }
    
    if (item && item.trim() !== "" && item.trim() !== '""') {
        const cleanItem = item.trim().replace(/^['"]+|['"]+$/g, '').trim(); // remove quotes
      
        whereClause += ` AND LOWER(TRIM(p.item)) LIKE :item`;
        replacements.item = `${cleanItem.toLowerCase()}%`; // starts with given text
      }   
      
      // sanitize brand from query
      let brandRaw = req.query?.brand;           
      let brandClean = '';
  
      if (typeof brandRaw !== 'undefined' && brandRaw !== null) {
        brandClean = String(brandRaw).trim();
  
        // Remove surrounding single or double quotes (and any extras)
        // e.g. '"Greenply"' -> 'Greenply',  '""' -> ''
        brandClean = brandClean.replace(/^['"]+|['"]+$/g, '').trim();
  
        // Optionally decode URI components if frontend double-encodes
        try { brandClean = decodeURIComponent(brandClean); } catch (e) { /* ignore */ }
  
        // final trim after decode
        brandClean = brandClean.trim();
      }
  
      // Only add the brand WHERE clause when cleaned value is non-empty
      if (brandClean.length > 0) {
        whereClause += ` AND LOWER(TRIM(p.brand)) = :brand`;
        replacements.brand = brandClean.toLowerCase();
      }
      // Price filters
      // Always filter price > 0
      whereClause += ` AND p.price >= 0`;
  
      if (price) {
        whereClause += ` AND p.price <= :price`;
        replacements.price = parseFloat(price);
      }
  
      console.log("whereClause", whereClause);
      console.log("replacements", replacements);
      // if (search) {
      //   whereClause += ` AND (p.heading LIKE :search OR p.sub_heading LIKE :search OR p.details LIKE :search)`;
      //   replacements.search = `%${search}%`;
      // }
  
      // Sorting
      let orderBy = `ORDER BY p.created_at DESC`;
      if (['price', 'created_at'].includes(sortBy)) {
        orderBy = `ORDER BY p.${sortBy} ${order}`;
      }
  
      // SQL query with GROUP_CONCAT to get all images
      const query = `
        SELECT 
          p.id,
          p.userId,
          p.heading AS name,
          p.sub_heading,
          p.details AS description,
          p.price,
          p.mrp,
          p.specification,
          p.product_type,
          p.brand,
          p.item,
          p.status,
          p.productImageUrl,
          p.measure,
          p.selling_measure,
          p.measure_term,
          p.measure_value,
          p.selling_measure_rate,
          p.unit_mrp_incl_gst,
          p.discount_rule,
          p.discount_value,
          p.delivery_time,
          p.logistics_rule,
          p.gst,
          p.delivery_charges,
          p.coupon_code_apply,
          GROUP_CONCAT(pi.image_url ORDER BY pi.is_primary DESC, pi.display_order ASC, pi.id ASC) AS images
        FROM products p
        LEFT JOIN product_images pi
          ON pi.productId = p.id AND pi.status = 'active'
        ${whereClause}
        GROUP BY p.id
        ${orderBy}
        LIMIT :limit OFFSET :offset
      `;
  
      // Count query for pagination
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM products p
        ${whereClause}
      `;
  
      replacements.limit = parseInt(limit);
      replacements.offset = offset;
  
      const products = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
  
      const [countResult] = await sequelize.query(countQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      });
  
      const total = countResult.total;
  
      // Format products
      const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        sub_heading: p.sub_heading,
        description: p.description,
        price: parseFloat(p.price),
        mrp: parseFloat(p.mrp || p.price),
        specification: p.specification,
        discount: p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0,
        product_type: p.product_type,
        brand: p.brand,
        item: p.item,
        status: p.status,
        productImageUrl: p.productImageUrl,
        measure: p.measure,
        selling_measure: p.selling_measure,
        measure_term: p.measure_term,
        measure_value: p.measure_value,
        selling_measure_rate: p.selling_measure_rate,
        unit_mrp_incl_gst: p.unit_mrp_incl_gst,
        discount_rule: p.discount_rule,
        discount_value: p.discount_value,
        delivery_time: p.delivery_time,
        logistics_rule: p.logistics_rule,
        gst: p.gst,
        delivery_charges: p.delivery_charges,
        coupon_code_apply: p.coupon_code_apply,
        selling_price: p.selling_price,
        selling_price_incl_gst: p.selling_price_incl_gst,
        selling_price_incl_gst_with_discount: p.selling_price_incl_gst_with_discount,
        selling_price_with_discount: p.selling_price_with_discount,
        selling_price_with_gst: p.selling_price_with_gst,
        selling_price_with_gst_with_discount: p.selling_price_with_gst_with_discount,
        selling_price_with_discount_and_gst: p.selling_price_with_discount_and_gst,
        images: p.images ? p.images.split(',') : [] // convert comma string to array
      }));
  
      res.status(200).json({
        status: 'success',
        data: {
          pagination: {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            perPage: parseInt(limit)
          },
          products: formattedProducts,
        }
      });
  
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch products',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  }; 


  exports.getAllOrders = async (req, res) => {
    try {
      const {
        userId,        // optional filter
        page = 1,      // pagination
        limit = 10
      } = req.query;
  
      const offset = (page - 1) * limit;
  
      // 1. Fetch orders with optional user filter & pagination
      const whereOrders = {};
      if (userId && userId.trim() !== '') whereOrders.userId = userId.trim();
  
      const orders = await Order.findAll({
        where: whereOrders,
        order: [['created_at', 'DESC']],
        offset: parseInt(offset),
        limit: parseInt(limit),
        raw: true
      });
  
      // 2. Count total orders for pagination
      const totalOrders = await Order.count({ where: whereOrders });
  
      if (!orders.length)
        return res.status(200).json({
          pagination: {
            total: 0,
            totalPages: 0,
            currentPage: parseInt(page),
            perPage: parseInt(limit)
          },
          orders: []
        });
  
      const orderIds = orders.map(o => o.id);
  
      // 3. Fetch order items for all orders
      const orderItems = await OrderItem.findAll({
        where: { order_id: orderIds },
        raw: true
      });
  
      const productIds = orderItems.map(item => item.product_id);
  
      // 4. Fetch products
      const products = await Product.findAll({
        where: { id: productIds },
        raw: true
      });
  
      const productMap = {};
      products.forEach(p => (productMap[p.id] = p));
  
      // 5. Fetch product images
      const productImages = await ProductImage.findAll({
        where: { productId: productIds },
        raw: true
      });
  
      const imageMap = {};
      productImages.forEach(img => {
        if (!imageMap[img.productId]) imageMap[img.productId] = [];
        imageMap[img.productId].push(img.image_url);
      });
  
      // 6. Combine orders + items + product details
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
          items
        };
      });
  
      // 7. Return paginated result
      res.status(200).json({
        pagination: {
          total: totalOrders,
          totalPages: Math.ceil(totalOrders / limit),
          currentPage: parseInt(page),
          perPage: parseInt(limit)
        },
        orders: ordersWithDetails
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  };
  

  // PUT /api/orders/:orderId/status
exports.updateOrderStatus = async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body; // New status
  
      // Basic validation
      if (!status || status.trim() === '') {
        return res.status(400).json({
          status: 'error',
          message: 'Status is required'
        });
      }
  
      // Find the order
      const order = await Order.findByPk(orderId);
      console.log("order ", order)
      console.log("orderId", orderId)
      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found'
        });
      }
  
      // Update order status
      order.status = status.trim();
      await order.save();
  
      res.status(200).json({
        status: 'success',
        message: 'Order status updated successfully',
        data: {
          orderId: order.id,
          status: order.status
        }
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update order status',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
      });
    }
  };

exports.uploadProductImagesAdd = async (req, res) => {
  try {
    const baseUrl = `${constant.HOST}`;
    const userId = req.body.userId || 'default';
    const productId = req.body.productId;

    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files were uploaded.'
      });
    }

    const uploadedImages = files.map(file => {
      const imageUrl = `${baseUrl}/uploads/products/${userId}/${file.filename}`;
      return {
        imageUrl,
        userId,
        productId
      };
    });

    // Use bulkCreate for multiple records
    const newImages = await AdminProductImage.bulkCreate(uploadedImages);

    res.status(200).json({
      status: 'success',
      message: 'Product images uploaded successfully!',
      images: newImages
    });

  } catch (error) {
    console.error('Upload product images error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload product images',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

exports.uploadProductImagesList = async (req, res) => {
  try {
    // Fetch all images, only select the imageUrl field
    const images = await AdminProductImage.findAll({
      attributes: ['imageUrl'],
      where: { active: 1 } // optional: only active images
    });

    // Extract only URLs from the result
    const imageUrls = images.map(img => img.imageUrl);

    res.status(200).json({
      status: 'success',
      message: 'Product images fetched successfully',
      data: imageUrls
    });

  } catch (error) {
    console.error('Error fetching product images:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product images',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

exports.getUsersByType = async (req, res) => {
  try {
    const { userType } = req.query; // Get userType from query parameters

    // Validate userType
    const allowedTypes = ['customer', 'vendor', 'admin', 'subAdmin'];
    if (!userType || !allowedTypes.includes(userType)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid or missing userType. Allowed types: ${allowedTypes.join(', ')}`,
      });
    }

    // Fetch users by userType
    const users = await User.findAll({
      where: { userType },
      attributes: ['id', 'userType', 'firstName', 'lastName', 'email', 'phone', 'photo', 'notificationSetting', 'status'],
      order: [['created_at', 'DESC']], // optional: order by creation date
    });

    res.status(200).json({
      status: 'success',
      message: `Users with type '${userType}' fetched successfully`,
      data: users,
    });

  } catch (error) {
    console.error('Error fetching users by type:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};



exports.deleteProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await product.destroy();
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
}
