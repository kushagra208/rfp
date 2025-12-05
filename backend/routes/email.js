const express = require('express');
const proposalService = require('../services/proposalService');
const router = express.Router();

const catchAsync = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Inbound email webhook (Mailgun form-encoded POST)
router.post('/inbound', catchAsync(async (req,res, next)=>{
  // Mailgun posts form-encoded data. Ensure bodyParser.urlencoded middleware is enabled.
  // Fields include: recipient, recipients, sender, subject, 'body-plain', 'body-html', etc.
  const toAddress = req.body.recipient || (Array.isArray(req.body.recipients) ? req.body.recipients[0] : req.body.recipients) || '';
  const sender = req.body.sender || req.body.from || '';
  const subject = req.body.subject || '';
  const bodyPlain = req.body['body-plain'] || req.body['body_text'] || req.body['body-html'] || '';

  // extract rfp id from address like rfp-<uuid>@...
  const m = toAddress && toAddress.match(/rfp-([0-9a-fA-F-]{36})@/);
  const rfpId = m ? m[1] : null;
  console.log("ID: ", rfpId);

  if (rfpId == null || rfpId == "") {
    throw new Error("RfpId was not parsed. Something went wrong!");
  }

  const { proposal, parsed } = await proposalService.createProposalFromEmail(rfpId, bodyPlain, subject, sender);
  res.json({ ok: true, proposal_id: proposal.id, parsed });
}));

module.exports = router;
