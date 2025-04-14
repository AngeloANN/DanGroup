// server/utils/googleCalendar.js
const { google } = require('googleapis');
require('dotenv').config();

// Configure Google OAuth client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set the refresh token for ongoing access
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Create calendar API client
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Create a new event in Google Calendar
 * @param {Object} eventDetails - Details of the appointment
 * @returns {Promise<Object>} - Created event object
 */
const createCalendarEvent = async (eventDetails) => {
  try {
    const { name, email, phone, serviceType, date, endTime, description } = eventDetails;
    
    // Format event for Google Calendar
    const event = {
      summary: `${serviceType} Appointment - ${name}`,
      description: `Client: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nDetails: ${description || 'No additional details provided.'}`,
      start: {
        dateTime: date,
        timeZone: 'America/Toronto',
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/Toronto',
      },
      attendees: [
        { email: email },
        { email: process.env.EMAIL_USER }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ],
      },
    };

    // Insert event to the calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all'
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

/**
 * Update an existing event in Google Calendar
 * @param {String} eventId - Google Calendar event ID
 * @param {Object} eventDetails - Updated details
 * @returns {Promise<Object>} - Updated event object
 */
const updateCalendarEvent = async (eventId, eventDetails) => {
  try {
    const { name, email, phone, serviceType, date, endTime, description } = eventDetails;
    
    // Get current event
    const event = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId
    });
    
    // Update event properties
    event.data.summary = `${serviceType} Appointment - ${name}`;
    event.data.description = `Client: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nDetails: ${description || 'No additional details provided.'}`;
    event.data.start = {
      dateTime: date,
      timeZone: 'America/Toronto',
    };
    event.data.end = {
      dateTime: endTime,
      timeZone: 'America/Toronto',
    };

    // Update event
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event.data,
      sendUpdates: 'all'
    });

    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

/**
 * Delete an event from Google Calendar
 * @param {String} eventId - Google Calendar event ID
 * @returns {Promise<void>}
 */
const deleteCalendarEvent = async (eventId) => {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId
    });
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};

/**
 * Get available time slots
 * @param {Date} date - Date to check availability
 * @returns {Promise<Array>} - Array of available time slots
 */
const getAvailableTimeSlots = async (date) => {
  try {
    // Set business hours (from document: Mon-Fri 8am-5pm, Sat 9am-3pm)
    const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    let startHour, endHour;
    if (dayOfWeek === 0) {
      // Sunday - closed
      return [];
    } else if (dayOfWeek === 6) {
      // Saturday
      startHour = 9;
      endHour = 15;
    } else {
      // Monday to Friday
      startHour = 8;
      endHour = 17;
    }

    // Format date for Google Calendar API
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing events for the day
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items;
    
    // Generate time slots (30 min slots)
    const timeSlots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + 30);

        // Check if slot is available (not overlapping with existing events)
        const isAvailable = !events.some(event => {
          const eventStart = new Date(event.start.dateTime || event.start.date);
          const eventEnd = new Date(event.end.dateTime || event.end.date);
          
          return (
            (slotStart >= eventStart && slotStart < eventEnd) || 
            (slotEnd > eventStart && slotEnd <= eventEnd) ||
            (slotStart <= eventStart && slotEnd >= eventEnd)
          );
        });

        if (isAvailable) {
          timeSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString()
          });
        }
      }
    }

    return timeSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw error;
  }
};

module.exports = {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getAvailableTimeSlots
};