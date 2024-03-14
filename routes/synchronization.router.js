const express = require("express");
const router = express.Router();

// Import configureAndSync function
const { configureAndSync } = require('../services/scheduling');

// Route to handle configuration and synchronization
router.post('/configure-sync', configureAndSync)


module.exports = router;
