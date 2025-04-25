// server/routes/appointments.js
const express = require('express');
const {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableSlots,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public route for availability
router.get('/available/:date', getAvailableSlots);

// Public route for creating appointments
router.post('/', createAppointment);
 
// Protected routes
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointment);
router.put('/:id', protect, updateAppointment);
router.delete('/:id', protect, deleteAppointment);

router.put('/:id/status', protect, authorize('admin', 'staff'), updateAppointmentStatus);

module.exports = router;