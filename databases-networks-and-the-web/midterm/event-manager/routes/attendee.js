/**
 * attendee.js
 * Public routes for attendees: browse published events, view a single event
 * and book tickets. Ticket availability is derived from the bookings so it is
 * always accurate, and bookings are written inside a transaction.
 *
 * NB. it's better NOT to use arrow functions for callbacks with the SQLite library.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

/**
 * @route GET /attendee
 * @desc  Attendee Home Page. Lists published events ordered by event date so
 *        the next upcoming event appears at the top.
 * @output Renders attendee-home with { events }.
 */
router.get('/', function (req, res, next) {
    const query = "SELECT * FROM events WHERE state = 'published' ORDER BY event_date ASC";
    global.db.all(query, function (err, events) {
        if (err) {
            return next(err);
        }
        res.render('attendee-home', { events });
    });
});

/**
 * @route GET /attendee/event/:id
 * @desc  Attendee Event Page. Shows a single published event with its ticket
 *        types and the number of tickets still available (capacity minus sold).
 * @input req.params.id, optional req.query.msg / req.query.error for feedback
 * @output Renders attendee-event, or forwards an error if the event is not published.
 */
router.get('/event/:id', function (req, res, next) {
    const eventQuery = "SELECT * FROM events WHERE event_id = ? AND state = 'published'";
    global.db.get(eventQuery, [req.params.id], function (err, event) {
        if (err) {
            return next(err);
        }
        if (!event) {
            return next(new Error('Event not available'));
        }
        // Derive availability: capacity minus the quantity already booked
        const ticketsQuery = `
            SELECT
                tt.ticket_type_id,
                tt.name,
                tt.price,
                tt.quantity,
                tt.quantity - COALESCE(
                    (SELECT SUM(bi.quantity) FROM booking_items bi
                     WHERE bi.ticket_type_id = tt.ticket_type_id), 0
                ) AS available
            FROM ticket_types tt
            WHERE tt.event_id = ?
            ORDER BY tt.ticket_type_id`;
        global.db.all(ticketsQuery, [req.params.id], function (err, ticketTypes) {
            if (err) {
                return next(err);
            }
            res.render('attendee-event', {
                event,
                ticketTypes,
                message: req.query.msg || null,
                error: req.query.error || null,
            });
        });
    });
});

/**
 * @route POST /attendee/event/:id/book
 * @desc  Book tickets for an event. Validates the attendee name and that the
 *        requested quantities do not exceed availability, then writes the
 *        booking and its items in a single transaction.
 * @input req.params.id, req.body.attendee_name, req.body['qty_<ticket_type_id>']
 * @output Redirects back to the event page with a success or error message.
 */
router.post(
    '/event/:id/book',
    [body('attendee_name').trim().notEmpty().withMessage('Please enter your name')],
    function (req, res, next) {
        const eventId = req.params.id;
        const backUrl = '/attendee/event/' + eventId;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.redirect(backUrl + '?error=' + encodeURIComponent(errors.array()[0].msg));
        }

        // Load current availability for this event's ticket types
        const ticketsQuery = `
            SELECT
                tt.ticket_type_id,
                tt.name,
                tt.quantity - COALESCE(
                    (SELECT SUM(bi.quantity) FROM booking_items bi
                     WHERE bi.ticket_type_id = tt.ticket_type_id), 0
                ) AS available
            FROM ticket_types tt
            WHERE tt.event_id = ?`;
        global.db.all(ticketsQuery, [eventId], function (err, ticketTypes) {
            if (err) {
                return next(err);
            }

            // Read the requested quantity for each ticket type and validate it
            const requestedItems = [];
            let totalRequested = 0;
            for (let i = 0; i < ticketTypes.length; i++) {
                const ticket = ticketTypes[i];
                const raw = req.body['qty_' + ticket.ticket_type_id];
                const quantity = parseInt(raw, 10) || 0;
                if (quantity < 0) {
                    return res.redirect(
                        backUrl + '?error=' + encodeURIComponent('Quantities cannot be negative')
                    );
                }
                if (quantity > ticket.available) {
                    return res.redirect(
                        backUrl +
                            '?error=' +
                            encodeURIComponent(
                                'Only ' +
                                    ticket.available +
                                    ' "' +
                                    ticket.name +
                                    '" ticket(s) are available'
                            )
                    );
                }
                if (quantity > 0) {
                    requestedItems.push({ ticket_type_id: ticket.ticket_type_id, quantity });
                    totalRequested += quantity;
                }
            }

            if (totalRequested === 0) {
                return res.redirect(
                    backUrl +
                        '?error=' +
                        encodeURIComponent('Please select at least one ticket to book')
                );
            }

            // Write the booking and its items atomically
            global.db.serialize(function () {
                global.db.run('BEGIN TRANSACTION');
                const insertBooking =
                    'INSERT INTO bookings (event_id, attendee_name) VALUES (?, ?)';
                global.db.run(
                    insertBooking,
                    [eventId, req.body.attendee_name.trim()],
                    function (err) {
                        if (err) {
                            global.db.run('ROLLBACK');
                            return next(err);
                        }
                        const bookingId = this.lastID;
                        // Build a single multi-row insert for the chosen ticket types
                        const placeholders = requestedItems.map(function () {
                            return '(?, ?, ?)';
                        });
                        const params = [];
                        requestedItems.forEach(function (item) {
                            params.push(bookingId, item.ticket_type_id, item.quantity);
                        });
                        const insertItems =
                            'INSERT INTO booking_items (booking_id, ticket_type_id, quantity) VALUES ' +
                            placeholders.join(', ');
                        global.db.run(insertItems, params, function (err) {
                            if (err) {
                                global.db.run('ROLLBACK');
                                return next(err);
                            }
                            global.db.run('COMMIT', function (err) {
                                if (err) {
                                    return next(err);
                                }
                                res.redirect(
                                    backUrl +
                                        '?msg=' +
                                        encodeURIComponent(
                                            'Booking confirmed for ' +
                                                req.body.attendee_name.trim() +
                                                '. Enjoy the event!'
                                        )
                                );
                            });
                        });
                    }
                );
            });
        });
    }
);

module.exports = router;
