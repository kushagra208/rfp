const express = require('express');
const router = express.Router();
const rfpService = require('../services/rfpService');

// helper to forward async errors to Express error handler
const catchAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Create RFP from natural text
router.post('/', catchAsync(async (req,res)=>{
  const { natural_text, title } = req.body;
  const rfp = await rfpService.createRfp(natural_text, title);
  res.status(201).json(rfp);
}));

router.get('/', catchAsync(async (req,res)=>{
  const rfps = await rfpService.listRfps();
  res.json(rfps);
}));

router.get('/:id', catchAsync(async (req,res)=>{
  const rfp = await rfpService.getRfpWithProposals(req.params.id);
  if (!rfp) return res.status(404).json({error:'not found'});
  res.json(rfp);
}));

// send RFP to vendors (Mailgun)
router.post('/:id/send', catchAsync(async (req,res)=>{
  const id = req.params.id;
  const { vendorIds } = req.body;
  const results = await rfpService.sendRfp(id, vendorIds || []);
  res.json({ results });
}));

// Compare proposals - calls AI for evaluation
router.post('/:id/compare', catchAsync(async (req,res)=>{
  const id = req.params.id;
  const evaluation = await rfpService.compareProposalsForRfp(id);
  res.json(evaluation);
}));

module.exports = router;
