/**
 * auth.js
 * Authentication routes for the organiser (extension feature).
 * Provides the login form, login submission and logout. Also exports the
 * requireAuth middleware used to protect the organiser-only routes.
 *
 * NB. it's better NOT to use arrow functions for callbacks with the SQLite library.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const router = express.Router();

/**
 * requireAuth middleware
 * Purpose: block access to organiser-only pages unless logged in.
 * Inputs:  req.session.organiserId.
 * Outputs: calls next() when authenticated, otherwise redirects to the login page.
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.organiserId) {
        next();
    } else {
        res.redirect('/organiser/login');
    }
}

/**
 * @route GET /organiser/login
 * @desc  Display the organiser login form.
 * @output Renders the login page (with no error initially).
 */
router.get('/login', function (req, res) {
    // Already logged in? Skip the form.
    if (req.session && req.session.organiserId) {
        return res.redirect('/organiser');
    }
    res.render('login', { error: null, username: '' });
});

/**
 * @route POST /organiser/login
 * @desc  Authenticate the organiser against the hashed password in the database.
 * @input req.body.username, req.body.password
 * @output On success: starts a session and redirects to the Organiser Home Page.
 *         On failure: re-renders the login form with an error message.
 */
router.post(
    '/login',
    [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('login', {
                error: errors.array()[0].msg,
                username: req.body.username || '',
            });
        }

        // Look up the organiser by username
        const query = 'SELECT organiser_id, password_hash FROM organiser WHERE username = ?';
        global.db.get(query, [req.body.username], function (err, organiser) {
            if (err) {
                return next(err);
            }
            // Compare the submitted password with the stored bcrypt hash
            const passwordOk =
                organiser && bcrypt.compareSync(req.body.password, organiser.password_hash);
            if (!passwordOk) {
                return res.render('login', {
                    error: 'Invalid username or password',
                    username: req.body.username || '',
                });
            }
            // Credentials are valid: persist the organiser id in the session
            req.session.organiserId = organiser.organiser_id;
            res.redirect('/organiser');
        });
    }
);

/**
 * @route POST /organiser/logout
 * @desc  Destroy the organiser's session and return to the main home page.
 * @output Redirects to the main home page.
 */
router.post('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

module.exports = { router, requireAuth };
