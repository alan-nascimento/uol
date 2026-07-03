
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- ============================================================
-- SCHEMA
-- ============================================================

-- Global site settings. A single row (setting_id = 1) holds the event
-- manager's name and description, editable from the Site Settings page.
CREATE TABLE IF NOT EXISTS settings (
    setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_name TEXT NOT NULL,
    site_description TEXT NOT NULL
);

-- Organiser account for the extension's authentication feature.
-- The password is stored only as a bcrypt hash, never in plain text.
CREATE TABLE IF NOT EXISTS organiser (
    organiser_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

-- Events created by the organiser. An event is either a 'draft' (not yet
-- visible to attendees) or 'published' (bookable on the attendee pages).
CREATE TABLE IF NOT EXISTS events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    event_date TEXT, -- ISO datetime for when the event takes place
    state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'published')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    published_at TEXT, -- set when the event is published, NULL while a draft
    last_modified TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ticket types belonging to an event (normalised: one event has many types).
-- The base spec requires exactly two per event: full-price and concession.
CREATE TABLE IF NOT EXISTS ticket_types (
    ticket_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

-- A booking made by an attendee for a single event. One booking groups one
-- or more booking_items (the different ticket types chosen in one purchase).
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    attendee_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
);

-- The individual line items of a booking: how many of each ticket type.
CREATE TABLE IF NOT EXISTS booking_items (
    booking_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    ticket_type_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(ticket_type_id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default site settings (single row).
INSERT INTO settings (setting_id, site_name, site_description)
VALUES (1, 'Stretch Yoga', 'Yoga classes for all ages and abilities');

-- Default organiser account.
-- Username: organiser  |  Password: password123
-- The hash below is a bcrypt hash of 'password123' (generated with bcryptjs).
INSERT INTO organiser (username, password_hash)
VALUES ('organiser', '$2a$10$5Ff8Or.pW0hEUt5gIC2eRO8jtut9.E7nxsBqz2KV05GadP1QWbz9.');

-- Two published events and one draft event.
INSERT INTO events (event_id, title, description, event_date, state, created_at, published_at, last_modified)
VALUES
    (1, 'Morning Vinyasa Flow',
        'An energising flow to start your day, suitable for all levels.',
        '2026-08-15 09:00', 'published', '2026-07-01 10:00', '2026-07-02 11:30', '2026-07-02 11:30'),
    (2, 'Restorative Evening Yoga',
        'Wind down with gentle restorative poses and guided breathing.',
        '2026-09-05 18:30', 'published', '2026-07-03 09:15', '2026-07-03 09:20', '2026-07-03 09:20'),
    (3, 'Advanced Ashtanga Workshop',
        'A challenging workshop for experienced practitioners.',
        '2026-10-10 14:00', 'draft', '2026-07-04 16:45', NULL, '2026-07-04 16:45');

-- Ticket types for each event (full-price and concession).
INSERT INTO ticket_types (ticket_type_id, event_id, name, price, quantity)
VALUES
    (1, 1, 'Full price', 15.00, 30),
    (2, 1, 'Concession', 10.00, 20),
    (3, 2, 'Full price', 12.50, 25),
    (4, 2, 'Concession', 8.00, 15),
    (5, 3, 'Full price', 40.00, 12),
    (6, 3, 'Concession', 30.00, 8);

-- Sample bookings so the sales dashboard shows meaningful figures.
INSERT INTO bookings (booking_id, event_id, attendee_name, created_at)
VALUES
    (1, 1, 'Alice Johnson', '2026-07-05 12:00'),
    (2, 1, 'Bob Smith', '2026-07-06 14:30'),
    (3, 2, 'Carla Nunes', '2026-07-06 18:05');

INSERT INTO booking_items (booking_id, ticket_type_id, quantity)
VALUES
    (1, 1, 2), -- Alice: 2 full-price for event 1
    (2, 1, 1), -- Bob: 1 full-price for event 1
    (2, 2, 3), -- Bob: 3 concession for event 1
    (3, 3, 2); -- Carla: 2 full-price for event 2

COMMIT;
