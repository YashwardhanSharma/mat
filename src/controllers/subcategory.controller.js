// controllers/subcategoryController.js
const Subcategory = require('../models/subcategory.model');
const { Op } = require('sequelize');

/**
 * Create a subcategory
 * POST /api/subcategories
 * body: { category_name, name, description, status }
 */
async function createSubcategory(req, res, next) {
  try {
    const { category_name, name, description, status } = req.body;

    if (!category_name || !name) {
      return res.status(400).json({ error: 'category_name and name are required' });
    }

    // optional uniqueness check: same category_name + name combination
    const exists = await Subcategory.findOne({
      where: {
        category_name,
        name
      }
    });
    if (exists) return res.status(409).json({ error: 'Subcategory with same name in this category already exists' });

    const subcat = await Subcategory.create({
      category_name,
      name,
      description: description || null,
      status: status || undefined
    });

    return res.status(201).json(subcat);
  } catch (err) {
    next(err);
  }
}

/**
 * List subcategories
 * GET /api/subcategories
 * query: onlyActive=true|false, q, category_name, limit, offset
 */
async function listSubcategories(req, res, next) {
  try {
    const { onlyActive = 'true', category_name, limit = 100, offset = 0 } = req.query;

    const where = {};
    if (onlyActive === 'true') where.status = 'ACTIVE';
    if (category_name) where.category_name = category_name;
    
    const results = await Subcategory.findAll({
      where,
      limit: Number(limit),
      offset: Number(offset),
      order: [['category_name', 'ASC'], ['name', 'ASC']]
    });

    return res.status(200).json({
      status: 'success',
      message: 'Subcategories retrieved successfully',
      data: results
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Get one by id
 * GET /api/subcategories/:id
 */
async function getSubcategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const subcat = await Subcategory.findByPk(id);
    if (!subcat) return res.status(404).json({ error: 'Subcategory not found' });
    return res.json(subcat);
  } catch (err) {
    next(err);
  }
}

/**
 * Update subcategory
 * PUT /api/subcategories/:id
 * body: { category_name, name, description, status }
 */
async function updateSubcategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { category_name, name, description, status } = req.body;

    const subcat = await Subcategory.findByPk(id);
    if (!subcat) return res.status(404).json({ error: 'Subcategory not found' });

    // if changing name or category_name, ensure uniqueness
    if ((name && name !== subcat.name) || (category_name && category_name !== subcat.category_name)) {
      const exists = await Subcategory.findOne({
        where: {
          id: { [Op.ne]: id },
          category_name: category_name || subcat.category_name,
          name: name || subcat.name
        }
      });
      if (exists) return res.status(409).json({ error: 'Another subcategory with same name in this category exists' });
    }

    await subcat.update({
      category_name: category_name ?? subcat.category_name,
      name: name ?? subcat.name,
      description: description ?? subcat.description,
      status: status ?? subcat.status
    });

    // return updated instance
    const updated = await Subcategory.findByPk(id);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Soft delete (deactivate)
 * PATCH /api/subcategories/:id/deactivate
 */
async function deactivateSubcategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const subcat = await Subcategory.findByPk(id);
    if (!subcat) return res.status(404).json({ error: 'Subcategory not found' });

    await subcat.update({ status: 'INACTIVE' });
    return res.json({ success: true, subcategory: subcat });
  } catch (err) {
    next(err);
  }
}

/**
 * Hard delete (permanent)
 * DELETE /api/subcategories/:id
 */
async function deleteSubcategory(req, res, next) {
  try {
    const id = Number(req.params.id);
    const subcat = await Subcategory.findByPk(id);
    if (!subcat) return res.status(404).json({ error: 'Subcategory not found' });

    await subcat.destroy();
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * Get subcategories by category name
 * GET /api/subcategories/:category_name
 */
async function getSubcategoriesByCategoryName(req, res, next) {
  try {
    const categoryName = req.params.category_name;
    console.log("categoryName >>>>>>>>>", categoryName);
    const subcategories = await Subcategory.findAll({ where: { category_name: categoryName } });
    console.log("subcategories >>>>>>>>>", subcategories);
    return res.status(200).json({
      status: 'success',
      message: 'Subcategories retrieved successfully',
      data: subcategories
    });
  } catch (err) {
    next(err);
  }   
}
module.exports = {
  createSubcategory,
  listSubcategories,
  getSubcategory,
  updateSubcategory,
  deactivateSubcategory,
  deleteSubcategory,
  getSubcategoriesByCategoryName
};
