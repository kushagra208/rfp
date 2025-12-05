const { Proposal, Vendor } = require('../models');
const ai = require('./ai');
const { NotFoundError, ValidationError } = require('../utils/errors');

async function createProposalFromEmail(rfpId, bodyPlain, subject, sender) {
  try {
    if (!rfpId) {
      throw new ValidationError('RFP ID is required');
    }

    const raw = (bodyPlain || subject || '').toString();
    if (!raw || raw.trim().length === 0) {
      throw new ValidationError('Email body cannot be empty');
    }

    // try to associate vendor by sender email
    let vendor = null;
    if (sender) {
      try {
        vendor = await Vendor.findOne({ where: { contact_email: sender } });
      } catch (e) {
        console.error('Error finding vendor by email:', e);
      }
    }

    const payload = { rfp_id: rfpId, raw_email_body: raw };
    if (vendor) payload.vendor_id = vendor.id;

    const proposal = await Proposal.create(payload);
    const parsed = await ai.parseProposal(raw, rfpId);
    await proposal.update({ parsed_json: parsed });
    return { proposal, parsed };
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'NotFoundError') throw err;
    console.error('Error creating proposal from email:', err);
    throw new Error('Failed to process email proposal. Please try again.');
  }
}

module.exports = { createProposalFromEmail };
