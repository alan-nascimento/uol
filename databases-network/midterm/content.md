That is an excellent milestone! The mid-term coursework requires you to build a dynamic "Event Manager" web application, which involves creating an Organiser interface (for creating, editing, publishing, and deleting events) and an Attendee interface (for viewing and booking events).

To help you succeed, here is a comprehensive summary of all the key concepts you have studied in Topics 1 through 7, tailored directly to your coursework requirements:

**1. Three-Tier Web Architecture (Topic 1)**
Your Event Manager app must be built using a three-tier architecture.

- **Presentation Tier (Client-side):** What the users see in their web browsers, built using HTML, CSS, and EJS templates.
- **Application Tier (Middleware/Server-side):** The logic of your application, which you will build using Node.js and Express.js to process bookings, handle forms, and communicate with the database.
- **Database Tier (Back-end):** Where all event and user data is persistently stored. While you practiced with MySQL in your labs, **you must use SQLite for the coursework** to make it easy for the markers to run your project.

**2. Node.js, Express, and Routing (Topic 2)**
You will use the Express.js framework to create your web server and define routes (URLs) for your application.

- **Separation of Concerns (SoC):** You must organize your code logically. Keep your route handlers (e.g., `/create-event`, `/book-ticket`) in a dedicated `routes` folder, and keep your HTML/template files in a `views` folder.
- **HTTP Methods:** You will use `app.get()` to serve pages (like displaying the event list) and `app.post()` to handle data submissions (like saving a new event or processing a booking).

**3. Dynamic Pages with EJS (Topic 3)**
Because your app needs to display data from the database (like a list of upcoming events), you cannot use static HTML files. Instead, you will use EJS (Embedded JavaScript) as your templating engine.

- EJS allows you to pass variables from your backend Node.js code directly to the frontend.
- Using tags like `<%= variable %>`, you can insert dynamic values (like event titles and prices) into your HTML.
- You can also use simple logic, like a `forEach` loop, to iterate through an array of events retrieved from your database and display them as a list on the page.

**4. Handling Forms and User Input (Topic 4)**
Your application relies heavily on forms, such as the Organiser creating an event or an Attendee entering their name to book tickets.

- **GET Requests:** Used for retrieving data, where form parameters are sent in the URL (accessed via `req.query` in Express).
- **POST Requests:** Used for sending sensitive or larger amounts of data, where form data is sent in the body of the request. You will access this data using `req.body`, which requires you to set up a body parser in your Express configuration (`app.use(express.urlencoded())`).

**5. Database Design (Topic 7)**
Before writing SQL code, you should plan your database using an Entity-Relationship (ER) diagram. You will need to submit this diagram as part of your PDF report.

- **Entities & Fields:** Identify the core objects of your application (e.g., Events, Tickets, Attendees, Organiser Settings) and determine their fields (e.g., Event Title, Date, Ticket Price) and data types (e.g., INT, VARCHAR, DECIMAL).
- **Primary and Foreign Keys:** Every table must have a Primary Key (a unique ID) to identify each record. To link tables together (e.g., linking a booked ticket to a specific event), you will use Foreign Keys.
- **Junction Tables:** If you encounter a Many-to-Many relationship (e.g., if one user can book many events, and one event can have many users), you must resolve it by creating a junction (or bridge) table to ensure database integrity.

**6. Database Operations (CRUD) & Node Integration (Topics 5 & 6)**
You will use the `sqlite3` module to connect your Express app to the database and perform asynchronous SQL queries. You will need to master all four CRUD operations:

- **Create (INSERT):** To save new events or new ticket bookings into the database.
- **Read (SELECT):** To retrieve the list of published events for the Attendee homepage or draft events for the Organiser homepage. You can also use `SELECT ... WHERE` to pull details for a single specific event.
- **Update (UPDATE):** To edit an existing event's details or change its status from 'draft' to 'published'.
- **Delete (DELETE):** To remove an event from the database entirely when the Organiser clicks the delete button.

**A Quick Reminder for your Submission:**
Make sure you write clean, well-commented code, clearly stating the inputs and outputs of each route. Do not forget that your final submission must include the zipped code (without `node_modules`), a 1000-word PDF report containing your architecture and database diagrams, an explanation of your custom extension, and a 2.5-minute video screencast demonstrating your app.

Good luck getting started with the "Event Manager" template! Let me know if you want to dive deeper into any specific area, like how to structure your SQL `JOIN` statements or how to set up your EJS loops.
