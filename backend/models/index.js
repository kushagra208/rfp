const sequelize = require('../config/database');
const Vendor = require('./Vendor');
const Rfp = require('./Rfp');
const Proposal = require('./Proposal');

// Define associations
Rfp.hasMany(Proposal, {
  foreignKey: 'rfp_id',
  onDelete: 'CASCADE'
});
Proposal.belongsTo(Rfp, {
  foreignKey: 'rfp_id'
});

Vendor.hasMany(Proposal, {
  foreignKey: 'vendor_id',
  onDelete: 'SET NULL'
});
Proposal.belongsTo(Vendor, {
  foreignKey: 'vendor_id'
});

module.exports = {
  sequelize,
  Vendor,
  Rfp,
  Proposal
};
