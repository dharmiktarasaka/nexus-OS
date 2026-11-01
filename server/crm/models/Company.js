const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  ownerId: {
    type: String,
    required: [true, 'Owner UID is required for company isolation'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  industry: {
    type: String,
    trim: true,
    default: 'General'
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
