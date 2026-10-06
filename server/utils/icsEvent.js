// server/utils/icsEvent.js
// Builds a calendar invite (.ics) that any calendar app understands

// Converts a date to the iCalendar format: 2026-10-10T14:00:00.000Z -> 20261010T140000Z
function toIcsDate(date) {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// Escapes characters that have a special meaning in .ics files
function escapeText(text = '') {
    return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');
}

function buildIcsEvent({ id, start, end, summary, description }) {
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Dan Group Inc//Website//EN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${id}@dangroup.club`,
        `DTSTAMP:${toIcsDate(new Date())}`,
        `DTSTART:${toIcsDate(start)}`,
        `DTEND:${toIcsDate(end)}`,
        `SUMMARY:${escapeText(summary)}`,
        `DESCRIPTION:${escapeText(description)}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');
}

module.exports = buildIcsEvent;