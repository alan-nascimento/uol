# Screencast Script (target: 2 min 30 s)

Record at 1280x720+, speak while clicking. Reset the DB first
(`npm run clean-db && npm run build-db && npm run start`) so the demo data is clean.

## 0:00 - 0:15 - Intro + Main Home
- Open http://localhost:3000
- "This is my Event Manager. The main home page links to the two areas:
  Organiser and Attendee."

## 0:15 - 0:55 - Organiser base functionality
- Click Organiser -> redirected to the login page.
  "The organiser area is protected — this is part of my extension."
- Log in: `organiser` / `password123`.
- On the Organiser Home Page point out: site name/description, the published and
  draft lists with dates and ticket counts, the sharing links.
- Click "Create New Event" -> lands on the Edit page.
  Fill in title, description, date, ticket numbers and prices, submit.
- Back on home, click Publish on the new draft. "It moves to Published and is
  timestamped."
- Open Site Settings, change the name, save -> back on home the name updates.

## 0:55 - 1:30 - Attendee base functionality
- Open the Attendee area (new tab). Show events ordered by date, next one first.
- Click the next event -> Attendee Event Page: title, description, date, ticket
  types, prices and availability.
- Select 2 full-price and 1 concession, enter a name, click Book.
  "Booking confirmed."
- Try to book more tickets than are available -> show the error message.
  "Attendees can never overbook."

## 1:30 - 2:25 - Extension deep dive
- Go back to the Organiser and open the Sales Dashboard.
- "This is the core of my extension. The top cards are global totals — revenue,
  tickets sold, bookings — computed with SQL aggregation."
- Scroll to the per-event breakdown. "For each ticket type I show sold, capacity,
  remaining and revenue, using a LEFT JOIN and GROUP BY, so availability is
  always derived from the bookings, never stored."
- Show the booking I just made appearing in "Recent bookings".
- Briefly: "Login uses bcrypt-hashed passwords and express-session, and every
  organiser route is guarded by a requireAuth middleware."

## 2:25 - 2:30 - Close
- "Everything is server-rendered with EJS, backed by SQLite. Thanks for watching."

## Tips
- Keep under 2:30 — anything after is not marked.
- Have the DB freshly built so numbers look tidy.
- Talk through what you click.
