const express = require('express');
const router = express.Router();
const Operator = require('../models/Operator');

// Create operator
router.post('/', async (req, res) => {
  try {
    const operator = new Operator(req.body);
    await operator.save();
    res.status(201).json(operator);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all operators
router.get('/', async (req, res) => {
  try {
    const operators = await Operator.find();
    res.json(operators);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;