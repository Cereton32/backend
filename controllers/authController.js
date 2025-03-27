const Operator = require('../models/Operator');

exports.verifyOperator = async (req, res, next) => {
    try {
      const operator = await Operator.findOne({ 
        operatorId: req.body.operatorId,
        isActive: true 
      });
      
      if (!operator) {
        return res.status(403).json({ 
          error: 'Operator not authorized or invalid ID' 
        });
      }
      
      req.operator = operator;
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  exports.login = async (req, res) => {
    try {
      const operator = await Operator.findOne({
        operatorId: req.body.operatorId,
        isActive: true
      });
  
      if (!operator) {
        return res.status(404).json({ error: 'Operator not found' });
      }
  
      // Simple response for testing - in production you'd add proper auth
      res.json({ 
        message: 'Login successful (testing only)', 
        operatorId: operator.operatorId 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  


  
exports.getOperatorDetails = async (req, res) => {
  try {
    const operator = await Operator.findById(req.params.id);
    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    res.json(operator);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};