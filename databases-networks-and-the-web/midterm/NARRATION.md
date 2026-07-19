# Video Narration — Word-for-Word (target 2:30)

> Speak these lines verbatim. Bracketed text = what to click (do NOT read it aloud).

## 0:00 — Intro [show http://localhost:3000]

"Hi. This is my Event Manager, built with Express, SQLite and EJS.
The main home page links to two areas: Organiser and Attendee."

## 0:12 — Login [click Organiser → login page]

"I'll click Organiser. Notice it redirects me to a login page — the organiser
area is protected, which is part of my extension. I'll log in as the organiser."
[type organiser / password123, submit]

## 0:28 — Organiser Home [organiser home]

"This is the Organiser Home Page. It shows the site name and description, my
published events and my draft events — each with their dates and ticket counts —
plus a sharing link to the attendee page."

## 0:45 — Create + Edit [click Create New Event → edit page]

"I'll click Create New Event. This creates a draft and opens its edit page.
I'll add a title, a description, a date, and the number and price of full-price
and concession tickets, then submit."
[fill fields, submit]

## 1:05 — Publish [click Publish on the draft]

"Back on the home page, I'll publish that draft. It moves to the published list
and its publication date is stamped."

## 1:15 — Settings [open Site Settings]

"In Site Settings I can change the name and description — the form is validated
and pre-filled — and saving takes me back home with the new name showing."
[change name, save]

## 1:30 — Attendee [open /attendee]

"Now the Attendee side. Events are ordered by date, with the next one first.
I'll open this event to see its details, ticket types and prices. I'll select
two full-price tickets, enter my name, and book. Booking confirmed. If I try to
book more than are available, I get an error — attendees can never overbook."
[do the booking, then attempt an overbook to show the error]

## 1:55 — Extension: Dashboard [open /organiser/dashboard]

"Finally, my main extension: the Sales Dashboard. These cards are global totals
— revenue, tickets sold and bookings — computed with SQL aggregation. Below,
each event breaks down by ticket type, showing sold, capacity and remaining,
using a LEFT JOIN and GROUP BY, so availability is always derived from the
bookings, never stored. And here's the booking I just made, in Recent Bookings.
Login uses bcrypt-hashed passwords with express-session, and every organiser
route is guarded by a requireAuth middleware."

## 2:25 — Close

"Everything is server-rendered with EJS on top of SQLite. Thanks for watching."
