const mongoose = require('mongoose');

const OperatorSchema = new mongoose.Schema({
  operatorId: {
    type: String,
    required: true,
    unique: true,
    match: /^OP-\d{4}$/, // Format: OP-1234
    index: true
  },
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    enum: ['Production', 'Maintenance', 'Quality', 'Engineering'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  authorizedForms: {
    type: [String],
    enum: ['open', 'temporary', 'closure', 'approval'],
    default: ['open']
  },
  lastActive: Date
}, { timestamps: true });

// Prevent deletion if associated with breakdowns
OperatorSchema.pre('remove', async function(next) {
  const Breakdown = mongoose.model('Breakdown');
  const count = await Breakdown.countDocuments({ operatorId: this.operatorId });
  if (count > 0) {
    throw new Error('Cannot delete operator with associated breakdown records');
  }
  next();
});

module.exports = mongoose.model('Operator', OperatorSchema);