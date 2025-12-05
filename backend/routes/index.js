const express = require('express');
const router = express.Router();
const rfp = require('./rfp');
const vendors = require('./vendors');
const email = require('./email');

router.use('/rfps', rfp);
router.use('/vendors', vendors);
router.use('/email', email);

module.exports = router;
