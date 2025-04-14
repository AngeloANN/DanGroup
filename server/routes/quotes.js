// server/routes/quotes.js
const express = require('express');
const {
  createQuoteRequest,
  getQuoteRequests,
  getQuoteRequest,
  updateQuoteRequest,
  deleteQuoteRequest
} = require('../controllers/quoteController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route for creating quote requests
router.post('/', createQuoteRequest);

// Protected routes
router.get('/', protect, getQuoteRequests);
router.get('/:id', protect, getQuoteRequest);
router.put('/:id', protect, authorize('admin', 'staff'), updateQuoteRequest);
router.delete('/:id', protect, deleteQuoteRequest);

module.exports = router;