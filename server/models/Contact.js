// server/models/Contact.js
const mongoose = require('mongoose');
const sendEmail = require('../utils/emailSender');
const contactReplyTemplate = require('../utils/emails/contactReply');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  response: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

contactSchema.post('save', async function (doc) {
  if (doc.response) {
    const content = contactReplyTemplate({ name: doc.name, message: doc.response });
    await sendEmail({ to: doc.email, ...content });
  }
});

module.exports = mongoose.model('Contact', contactSchema);