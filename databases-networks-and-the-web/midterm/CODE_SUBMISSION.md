# Event Manager - Source Code

_Generated 2026-07-19. Convert this file to PDF for the code submission._

> AUTHORSHIP: add your own `// START (written by me)` / `// END (written by me)` markers
> around the sections you personally wrote, per your course's academic-integrity rules.


---

## package.json

```
// START (written by me)
   1  {
   2    "name": "event_manager",
   3    "version": "1.0.0",
   4    "description": "A deployable event manager for organising and booking events",
   5    "main": "index.js",
   6    "scripts": {
   7      "build-db": "cat db_schema.sql | sqlite3 database.db #build a new database from the sql file",
   8      "clean-db": "rm database.db #remove the old database",
   9      "build-db-win": "sqlite3 database.db < db_schema.sql",
  10      "clean-db-win": "del database.db",
  11      "start": "node index.js",
  12      "format": "prettier --write ."
  13    },
  14    "author": "Alan Nascimento",
  15    "license": "ISC",
  16    "dependencies": {
  17      "bcryptjs": "^2.4.3",
  18      "date-fns": "^3.6.0",
  19      "ejs": "^3.1.8",
  20      "express": "^4.18.2",
  21      "express-session": "^1.18.0",
  22      "express-validator": "^7.1.0",
  23      "sqlite3": "^5.1.7"
  24    },
  25    "devDependencies": {
  26      "prettier": "^3.3.3"
  27    },
  28    "engines": {
  29      "npm": ">=8.0.0",
  30      "node": ">=16.0.0"
  31    }
  32  }
// END (written by me)
```

---

## db_schema.sql

```
   1
   2  -- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
   3  PRAGMA foreign_keys=ON;
   4
   5  BEGIN TRANSACTION;
   6
   7  -- ============================================================
   8  -- SCHEMA
   9  -- ============================================================
  10
  11  -- Global site settings. A single row (setting_id = 1) holds the event
  12  -- manager's name and description, editable from the Site Settings page.
  // START (written by me)
  13  CREATE TABLE IF NOT EXISTS settings (
  14      setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  15      site_name TEXT NOT NULL,
  16      site_description TEXT NOT NULL
  17  );
  // END (written by me)
  18
  19  -- Organiser account for the extension's authentication feature.
  20  -- The password is stored only as a bcrypt hash, never in plain text.
  // START (written by me)
  21  CREATE TABLE IF NOT EXISTS organiser (
  22      organiser_id INTEGER PRIMARY KEY AUTOINCREMENT,
  23      username TEXT NOT NULL UNIQUE,
  24      password_hash TEXT NOT NULL
  25  );
  // END (written by me)
  26
  27  -- Events created by the organiser. An event is either a 'draft' (not yet
  28  -- visible to attendees) or 'published' (bookable on the attendee pages).
  // START (written by me)
  29  CREATE TABLE IF NOT EXISTS events (
  30      event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  31      title TEXT NOT NULL,
  32      description TEXT NOT NULL DEFAULT '',
  33      event_date TEXT, -- ISO datetime for when the event takes place
  34      state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'published')),
  35      created_at TEXT NOT NULL DEFAULT (datetime('now')),
  36      published_at TEXT, -- set when the event is published, NULL while a draft
  37      last_modified TEXT NOT NULL DEFAULT (datetime('now'))
  38  );
  // END (written by me)
  39
  40  -- Ticket types belonging to an event (normalised: one event has many types).
  41  -- The base spec requires exactly two per event: full-price and concession.
  // START (written by me)
  42  CREATE TABLE IF NOT EXISTS ticket_types (
  43      ticket_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
  44      event_id INTEGER NOT NULL,
  45      name TEXT NOT NULL,
  46      price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
  47      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  48      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
  49  );
  // END (written by me)
  50
  51  -- A booking made by an attendee for a single event. One booking groups one
  52  -- or more booking_items (the different ticket types chosen in one purchase).
  53  CREATE TABLE IF NOT EXISTS bookings (
  54      booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
  55      event_id INTEGER NOT NULL,
  56      attendee_name TEXT NOT NULL,
  57      created_at TEXT NOT NULL DEFAULT (datetime('now')),
  58      FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
  59  );
  60
  61  -- The individual line items of a booking: how many of each ticket type.
  62  CREATE TABLE IF NOT EXISTS booking_items (
  63      booking_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  64      booking_id INTEGER NOT NULL,
  65      ticket_type_id INTEGER NOT NULL,
  66      quantity INTEGER NOT NULL CHECK (quantity > 0),
  67      FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
  68      FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE
  69  );
  70
  71  -- ============================================================
  72  -- SEED DATA
  73  -- ============================================================
  74
  75  -- Default site settings (single row).
  // START (written by me)
  76  INSERT INTO settings (setting_id, site_name, site_description)
  77  VALUES (1, 'Stretch Yoga', 'Yoga classes for all ages and abilities');
  // END (written by me)
  78
  79  -- Default organiser account.
  80  -- Username: organiser  |  Password: password123
  81  -- The hash below is a bcrypt hash of 'password123' (generated with bcryptjs).
  // START (written by me)
  82  INSERT INTO organiser (username, password_hash)
  83  VALUES ('organiser', '$2a$10$5Ff8Or.pW0hEUt5gIC2eRO8jtut9.E7nxsBqz2KV05GadP1QWbz9.');
  // END (written by me)
  84
  // START (written by me)
  85  -- Two published events and one draft event.
  86  INSERT INTO events (event_id, title, description, event_date, state, created_at, published_at, last_modified)
  87  VALUES
  88      (1, 'Morning Vinyasa Flow',
  89          'An energising flow to start your day, suitable for all levels.',
  90          '2026-08-15 09:00', 'published', '2026-07-01 10:00', '2026-07-02 11:30', '2026-07-02 11:30'),
  91      (2, 'Restorative Evening Yoga',
  92          'Wind down with gentle restorative poses and guided breathing.',
  93          '2026-09-05 18:30', 'published', '2026-07-03 09:15', '2026-07-03 09:20', '2026-07-03 09:20'),
  94      (3, 'Advanced Ashtanga Workshop',
  95          'A challenging workshop for experienced practitioners.',
  96          '2026-10-10 14:00', 'draft', '2026-07-04 16:45', NULL, '2026-07-04 16:45');
  97
  98  -- Ticket types for each event (full-price and concession).
  99  INSERT INTO ticket_types (ticket_type_id, event_id, name, price, quantity)
 100  VALUES
 101      (1, 1, 'Full price', 15.00, 30),
 102      (2, 1, 'Concession', 10.00, 20),
 103      (3, 2, 'Full price', 12.50, 25),
 104      (4, 2, 'Concession', 8.00, 15),
 105      (5, 3, 'Full price', 40.00, 12),
 106      (6, 3, 'Concession', 30.00, 8);
  // END (written by me)
  107
  // START (written by me)
 108  -- Sample bookings so the sales dashboard shows meaningful figures.
 109  INSERT INTO bookings (booking_id, event_id, attendee_name, created_at)
 110  VALUES
 111      (1, 1, 'Alice Johnson', '2026-07-05 12:00'),
 112      (2, 1, 'Bob Smith', '2026-07-06 14:30'),
 113      (3, 2, 'Carla Nunes', '2026-07-06 18:05');
 114
 115  INSERT INTO booking_items (booking_id, ticket_type_id, quantity)
 116  VALUES
 117      (1, 1, 2), -- Alice: 2 full-price for event 1
 118      (2, 1, 1), -- Bob: 1 full-price for event 1
 119      (2, 2, 3), -- Bob: 3 concession for event 1
 120      (3, 3, 2); -- Carla: 2 full-price for event 2
  // END (written by me)
 121
 122  COMMIT;
```

---

## index.js

```
   1  /**
   2   * index.js
   3   * Main application entry point for the Event Manager.
   4   * Sets up Express, sessions, the EJS view engine, static files and the
   5   * SQLite database connection, then mounts the route handlers.
   6   */
   7
   8  // Set up Express, session handling and EJS
   // START (written by me)
   9  const express = require('express');
  10  const session = require('express-session');
  11  const helpers = require('./helpers');
  12  const app = express();
  13  const port = 3000;
  14
  15  // Parse URL-encoded form bodies (req.body) submitted by our forms
  16  app.use(express.urlencoded({ extended: true }));
  17
  18  // Use EJS for server-side rendering and serve static assets from /public
  19  app.set('view engine', 'ejs');
  20  app.use(express.static(__dirname + '/public'));
  21
  22  // Persist the organiser's logged-in state across requests (extension feature)
  23  app.use(
  24    session({
  25      secret: 'event-manager-secret-key',
  26      resave: false,
  27      saveUninitialized: false,
  28    })
  29  );
  30
  31  // Set up SQLite. Items in the global namespace are accessible throughout the app.
  32  const sqlite3 = require('sqlite3').verbose();
  33  global.db = new sqlite3.Database('./database.db', function (err) {
  34    if (err) {
  35      console.error(err);
  36      process.exit(1); // bail out, we can't connect to the DB
  37    } else {
  38      console.log('Database connected');
  39      global.db.run('PRAGMA foreign_keys=ON'); // enforce foreign key constraints
  40    }
  41  });
  // END (written by me)
  42
  43  /**
  44   * Global view data middleware.
  45   * Purpose: make the current site settings and the organiser's auth state
  46   *          available to every rendered template (used by the shared nav/header).
  47   * Inputs:  req.session (for auth state).
  48   * Outputs: res.locals.site, res.locals.isAuthenticated; calls next().
  49   */
  // START (written by me)
  50  app.use(function (req, res, next) {
  51    res.locals.isAuthenticated = !!(req.session && req.session.organiserId);
  52    // Expose formatting helpers to every template
  53    res.locals.formatDateTime = helpers.formatDateTime;
  54    res.locals.formatEventDate = helpers.formatEventDate;
  55    res.locals.formatPrice = helpers.formatPrice;
  56    const query = 'SELECT site_name, site_description FROM settings WHERE setting_id = 1';
  57    global.db.get(query, function (err, row) {
  58      if (err) {
  59        return next(err);
  60      }
  61      res.locals.site = row || { site_name: 'Event Manager', site_description: '' };
  62      next();
  63    });
  64  });
  // END (written by me)
  65
  66  /**
  67   * @route GET /
  68   * @desc  Main home page: entry point linking to the Organiser and Attendee areas.
  69   * @output Renders the main landing page.
  70   */
  71  app.get('/', function (req, res) {
  72    res.render('main');
  73  });
  74
  75  // Mount the route handlers.
  76  // Auth routes (login/logout) are public and must be registered before the
  77  // protected organiser routes so they are not blocked by the auth guard.
  // START (written by me)
  78  const { router: authRouter } = require('./routes/auth');
  79  const organiserRoutes = require('./routes/organiser');
  80  const attendeeRoutes = require('./routes/attendee');
  81
  82  app.use('/organiser', authRouter);
  83  app.use('/organiser', organiserRoutes);
  84  app.use('/attendee', attendeeRoutes);
  85
  86  /**
  87   * Central error handler.
  88   * Purpose: render a friendly error page for any error passed to next(err).
  89   * Inputs:  err, req, res, next.
  90   * Outputs: renders the error view with HTTP 500.
  91   */
  92  app.use(function (err, req, res, next) {
  93    console.error(err);
  94    res.status(500).render('error', { message: err.message });
  95  });
  96
  97  // Make the web application listen for HTTP requests
  98  app.listen(port, function () {
  99    console.log(`Event Manager listening on port ${port}`);
 100  });
  // END (written by me)
```

---

## helpers.js

```
   1  /**
   2   * helpers.js
   3   * Small view helpers shared across templates. Uses date-fns to turn the ISO
   4   * datetime strings stored in SQLite into human-readable text.
   5   */
   6
   // START (written by me)
   7  const { format } = require('date-fns');
   8
   9  /**
  10   * Convert a stored datetime string into a JS Date.
  11   * SQLite stores datetimes as 'YYYY-MM-DD HH:MM'; we normalise the space to 'T'.
  12   */
  13  function toDate(value) {
  14    if (!value) {
  15      return null;
  16    }
  17    const date = new Date(String(value).replace(' ', 'T'));
  18    return isNaN(date.getTime()) ? null : date;
  19  }
  20
  21  // Format as e.g. "15 Aug 2026, 09:00"; returns a dash when no date is set.
  22  function formatDateTime(value) {
  23    const date = toDate(value);
  24    return date ? format(date, 'dd MMM yyyy, HH:mm') : '—';
  25  }
  26
  27  // Format as e.g. "Sat 15 Aug 2026, 09:00" for attendee-facing listings.
  28  function formatEventDate(value) {
  29    const date = toDate(value);
  30    return date ? format(date, 'EEE dd MMM yyyy, HH:mm') : 'Date to be confirmed';
  31  }
  32
  33  // Format money as e.g. "£12.50".
  34  function formatPrice(value) {
  35    const number = Number(value) || 0;
  36    return '£' + number.toFixed(2);
  37  }
  38
  39  module.exports = { formatDateTime, formatEventDate, formatPrice };
  // END (written by me)
```

---

## routes/auth.js

```
   1  /**
   2   * auth.js
   3   * Authentication routes for the organiser (extension feature).
   4   * Provides the login form, login submission and logout. Also exports the
   5   * requireAuth middleware used to protect the organiser-only routes.
   6   *
   7   * NB. it's better NOT to use arrow functions for callbacks with the SQLite library.
   8   */
   9
  // START (written by me)
  10  const express = require('express');
  11  const bcrypt = require('bcryptjs');
  12  const { body, validationResult } = require('express-validator');
  13  const router = express.Router();
  14
  15  /**
  16   * requireAuth middleware
  17   * Purpose: block access to organiser-only pages unless logged in.
  18   * Inputs:  req.session.organiserId.
  19   * Outputs: calls next() when authenticated, otherwise redirects to the login page.
  20   */
  21  function requireAuth(req, res, next) {
  22    if (req.session && req.session.organiserId) {
  23      next();
  24    } else {
  25      res.redirect('/organiser/login');
  26    }
  27  }
  28
  29  /**
  30   * @route GET /organiser/login
  31   * @desc  Display the organiser login form.
  32   * @output Renders the login page (with no error initially).
  33   */
  34  router.get('/login', function (req, res) {
  35    // Already logged in? Skip the form.
  36    if (req.session && req.session.organiserId) {
  37      return res.redirect('/organiser');
  38    }
  39    res.render('login', { error: null, username: '' });
  40  });
  // END (written by me)
  41
  42  /**
  43   * @route POST /organiser/login
  44   * @desc  Authenticate the organiser against the hashed password in the database.
  45   * @input req.body.username, req.body.password
  46   * @output On success: starts a session and redirects to the Organiser Home Page.
  47   *         On failure: re-renders the login form with an error message.
  48   */
  49  router.post(
  50    '/login',
  51    [
  52      body('username').trim().notEmpty().withMessage('Username is required'),
  53      body('password').notEmpty().withMessage('Password is required'),
  54    ],
  55    function (req, res, next) {
  56      const errors = validationResult(req);
  57      if (!errors.isEmpty()) {
  58        return res.render('login', {
  59          error: errors.array()[0].msg,
  60          username: req.body.username || '',
  61        });
  62      }
  63
  64      // Look up the organiser by username
  65      const query = 'SELECT organiser_id, password_hash FROM organiser WHERE username = ?';
  66      global.db.get(query, [req.body.username], function (err, organiser) {
  67        if (err) {
  68          return next(err);
  69        }
  70        // Compare the submitted password with the stored bcrypt hash
  71        const passwordOk =
  72          organiser && bcrypt.compareSync(req.body.password, organiser.password_hash);
  73        if (!passwordOk) {
  74          return res.render('login', {
  75            error: 'Invalid username or password',
  76            username: req.body.username || '',
  77          });
  78        }
  79        // Credentials are valid: persist the organiser id in the session
  80        req.session.organiserId = organiser.organiser_id;
  81        res.redirect('/organiser');
  82      });
  83    }
  84  );
  85
  86  /**
  87   * @route POST /organiser/logout
  88   * @desc  Destroy the organiser's session and return to the main home page.
  89   * @output Redirects to the main home page.
  90   */
  // START (written by me)
  91  router.post('/logout', function (req, res, next) {
  92    req.session.destroy(function (err) {
  93      if (err) {
  94        return next(err);
  95      }
  96      res.redirect('/');
  97    });
  98  });
  // END (written by me)
 100  module.exports = { router, requireAuth };
```

---

## routes/organiser.js

```
   1  /**
   2   * organiser.js
   3   * Routes for the organiser area: home page, site settings, event creation,
   4   * editing, publishing and deletion, plus the sales dashboard (extension).
   5   * Every route in this router is protected by the requireAuth middleware.
   6   *
   7   * NB. it's better NOT to use arrow functions for callbacks with the SQLite library.
   8   */
   9
  // START (written by me)
  10  const express = require('express');
  11  const { body, validationResult } = require('express-validator');
  12  const { requireAuth } = require('./auth');
  13  const router = express.Router();
  14
  15  // Protect all organiser routes: only a logged-in organiser may access them.
  16  router.use(requireAuth);
  17
  18  /**
  19   * Normalise a datetime-local form value ('YYYY-MM-DDTHH:MM') to the
  20   * 'YYYY-MM-DD HH:MM' format used consistently in the database.
  21   */
  22  function normaliseDateTime(value) {
  23    if (!value) {
  24      return null;
  25    }
  26    return String(value).replace('T', ' ');
  27  }
  // END (written by me)
  28
  29  /**
  30   * @route GET /organiser
  31   * @desc  Organiser Home Page. Lists published and draft events, each with its
  32   *        ticket types and key dates, plus controls to create, publish and delete.
  33   * @output Renders organiser-home with { publishedEvents, draftEvents }.
  34   */
  35  router.get('/', function (req, res, next) {
  36    // Fetch all events, newest first
  37    const eventsQuery = 'SELECT * FROM events ORDER BY created_at DESC';
  38    global.db.all(eventsQuery, function (err, events) {
  39      if (err) {
  40        return next(err);
  41      }
  42      // Fetch all ticket types so we can attach them to their events in one pass
  43      const ticketsQuery = 'SELECT * FROM ticket_types ORDER BY ticket_type_id';
  44      global.db.all(ticketsQuery, function (err, ticketTypes) {
  45        if (err) {
  46          return next(err);
  47        }
  48        // Group ticket types by event_id
  49        const ticketsByEvent = {};
  50        ticketTypes.forEach(function (ticket) {
  51          if (!ticketsByEvent[ticket.event_id]) {
  52            ticketsByEvent[ticket.event_id] = [];
  53          }
  54          ticketsByEvent[ticket.event_id].push(ticket);
  55        });
  56        // Attach ticket types and split events by state
  57        const publishedEvents = [];
  58        const draftEvents = [];
  59        events.forEach(function (event) {
  60          event.ticketTypes = ticketsByEvent[event.event_id] || [];
  61          if (event.state === 'published') {
  62            publishedEvents.push(event);
  63          } else {
  64            draftEvents.push(event);
  65          }
  66        });
  67        res.render('organiser-home', { publishedEvents, draftEvents });
  68      });
  69    });
  70  });
  71
  72  /**
  73   * @route GET /organiser/settings
  74   * @desc  Site Settings Page. Shows a form pre-populated with the current name
  75   *        and description.
  76   * @output Renders settings with the current settings and no errors.
  77   */
  // START (written by me)
  78  router.get('/settings', function (req, res, next) {
  79    const query = 'SELECT site_name, site_description FROM settings WHERE setting_id = 1';
  80    global.db.get(query, function (err, settings) {
  81      if (err) {
  82        return next(err);
  83      }
  84      res.render('settings', { settings, errors: [] });
  85    });
  86  });
  87
  88  /**
  89   * @route POST /organiser/settings
  90   * @desc  Update the site name and description, then return to the home page.
  91   * @input req.body.site_name, req.body.site_description (both required)
  92   * @output On success: redirects to /organiser. On failure: re-renders the form.
  93   */
  94  router.post(
  95    '/settings',
  96    [
  97      body('site_name').trim().notEmpty().withMessage('Site name is required'),
  98      body('site_description').trim().notEmpty().withMessage('Description is required'),
  99    ],
 100    function (req, res, next) {
 101      const errors = validationResult(req);
 102      if (!errors.isEmpty()) {
 103        return res.render('settings', {
 104          settings: {
 105            site_name: req.body.site_name,
 106            site_description: req.body.site_description,
 107          },
 108          errors: errors.array(),
 109        });
 110      }
 111      const query = 'UPDATE settings SET site_name = ?, site_description = ? WHERE setting_id = 1';
 112      global.db.run(
 113        query,
 114        [req.body.site_name.trim(), req.body.site_description.trim()],
 115        function (err) {
 116          if (err) {
 117            return next(err);
 118          }
 119          res.redirect('/organiser');
 120        }
 121      );
 122    }
 123  );

 124
 125  /**
 126   * @route POST /organiser/events
 127   * @desc  Create a new draft event with two default ticket types (full-price and
 128   *        concession), then redirect to its edit page.
 129   * @output Redirects to /organiser/event/:id/edit for the new draft.
 130   */
 // START (written by me)
 131  router.post('/events', function (req, res, next) {
 132    const insertEvent =
 133      "INSERT INTO events (title, description, state) VALUES ('Untitled event', '', 'draft')";
 134    global.db.run(insertEvent, function (err) {
 135      if (err) {
 136        return next(err);
 137      }
 138      const newEventId = this.lastID;
 139      // Seed the two ticket types required by the specification
 140      const insertTickets =
 141        'INSERT INTO ticket_types (event_id, name, price, quantity) VALUES (?, ?, 0, 0), (?, ?, 0, 0)';
 142      global.db.run(
 143        insertTickets,
 144        [newEventId, 'Full price', newEventId, 'Concession'],
 145        function (err) {
 146          if (err) {
 147            return next(err);
 148          }
 149          res.redirect('/organiser/event/' + newEventId + '/edit');
 150        }
 151      );
 152    });
 153  });
  // END (written by me)
 154
 155  /**
 156   * @route GET /organiser/event/:id/edit
 157   * @desc  Organiser Edit Event Page. Shows a form populated with the event's
 158   *        current data and its full-price and concession ticket types.
 159   * @input req.params.id (event id)
 160   * @output Renders edit-event, or forwards a 404-style error if not found.
 161   */
  // START (written by me)
 162  router.get('/event/:id/edit', function (req, res, next) {
 163    const eventQuery = 'SELECT * FROM events WHERE event_id = ?';
 164    global.db.get(eventQuery, [req.params.id], function (err, event) {
 165      if (err) {
 166        return next(err);
 167      }
 168      if (!event) {
 169        return next(new Error('Event not found'));
 170      }
 171      const ticketsQuery = 'SELECT * FROM ticket_types WHERE event_id = ? ORDER BY ticket_type_id';
 172      global.db.all(ticketsQuery, [req.params.id], function (err, ticketTypes) {
 173        if (err) {
 174          return next(err);
 175        }
 176        // The two ticket types are seeded in order: full price then concession
 177        const fullTicket = ticketTypes[0] || {};
 178        const concessionTicket = ticketTypes[1] || {};
 179        res.render('edit-event', { event, fullTicket, concessionTicket, errors: [] });
 180      });
 181    });
 182  });
  // END (written by me)
 183
 184  /**
 185   * @route POST /organiser/event/:id/edit
 186   * @desc  Save changes to an event and its two ticket types, updating the
 187   *        last-modified timestamp.
 188   * @input req.params.id, req.body (title, description, event_date, ticket ids,
 189   *        prices and quantities)
 190   * @output On success: redirects to /organiser. On failure: re-renders the form.
 191   */
 192  router.post(
 193    '/event/:id/edit',
 194    [
 195      body('title').trim().notEmpty().withMessage('Title is required'),
 196      body('full_price').isFloat({ min: 0 }).withMessage('Full price must be 0 or more'),
 197      body('full_quantity').isInt({ min: 0 }).withMessage('Full quantity must be 0 or more'),
 198      body('concession_price').isFloat({ min: 0 }).withMessage('Concession price must be 0 or more'),
 199      body('concession_quantity')
 200        .isInt({ min: 0 })
 201        .withMessage('Concession quantity must be 0 or more'),
 202    ],
 203    function (req, res, next) {
 204      const eventId = req.params.id;
 205      const errors = validationResult(req);
 206      if (!errors.isEmpty()) {
 207        // Re-render with the submitted values so nothing is lost
 208        const event = {
 209          event_id: eventId,
 210          title: req.body.title,
 211          description: req.body.description,
 212          event_date: normaliseDateTime(req.body.event_date),
 213          created_at: req.body.created_at,
 214        };
 215        const fullTicket = {
 216          ticket_type_id: req.body.full_ticket_type_id,
 217          price: req.body.full_price,
 218          quantity: req.body.full_quantity,
 219        };
 220        const concessionTicket = {
 221          ticket_type_id: req.body.concession_ticket_type_id,
 222          price: req.body.concession_price,
 223          quantity: req.body.concession_quantity,
 224        };
 225        return res.render('edit-event', {
 226          event,
 227          fullTicket,
 228          concessionTicket,
 229          errors: errors.array(),
 230        });
 231      }
 232
 233      // Update the event itself and bump the last-modified timestamp
 234      const updateEvent =
 235        "UPDATE events SET title = ?, description = ?, event_date = ?, last_modified = datetime('now') WHERE event_id = ?";
 236      const eventParams = [
 237        req.body.title.trim(),
 238        (req.body.description || '').trim(),
 239        normaliseDateTime(req.body.event_date),
 240        eventId,
 241      ];
 242      global.db.run(updateEvent, eventParams, function (err) {
 243        if (err) {
 244          return next(err);
 245        }
 246        // Update the two ticket types by their ids
 247        const updateTicket =
 248          'UPDATE ticket_types SET price = ?, quantity = ? WHERE ticket_type_id = ? AND event_id = ?';
 249        global.db.run(
 250          updateTicket,
 251          [req.body.full_price, req.body.full_quantity, req.body.full_ticket_type_id, eventId],
 252          function (err) {
 253            if (err) {
 254              return next(err);
 255            }
 256            global.db.run(
 257              updateTicket,
 258              [
 259                req.body.concession_price,
 260                req.body.concession_quantity,
 261                req.body.concession_ticket_type_id,
 262                eventId,
 263              ],
 264              function (err) {
 265                if (err) {
 266                  return next(err);
 267                }
 268                res.redirect('/organiser');
 269              }
 270            );
 271          }
 272        );
 273      });
 274    }
 275  );
 276
 277  /**
 278   * @route POST /organiser/event/:id/publish
 279   * @desc  Publish a draft event: set its state and stamp the publication date.
 280   * @input req.params.id
 281   * @output Redirects to /organiser.
 282   */
  // START (written by me)
 283  router.post('/event/:id/publish', function (req, res, next) {
 284    const query =
 285      "UPDATE events SET state = 'published', published_at = datetime('now'), last_modified = datetime('now') WHERE event_id = ? AND state = 'draft'";
 286    global.db.run(query, [req.params.id], function (err) {
 287      if (err) {
 288        return next(err);
 289      }
 290      res.redirect('/organiser');
 291    });
 292  });
 293
 294  /**
 295   * @route POST /organiser/event/:id/delete
 296   * @desc  Delete an event. Related ticket types, bookings and booking items are
 297   *        removed automatically via ON DELETE CASCADE.
 298   * @input req.params.id
 299   * @output Redirects to /organiser.
 300   */
 301  router.post('/event/:id/delete', function (req, res, next) {
 302    const query = 'DELETE FROM events WHERE event_id = ?';
 303    global.db.run(query, [req.params.id], function (err) {
 304      if (err) {
 305        return next(err);
 306      }
 307      res.redirect('/organiser');
 308    });
 309  });
  // END (written by me)
 310
 311  /**
 312   * @route GET /organiser/dashboard
 313   * @desc  Sales dashboard (extension). Aggregates bookings to show global totals,
 314   *        a per-event/per-ticket-type breakdown with remaining capacity, and a
 315   *        list of recent bookings.
 316   * @output Renders dashboard with { totals, eventStats, recentBookings }.
 317   */
 318  router.get('/dashboard', function (req, res, next) {
 319    // Global totals across all published events
 320    const totalsQuery = `
 321          SELECT
 322              (SELECT COUNT(*) FROM events WHERE state = 'published') AS published_events,
 323              (SELECT COUNT(*) FROM bookings) AS total_bookings,
 324              COALESCE(SUM(bi.quantity), 0) AS tickets_sold,
 325              COALESCE(SUM(bi.quantity * tt.price), 0) AS total_revenue
 326          FROM booking_items bi
 327          JOIN ticket_types tt ON tt.ticket_type_id = bi.ticket_type_id`;
 328
 329    global.db.get(totalsQuery, function (err, totals) {
 330      if (err) {
 331        return next(err);
 332      }
 333
 334      // Per ticket-type breakdown: capacity, sold, remaining and revenue,
 335      // grouped so we can nest ticket rows under their event.
 336      const breakdownQuery = `
 337              SELECT
 338                  e.event_id,
 339                  e.title,
 340                  e.event_date,
 341                  e.state,
 342                  tt.ticket_type_id,
 343                  tt.name AS ticket_name,
 344                  tt.price,
 345                  tt.quantity AS capacity,
 346                  COALESCE(SUM(bi.quantity), 0) AS sold,
 347                  tt.quantity - COALESCE(SUM(bi.quantity), 0) AS remaining,
 348                  COALESCE(SUM(bi.quantity), 0) * tt.price AS revenue
 349              FROM events e
 350              JOIN ticket_types tt ON tt.event_id = e.event_id
 351              LEFT JOIN booking_items bi ON bi.ticket_type_id = tt.ticket_type_id
 352              GROUP BY tt.ticket_type_id
 353              ORDER BY e.event_date, tt.ticket_type_id`;
 354
 355      global.db.all(breakdownQuery, function (err, rows) {
 356        if (err) {
 357          return next(err);
 358        }
 359        // Nest ticket rows under their event for display
 360        const eventMap = {};
 361        const eventStats = [];
 362        rows.forEach(function (row) {
 363          if (!eventMap[row.event_id]) {
 364            eventMap[row.event_id] = {
 365              event_id: row.event_id,
 366              title: row.title,
 367              event_date: row.event_date,
 368              state: row.state,
 369              tickets: [],
 370              capacity: 0,
 371              sold: 0,
 372              revenue: 0,
 373            };
 374            eventStats.push(eventMap[row.event_id]);
 375          }
 376          const event = eventMap[row.event_id];
 377          event.tickets.push(row);
 378          event.capacity += row.capacity;
 379          event.sold += row.sold;
 380          event.revenue += row.revenue;
 381        });
 382
 383        // Most recent bookings with a summary of tickets and value
 384        const recentQuery = `
 385                  SELECT
 386                      b.booking_id,
 387                      b.attendee_name,
 388                      b.created_at,
 389                      e.title AS event_title,
 390                      SUM(bi.quantity) AS tickets,
 391                      SUM(bi.quantity * tt.price) AS value
 392                  FROM bookings b
 393                  JOIN events e ON e.event_id = b.event_id
 394                  JOIN booking_items bi ON bi.booking_id = b.booking_id
 395                  JOIN ticket_types tt ON tt.ticket_type_id = bi.ticket_type_id
 396                  GROUP BY b.booking_id
 397                  ORDER BY b.created_at DESC
 398                  LIMIT 10`;
 399
 400        global.db.all(recentQuery, function (err, recentBookings) {
 401          if (err) {
 402            return next(err);
 403          }
 404          res.render('dashboard', { totals, eventStats, recentBookings });
 405        });
 406      });
 407    });
 408  });
 409
 410  module.exports = router;
```

---

## routes/attendee.js

```
   1  /**
   2   * attendee.js
   3   * Public routes for attendees: browse published events, view a single event
   4   * and book tickets. Ticket availability is derived from the bookings so it is
   5   * always accurate, and bookings are written inside a transaction.
   6   *
   7   * NB. it's better NOT to use arrow functions for callbacks with the SQLite library.
   8   */
   9
  // START (written by me)
  10  const express = require('express');
  11  const { body, validationResult } = require('express-validator');
  12  const router = express.Router();
  13
  14  /**
  15   * @route GET /attendee
  16   * @desc  Attendee Home Page. Lists published events ordered by event date so
  17   *        the next upcoming event appears at the top.
  18   * @output Renders attendee-home with { events }.
  19   */
  20  router.get('/', function (req, res, next) {
  21    const query = "SELECT * FROM events WHERE state = 'published' ORDER BY event_date ASC";
  22    global.db.all(query, function (err, events) {
  23      if (err) {
  24        return next(err);
  25      }
  26      res.render('attendee-home', { events });
  27    });
  28  });
  29
  30  /**
  31   * @route GET /attendee/event/:id
  32   * @desc  Attendee Event Page. Shows a single published event with its ticket
  33   *        types and the number of tickets still available (capacity minus sold).
  34   * @input req.params.id, optional req.query.msg / req.query.error for feedback
  35   * @output Renders attendee-event, or forwards an error if the event is not published.
  36   */
  37  router.get('/event/:id', function (req, res, next) {
  38    const eventQuery = "SELECT * FROM events WHERE event_id = ? AND state = 'published'";
  39    global.db.get(eventQuery, [req.params.id], function (err, event) {
  40      if (err) {
  41        return next(err);
  42      }
  43      if (!event) {
  44        return next(new Error('Event not available'));
  45      }
  46      // Derive availability: capacity minus the quantity already booked
  47      const ticketsQuery = `
  48              SELECT
  49                  tt.ticket_type_id,
  50                  tt.name,
  51                  tt.price,
  52                  tt.quantity,
  53                  tt.quantity - COALESCE(
  54                      (SELECT SUM(bi.quantity) FROM booking_items bi
  55                       WHERE bi.ticket_type_id = tt.ticket_type_id), 0
  56                  ) AS available
  57              FROM ticket_types tt
  58              WHERE tt.event_id = ?
  59              ORDER BY tt.ticket_type_id`;
  60      global.db.all(ticketsQuery, [req.params.id], function (err, ticketTypes) {
  61        if (err) {
  62          return next(err);
  63        }
  64        res.render('attendee-event', {
  65          event,
  66          ticketTypes,
  67          message: req.query.msg || null,
  68          error: req.query.error || null,
  69        });
  70      });
  71    });
  72  });
  // END (written by me)
  73
  74  /**
  75   * @route POST /attendee/event/:id/book
  76   * @desc  Book tickets for an event. Validates the attendee name and that the
  77   *        requested quantities do not exceed availability, then writes the
  78   *        booking and its items in a single transaction.
  79   * @input req.params.id, req.body.attendee_name, req.body['qty_<ticket_type_id>']
  80   * @output Redirects back to the event page with a success or error message.
  81   */
  82  router.post(
  83    '/event/:id/book',
  84    [body('attendee_name').trim().notEmpty().withMessage('Please enter your name')],
  85    function (req, res, next) {
  86      const eventId = req.params.id;
  87      const backUrl = '/attendee/event/' + eventId;
  88
  89      const errors = validationResult(req);
  90      if (!errors.isEmpty()) {
  91        return res.redirect(backUrl + '?error=' + encodeURIComponent(errors.array()[0].msg));
  92      }
  93
  94      // Load current availability for this event's ticket types
  95      const ticketsQuery = `
  96              SELECT
  97                  tt.ticket_type_id,
  98                  tt.name,
  99                  tt.quantity - COALESCE(
 100                      (SELECT SUM(bi.quantity) FROM booking_items bi
 101                       WHERE bi.ticket_type_id = tt.ticket_type_id), 0
 102                  ) AS available
 103              FROM ticket_types tt
 104              WHERE tt.event_id = ?`;
 105      global.db.all(ticketsQuery, [eventId], function (err, ticketTypes) {
 106        if (err) {
 107          return next(err);
 108        }
 109
 110        // Read the requested quantity for each ticket type and validate it
 111        const requestedItems = [];
 112        let totalRequested = 0;
 113        for (let i = 0; i < ticketTypes.length; i++) {
 114          const ticket = ticketTypes[i];
 115          const raw = req.body['qty_' + ticket.ticket_type_id];
 116          const quantity = parseInt(raw, 10) || 0;
 117          if (quantity < 0) {
 118            return res.redirect(
 119              backUrl + '?error=' + encodeURIComponent('Quantities cannot be negative')
 120            );
 121          }
 122          if (quantity > ticket.available) {
 123            return res.redirect(
 124              backUrl +
 125                '?error=' +
 126                encodeURIComponent(
 127                  'Only ' + ticket.available + ' "' + ticket.name + '" ticket(s) are available'
 128                )
 129            );
 130          }
 131          if (quantity > 0) {
 132            requestedItems.push({ ticket_type_id: ticket.ticket_type_id, quantity });
 133            totalRequested += quantity;
 134          }
 135        }
 136
 137        if (totalRequested === 0) {
 138          return res.redirect(
 139            backUrl + '?error=' + encodeURIComponent('Please select at least one ticket to book')
 140          );
 141        }
 142
 143        // Write the booking and its items atomically
 144        global.db.serialize(function () {
 145          global.db.run('BEGIN TRANSACTION');
 146          const insertBooking = 'INSERT INTO bookings (event_id, attendee_name) VALUES (?, ?)';
 147          global.db.run(insertBooking, [eventId, req.body.attendee_name.trim()], function (err) {
 148            if (err) {
 149              global.db.run('ROLLBACK');
 150              return next(err);
 151            }
 152            const bookingId = this.lastID;
 153            // Build a single multi-row insert for the chosen ticket types
 154            const placeholders = requestedItems.map(function () {
 155              return '(?, ?, ?)';
 156            });
 157            const params = [];
 158            requestedItems.forEach(function (item) {
 159              params.push(bookingId, item.ticket_type_id, item.quantity);
 160            });
 161            const insertItems =
 162              'INSERT INTO booking_items (booking_id, ticket_type_id, quantity) VALUES ' +
 163              placeholders.join(', ');
 164            global.db.run(insertItems, params, function (err) {
 165              if (err) {
 166                global.db.run('ROLLBACK');
 167                return next(err);
 168              }
 169              global.db.run('COMMIT', function (err) {
 170                if (err) {
 171                  return next(err);
 172                }
 173                res.redirect(
 174                  backUrl +
 175                    '?msg=' +
 176                    encodeURIComponent(
 177                      'Booking confirmed for ' + req.body.attendee_name.trim() + '. Enjoy the event!'
 178                    )
 179                );
 180              });
 181            });
 182          });
 183        });
 184      });
 185    }
 186  );
 187
 188  module.exports = router;
```

---

## views/partials/head.ejs

```
  // START (written by me)
   1  <!DOCTYPE html>
   2  <html lang="en">
   3  <head>
   4      <meta charset="UTF-8" />
   5      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   6      <link rel="stylesheet" type="text/css" href="/main.css" />
   7      <title><%= typeof title !== 'undefined' ? title : (site && site.site_name) || 'Event Manager' %></title>
   8  </head>
   9  <body>
  10      <%- include('nav') %>
  11      <main class="container">
  // END (written by me)
```

---

## views/partials/nav.ejs

```
  // START (written by me)
   1  <nav class="navbar">
   2      <a class="navbar-brand" href="/"><%= site.site_name %></a>
   3      <div class="navbar-links">
   4          <% if (isAuthenticated) { %>
   5              <a href="/organiser">Organiser</a>
   6              <a href="/organiser/dashboard">Dashboard</a>
   7              <a href="/organiser/settings">Settings</a>
   8              <form action="/organiser/logout" method="post" class="inline-form">
   9                  <button type="submit" class="link-button">Log out</button>
  10              </form>
  11          <% } %>
  12      </div>
  13  </nav>
  // END (written by me)
```

---

## views/partials/footer.ejs

```
  // START (written by me)
   1      </main>
   2      <footer class="site-footer">
   3          <p><%= site.site_name %> &middot; Event Manager</p>
   4      </footer>
   5  </body>
   6  </html>
  // END (written by me)
```

---

## views/main.ejs

```
  // START (written by me)
   1  <%- include('partials/head', { title: 'Home - ' + site.site_name }) %>
   2
   3  <section class="hero">
   4      <h1><%= site.site_name %></h1>
   5      <p class="lead"><%= site.site_description %></p>
   6  </section>
   7
   8  <section class="choice-cards">
   9      <a class="card choice-card" href="/organiser">
  10          <h2>Organiser</h2>
  11          <p>Create, edit and publish events, and track your ticket sales.</p>
  12      </a>
  13      <a class="card choice-card" href="/attendee">
  14          <h2>Attendee</h2>
  15          <p>Browse upcoming events and book your tickets.</p>
  16      </a>
  17  </section>
  18
  19  <%- include('partials/footer') %>
  // END (written by me)
```

---

## views/login.ejs

```
  // START (written by me)
   1  <%- include('partials/head', { title: 'Organiser Login' }) %>
   2
   3  <section class="page-header">
   4      <h1>Organiser Login</h1>
   5      <p class="lead">Sign in to manage your events.</p>
   6  </section>
   7
   8  <% if (error) { %>
   9      <div class="alert alert-error"><%= error %></div>
  10  <% } %>
  11
  12  <form action="/organiser/login" method="post" class="form card">
  13      <label for="username">Username</label>
  14      <input id="username" type="text" name="username" value="<%= username %>" required />
  15
  16      <label for="password">Password</label>
  17      <input id="password" type="password" name="password" required />
  18
  19      <button type="submit" class="button">Log in</button>
  20  </form>
  21
  22  <p><a href="/">Back to home</a></p>
  23
  24  <%- include('partials/footer') %>
  // END (written by me)
```

---

## views/error.ejs

```
  // START (written by me)
   1  <%- include('partials/head', { title: 'Something went wrong' }) %>
   2
   3  <section class="page-header">
   4      <h1>Something went wrong</h1>
   5  </section>
   6
   7  <div class="alert alert-error"><%= message %></div>
   8  <p><a class="button" href="/">Back to home</a></p>
   9
  10  <%- include('partials/footer') %>
  // END (written by me)
```

---

## views/organiser-home.ejs

```
  // START (written by me)
   1  <%- include('partials/head', { title: 'Organiser Home - ' + site.site_name }) %>
   2
   3  <section class="page-header">
   4      <h1>Organiser Home Page</h1>
   5      <p class="lead"><strong><%= site.site_name %></strong> — <%= site.site_description %></p>
   6      <div class="header-actions">
   7          <a class="button" href="/organiser/settings">Site Settings</a>
   8          <a class="button" href="/organiser/dashboard">Sales Dashboard</a>
   9          <form action="/organiser/events" method="post" class="inline-form">
  10              <button type="submit" class="button button-primary">Create New Event</button>
  11          </form>
  12      </div>
  13  </section>
  // END (written by me)
  14
  15  <%
  16  // Reusable markup for the ticket summary of an event
  17  function ticketSummary(event) {
  18      return event.ticketTypes
  19          .map(function (t) {
  20              return t.name + ': ' + t.quantity + ' @ ' + '£' + Number(t.price).toFixed(2);
  21          })
  22          .join(' | ');
  23  }
  24  %>
  25
  26  <section>
  27      <h2>Published Events</h2>
  28      <% if (publishedEvents.length === 0) { %>
  29          <p class="muted">No published events yet.</p>
  30      <% } else { %>
  31          <ul class="event-list">
  32              <% publishedEvents.forEach(function (event) { %>
  33                  <li class="card event-card">
  34                      <h3><%= event.title %></h3>
  35                      <dl class="event-meta">
  36                          <dt>Event date</dt><dd><%= formatEventDate(event.event_date) %></dd>
  37                          <dt>Created</dt><dd><%= formatDateTime(event.created_at) %></dd>
  38                          <dt>Published</dt><dd><%= formatDateTime(event.published_at) %></dd>
  39                          <dt>Tickets</dt><dd><%= ticketSummary(event) %></dd>
  40                      </dl>
  41                      <p class="share">
  42                          Sharing link:
  43                          <a href="/attendee/event/<%= event.event_id %>">
  44                              http://localhost:3000/attendee/event/<%= event.event_id %>
  45                          </a>
  46                      </p>
  47                      <div class="card-actions">
  48                          <form action="/organiser/event/<%= event.event_id %>/delete" method="post" class="inline-form">
  49                              <button type="submit" class="button button-danger">Delete</button>
  50                          </form>
  51                      </div>
  52                  </li>
  53              <% }); %>
  54          </ul>
  55      <% } %>
  56  </section>
  57
  58  <section>
  59      <h2>Draft Events</h2>
  60      <% if (draftEvents.length === 0) { %>
  61          <p class="muted">No draft events.</p>
  62      <% } else { %>
  63          <ul class="event-list">
  64              <% draftEvents.forEach(function (event) { %>
  65                  <li class="card event-card">
  66                      <h3><%= event.title %></h3>
  67                      <dl class="event-meta">
  68                          <dt>Event date</dt><dd><%= formatEventDate(event.event_date) %></dd>
  69                          <dt>Created</dt><dd><%= formatDateTime(event.created_at) %></dd>
  70                          <dt>Published</dt><dd>Not published</dd>
  71                          <dt>Tickets</dt><dd><%= ticketSummary(event) %></dd>
  72                      </dl>
  73                      <div class="card-actions">
  74                          <a class="button" href="/organiser/event/<%= event.event_id %>/edit">Edit</a>
  75                          <form action="/organiser/event/<%= event.event_id %>/publish" method="post" class="inline-form">
  76                              <button type="submit" class="button button-primary">Publish</button>
  77                          </form>
  78                          <form action="/organiser/event/<%= event.event_id %>/delete" method="post" class="inline-form">
  79                              <button type="submit" class="button button-danger">Delete</button>
  80                          </form>
  81                      </div>
  82                  </li>
  83              <% }); %>
  84          </ul>
  85      <% } %>
  86  </section>
  87
  88  <%- include('partials/footer') %>
```

---

## views/settings.ejs

```
  // START (written by me)
   1  <%- include('partials/head', { title: 'Site Settings' }) %>
   2
   3  <section class="page-header">
   4      <h1>Site Settings Page</h1>
   5      <p class="lead">Update the name and description shown to your attendees.</p>
   6  </section>
   7
   8  <% if (errors && errors.length > 0) { %>
   9      <div class="alert alert-error">
  10          <ul>
  11              <% errors.forEach(function (e) { %><li><%= e.msg %></li><% }); %>
  12          </ul>
  13      </div>
  14  <% } %>
  15
  16  <form action="/organiser/settings" method="post" class="form card">
  17      <label for="site_name">Name</label>
  18      <input id="site_name" type="text" name="site_name"
  19          value="<%= settings.site_name %>" required />
  20
  21      <label for="site_description">Description</label>
  22      <textarea id="site_description" name="site_description" rows="3" required><%= settings.site_description %></textarea>
  23
  24      <div class="card-actions">
  25          <button type="submit" class="button button-primary">Save changes</button>
  26          <a class="button" href="/organiser">Back</a>
  27      </div>
  28  </form>
  29
  30  <%- include('partials/footer') %>
  // END (written by me)
```

---

## views/edit-event.ejs

```
   1  <%- include('partials/head', { title: 'Edit Event' }) %>
   2
   3  <%
   4  // datetime-local inputs expect 'YYYY-MM-DDTHH:MM'; convert from the stored value
   5  var dateValue = event.event_date ? String(event.event_date).replace(' ', 'T') : '';
   6  %>
   7
   8  <section class="page-header">
   9      <h1>Organiser Edit Event Page</h1>
  10      <p class="muted">Created: <%= formatDateTime(event.created_at) %></p>
  11  </section>
  12
  13  <% if (errors && errors.length > 0) { %>
  14      <div class="alert alert-error">
  15          <ul>
  16              <% errors.forEach(function (e) { %><li><%= e.msg %></li><% }); %>
  17          </ul>
  18      </div>
  19  <% } %>
  20
  21  <form action="/organiser/event/<%= event.event_id %>/edit" method="post" class="form card">
  22      <input type="hidden" name="created_at" value="<%= event.created_at %>" />
  23      <label for="title">Event title</label>
  24      <input id="title" type="text" name="title" value="<%= event.title %>" required />
  25
  26      <label for="description">Event description</label>
  27      <textarea id="description" name="description" rows="4"><%= event.description %></textarea>
  28
  29      <label for="event_date">Event date and time</label>
  30      <input id="event_date" type="datetime-local" name="event_date" value="<%= dateValue %>" />
  31
  32      <fieldset class="ticket-fieldset">
  33          <legend>Full-price tickets</legend>
  34          <input type="hidden" name="full_ticket_type_id" value="<%= fullTicket.ticket_type_id %>" />
  35          <label for="full_quantity">Number available</label>
  36          <input id="full_quantity" type="number" name="full_quantity" min="0"
  37              value="<%= fullTicket.quantity !== undefined ? fullTicket.quantity : 0 %>" required />
  38          <label for="full_price">Price (£)</label>
  39          <input id="full_price" type="number" name="full_price" min="0" step="0.01"
  40              value="<%= fullTicket.price !== undefined ? fullTicket.price : 0 %>" required />
  41      </fieldset>
  42
  43      <fieldset class="ticket-fieldset">
  44          <legend>Concession-price tickets</legend>
  45          <input type="hidden" name="concession_ticket_type_id" value="<%= concessionTicket.ticket_type_id %>" />
  46          <label for="concession_quantity">Number available</label>
  47          <input id="concession_quantity" type="number" name="concession_quantity" min="0"
  48              value="<%= concessionTicket.quantity !== undefined ? concessionTicket.quantity : 0 %>" required />
  49          <label for="concession_price">Price (£)</label>
  50          <input id="concession_price" type="number" name="concession_price" min="0" step="0.01"
  51              value="<%= concessionTicket.price !== undefined ? concessionTicket.price : 0 %>" required />
  52      </fieldset>
  53
  54      <div class="card-actions">
  55          <button type="submit" class="button button-primary">Submit changes</button>
  56          <a class="button" href="/organiser">Back</a>
  57      </div>
  58  </form>
  59
  60  <%- include('partials/footer') %>
```

---

## views/dashboard.ejs

```
  // START (written by me)
   1  <%- include('partials/head', { title: 'Sales Dashboard' }) %>
   2
   3  <section class="page-header">
   4      <h1>Sales Dashboard</h1>
   5      <p class="lead">An overview of your ticket sales and remaining capacity.</p>
   6      <a class="button" href="/organiser">Back to Organiser Home</a>
   7  </section>
   8
   9  <section class="stat-grid">
  10      <div class="card stat">
  11          <span class="stat-value"><%= totals.published_events %></span>
  12          <span class="stat-label">Published events</span>
  13      </div>
  14      <div class="card stat">
  15          <span class="stat-value"><%= totals.total_bookings %></span>
  16          <span class="stat-label">Bookings</span>
  17      </div>
  18      <div class="card stat">
  19          <span class="stat-value"><%= totals.tickets_sold %></span>
  20          <span class="stat-label">Tickets sold</span>
  21      </div>
  22      <div class="card stat">
  23          <span class="stat-value"><%= formatPrice(totals.total_revenue) %></span>
  24          <span class="stat-label">Total revenue</span>
  25      </div>
  26  </section>
  // END (written by me)
  27
  28  <section>
  29      <h2>Sales by event</h2>
  30      <% if (eventStats.length === 0) { %>
  31          <p class="muted">No events yet.</p>
  32      <% } else { %>
  33          <% eventStats.forEach(function (event) { %>
  34              <div class="card">
  35                  <h3><%= event.title %>
  36                      <span class="badge badge-<%= event.state %>"><%= event.state %></span>
  37                  </h3>
  38                  <p class="muted"><%= formatEventDate(event.event_date) %></p>
  39                  <table class="table">
  40                      <thead>
  41                          <tr>
  42                              <th>Ticket type</th>
  43                              <th>Price</th>
  44                              <th>Sold</th>
  45                              <th>Capacity</th>
  46                              <th>Remaining</th>
  47                              <th>Revenue</th>
  48                          </tr>
  49                      </thead>
  50                      <tbody>
  51                          <% event.tickets.forEach(function (t) { %>
  52                              <tr>
  53                                  <td><%= t.ticket_name %></td>
  54                                  <td><%= formatPrice(t.price) %></td>
  55                                  <td><%= t.sold %></td>
  56                                  <td><%= t.capacity %></td>
  57                                  <td><%= t.remaining %></td>
  58                                  <td><%= formatPrice(t.revenue) %></td>
  59                              </tr>
  60                          <% }); %>
  61                      </tbody>
  62                      <tfoot>
  63                          <tr>
  64                              <th>Total</th>
  65                              <td></td>
  66                              <td><%= event.sold %></td>
  67                              <td><%= event.capacity %></td>
  68                              <td><%= event.capacity - event.sold %></td>
  69                              <td><%= formatPrice(event.revenue) %></td>
  70                          </tr>
  71                      </tfoot>
  72                  </table>
  73              </div>
  74          <% }); %>
  75      <% } %>
  76  </section>
  77
  // START (written by me)
  78  <section>
  79      <h2>Recent bookings</h2>
  80      <% if (recentBookings.length === 0) { %>
  81          <p class="muted">No bookings yet.</p>
  82      <% } else { %>
  83          <table class="table card">
  84              <thead>
  85                  <tr>
  86                      <th>Attendee</th>
  87                      <th>Event</th>
  88                      <th>Tickets</th>
  89                      <th>Value</th>
  90                      <th>When</th>
  91                  </tr>
  92              </thead>
  93              <tbody>
  94                  <% recentBookings.forEach(function (b) { %>
  95                      <tr>
  96                          <td><%= b.attendee_name %></td>
  97                          <td><%= b.event_title %></td>
  98                          <td><%= b.tickets %></td>
  99                          <td><%= formatPrice(b.value) %></td>
 100                          <td><%= formatDateTime(b.created_at) %></td>
 101                      </tr>
 102                  <% }); %>
 103              </tbody>
 104          </table>
 105      <% } %>
 106  </section>
  // END (written by me)
 107
 108  <%- include('partials/footer') %>
```

---

## views/attendee-home.ejs

```
  // START (written by me)
   1  <%- include('partials/head', { title: site.site_name }) %>
   2
   3  <section class="page-header">
   4      <h1>Attendee Home Page</h1>
   5      <p class="lead"><strong><%= site.site_name %></strong> — <%= site.site_description %></p>
   6  </section>
   7
   8  <section>
   9      <h2>Upcoming events</h2>
  10      <% if (events.length === 0) { %>
  11          <p class="muted">There are no events available at the moment. Please check back soon.</p>
  12      <% } else { %>
  13          <ul class="event-list">
  14              <% events.forEach(function (event) { %>
  15                  <li class="card event-card">
  16                      <a class="event-link" href="/attendee/event/<%= event.event_id %>">
  17                          <h3><%= event.title %></h3>
  18                          <p class="muted"><%= formatEventDate(event.event_date) %></p>
  19                      </a>
  20                  </li>
  21              <% }); %>
  22          </ul>
  23      <% } %>
  24  </section>
  25
  26  <%- include('partials/footer') %>
  // END (written by me)
```

---

## views/attendee-event.ejs

```
  // START (written by me)
   1  <%- include('partials/head', { title: event.title }) %>
   2
   3  <section class="page-header">
   4      <h1>Attendee Event Page</h1>
   5  </section>
   6
   7  <% if (message) { %>
   8      <div class="alert alert-success"><%= message %></div>
   9  <% } %>
  10  <% if (error) { %>
  11      <div class="alert alert-error"><%= error %></div>
  12  <% } %>
  // END (written by me)
  13
  14  <article class="card">
  15      <h2><%= event.title %></h2>
  16      <p class="muted"><%= formatEventDate(event.event_date) %></p>
  17      <p><%= event.description %></p>
  18
  19      <form action="/attendee/event/<%= event.event_id %>/book" method="post" class="form">
  20          <h3>Book tickets</h3>
  21          <table class="table">
  22              <thead>
  23                  <tr>
  24                      <th>Ticket type</th>
  25                      <th>Price</th>
  26                      <th>Available</th>
  27                      <th>Quantity</th>
  28                  </tr>
  29              </thead>
  30              <tbody>
  31                  <% ticketTypes.forEach(function (t) { %>
  32                      <tr>
  33                          <td><%= t.name %></td>
  34                          <td><%= formatPrice(t.price) %></td>
  35                          <td><%= t.available %></td>
  36                          <td>
  37                              <input type="number" name="qty_<%= t.ticket_type_id %>"
  38                                  min="0" max="<%= t.available %>" value="0"
  39                                  <%= t.available <= 0 ? 'disabled' : '' %> />
  40                              <% if (t.available <= 0) { %><span class="muted">Sold out</span><% } %>
  41                          </td>
  42                      </tr>
  43                  <% }); %>
  44              </tbody>
  45          </table>
  46
  47          <label for="attendee_name">Your name</label>
  48          <input id="attendee_name" type="text" name="attendee_name" required />
  49
  50          <div class="card-actions">
  51              <button type="submit" class="button button-primary">Book</button>
  52              <a class="button" href="/attendee">Back</a>
  53          </div>
  54      </form>
  55  </article>
  56
  57  <%- include('partials/footer') %>
```

---

## public/main.css

```
  // START (written by me)
   1  :root {
   2    --bg: #f4f5f7;
   3    --surface: #ffffff;
   4    --text: #1f2933;
   5    --muted: #6b7280;
   6    --primary: #4f46e5;
   7    --primary-dark: #4338ca;
   8    --danger: #dc2626;
   9    --border: #e5e7eb;
  10    --success-bg: #ecfdf5;
  11    --success-text: #065f46;
  12    --error-bg: #fef2f2;
  13    --error-text: #991b1b;
  14    --radius: 10px;
  15    --shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  16  }
  17
  18  * {
  19    box-sizing: border-box;
  20  }
  21
  22  body {
  23    margin: 0;
  24    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  25    color: var(--text);
  26    background: var(--bg);
  27    line-height: 1.5;
  28  }
  29
  30  /* Layout */
  31  .container {
  32    max-width: 900px;
  33    margin: 0 auto;
  34    padding: 1.5rem 1rem 3rem;
  35  }
  36
  37  .navbar {
  38    display: flex;
  39    align-items: center;
  40    justify-content: space-between;
  41    padding: 0.85rem 1.5rem;
  42    background: var(--surface);
  43    border-bottom: 1px solid var(--border);
  44  }
  45
  46  .navbar-brand {
  47    font-weight: 700;
  48    font-size: 1.15rem;
  49    color: var(--text);
  50    text-decoration: none;
  51  }
  52
  53  .navbar-links {
  54    display: flex;
  55    align-items: center;
  56    gap: 1rem;
  57  }
  58
  59  .navbar-links a {
  60    color: var(--primary);
  61    text-decoration: none;
  62    font-weight: 500;
  63  }
  64
  65  .site-footer {
  66    text-align: center;
  67    color: var(--muted);
  68    padding: 2rem 1rem;
  69    font-size: 0.85rem;
  70  }
  // END (written by me)
  71
  72  /* Typography */
  73  h1 {
  74    margin: 0 0 0.25rem;
  75    font-size: 1.8rem;
  76  }
  77
  78  h2 {
  79    margin-top: 2rem;
  80    font-size: 1.35rem;
  81  }
  82
  83  .lead {
  84    color: var(--muted);
  85    font-size: 1.05rem;
  86  }
  87
  88  .muted {
  89    color: var(--muted);
  90  }
  91
  92  .page-header {
  93    margin-bottom: 1.5rem;
  94  }
  95
  96  .header-actions {
  97    display: flex;
  98    flex-wrap: wrap;
  99    gap: 0.5rem;
 100    margin-top: 1rem;
 101  }
 102
 103  /* Cards */
 104  .card {
 105    background: var(--surface);
 106    border: 1px solid var(--border);
 107    border-radius: var(--radius);
 108    box-shadow: var(--shadow);
 109    padding: 1.25rem;
 110    margin-bottom: 1rem;
 111  }
 112
 113  /* Hero + choice cards (main page) */
 114  .hero {
 115    text-align: center;
 116    padding: 2rem 0 1rem;
 117  }
 118
 119  .choice-cards {
 120    display: grid;
 121    grid-template-columns: 1fr 1fr;
 122    gap: 1rem;
 123  }
 124
 125  .choice-card {
 126    text-decoration: none;
 127    color: var(--text);
 128    transition:
 129      transform 0.08s ease,
 130      box-shadow 0.08s ease;
 131  }
 132
 133  .choice-card:hover {
 134    transform: translateY(-2px);
 135    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
 136  }
 137
  // START (written by me)
 138  /* Buttons */
 139  .button,
 140  .link-button {
 141    display: inline-block;
 142    padding: 0.5rem 0.9rem;
 143    border-radius: 8px;
 144    border: 1px solid var(--border);
 145    background: var(--surface);
 146    color: var(--text);
 147    font: inherit;
 148    font-weight: 500;
 149    text-decoration: none;
 150    cursor: pointer;
 151  }
 152
 153  .button:hover {
 154    border-color: var(--primary);
 155    color: var(--primary);
 156  }
 157
 158  .button-primary {
 159    background: var(--primary);
 160    border-color: var(--primary);
 161    color: #fff;
 162  }
 163
 164  .button-primary:hover {
 165    background: var(--primary-dark);
 166    border-color: var(--primary-dark);
 167    color: #fff;
 168  }
 169
 170  .button-danger {
 171    background: #fff;
 172    border-color: var(--danger);
 173    color: var(--danger);
 174  }
 175
 176  .button-danger:hover {
 177    background: var(--danger);
 178    color: #fff;
 179  }
 180
 181  .link-button {
 182    border: none;
 183    background: none;
 184    color: var(--primary);
 185    padding: 0;
 186    font-weight: 500;
 187  }
  // END (written by me)
 188
 189  .inline-form {
 190    display: inline;
 191    margin: 0;
 192  }
 193
 194  /* Forms */
 195  .form label {
 196    display: block;
 197    margin-top: 1rem;
 198    font-weight: 600;
 199    font-size: 0.9rem;
 200  }
 201
 202  .form input[type='text'],
 203  .form input[type='password'],
 204  .form input[type='number'],
 205  .form input[type='datetime-local'],
 206  .form textarea {
 207    width: 100%;
 208    padding: 0.55rem 0.7rem;
 209    margin-top: 0.35rem;
 210    border: 1px solid var(--border);
 211    border-radius: 8px;
 212    font: inherit;
 213  }
 214
 215  .form input:focus,
 216  .form textarea:focus {
 217    outline: none;
 218    border-color: var(--primary);
 219    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
 220  }
 221
 222  .ticket-fieldset {
 223    margin-top: 1.25rem;
 224    border: 1px solid var(--border);
 225    border-radius: 8px;
 226    padding: 0.5rem 1rem 1rem;
 227  }
 228
 229  .ticket-fieldset legend {
 230    font-weight: 600;
 231    padding: 0 0.4rem;
 232  }
 233
 234  .card-actions {
 235    display: flex;
 236    flex-wrap: wrap;
 237    gap: 0.5rem;
 238    margin-top: 1.25rem;
 239  }
 240
  // START (written by me)
 241  /* Event lists */
 242  .event-list {
 243    list-style: none;
 244    padding: 0;
 245    margin: 0;
 246  }
 247
 248  .event-meta {
 249    display: grid;
 250    grid-template-columns: max-content 1fr;
 251    gap: 0.15rem 1rem;
 252    margin: 0.75rem 0;
 253    font-size: 0.92rem;
 254  }
 255
 256  .event-meta dt {
 257    font-weight: 600;
 258    color: var(--muted);
 259  }
 260
 261  .event-meta dd {
 262    margin: 0;
 263  }
 264
 265  .event-link {
 266    text-decoration: none;
 267    color: var(--text);
 268    display: block;
 269  }
 270
 271  .event-link:hover h3 {
 272    color: var(--primary);
 273  }
  // END (written by me)
 274
 275  .share {
 276    font-size: 0.85rem;
 277    word-break: break-all;
 278  }
 279
 280  /* Alerts */
 281  .alert {
 282    padding: 0.75rem 1rem;
 283    border-radius: 8px;
 284    margin-bottom: 1rem;
 285  }
 286
 287  .alert ul {
 288    margin: 0;
 289    padding-left: 1.2rem;
 290  }
 291
 292  .alert-success {
 293    background: var(--success-bg);
 294    color: var(--success-text);
 295  }
 296
 297  .alert-error {
 298    background: var(--error-bg);
 299    color: var(--error-text);
 300  }
 301
  // START (written by me)
 302  /* Tables */
 303  .table {
 304    width: 100%;
 305    border-collapse: collapse;
 306    margin-top: 0.75rem;
 307    font-size: 0.92rem;
 308  }
 309
 310  .table th,
 311  .table td {
 312    text-align: left;
 313    padding: 0.5rem 0.6rem;
 314    border-bottom: 1px solid var(--border);
 315  }
 316
 317  .table thead th {
 318    color: var(--muted);
 319    font-size: 0.8rem;
 320    text-transform: uppercase;
 321    letter-spacing: 0.03em;
 322  }
 323
 324  .table tfoot th,
 325  .table tfoot td {
 326    font-weight: 700;
 327    border-top: 2px solid var(--border);
 328  }
 329
  // END (written by me)
 330  /* Dashboard stats */
 331  .stat-grid {
 332    display: grid;
 333    grid-template-columns: repeat(4, 1fr);
 334    gap: 1rem;
 335  }
 336
 337  .stat {
 338    text-align: center;
 339  }
 340
 341  .stat-value {
 342    display: block;
 343    font-size: 1.6rem;
 344    font-weight: 700;
 345    color: var(--primary);
 346  }
 347
 348  .stat-label {
 349    color: var(--muted);
 350    font-size: 0.85rem;
 351  }
 352
 353  /* Badges */
 354  .badge {
 355    display: inline-block;
 356    font-size: 0.7rem;
 357    text-transform: uppercase;
 358    letter-spacing: 0.04em;
 359    padding: 0.15rem 0.5rem;
 360    border-radius: 999px;
 361    vertical-align: middle;
 362    margin-left: 0.4rem;
 363  }
 364
 365  .badge-published {
 366    background: var(--success-bg);
 367    color: var(--success-text);
 368  }
 369
 370  .badge-draft {
 371    background: #fef3c7;
 372    color: #92400e;
 373  }
 374
  // START (written by me)
 375  /* Responsive */
 376  @media (max-width: 640px) {
 377    .choice-cards,
 378    .stat-grid {
 379      grid-template-columns: 1fr;
 380    }
 381  }
  // END (written by me)
```
