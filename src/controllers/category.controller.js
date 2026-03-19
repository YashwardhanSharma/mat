// controllers/categoryController.js
const Category = require('../models/category.model.js');

/**
 * Create a category
 * POST /api/categories
 * body: { name, description, status }
 */
async function createCategory(req, res, next) {
  try {
    const { name, description, status } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const existing = await Category.findOne({ where: { name } });
    if (existing) return res.status(409).json({ error: 'Category with same name already exists' });

    const cat = await Category.create({ name, description, status });
    return res.status(201).json(cat);
  } catch (err) {
    next(err);
  }
}

/**
 * List categories
 * GET /api/categories
 * query: onlyActive=true|false, q, limit, offset
 */
async function listCategories(req, res, next) {
  try {
    const { onlyActive = 'true', q, limit = 100, offset = 0 } = req.query;
    const where = {};
    if (onlyActive === 'true') where.status = 'ACTIVE';
    if (q) where.name = { [require('sequelize').Op.like]: `%${q}%` };

    const categories = await Category.findAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['name', 'ASC']]
    });

    return res.json(categories);
  } catch (err) {
    next(err);
  }
}

/**
 * Get one by id
 * GET /api/categories/:id
 */
async function getCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    return res.json(cat);
  } catch (err) {
    next(err);
  }
}

/**
 * Update category
 * PUT /api/categories/:id
 * body: { name, description, status }
 */
async function updateCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, description, status } = req.body;

    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    // optional: check name uniqueness
    if (name && name !== cat.name) {
      const exists = await Category.findOne({ where: { name } });
      if (exists) return res.status(409).json({ error: 'Another category with same name exists' });
    }

    await cat.update({ name: name ?? cat.name, description: description ?? cat.description, status: status ?? cat.status });
    return res.json(cat);
  } catch (err) {
    next(err);
  }
}

/**
 * Soft delete (recommended)
 * PATCH /api/categories/:id/deactivate
 */
async function deactivateCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    await cat.update({ status: 'INACTIVE' });
    return res.json({ success: true, category: cat });
  } catch (err) {
    next(err);
  }
}

/**
 * Hard delete (use with caution)
 * DELETE /api/categories/:id
 */
async function deleteCategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    await cat.destroy();
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deactivateCategory,
  deleteCategory
};
