const express = require('express');
const router = express.Router();
const globalSettings = require('../controllers/settingsController');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/settings', globalSettings.getGlobalSettings);
router.put('/settings', adminOnly, globalSettings.updateGlobalSettings);

module.exports = router;
