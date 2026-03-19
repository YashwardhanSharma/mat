const Faq = require('../models/faq.model');

// Get all FAQs
exports.getAllFaqs = async (req, res) => {
  try {
    const faqs = await Faq.findAll({
      where: { status: 'active' }, // Only active FAQs
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      message: 'FAQs fetched successfully',
      data: faqs
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch FAQs',
      error: error.message
    });
  }
};

//Add new FAQ
exports.addFaq = async (req, res) => {
  try {
    const { question, answer, category } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ status: 'error', message: 'Question and Answer are required' });
    }

    const faq = await Faq.create({ question, answer, category });

    return res.status(201).json({
      status: 'success',
      message: 'FAQ added successfully',
      data: faq
    });
  } catch (error) {
    console.error('Error adding FAQ:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add FAQ',
      error: error.message
    });
  }
};

// ✅ Update FAQ by ID
exports.updateFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, status } = req.body;

    const faq = await Faq.findByPk(id);
    if (!faq) {
      return res.status(404).json({ status: 'error', message: 'FAQ not found' });
    }

    await faq.update({ question, answer, category, status });

    return res.status(200).json({
      status: 'success',
      message: 'FAQ updated successfully',
      data: faq
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update FAQ',
      error: error.message
    });
  }
};

// ✅ Delete FAQ by ID
exports.deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await Faq.findByPk(id);
    if (!faq) {
      return res.status(404).json({ status: 'error', message: 'FAQ not found' });
    }

    await faq.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete FAQ',
      error: error.message
    });
  }
};
