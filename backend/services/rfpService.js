const { Rfp, Proposal, Vendor } = require('../models');
const ai = require('./ai');
const mailer = require('./mailgunMailer');
const { ValidationError, NotFoundError } = require('../utils/errors');

async function createRfp(natural_text, titleFallback) {
  try {
    // sanitize
    natural_text = (natural_text || '').trim();
    const title = (titleFallback || '').trim();

    if (!natural_text) {
      throw new ValidationError('RFP description cannot be empty');
    }

    const structured = await ai.createRfpFromText(natural_text, title);
    const rfp = await Rfp.create({
      title: (structured.title || title || 'Untitled RFP').trim(),
      description_raw: natural_text,
      structured_json: structured
    });
    return rfp;
  } catch (err) {
    if (err.name === 'ValidationError') throw err;
    console.error('Error creating RFP:', err);
    throw new Error('Failed to create RFP. Please try again.');
  }
}

async function listRfps() {
  return await Rfp.findAll({ include: [{ model: Proposal }], order: [['created_at', 'DESC']] });
}

async function getRfpWithProposals(id) {
  try {
    const rfp = await Rfp.findByPk(id, { include: [{ model: Proposal }] });
    if (!rfp) {
      throw new NotFoundError('RFP');
    }
    return rfp;
  } catch (err) {
    if (err.name === 'NotFoundError') throw err;
    console.error('Error fetching RFP:', err);
    throw new Error('Failed to fetch RFP. Please try again.');
  }
}

async function sendRfp(id, vendorIds) {
  try {
    if (!vendorIds || vendorIds.length === 0) {
      throw new ValidationError('At least one vendor must be selected');
    }

    const rfp = await Rfp.findByPk(id);
    if (!rfp) {
      throw new NotFoundError('RFP');
    }

    const vendors = await Vendor.findAll({ where: { id: vendorIds } });
    if (vendors.length === 0) {
      throw new ValidationError('No valid vendors found');
    }

    const results = [];
    for (const v of vendors) {
      const replyTo = `rfp-${id}@${process.env.INBOUND_EMAIL_DOMAIN || process.env.MAILGUN_DOMAIN || 'example.com'}`;
      const subject = `RFP: ${rfp.title}`;

      const rfpDetails = rfp.structured_json || {};
      const body = `Dear ${v.name || 'Valued Partner'},\n\nWe are pleased to invite you to submit a proposal for our upcoming procurement initiative.\n\nREQUEST FOR PROPOSAL (RFP) DETAILS\n${"-".repeat(50)}\n\nTitle: ${rfp.title}\n\nDescription:\n${rfp.description_raw}\n\n${rfpDetails.items ? `\nScope of Work:\n${rfpDetails.items.map((item, idx) => `${idx + 1}. ${item.name} (Qty: ${item.quantity}) - ${item.specs}`).join('\n')}` : ''}\n\n${rfpDetails.total_budget ? `\nBudget: $${rfpDetails.total_budget}` : ''}\n${rfpDetails.delivery_days ? `\nDelivery Timeline: ${rfpDetails.delivery_days} days` : ''}\n${rfpDetails.payment_terms ? `\nPayment Terms: ${rfpDetails.payment_terms}` : ''}\n${rfpDetails.warranty_months ? `\nWarranty Period: ${rfpDetails.warranty_months} months` : ''}\n\n${"-".repeat(50)}\n\nPlease prepare your proposal and submit it by replying to this email. We look forward to reviewing your bid.\n\nIf you have any questions regarding this RFP, please feel free to reach out.\n\nBest regards,\nProcurement Team\n\n---\nReply To: ${replyTo}\n`;

      try {
        await mailer.sendMail({ to: v.contact_email, subject, text: body, replyTo });
        results.push({ vendor: v.id, status: 'sent' });
      } catch (e) {
        console.error(`Failed to send RFP to vendor ${v.id}:`, e);
        results.push({ vendor: v.id, status: 'error', message: e.message });
      }
    }

    return results;
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'NotFoundError') throw err;
    console.error('Error sending RFP:', err);
    throw new Error('Failed to send RFP. Please try again.');
  }
}

async function compareProposalsForRfp(id) {
  try {
    const rfp = await Rfp.findByPk(id);
    if (!rfp) {
      throw new NotFoundError('RFP');
    }

    const proposals = await Proposal.findAll({ where: { rfp_id: id } });
    if (proposals.length === 0) {
      throw new ValidationError('No proposals found for this RFP');
    }

    const evaluation = await ai.compareProposals(rfp, proposals);
    return evaluation;
  } catch (err) {
    if (err.name === 'ValidationError' || err.name === 'NotFoundError') throw err;
    console.error('Error comparing proposals:', err);
    throw new Error('Failed to compare proposals. Please try again.');
  }
}

module.exports = { createRfp, listRfps, getRfpWithProposals, sendRfp, compareProposalsForRfp };
