Here is a focused summary of the two requested topics, highlighting the essential concepts from your sources:

**Topic 3: Layout for Different Devices (Responsive CSS Grid)**
The challenge of displaying content on the web today is the huge variety of devices, ranging from tiny smartwatch screens to large desktop monitors. To solve this, we use **CSS Grid**, a native, powerful feature of modern CSS that replaces old, complex layout solutions.

- **Grid Fundamentals:** By applying the `display: grid` property to a container (such as a `<div>` tag), you turn it into a customizable grid.
- **Responsiveness and Flexibility:** With simple rules such as `grid-template-columns`, developers divide space responsively. Grid introduced the fractional unit (`fr`), which distributes available space proportionally (e.g., `1fr 1fr 1fr` creates three equal-width columns).
- **Automatic Adaptation:** Using the `repeat()` and `minmax()` functions, you can instruct the browser to adapt the grid automatically, ensuring rows have minimum heights or that columns adjust as the screen shrinks—reducing the need to import heavy CSS frameworks just to build basic layouts.
- **Precise Positioning:** Grid does more than align elements side by side; it allows exact control of their position using _tracks_, through properties such as `grid-column-start` and `grid-row-start`, so a single element can expand (span) across multiple columns or rows.

**Topic 5: Working with Data Sources and Data Security (Fetching JSON via REST API)**
This topic focuses on fetching data dynamically to power responsive user interfaces, instead of relying on static HTML pages.

- **REST APIs:** A REST API (Representational State Transfer) is a structured web service that lets a client (such as the browser) access data on a server using standard HTTP methods. REST APIs are _stateless_, meaning the server does not store the user's session from one request to the next—each request must carry its own credentials (such as cookies or tokens).
- **CRUD Operations and Endpoints:** The actions you can perform with a REST API mirror database operations and use HTTP methods: **GET** to retrieve data (e.g., query a list at `/books`), **POST** to create/send new data (e.g., submit a form), **PUT** to update something existing, and **DELETE** to remove information.
- **JSON Format:** Instead of receiving HTML full of styling markup, REST APIs return "raw" data, typically in **JSON** format. Invented by Douglas Crockford, JSON (JavaScript Object Notation) uses a lightweight syntax based on key-value property pairs and hierarchically structured _arrays_. It is easy for humans to read and for machines to process.
- **Implementation with Fetch:** To connect the client to API data, developers use modern JavaScript functions such as `fetch()`. This tool makes asynchronous requests in the browser, captures the network response, and then converts the payload (`response.json()`) into a practical data format. JavaScript can then iterate over that raw data list and inject it dynamically into the DOM as visual elements, feeding the HTML/CSS layout with up-to-date content.
