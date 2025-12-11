const express = require('express');
const controller = require('../controllers/reactNativeWebhookController');

const router = express.Router();

// Endpoint principal que consumirá la app de React Native
router.post('/trigger', controller.triggerWorkflow);

module.exports = router;
