const sequelize = require('../config/db');
const Gstn = require('../models/gstn.model');

//Add GSTN (one GSTN per user)
exports.addGstn = async (req, res) => {
  try {
    const { userId, gstn, firstName, lastName } = req.body;

    if (!userId || !gstn || !firstName || !lastName) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    // Check if user already has GSTN
    const existingGstn = await Gstn.findOne({ where: { userId } });
    if (existingGstn) {
      return res.status(400).json({
        status: 'error',
        message: 'User already has a GSTN record'
      });
    }

    // Check if GSTN already exists for another user
    const existingGstnNumber = await Gstn.findOne({ where: { gstn } });
    if (existingGstnNumber) {
      return res.status(400).json({
        status: 'error',
        message: 'This GSTN number is already registered'
      });
    }

    const newGstn = await Gstn.create({
      userId,
      gstn,
      firstName,
      lastName
    });

    return res.status(201).json({
      status: 'success',
      message: 'GSTN added successfully',
      data: newGstn
    });

  } catch (error) {
    console.error('Error adding GSTN:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add GSTN',
      error: error.message
    });
  }
};


// Update GSTN by id
exports.updateGstn = async (req, res) => {
  try {
    const { userId, gstn, firstName, lastName } = req.body;

    const gstnRecord = await Gstn.findOne({ where: { userId } });
    if (!gstnRecord) {
      return res.status(404).json({
        status: 'error',
        message: 'GSTN record not found for this user'
      });
    }

    // Check if GSTN already exists
    if (gstn && gstn !== gstnRecord.gstn) {
        const existingGstn = await Gstn.findOne({ where: { gstn } });
  
        if (existingGstn && existingGstn.userId !== gstnRecord.userId) {
          return res.status(400).json({
            status: 'error',
            message: 'This GSTN number is already registered for another user'
          });
        }
    }
    await gstnRecord.update({ gstn, firstName, lastName });

    return res.status(200).json({
      status: 'success',
      message: 'GSTN updated successfully',
      data: gstnRecord
    });

  } catch (error) {
    console.error('Error updating GSTN:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update GSTN',
      error: error.message
    });
  }
};


//Remove GSTN by id
exports.removeGstn = async (req, res) => {
  try {
    const { userId } = req.params;

    const gstnRecord = await Gstn.findOne({ where: { userId } });
    if (!gstnRecord) {
      return res.status(404).json({
        status: 'error',
        message: 'GSTN record not found'
      });
    }

    await gstnRecord.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'GSTN deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting GSTN:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete GSTN',
      error: error.message
    });
  }
};


//Get GSTN by userId
exports.getGstnByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const gstnRecord = await Gstn.findOne({ where: { userId } });
    if (!gstnRecord) {
      return res.status(404).json({
        status: 'error',
        message: 'No GSTN record found for this user'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'GSTN fetched successfully',
      data: gstnRecord
    });

  } catch (error) {
    console.error('Error fetching GSTN:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch GSTN',
      error: error.message
    });
  }
};
