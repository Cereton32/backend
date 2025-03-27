const express = require('express');
const router = express.Router();
const breakdownController = require('../controllers/breakdownController');
const authController = require('../controllers/authController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Open Report
router.post(
  '/open',
  authController.verifyOperator,
  upload.single('file'),
  breakdownController.createOpenReport
);

// Temporary Report
router.put(
  '/temporary',
  authController.verifyOperator,
  breakdownController.createTemporaryReport
);

// Closure Report
router.post(
  '/closure',
  authController.verifyOperator,
  upload.single('file'),
  breakdownController.createClosureReport
);

// Approval Report
router.post(
  '/approval',
  authController.verifyOperator,
  breakdownController.createApprovalReport
);

// Get breakdowns for form type
router.get(
  '/form/:formType',
  authController.verifyOperator,
  breakdownController.getBreakdownsForForm
);

// Get all breakdowns
router.get('/', breakdownController.getAllBreakdowns);


// Get media
router.get('/media/:filePath', breakdownController.getMedia);

module.exports = router;