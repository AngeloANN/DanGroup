// server/routes/contact.js
const express = require('express');
const {
  submitContact,
  getContacts,
  updateContact
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route for submitting contact form
router.post('/', submitContact);

// Protected routes (admin only)
router.get('/', protect, authorize('admin', 'staff'), getContacts);
router.put('/:id', protect, authorize('admin', 'staff'), updateContact);

module.exports = router;