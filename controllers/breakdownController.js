const Breakdown = require('../models/Breakdown');
const { syncToSheets } = require('../config/googleAuth');
const fs = require('fs');
const path = require('path');

// Generate unique breakdown ID
const generateBreakdownId = () => {
  return 'BD-' + Date.now().toString(36).toUpperCase() + 
    Math.floor(Math.random() * 100).toString().padStart(2, '0');
};

// Create Open Report
exports.createOpenReport = async (req, res) => {
  try {
    // Verify operator ID is authorized
    const isAuthorized = await checkOperatorAuthorization(req.body.operatorId);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Operator not authorized' });
    }

    let problemMediaPath;
    if (req.file) {
      problemMediaPath = `/uploads/${req.file.filename}`;
    }

    const breakdown = new Breakdown({
      breakdownId: generateBreakdownId(),
      operatorId: req.body.operatorId,
      machineId: req.body.machineId,
      machineFamily: req.body.machineFamily,
      productionStopped: req.body.productionStopped === 'true',
      problemDescription: req.body.problemDescription,
      problemMedia: problemMediaPath,
      createdByDevice: req.body.deviceId
    });

    await breakdown.save();
    await syncToSheets(breakdown, 'open');
    
    res.status(201).json({
      breakdownId: breakdown.breakdownId,
      message: 'Open report created successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create Temporary Report
exports.createTemporaryReport = async (req, res) => {
  try {
    const breakdown = await Breakdown.findOneAndUpdate(
      { 
        breakdownId: req.body.breakdownId,
        temporaryTimestamp: { $exists: false } // Only if not already filled
      },
      {
        temporaryTimestamp: new Date(),
        maintenanceId: req.body.maintenanceId,
        temporaryAction: req.body.temporaryAction,
        spareUsed: req.body.spareUsed,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!breakdown) {
      return res.status(404).json({ error: 'Breakdown not found or already has temporary report' });
    }

    await syncToSheets(breakdown, 'temporary');
    res.status(200).json(breakdown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create Closure Report
exports.createClosureReport = async (req, res) => {
  try {
    let analysisMediaPath;
    if (req.file) {
      analysisMediaPath = `/uploads/${req.file.filename}`;
    }

    const breakdown = await Breakdown.findOneAndUpdate(
      { 
        breakdownId: req.body.breakdownId,
        temporaryTimestamp: { $exists: true }, // Must have temporary report
        closureTimestamp: { $exists: false }   // Must not have closure report
      },
      {
        closureTimestamp: new Date(),
        closureMaintenanceId: req.body.maintenanceId,
        analysisReport: req.body.analysisReport,
        analysisMedia: analysisMediaPath,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!breakdown) {
      return res.status(404).json({ 
        error: 'Breakdown not found or missing prerequisites for closure' 
      });
    }

    await syncToSheets(breakdown, 'closure');
    res.status(200).json(breakdown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create Approval Report
exports.createApprovalReport = async (req, res) => {
  try {
    const breakdown = await Breakdown.findOneAndUpdate(
      { 
        breakdownId: req.body.breakdownId,
        closureTimestamp: { $exists: true }, // Must have closure report
        approvalTimestamp: { $exists: false } // Must not have approval
      },
      {
        approvalTimestamp: new Date(),
        approvalId: req.body.approvalId,
        status: req.body.status,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!breakdown) {
      return res.status(404).json({ 
        error: 'Breakdown not found or missing prerequisites for approval' 
      });
    }

    await syncToSheets(breakdown, 'approval');
    res.status(200).json(breakdown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get breakdowns for a specific form type
exports.getBreakdownsForForm = async (req, res) => {
  try {
    let query = {};
    
    switch (req.params.formType) {
      case 'temporary':
        query = { 
          temporaryTimestamp: { $exists: false },
          createdByDevice: req.query.deviceId 
        };
        break;
      case 'closure':
        query = { 
          temporaryTimestamp: { $exists: true },
          closureTimestamp: { $exists: false },
          createdByDevice: req.query.deviceId 
        };
        break;
      case 'approval':
        query = { 
          closureTimestamp: { $exists: true },
          approvalTimestamp: { $exists: false } 
        };
        break;
      default:
        return res.status(400).json({ error: 'Invalid form type' });
    }

    const breakdowns = await Breakdown.find(query);
    res.status(200).json(breakdowns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all breakdowns
exports.getAllBreakdowns = async (req, res) => {
  try {
    const breakdowns = await Breakdown.find().sort({ openTimestamp: -1 });
    res.status(200).json(breakdowns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get media file
exports.getMedia = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', req.params.filePath);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to check operator authorization
async function checkOperatorAuthorization(operatorId) {
  // In a real app, this would check against a database of authorized operators
  // For demo, we'll just check if it matches a pattern
  return /^OP-\d{4}$/.test(operatorId);
}