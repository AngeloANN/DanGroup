// server/controllers/appointmentController.js
const Appointment = require('../models/Appointment');
const { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  getAvailableTimeSlots 
} = require('../utils/googleCalendar');
const sendEmail = require('../utils/emailSender');
const buildIcsEvent = require('../utils/icsEvent')

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
    // Notify the business by email, with a calendar invite (.ics) attached
    try {
      const start = new Date(date);
      // If no end time was provided, assume 1 hour
      const end = endTime ? new Date(endTime) : new Date(start.getTime() + 60 * 60 * 1000);

      await sendEmail({
        to: process.env.EMAIL_USER,
        subject: `New appointment request: ${serviceType} - ${name}`,
        text: `New appointment request:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nService: ${serviceType}\nDate: ${start.toLocaleString('en-CA', { timeZone: 'America/Toronto' })}\nDetails: ${description || 'None'}\n\nAdd it to your calendar with the attached invite, then confirm it in the admin dashboard.`,
        icalEvent: {
          filename: 'appointment.ics',
          method: 'PUBLISH',
          content: buildIcsEvent({
            id: appointment._id,
            start,
            end,
            summary: `${serviceType} - ${name}`,
            description: `Client: ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${description || ''}`
          })
        }
      });
    } catch (emailError) {
      console.error('Error sending appointment notification:', emailError);
      // Continue even if the email fails: the appointment is still saved
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

/**
 * Update appointment status (admin/staff only)
 * @route PUT /api/appointments/:id/status
 */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    // Only admins and staff can update appointment status
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update appointment status'
      });
    }
    
    const { status, notes } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be one of: pending, confirmed, completed, cancelled'
      });
    }
    
    let appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Prepare update data
    const updateData = { status };
    if (notes) {
      updateData.notes = notes;
    }
    
    // Update in Google Calendar if needed (for confirmed/cancelled status)
    if (appointment.googleCalendarEventId) {
      try {
        if (status === 'cancelled') {
          await deleteCalendarEvent(appointment.googleCalendarEventId);
          // Remove calendar ID from appointment since it's now deleted
          updateData.googleCalendarEventId = null;
        } else if (status === 'confirmed' && appointment.status !== 'confirmed') {
          // Update event to show confirmation
          await updateCalendarEvent(appointment.googleCalendarEventId, {
            ...appointment.toObject(),
            status
          });
        }
      } catch (calendarError) {
        console.error('Error updating calendar event:', calendarError);
        // Continue even if calendar update fails
      }
    } else if (status === 'confirmed' && !appointment.googleCalendarEventId) {
      // If confirming and no calendar event exists, create one
      try {
        if (typeof createCalendarEvent === 'function') {
          const calendarEvent = await createCalendarEvent({
            name: appointment.name,
            email: appointment.email,
            phone: appointment.phone,
            serviceType: appointment.serviceType,
            date: appointment.date,
            endTime: appointment.endTime,
            description: appointment.description
          });
          
          if (calendarEvent && calendarEvent.id) {
            updateData.googleCalendarEventId = calendarEvent.id;
          }
        }
      } catch (calendarError) {
        console.error('Error creating calendar event:', calendarError);
        // Continue even if calendar creation fails
      }
    }
    
    // Update appointment in database
    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Send email notification about status change
    try {
      if (typeof sendEmail === 'function' && appointment.email) {
        let emailSubject = `Appointment Update - ${appointment.serviceType}`;
        let emailBody = `Dear ${appointment.name},\n\n`;
        
        switch (status) {
          case 'confirmed':
            emailSubject = `Appointment Confirmed - ${appointment.serviceType}`;
            emailBody += `Your appointment for ${appointment.serviceType} on ${new Date(appointment.date).toLocaleString('en-CA')} has been confirmed.\n\n`;
            break;
          case 'cancelled':
            emailSubject = `Appointment Cancelled - ${appointment.serviceType}`;
            emailBody += `Your appointment for ${appointment.serviceType} on ${new Date(appointment.date).toLocaleString('en-CA')} has been cancelled.\n\n`;
            break;
          case 'completed':
            emailSubject = `Appointment Completed - ${appointment.serviceType}`;
            emailBody += `Thank you for your recent appointment for ${appointment.serviceType} on ${new Date(appointment.date).toLocaleString('en-CA')}. We hope everything was to your satisfaction.\n\n`;
            break;
          default:
            emailBody += `The status of your appointment for ${appointment.serviceType} on ${new Date(appointment.date).toLocaleString('en-CA')} has been updated to ${status}.\n\n`;
        }
        
        if (notes) {
          emailBody += `Additional information: ${notes}\n\n`;
        }
        
        emailBody += `If you have any questions, please contact us.\n\nThank you for choosing Groupe Dan Inc.\n\nBest regards,\nThe Groupe Dan Team`;
        
        await sendEmail({
          to: appointment.email,
          subject: emailSubject,
          text: emailBody
        });
      }
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
      // Continue even if email fails
    }
    
    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};