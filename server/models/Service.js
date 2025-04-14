// server/models/Service.js
const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  titleFr: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  descriptionFr: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['import', 'export', 'logistics', 'storage', 'mechanic'],
    required: true
  },
  icon: {
    type: String
  },
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', ServiceSchema);