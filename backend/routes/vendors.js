const express = require('express');
const router = express.Router();
const vendorService = require('../services/vendorService');

const catchAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);


router.get('/', catchAsync(async (req,res, next)=>{
  const vendors = await vendorService.listVendors();
  res.json(vendors);
}));

router.post('/', catchAsync(async (req,res, next)=>{
  const { name, contact_name, contact_email } = req.body;
  const vendor = await vendorService.createVendor({ name, contact_name, contact_email });
  res.status(201).json(vendor);
}));

module.exports = router;
