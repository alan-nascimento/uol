/**
 * helpers.js
 * Small view helpers shared across templates. Uses date-fns to turn the ISO
 * datetime strings stored in SQLite into human-readable text.
 */

const { format } = require('date-fns');

/**
 * Convert a stored datetime string into a JS Date.
 * SQLite stores datetimes as 'YYYY-MM-DD HH:MM'; we normalise the space to 'T'.
 */
function toDate(value) {
    if (!value) {
        return null;
    }
    const date = new Date(String(value).replace(' ', 'T'));
    return isNaN(date.getTime()) ? null : date;
}

// Format as e.g. "15 Aug 2026, 09:00"; returns a dash when no date is set.
function formatDateTime(value) {
    const date = toDate(value);
    return date ? format(date, 'dd MMM yyyy, HH:mm') : '—';
}

// Format as e.g. "Sat 15 Aug 2026, 09:00" for attendee-facing listings.
function formatEventDate(value) {
    const date = toDate(value);
    return date ? format(date, 'EEE dd MMM yyyy, HH:mm') : 'Date to be confirmed';
}

// Format money as e.g. "£12.50".
function formatPrice(value) {
    const number = Number(value) || 0;
    return '£' + number.toFixed(2);
}

module.exports = { formatDateTime, formatEventDate, formatPrice };
