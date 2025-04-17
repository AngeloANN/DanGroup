// server/controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  getAvailableTimeSlots 
} = require('../utils/googleCalendar');
const sendEmail = require('../utils/emailSender');

/**
 * Get available appointment slots for a specific date
 * @route GET /api/appointments/available/:date
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.params;
    const availableSlots = await getAvailableTimeSlots(new Date(date));
    
    res.status(200).json({
      success: true,
      data: availableSlots
    });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create new appointment
 * @route POST /api/appointments
 */
exports.createAppointment = async (req, res) => {
  try {
    const { name, email, phone, serviceType, date, endTime, description } = req.body;
    
    // Create appointment in database
    let appointment = new Appointment({
      name,
      email,
      phone,
      serviceType,
      date,
      endTime,
      description,
      user: req.user ? req.user.id : null,
      // Set status to pending by default
      status: 'pending'
    });
    
    // Try to create event in Google Calendar but don't let it break the whole process
    let calendarEventId = null;
    try {
      // Only attempt calendar integration if the required utilities are properly configured
      if (typeof createCalendarEvent === 'function') {
        const calendarEvent = await createCalendarEvent({
          name,
          email,
          phone,
          serviceType,
          date,
          endTime,
          description
        });
        
        if (calendarEvent && calendarEvent.id) {
          calendarEventId = calendarEvent.id;
          appointment.googleCalendarEventId = calendarEventId;
          appointment.status = 'confirmed';
        }
      }
    } catch (calendarError) {
      console.error('Error creating calendar event:', calendarError);
      // Continue without calendar integration - the appointment will remain in 'pending' status
    }
    
    // Save the appointment regardless of calendar integration success
    await appointment.save();
    
    // Try to send confirmation email but don't let it break the process
    try {
      if (typeof sendEmail === 'function') {
        await sendEmail({
          to: email,
          subject: `Appointment Request - ${serviceType} Service`,
          text: `Dear ${name},\n\nThank you for requesting an appointment for ${serviceType} service on ${new Date(date).toLocaleString('en-CA')}.\n\nYour appointment is currently ${appointment.status}. We will contact you shortly to confirm the details.\n\nThank you for choosing Groupe Dan Inc.\n\nBest regards,\nThe Groupe Dan Team`
        });
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue even if email fails
    }
    
    // Return success response
    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all appointments
 * @route GET /api/appointments
 */
exports.getAppointments = async (req, res) => {
  try {
    // Filter based on user role
    let query = {};
    
    // Regular users can only see their own appointments
    if (req.user && req.user.role === 'customer') {
      query.user = req.user.id;
    }
    
    const appointments = await Appointment.find(query).sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get single appointment by ID
 * @route GET /api/appointments/:id
 */
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user has permission to view this appointment
    if (req.user.role === 'customer' && appointment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this appointment'
      });
    }
    
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update appointment by ID
 * @route PUT /api/appointments/:id
 */
exports.updateAppointment = async (req, res) => {
  try {
    let appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user has permission to update this appointment
    if (req.user.role === 'customer' && appointment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }
    
    // Update in Google Calendar
    if (appointment.googleCalendarEventId) {
      await updateCalendarEvent(appointment.googleCalendarEventId, {
        ...req.body,
        name: req.body.name || appointment.name,
        email: req.body.email || appointment.email,
        phone: req.body.phone || appointment.phone,
        serviceType: req.body.serviceType || appointment.serviceType,
        date: req.body.date || appointment.date,
        endTime: req.body.endTime || appointment.endTime,
        description: req.body.description || appointment.description
      });
    }
    
    // Update in database
    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete appointment by ID
 * @route DELETE /api/appointments/:id
 */
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user has permission to delete this appointment
    if (req.user.role === 'customer' && appointment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this appointment'
      });
    }
    
    // Delete from Google Calendar
    if (appointment.googleCalendarEventId) {
      await deleteCalendarEvent(appointment.googleCalendarEventId);
    }
    
    // Delete from database
    await appointment.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};