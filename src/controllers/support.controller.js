const Support = require('../models/support.model');

exports.createSupport = async (req, res) => {
  try {

    const { number, email } = req.body;

    if (!number || !email) {
      return res.status(400).json({
        success: false,
        message: "Number and email are required"
      });
    }

    const support = await Support.create({
      number,
      email
    });

    res.status(201).json({
      success: true,
      message: "Support created successfully",
      data: support
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.getSupport = async (req, res) => {
  try {

    const supports = await Support.findAll();

    res.json({
      success: true,
      data: supports
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.updateSupport = async (req, res) => {
  try {

    const { id } = req.params;

    const { number, email } = req.body;

    await Support.update(
      { number, email },
      { where: { id } }
    );

    res.json({
      success: true,
      message: "Support updated successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


exports.deleteSupport = async (req, res) => {
  try {

    const { id } = req.params;

    await Support.destroy({
      where: { id }
    });

    res.json({
      success: true,
      message: "Support deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};