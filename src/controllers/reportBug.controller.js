const ReportBug = require('../models/reportBug.model');
const User = require('../models/user.model');
const Order = require('../models/order.model');

// Get all bug reports
exports.getAllBugs = async (req, res) => {
  try {
    const { userId, orderId, status, priority } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const bugs = await ReportBug.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Order, as: 'order', attributes: ['id', 'total_amount', 'status'] }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      message: 'Bug reports fetched successfully',
      data: bugs
    });

  } catch (error) {
    console.error('Error fetching bug reports:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to fetch bug reports', error: error.message });
  }
};

// Add a bug report
exports.addBugReport = async (req, res) => {
  try {
    const { userId, orderId, title, description, image_url, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ status: 'error', message: 'Title and description are required' });
    }

    const bug = await ReportBug.create({
      userId,
      orderId,
      title,
      description,
      image_url,
      priority
    });

    return res.status(201).json({
      status: 'success',
      message: 'Bug report added successfully',
      data: bug
    });

  } catch (error) {
    console.error('Error adding bug report:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to add bug report', error: error.message });
  }
};

//Update a bug report by ID
exports.updateBugReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image_url, status, priority } = req.body;

    const bug = await ReportBug.findByPk(id);
    if (!bug) {
      return res.status(404).json({ status: 'error', message: 'Bug report not found' });
    }

    await bug.update({ title, description, image_url, status, priority });

    return res.status(200).json({
      status: 'success',
      message: 'Bug report updated successfully',
      data: bug
    });

  } catch (error) {
    console.error('Error updating bug report:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to update bug report', error: error.message });
  }
};

//Delete a bug report by ID
exports.deleteBugReport = async (req, res) => {
  try {
    const { id } = req.params;

    const bug = await ReportBug.findByPk(id);
    if (!bug) {
      return res.status(404).json({ status: 'error', message: 'Bug report not found' });
    }

    await bug.destroy();

    return res.status(200).json({ status: 'success', message: 'Bug report deleted successfully' });

  } catch (error) {
    console.error('Error deleting bug report:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to delete bug report', error: error.message });
  }
};
