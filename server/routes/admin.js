// In routes/admin.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

// Import controllers
const serviceController = require('../controllers/serviceController');
const quoteController = require('../controllers/quoteController');
const appointmentController = require('../controllers/appointmentController');
const contactController = require('../controllers/contactController');

// Helper function for dashboard stats - simplified version
const getDashboardStats = async (req, res) => {
  try {
    // Use mongoose directly to access collections
    const db = mongoose.connection;
    
    // Get counts from collections using MongoDB native driver
    // Count only what needs attention
    const [pendingAppointments, newQuotes, unreadMessages] = await Promise.all([
      db.collection('appointments').countDocuments({ status: 'pending' }),
      db.collection('quoterequests').countDocuments({ status: 'pending' }),
      // Messages with no reply yet (the model has no "read" field)
      db.collection('contacts').countDocuments({ response: { $in: [null, ''] } })
    ]);

    res.status(200).json({
      success: true,
      data: { pendingAppointments, newQuotes, unreadMessages }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics',
      error: error.message
    });
  }
};

// Protected admin routes
router.get('/dashboard', protect, (req, res) => {
  res.status(200).json({ success: true, message: 'Admin dashboard access granted' });
});

// Dashboard statistics
router.get('/dashboard-stats', protect, getDashboardStats);

// Service management routes
router.get('/services', protect, serviceController.getServices);
router.post('/services', protect, serviceController.createService);
router.put('/services/:id', protect, serviceController.updateService);
router.delete('/services/:id', protect, serviceController.deleteService);

// Quote management routes
router.get('/quotes', protect, quoteController.getQuoteRequests);
router.put('/quotes/:id', protect, quoteController.updateQuoteRequest);

// Appointment management routes
router.get('/appointments', protect, appointmentController.getAppointments);
router.get('/appointments/:id', protect, appointmentController.getAppointment);
router.put('/appointments/:id', protect, appointmentController.updateAppointment);
router.delete('/appointments/:id', protect, appointmentController.deleteAppointment);

// Contact management routes
router.get('/contacts', protect, contactController.getContacts);
router.put('/contacts/:id', protect, contactController.updateContact);

module.exports = router;