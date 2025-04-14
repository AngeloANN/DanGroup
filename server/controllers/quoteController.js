// server/controllers/quoteController.js
const QuoteRequest = require('../models/QuoteRequest');
const sendEmail = require('../utils/emailSender');

/**
 * Create new quote request
 * @route POST /api/quotes
 */
exports.createQuoteRequest = async (req, res) => {
  try {
    const { name, email, phone, companyName, serviceType, serviceDetails } = req.body;
    
    // Create quote request
    const quoteRequest = new QuoteRequest({
      name,
      email,
      phone,
      companyName,
      serviceType,
      serviceDetails,
      user: req.user ? req.user.id : null
    });
    
    await quoteRequest.save();
    
    // Send notification email to admin
    await sendEmail({
      to: process.env.EMAIL_USER,
      subject: `New Quote Request: ${serviceType}`,
      text: `A new quote request has been submitted:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${companyName || 'Not provided'}\nService: ${serviceType}\nDetails: ${serviceDetails}\n\nPlease log in to the admin dashboard to review.`
    });
    
    // Send confirmation email// Send confirmation email to customer
    await sendEmail({
        to: email,
        subject: `Your Quote Request - Groupe Dan Inc.`,
        text: `Dear ${name},\n\nThank you for submitting a quote request for our ${serviceType} services. We have received your request and our team will review it as soon as possible.\n\nWe aim to respond within 1-2 business days.\n\nYour request details:\nService Type: ${serviceType}\nDetails: ${serviceDetails}\n\nIf you have any questions, please contact us at +1 438 938 3100.\n\nBest regards,\nGroupe Dan Inc. Team`
      });
      
      res.status(201).json({
        success: true,
        data: quoteRequest
      });
    } catch (error) {
      console.error('Error creating quote request:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting quote request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  
  /**
   * Get all quote requests
   * @route GET /api/quotes
   */
  exports.getQuoteRequests = async (req, res) => {
    try {
      // Filter based on user role
      let query = {};
      
      // Regular users can only see their own quote requests
      if (req.user && req.user.role === 'customer') {
        query.user = req.user.id;
      }
      
      const quoteRequests = await QuoteRequest.find(query).sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        count: quoteRequests.length,
        data: quoteRequests
      });
    } catch (error) {
      console.error('Error fetching quote requests:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving quote requests',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  
  /**
   * Get single quote request
   * @route GET /api/quotes/:id
   */
  exports.getQuoteRequest = async (req, res) => {
    try {
      const quoteRequest = await QuoteRequest.findById(req.params.id);
      
      if (!quoteRequest) {
        return res.status(404).json({
          success: false,
          message: 'Quote request not found'
        });
      }
      
      // Check if user has permission to view this quote
      if (req.user.role === 'customer' && 
          quoteRequest.user && 
          quoteRequest.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this quote request'
        });
      }
      
      res.status(200).json({
        success: true,
        data: quoteRequest
      });
    } catch (error) {
      console.error('Error fetching quote request:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving quote request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  
  /**
   * Update quote request (admin only)
   * @route PUT /api/quotes/:id
   */
  exports.updateQuoteRequest = async (req, res) => {
    try {
      // Only admins and staff can update quote status
      if (req.user.role === 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update quote requests'
        });
      }
      
      let quoteRequest = await QuoteRequest.findById(req.params.id);
      
      if (!quoteRequest) {
        return res.status(404).json({
          success: false,
          message: 'Quote request not found'
        });
      }
      
      quoteRequest = await QuoteRequest.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      
      // If status has been updated to something other than 'pending', notify the customer
      if (req.body.status && req.body.status !== 'pending') {
        await sendEmail({
          to: quoteRequest.email,
          subject: `Quote Request Update - Groupe Dan Inc.`,
          text: `Dear ${quoteRequest.name},\n\nYour quote request for ${quoteRequest.serviceType} services has been ${req.body.status}.\n\n${
            req.body.status === 'completed' 
              ? `Your estimated price is $${quoteRequest.estimatedPrice || 'To be discussed'}.\n\nAdditional notes: ${quoteRequest.notes || 'None provided'}.` 
              : ''
          }\n\nPlease contact us at +1 438 938 3100 for more details.\n\nBest regards,\nGroupe Dan Inc. Team`
        });
      }
      
      res.status(200).json({
        success: true,
        data: quoteRequest
      });
    } catch (error) {
      console.error('Error updating quote request:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating quote request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
  
  /**
   * Delete quote request
   * @route DELETE /api/quotes/:id
   */
  exports.deleteQuoteRequest = async (req, res) => {
    try {
      const quoteRequest = await QuoteRequest.findById(req.params.id);
      
      if (!quoteRequest) {
        return res.status(404).json({
          success: false,
          message: 'Quote request not found'
        });
      }
      
      // Only admins can delete any quote request
      // Staff and customers can only delete their own
      if (req.user.role === 'customer' && 
          quoteRequest.user && 
          quoteRequest.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this quote request'
        });
      }
      
      await quoteRequest.remove();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      console.error('Error deleting quote request:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting quote request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };