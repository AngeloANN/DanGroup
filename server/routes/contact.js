// server/routes/contact.js
const express = require('express');
const {
  submitContact,
  getContacts,
  updateContact,
  getContactById,
  updateContactStatus
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route for submitting contact form
router.post('/', submitContact);

// Protected routes (admin only)
router.get('/', protect, authorize('admin', 'staff'), getContacts);
router.put('/:id', protect, authorize('admin', 'staff'), updateContact);
router.get('/:id', protect, authorize('admin', 'staff'), getContactById);
router.put('/:id/status', protect, authorize('admin', 'staff'), updateContactStatus);

module.exports = router;