const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Rfp = require('./Rfp');
const Vendor = require('./Vendor');

const Proposal = sequelize.define('Proposal', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  rfp_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Rfp,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  vendor_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Vendor,
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  raw_email_body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  parsed_json: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  received_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'proposals',
  timestamps: false
});

module.exports = Proposal;
