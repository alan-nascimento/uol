/**
 * organiser.js
 * Routes for the organiser area: home page, site settings, event creation,
 * editing, publishing and deletion, plus the sales dashboard (extension).
 * Every route in this router is protected by the requireAuth middleware.
 *
 * NB. it's better NOT to use arrow functions for callbacks with the SQLite library.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('./auth');
const router = express.Router();

// Protect all organiser routes: only a logged-in organiser may access them.
router.use(requireAuth);

/**
 * Normalise a datetime-local form value ('YYYY-MM-DDTHH:MM') to the
 * 'YYYY-MM-DD HH:MM' format used consistently in the database.
 */
function normaliseDateTime(value) {
  if (!value) {
    return null;
  }
  return String(value).replace('T', ' ');
}

/**
 * @route GET /organiser
 * @desc  Organiser Home Page. Lists published and draft events, each with its
 *        ticket types and key dates, plus controls to create, publish and delete.
 * @output Renders organiser-home with { publishedEvents, draftEvents }.
 */
router.get('/', function (req, res, next) {
  // Fetch all events, newest first
  const eventsQuery = 'SELECT * FROM events ORDER BY created_at DESC';
  global.db.all(eventsQuery, function (err, events) {
    if (err) {
      return next(err);
    }
    // Fetch all ticket types so we can attach them to their events in one pass
    const ticketsQuery = 'SELECT * FROM ticket_types ORDER BY ticket_type_id';
    global.db.all(ticketsQuery, function (err, ticketTypes) {
      if (err) {
        return next(err);
      }
      // Group ticket types by event_id
      const ticketsByEvent = {};
      ticketTypes.forEach(function (ticket) {
        if (!ticketsByEvent[ticket.event_id]) {
          ticketsByEvent[ticket.event_id] = [];
        }
        ticketsByEvent[ticket.event_id].push(ticket);
      });
      // Attach ticket types and split events by state
      const publishedEvents = [];
      const draftEvents = [];
      events.forEach(function (event) {
        event.ticketTypes = ticketsByEvent[event.event_id] || [];
        if (event.state === 'published') {
          publishedEvents.push(event);
        } else {
          draftEvents.push(event);
        }
      });
      res.render('organiser-home', { publishedEvents, draftEvents });
    });
  });
});

/**
 * @route GET /organiser/settings
 * @desc  Site Settings Page. Shows a form pre-populated with the current name
 *        and description.
 * @output Renders settings with the current settings and no errors.
 */
router.get('/settings', function (req, res, next) {
  const query = 'SELECT site_name, site_description FROM settings WHERE setting_id = 1';
  global.db.get(query, function (err, settings) {
    if (err) {
      return next(err);
    }
    res.render('settings', { settings, errors: [] });
  });
});

/**
 * @route POST /organiser/settings
 * @desc  Update the site name and description, then return to the home page.
 * @input req.body.site_name, req.body.site_description (both required)
 * @output On success: redirects to /organiser. On failure: re-renders the form.
 */
router.post(
  '/settings',
  [
    body('site_name').trim().notEmpty().withMessage('Site name is required'),
    body('site_description').trim().notEmpty().withMessage('Description is required'),
  ],
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('settings', {
        settings: {
          site_name: req.body.site_name,
          site_description: req.body.site_description,
        },
        errors: errors.array(),
      });
    }
    const query = 'UPDATE settings SET site_name = ?, site_description = ? WHERE setting_id = 1';
    global.db.run(
      query,
      [req.body.site_name.trim(), req.body.site_description.trim()],
      function (err) {
        if (err) {
          return next(err);
        }
        res.redirect('/organiser');
      }
    );
  }
);

/**
 * @route POST /organiser/events
 * @desc  Create a new draft event with two default ticket types (full-price and
 *        concession), then redirect to its edit page.
 * @output Redirects to /organiser/event/:id/edit for the new draft.
 */
router.post('/events', function (req, res, next) {
  const insertEvent =
    "INSERT INTO events (title, description, state) VALUES ('Untitled event', '', 'draft')";
  global.db.run(insertEvent, function (err) {
    if (err) {
      return next(err);
    }
    const newEventId = this.lastID;
    // Seed the two ticket types required by the specification
    const insertTickets =
      'INSERT INTO ticket_types (event_id, name, price, quantity) VALUES (?, ?, 0, 0), (?, ?, 0, 0)';
    global.db.run(
      insertTickets,
      [newEventId, 'Full price', newEventId, 'Concession'],
      function (err) {
        if (err) {
          return next(err);
        }
        res.redirect('/organiser/event/' + newEventId + '/edit');
      }
    );
  });
});

/**
 * @route GET /organiser/event/:id/edit
 * @desc  Organiser Edit Event Page. Shows a form populated with the event's
 *        current data and its full-price and concession ticket types.
 * @input req.params.id (event id)
 * @output Renders edit-event, or forwards a 404-style error if not found.
 */
router.get('/event/:id/edit', function (req, res, next) {
  const eventQuery = 'SELECT * FROM events WHERE event_id = ?';
  global.db.get(eventQuery, [req.params.id], function (err, event) {
    if (err) {
      return next(err);
    }
    if (!event) {
      return next(new Error('Event not found'));
    }
    const ticketsQuery = 'SELECT * FROM ticket_types WHERE event_id = ? ORDER BY ticket_type_id';
    global.db.all(ticketsQuery, [req.params.id], function (err, ticketTypes) {
      if (err) {
        return next(err);
      }
      // The two ticket types are seeded in order: full price then concession
      const fullTicket = ticketTypes[0] || {};
      const concessionTicket = ticketTypes[1] || {};
      res.render('edit-event', { event, fullTicket, concessionTicket, errors: [] });
    });
  });
});

/**
 * @route POST /organiser/event/:id/edit
 * @desc  Save changes to an event and its two ticket types, updating the
 *        last-modified timestamp.
 * @input req.params.id, req.body (title, description, event_date, ticket ids,
 *        prices and quantities)
 * @output On success: redirects to /organiser. On failure: re-renders the form.
 */
router.post(
  '/event/:id/edit',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('full_price').isFloat({ min: 0 }).withMessage('Full price must be 0 or more'),
    body('full_quantity').isInt({ min: 0 }).withMessage('Full quantity must be 0 or more'),
    body('concession_price').isFloat({ min: 0 }).withMessage('Concession price must be 0 or more'),
    body('concession_quantity')
      .isInt({ min: 0 })
      .withMessage('Concession quantity must be 0 or more'),
  ],
  function (req, res, next) {
    const eventId = req.params.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Re-render with the submitted values so nothing is lost
      const event = {
        event_id: eventId,
        title: req.body.title,
        description: req.body.description,
        event_date: normaliseDateTime(req.body.event_date),
        created_at: req.body.created_at,
      };
      const fullTicket = {
        ticket_type_id: req.body.full_ticket_type_id,
        price: req.body.full_price,
        quantity: req.body.full_quantity,
      };
      const concessionTicket = {
        ticket_type_id: req.body.concession_ticket_type_id,
        price: req.body.concession_price,
        quantity: req.body.concession_quantity,
      };
      return res.render('edit-event', {
        event,
        fullTicket,
        concessionTicket,
        errors: errors.array(),
      });
    }

    // Update the event itself and bump the last-modified timestamp
    const updateEvent =
      "UPDATE events SET title = ?, description = ?, event_date = ?, last_modified = datetime('now') WHERE event_id = ?";
    const eventParams = [
      req.body.title.trim(),
      (req.body.description || '').trim(),
      normaliseDateTime(req.body.event_date),
      eventId,
    ];
    global.db.run(updateEvent, eventParams, function (err) {
      if (err) {
        return next(err);
      }
      // Update the two ticket types by their ids
      const updateTicket =
        'UPDATE ticket_types SET price = ?, quantity = ? WHERE ticket_type_id = ? AND event_id = ?';
      global.db.run(
        updateTicket,
        [req.body.full_price, req.body.full_quantity, req.body.full_ticket_type_id, eventId],
        function (err) {
          if (err) {
            return next(err);
          }
          global.db.run(
            updateTicket,
            [
              req.body.concession_price,
              req.body.concession_quantity,
              req.body.concession_ticket_type_id,
              eventId,
            ],
            function (err) {
              if (err) {
                return next(err);
              }
              res.redirect('/organiser');
            }
          );
        }
      );
    });
  }
);

/**
 * @route POST /organiser/event/:id/publish
 * @desc  Publish a draft event: set its state and stamp the publication date.
 * @input req.params.id
 * @output Redirects to /organiser.
 */
router.post('/event/:id/publish', function (req, res, next) {
  const query =
    "UPDATE events SET state = 'published', published_at = datetime('now'), last_modified = datetime('now') WHERE event_id = ? AND state = 'draft'";
  global.db.run(query, [req.params.id], function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/organiser');
  });
});

/**
 * @route POST /organiser/event/:id/delete
 * @desc  Delete an event. Related ticket types, bookings and booking items are
 *        removed automatically via ON DELETE CASCADE.
 * @input req.params.id
 * @output Redirects to /organiser.
 */
router.post('/event/:id/delete', function (req, res, next) {
  const query = 'DELETE FROM events WHERE event_id = ?';
  global.db.run(query, [req.params.id], function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/organiser');
  });
});

/**
 * @route GET /organiser/dashboard
 * @desc  Sales dashboard (extension). Aggregates bookings to show global totals,
 *        a per-event/per-ticket-type breakdown with remaining capacity, and a
 *        list of recent bookings.
 * @output Renders dashboard with { totals, eventStats, recentBookings }.
 */
router.get('/dashboard', function (req, res, next) {
  // Global totals across all published events
  const totalsQuery = `
        SELECT
            (SELECT COUNT(*) FROM events WHERE state = 'published') AS published_events,
            (SELECT COUNT(*) FROM bookings) AS total_bookings,
            COALESCE(SUM(bi.quantity), 0) AS tickets_sold,
            COALESCE(SUM(bi.quantity * tt.price), 0) AS total_revenue
        FROM booking_items bi
        JOIN ticket_types tt ON tt.ticket_type_id = bi.ticket_type_id`;

  global.db.get(totalsQuery, function (err, totals) {
    if (err) {
      return next(err);
    }

    // Per ticket-type breakdown: capacity, sold, remaining and revenue,
    // grouped so we can nest ticket rows under their event.
    const breakdownQuery = `
            SELECT
                e.event_id,
                e.title,
                e.event_date,
                e.state,
                tt.ticket_type_id,
                tt.name AS ticket_name,
                tt.price,
                tt.quantity AS capacity,
                COALESCE(SUM(bi.quantity), 0) AS sold,
                tt.quantity - COALESCE(SUM(bi.quantity), 0) AS remaining,
                COALESCE(SUM(bi.quantity), 0) * tt.price AS revenue
            FROM events e
            JOIN ticket_types tt ON tt.event_id = e.event_id
            LEFT JOIN booking_items bi ON bi.ticket_type_id = tt.ticket_type_id
            GROUP BY tt.ticket_type_id
            ORDER BY e.event_date, tt.ticket_type_id`;

    global.db.all(breakdownQuery, function (err, rows) {
      if (err) {
        return next(err);
      }
      // Nest ticket rows under their event for display
      const eventMap = {};
      const eventStats = [];
      rows.forEach(function (row) {
        if (!eventMap[row.event_id]) {
          eventMap[row.event_id] = {
            event_id: row.event_id,
            title: row.title,
            event_date: row.event_date,
            state: row.state,
            tickets: [],
            capacity: 0,
            sold: 0,
            revenue: 0,
          };
          eventStats.push(eventMap[row.event_id]);
        }
        const event = eventMap[row.event_id];
        event.tickets.push(row);
        event.capacity += row.capacity;
        event.sold += row.sold;
        event.revenue += row.revenue;
      });

      // Most recent bookings with a summary of tickets and value
      const recentQuery = `
                SELECT
                    b.booking_id,
                    b.attendee_name,
                    b.created_at,
                    e.title AS event_title,
                    SUM(bi.quantity) AS tickets,
                    SUM(bi.quantity * tt.price) AS value
                FROM bookings b
                JOIN events e ON e.event_id = b.event_id
                JOIN booking_items bi ON bi.booking_id = b.booking_id
                JOIN ticket_types tt ON tt.ticket_type_id = bi.ticket_type_id
                GROUP BY b.booking_id
                ORDER BY b.created_at DESC
                LIMIT 10`;

      global.db.all(recentQuery, function (err, recentBookings) {
        if (err) {
          return next(err);
        }
        res.render('dashboard', { totals, eventStats, recentBookings });
      });
    });
  });
});

module.exports = router;
