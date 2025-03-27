const mongoose = require('mongoose');

const BreakdownSchema = new mongoose.Schema({
  breakdownId: { type: String, unique: true, required: true },
  operatorId: { type: String, required: true },
  machineId: { type: String, required: true },
  machineFamily: { type: String, required: true },
  productionStopped: { type: Boolean, required: true },
  problemDescription: { type: String, required: true },
  problemMedia: { type: String }, // Path to image/video
  openTimestamp: { type: Date, default: Date.now },
  
  // Temporary Report
  temporaryTimestamp: { type: Date },
  maintenanceId: { type: String },
  temporaryAction: { type: String },
  spareUsed: { type: String },
  
  // Closure Report
  closureTimestamp: { type: Date },
  closureMaintenanceId: { type: String },
  analysisReport: { type: String },
  analysisMedia: { type: String }, // Path to image/video
  
  // Approval Report
  approvalTimestamp: { type: Date },
  approvalId: { type: String },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'] },
  
  createdByDevice: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Breakdown', BreakdownSchema);