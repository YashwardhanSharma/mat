// const Address = require('../models/Address');
const sequelize = require('../config/db'); // for raw SQL if needed
const Address = require('../models/address.model');

// Add Address (using Sequelize model)
exports.addAddress = async (req, res) => {
    try {
        const {
            userId,
            name,
            phone,
            houseNumber,
            floor,
            towar,
            landmark,
            description,
            recipientName,
            recipientPhoneNumber,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country,
            latitude,
            longitude,
            address_type,
            is_default
        } = req.body;

        if (!userId || !name || !phone || !address_line1 || !city || !state || !postal_code) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Missing required fields' 
            });
        }

        // Reset previous default if needed
        if (is_default) {
            await Address.update(
                { is_default: false },
                { where: { userId } }
            );
        }

        const newAddress = await Address.create({
            userId,
            name,
            phone,
            houseNumber,
            floor,
            towar,
            landmark,
            description,
            recipientName,
            recipientPhoneNumber,
            address_line1,
            address_line2: address_line2 || null,
            city,
            state,
            postal_code,
            country: country || 'India',
            latitude: latitude || null,
            longitude: longitude || null,
            address_type: address_type || 'home',
            is_default: !!is_default,
            status: 'active'
        });

        return res.status(201).json({
            status: 'success',
            data: newAddress
        });

    } catch (error) {
        console.error('Error adding address:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to add address',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get all addresses for a user
exports.getUserAddresses = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ status: 'error', message: 'User ID is required' });
        }

        const addresses = await Address.findAll({
            where: { userId, status: 'active' },
            order: [['is_default', 'DESC'], ['created_at', 'DESC']]
        });

        return res.status(200).json({
            status: 'success',
            data: addresses,
            count: addresses.length
        });

    } catch (error) {
        console.error('Error fetching addresses:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch addresses',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get address by addressId
exports.getAddressById = async (req, res) => {
    try {
        const { addressId } = req.params;

        if (!addressId) {
            return res.status(400).json({ status: 'error', message: 'Address ID is required' });
        }

        const address = await Address.findOne({
            where: { id: addressId, status: 'active' }
        });

        if (!address) {
            return res.status(404).json({ status: 'error', message: 'Address not found' });
        }

        return res.status(200).json({ status: 'success', data: address });

    } catch (error) {
        console.error('Error fetching address:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch address',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        if (!addressId) {
            return res.status(400).json({ status: 'error', message: 'Address ID is required' });
        }

        // Soft delete by setting status to 'inactive'
        const result = await Address.update(
            { status: 'inactive' },
            { where: { id: addressId, status: 'active' } }
        );

        if (result[0] === 0) { // no rows updated
            return res.status(404).json({ status: 'error', message: 'Address not found or already inactive' });
        }

        return res.status(200).json({ status: 'success', message: 'Address deleted successfully' });

    } catch (error) {
        console.error('Error deleting address:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to delete address',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};