/**
 * index.js
 * Main application entry point for the Event Manager.
 * Sets up Express, sessions, the EJS view engine, static files and the
 * SQLite database connection, then mounts the route handlers.
 */

// Set up Express, session handling and EJS
const express = require('express');
const session = require('express-session');
const helpers = require('./helpers');
const app = express();
const port = 3000;

// Parse URL-encoded form bodies (req.body) submitted by our forms
app.use(express.urlencoded({ extended: true }));

// Use EJS for server-side rendering and serve static assets from /public
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Persist the organiser's logged-in state across requests (extension feature)
app.use(
    session({
        secret: 'event-manager-secret-key',
        resave: false,
        saveUninitialized: false,
    })
);

// Set up SQLite. Items in the global namespace are accessible throughout the app.
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db', function (err) {
    if (err) {
        console.error(err);
        process.exit(1); // bail out, we can't connect to the DB
    } else {
        console.log('Database connected');
        global.db.run('PRAGMA foreign_keys=ON'); // enforce foreign key constraints
    }
});

/**
 * Global view data middleware.
 * Purpose: make the current site settings and the organiser's auth state
 *          available to every rendered template (used by the shared nav/header).
 * Inputs:  req.session (for auth state).
 * Outputs: res.locals.site, res.locals.isAuthenticated; calls next().
 */
app.use(function (req, res, next) {
    res.locals.isAuthenticated = !!(req.session && req.session.organiserId);
    // Expose formatting helpers to every template
    res.locals.formatDateTime = helpers.formatDateTime;
    res.locals.formatEventDate = helpers.formatEventDate;
    res.locals.formatPrice = helpers.formatPrice;
    const query = 'SELECT site_name, site_description FROM settings WHERE setting_id = 1';
    global.db.get(query, function (err, row) {
        if (err) {
            return next(err);
        }
        res.locals.site = row || { site_name: 'Event Manager', site_description: '' };
        next();
    });
});

/**
 * @route GET /
 * @desc  Main home page: entry point linking to the Organiser and Attendee areas.
 * @output Renders the main landing page.
 */
app.get('/', function (req, res) {
    res.render('main');
});

// Mount the route handlers.
// Auth routes (login/logout) are public and must be registered before the
// protected organiser routes so they are not blocked by the auth guard.
const { router: authRouter } = require('./routes/auth');
const organiserRoutes = require('./routes/organiser');
const attendeeRoutes = require('./routes/attendee');

app.use('/organiser', authRouter);
app.use('/organiser', organiserRoutes);
app.use('/attendee', attendeeRoutes);

/**
 * Central error handler.
 * Purpose: render a friendly error page for any error passed to next(err).
 * Inputs:  err, req, res, next.
 * Outputs: renders the error view with HTTP 500.
 */
app.use(function (err, req, res, next) {
    console.error(err);
    res.status(500).render('error', { message: err.message });
});

// Make the web application listen for HTTP requests
app.listen(port, function () {
    console.log(`Event Manager listening on port ${port}`);
});
