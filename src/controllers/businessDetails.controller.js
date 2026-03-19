const BusinessDetails = require('../models/businessDetails.model');

// Add Business Details (only one per user)
exports.addBusinessDetails = async (req, res) => {
  try {
    const { userId, companyName, panNumber, gstNumber, companyAddress, pinCode, city, state, cinNumber } = req.body;

    // Check if user already has business details
    const existing = await BusinessDetails.findOne({ where: { userId } });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'Business details already exist for this user'
      });
    }

    const details = await BusinessDetails.create({
      userId,
      companyName,
      panNumber,
      gstNumber,
      companyAddress,
      pinCode,
      city,
      state,
      cinNumber
    });

    return res.status(200).json({
      status: 'success',
      message: 'Business details added successfully',
      data: details
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Update Business Details
exports.updateBusinessDetails = async (req, res) => {
  try {
    const { userId } = req.body;
    const details = await BusinessDetails.findOne({ where: { userId } });

    if (!details) {
      return res.status(404).json({ status: 'error', message: 'Business details not found' });
    }

    await details.update(req.body);

    return res.status(200).json({
      status: 'success',
      message: 'Business details updated successfully',
      data: details
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

// Get Business Details by User ID
exports.getBusinessDetailsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const details = await BusinessDetails.findOne({ where: { userId } });

    if (!details) {
      return res.status(404).json({
        status: 'error',
        message: 'Business details not found for this user'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Business details fetched successfully',
      data: details
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};
