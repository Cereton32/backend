const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Verify Operator
router.post('/verify-operator', authController.verifyOperator);

// Operator Login
router.post('/login', authController.login);

// Get Operator Details
router.get('/operators/:id', authController.getOperatorDetails);

module.exports = router;