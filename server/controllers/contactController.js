// server/controllers/contactController.js
const mongoose = require('mongoose');
const sendEmail = require('../utils/emailSender');

// Define the Contact model (move this to a separate model file later)
const ContactSchema = new mongoose.Schema({
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
  responded: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Use mongoose.models to check if the model is already defined
const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

/**
 * Submit contact form
 * @route POST /api/contact
 */
exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Create new contact submission
    const contact = new Contact({
      name,
      email,
      subject,
      message
    });
    
    await contact.save();
    
    // Try to send notification email to admin, but don't fail if it doesn't work
    try {
      if (typeof sendEmail === 'function') {
        await sendEmail({
          to: process.env.EMAIL_USER,
          subject: `New Contact Form Submission: ${subject}`,
          text: `A new contact form submission has been received:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}\n\nPlease log in to the admin dashboard to respond.`
        });
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Continue even if email fails
    }
    
    // Try to send confirmation email to user, but don't fail if it doesn't work
    try {
      if (typeof sendEmail === 'function') {
        await sendEmail({
          to: email,
          subject: `Thank You for Contacting Groupe Dan Inc.`,
          text: `Dear ${name},\n\nThank you for reaching out to Groupe Dan Inc. We have received your message regarding "${subject}".\n\nOur team will review your inquiry and get back to you as soon as possible.\n\nBest regards,\nGroupe Dan Inc. Team\n\n+1 438 938 3100\ninfo@groupedan.com`
        });
      }
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Continue even if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Contact form submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting contact form',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all contact submissions (admin only)
 * @route GET /api/contact
 */
exports.getContacts = async (req, res) => {
  try {
    // Only admins and staff can view contact submissions
    if (req.user.role === 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access contact submissions'
      });
    }
    
    const contacts = await Contact.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving contact submissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get a single contact by ID (admin only)
 * @route GET /api/contact/:id
 */
exports.getContactById = async (req, res) => {
  try {
    // Only admins and staff can view contact details
    if (req.user.role === 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access contact details'
      });
    }
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error fetching contact details:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving contact details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Mark contact as responded (admin only)
 * @route PUT /api/contact/:id
 */
exports.updateContact = async (req, res) => {
  try {
    // Only admins and staff can update contact status
    if (req.user.role === 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update contact submissions'
      });
    }
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { responded: true },
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error updating contact submission:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contact submission',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update contact status (responded/not responded) - admin only
 * @route PUT /api/contact/:id/status
 */
exports.updateContactStatus = async (req, res) => {
  try {
    // Only admins and staff can update contact status
    if (req.user.role === 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update contact status'
      });
    }
    
    const { responded, response } = req.body;
    
    const updateData = { responded };
    if (response) {
      updateData.response = response;
    }
    
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }
    
    // If there's a response and contact has email, send email to the contact
    if (response && contact.email) {
      try {
        if (typeof sendEmail === 'function') {
          await sendEmail({
            to: contact.email,
            subject: `Re: ${contact.subject} - Response from Groupe Dan Inc.`,
            text: `Dear ${contact.name},\n\n${response}\n\nBest regards,\nGroupe Dan Inc. Team\n\n+1 438 938 3100\ninfo@groupedan.com`
          });
        }
      } catch (emailError) {
        console.error('Error sending response email:', emailError);
        // Continue even if email fails
      }
    }
    
    res.status(200).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contact status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};