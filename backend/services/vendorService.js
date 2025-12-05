const { Vendor } = require('../models');
const { ValidationError } = require('../utils/errors');

async function listVendors() {
  try {
    return await Vendor.findAll({ order: [['created_at', 'DESC']] });
  } catch (err) {
    console.error('Error listing vendors:', err);
    throw new Error('Failed to fetch vendors. Please try again.');
  }
}

async function createVendor({ name, contact_name, contact_email }) {
  try {
    if (!name || !contact_email) {
      throw new ValidationError('Vendor name and email are required');
    }

    // Check for duplicate email
    const existing = await Vendor.findOne({ where: { contact_email } });
    if (existing) {
      throw new ValidationError('A vendor with this email already exists');
    }

    return await Vendor.create({ name, contact_name, contact_email });
  } catch (err) {
    if (err.name === 'ValidationError') throw err;
    console.error('Error creating vendor:', err);
    throw new Error('Failed to create vendor. Please try again.');
  }
}

module.exports = { listVendors, createVendor };
