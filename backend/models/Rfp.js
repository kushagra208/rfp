const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rfp = sequelize.define('Rfp', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description_raw: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  structured_json: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  total_budget: {
    type: DataTypes.NUMERIC,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'rfps',
  timestamps: false
});

module.exports = Rfp;
