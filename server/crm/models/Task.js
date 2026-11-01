const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  leadId: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for task isolation'],
    index: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'TODO'
  },
  createdBy: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ status: 1 });

module.exports = mongoose.model('Task', taskSchema);
