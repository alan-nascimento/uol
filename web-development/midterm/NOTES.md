# CM1040 Midterm — Presentation Package

**Story:** "The Journey of Data to the Eye" — data leaves a remote REST API
(Topic 5), travels over HTTPS as JSON, and must render well on **any**
device (Topic 3). The two topics are two halves of one pipeline.

Topics covered: **Topic 3 — Layout for Different Devices** and
**Topic 5 — Working with Data Sources and Data Security**.

Demo app: `index.html`, `style.css`, `script.js` in this folder. Open
`index.html` via a local server (e.g. `python3 -m http.server`, then visit
`http://localhost:8000`) rather than double-clicking the file, so `fetch()`
isn't blocked by `file://` origin restrictions.

---

## 1. How the app demonstrates the two topics

### Topic 3 — Layout for Different Devices
- `#catalog-container` uses `display: grid` with
  `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));`
  (`style.css`).
- `auto-fit` asks the browser to fit as many tracks (columns) as possible
  given the container width; `minmax(250px, 1fr)` guarantees every card is
  at least 250px wide, and distributes any remaining space using the
  fractional unit (`fr`) — the same vocabulary from your `content.md`
  notes (fundamentals of Grid, `fr`, `repeat()`, `minmax()`, tracks).
- Net effect: 1 column on a narrow phone, up to 4+ columns on a wide
  desktop, with **no JavaScript and no framework** — pure native CSS.
- The `.media-query` alternative in `style.css` shows the "old way":
  hand-written breakpoints at 600px/900px/1200px that force a fixed
  column count per range.

### Topic 5 — Working with Data Sources and Data Security
- `script.js` calls `fetch("https://jsonplaceholder.typicode.com/users")`,
  awaits the response, and parses the body with `response.json()` — this
  is exactly the REST + JSON + `fetch` pipeline from your notes (REST is
  stateless, JSON is the payload format invented by Douglas Crockford).
- The parsed array is iterated with `.forEach()`; for each user object the
  code calls `document.createElement()` to build a card and sets text via
  `textContent`, then appends it to `#catalog-container` — this is
  "dynamically creating content from data" instead of hard-coding HTML.
- Data security angle (light touch, matches Topic 5's second half):
  - **HTTPS**: the endpoint is `https://...`, so the request/response are
    encrypted in transit; an `http://` equivalent would expose the JSON
    payload to network eavesdroppers.
  - **CORS**: the browser only lets this page read a cross-origin response
    because JSONPlaceholder sends permissive CORS headers; open DevTools →
    Network → the request → Response Headers to show `access-control-allow-origin`.
  - **No secrets in client code**: this API needs no key, which is exactly
    why it's safe to call directly from the browser. A real API key must
    never be hard-coded in JS shipped to the client, because anyone can
    open DevTools and read it.
  - **XSS defence**: cards are built with `textContent`, never
    `innerHTML`, so any HTML/script characters inside the API response
    would be displayed as literal text, not executed.

---

## 2. Experiments to run and document

### Experiment 1 (Topic 3): CSS Grid `auto-fit/minmax` vs media queries
**Procedure:**
1. Open the app, leave the "CSS Grid: repeat(auto-fit...)" option selected.
2. Open DevTools → Toggle device toolbar (responsive mode).
3. Drag the width from ~360px to ~1440px slowly; note the exact width at
   which the number of card columns increases.
4. Switch the radio to "Manual media-query breakpoints" and repeat the
   same drag.
5. Compare: does the column count change smoothly/continuously, or only
   at your hard-coded breakpoints (600/900/1200px)?

**Results table (fill in while recording):**

| Viewport width | Columns — auto-fit/minmax | Columns — media query |
|---|---|---|
| 360px |  |  |
| 480px |  |  |
| 768px |  |  |
| 1024px |  |  |
| 1440px |  |  |

**Expected finding:** `auto-fit`/`minmax()` adapts continuously to any
width with a single CSS rule; media queries only change at the widths you
explicitly coded, so intermediate widths (e.g. 750px) can look cramped or
wasteful until the next breakpoint fires.

### Experiment 2 (Topic 5): `fetch()`/async-await vs `XMLHttpRequest`
**Procedure:**
1. With "fetch() + async/await" selected, click "Reload data" and open the
   DevTools Console — note the logged `Strategy "fetch" took X ms`.
2. Switch to "XMLHttpRequest" and reload; note the logged time again.
3. Open the Network tab in both cases: same request, same response, same
   JSON body.
4. Open `script.js` and compare `loadWithFetch()` (≈4 lines, linear,
   `async/await`) vs `loadWithXhr()` (≈15 lines, callback-based,
   `onload`/`onerror`).

**Results table:**

| Run | Strategy | Time (ms) | Lines of code | Style |
|---|---|---|---|---|
| 1 | fetch |  | ~4 | Promise / async-await |
| 2 | XHR |  | ~15 | Event callbacks |

**Expected finding:** both strategies retrieve identical JSON from the
identical endpoint (proving REST responses are just data, independent of
how the client requests them). `fetch` is shorter, reads top-to-bottom,
and avoids nested callbacks — the practical reason modern JS favours it.

### Extra inspection tasks (for screenshots, not a "vs" experiment)
- DevTools → Network → click the `/users` request → **Response** tab to
  show the raw JSON text straight from the server.
- DevTools → Console → run `console.table(data)` (already logged
  automatically by `script.js`) to show the parsed array as a table.
- View Page Source vs the live DOM (Elements panel) to show that the
  `<main id="catalog-container">` starts empty in the HTML source and is
  populated only after JavaScript runs — the core evidence for "dynamic
  content from data sources."

---

## 3. Screenshots to capture for slides

1. Full page at desktop width (~1440px) — multiple columns visible.
2. Full page at tablet width (~768px) — fewer columns.
3. Full page at mobile width (~375px) — single column.
4. Side-by-side of the three above (compose in slides or a single
   screenshot with DevTools device toolbar at each size).
5. DevTools ruler/device toolbar showing the exact px width where columns
   change (auto-fit run).
6. Same ruler shot for the media-query run, showing the "jump" at a fixed
   breakpoint.
7. Network tab: the GET request to `jsonplaceholder.typicode.com/users`
   with status 200 and response headers (to show HTTPS + CORS headers).
8. Response body tab showing raw JSON.
9. Console showing `console.table(data)`.
10. Code snippet screenshots: the `grid-template-columns` line; the
    `fetch`/async block; the `XMLHttpRequest` block; the `textContent`
    lines (for the XSS point).

---

## 4. Suggested 10-slide structure

1. **Title** — project name/story hook ("The Journey of Data to the Eye"),
   your name, module code, face-to-camera intro.
2. **Problem statement** — the web is viewed on wildly different devices;
   pages increasingly show data that isn't known at write-time (it must be
   fetched). Two problems, one demo.
3. **The two topics & the connecting story** — show the pipeline diagram
   (API → JSON → fetch → DOM → CSS Grid → any device) and state explicitly:
   "I am exploring Topic 3 and Topic 5."
4. **Technologies used** — HTML5 semantic elements, native CSS Grid
   (no framework), vanilla JavaScript `fetch`/`XMLHttpRequest`,
   JSONPlaceholder REST API, Chrome DevTools.
5. **Topic 3 deep dive** — `display:grid`, the `fr` unit, `repeat()`,
   `minmax()`, tracks; explain `auto-fit` vs `auto-fill` briefly.
6. **Topic 5 deep dive** — REST statelessness, CRUD → HTTP verbs mapping,
   JSON syntax (Crockford), `fetch()` + `response.json()`.
7. **Experiment 1 results** — Grid auto-fit vs media queries; show the
   results table and the "smooth vs stepped" screenshots.
8. **Experiment 2 results** — fetch/async vs XHR; show code snippets side
   by side and the timing numbers.
9. **Data security** — HTTPS, CORS, no client-side secrets, XSS-safe
   DOM injection via `textContent`.
10. **Results, lessons learned, conclusion & references** — what surprised
    you, what you'd do differently, and the source list below.

---

## 5. Spoken video talk-track (~9 minutes, own voice, face visible)

Keep this as a guide, not a script to read verbatim — speak naturally,
make eye contact with the camera, and rehearse at least once before
recording (per the brief).

**Slide 1 — Title (30s)**
"Hi, I'm [name]. For this presentation I'm going to walk you through two
topics from the first half of the course — Layout for Different Devices,
and Working with Data Sources and Data Security — connected by one small
story: the journey of a piece of data from a server, all the way to your
eyes, on whatever device you're using."

**Slide 2 — Problem statement (45s)**
"Two real problems motivated this. First, users view the same website on
phones, tablets and desktops with wildly different widths, so a fixed
layout breaks somewhere. Second, most modern pages don't hard-code their
content — they fetch it from a server at runtime, as JSON. I wanted to
build one small demo where both problems show up together, so I could
compare, hands-on, how each is solved."

**Slide 3 — The two topics & story (45s)**
"Here's the pipeline I built. A REST API returns JSON over HTTPS. My
JavaScript fetches it, parses it, and turns each record into an HTML
element. Those elements land inside a container styled with CSS Grid,
which is what makes the layout adapt to any device. So Topic 5 gets the
data to the browser, and Topic 3 decides how it's shown once it's there."

**Slide 4 — Technologies (30s)**
"I deliberately avoided frameworks. Native CSS Grid instead of Bootstrap;
plain `fetch` and `XMLHttpRequest` instead of a library like Axios. That
let me compare 'the modern way' against 'the older way' for both topics."

**Slide 5 — Topic 3 deep dive (60s)**
"CSS Grid works by turning a container into tracks — rows and columns —
using `display: grid`. The key line in my CSS is
`grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))`. `repeat`
avoids typing the same rule four times, `auto-fit` tells the browser to
fit as many columns as will comfortably sit in the available width, and
`minmax(250px, 1fr)` says: never go below 250 pixels, and share whatever
space is left equally, using the `fr` unit."

**Slide 6 — Topic 5 deep dive (60s)**
"On the data side, REST is stateless — every request must carry what it
needs, there's no server-side memory of me between calls. I used a GET
request, which is the 'read' verb in CRUD, against a public endpoint that
returns JSON — a plain-text, key-value format invented by Douglas
Crockford. In JavaScript, `fetch()` performs the request, and
`response.json()` turns the raw text into a real JavaScript array I can
loop over with `forEach()`."

**Slide 7 — Experiment 1 (75s)**
"For my first experiment I compared two ways of doing responsive layout.
[Show screenshots / live resize] With `auto-fit`/`minmax()`, the number of
columns changes continuously as I resize — you can see it drop from four,
to three, to two, to one, at whatever width makes sense. Then I switched
to a version using only media queries at 600, 900 and 1200 pixels — the
columns only change at those exact points, so in between, cards can look
too cramped or too spaced out. That's the practical benefit of the modern
Grid approach: less code, and it adapts automatically."

**Slide 8 — Experiment 2 (75s)**
"My second experiment compared `fetch()` with `async`/`await` against the
older `XMLHttpRequest` API, against the exact same endpoint. [Show
Network tab] Both return identical JSON — the data itself doesn't care how
you asked for it. But look at the code: fetch is about four lines and
reads top to bottom; XHR needs an event listener for success and one for
errors, and is noticeably more verbose. I logged the time for each in the
console, and both were comparable in speed — the real difference is
code style and readability, not performance."

**Slide 9 — Data security (45s)**
"Since Topic 5 also covers data security, I want to highlight a few
practical points from this demo. The API is HTTPS, so traffic is
encrypted. CORS headers are what allow my page, on a different origin, to
read the response at all — you can see that header in the Network tab.
This particular API needs no key, which is intentional: an API key should
never be hard-coded into client-side JavaScript, because anyone can open
DevTools and read it. And when I inject the data into the page, I use
`textContent` rather than `innerHTML`, so any unexpected HTML in the
response can't execute as code — a basic defence against cross-site
scripting."

**Slide 10 — Results, lessons, conclusion (60s)**
"To wrap up: this small app let me directly compare two techniques per
topic, not just read about them. I found that native CSS Grid genuinely
replaces a lot of manual media-query work, and that modern fetch/async
code is meaningfully easier to read than XHR, without giving up anything
functionally. Connecting the two topics into one pipeline — data in, data
displayed responsively — made both topics click together for me rather
than feeling like two separate lessons. Thanks for watching."

---

## 6. References (verified, citable sources)

- MDN Web Docs — "CSS Grid Layout." Mozilla.
  https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout
- MDN Web Docs — "Using the Fetch API." Mozilla.
  https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch_API
- MDN Web Docs — "XMLHttpRequest." Mozilla.
  https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
- MDN Web Docs — "Node.textContent." Mozilla.
  https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
- W3C — "CSS Grid Layout Module Level 1." W3C Candidate Recommendation.
  https://www.w3.org/TR/css-grid-1/
- web.dev (Google) — "Responsive Web Design Basics."
  https://web.dev/articles/responsive-web-design-basics
- Bray, T., Ed. — "The JavaScript Object Notation (JSON) Data Interchange
  Format." RFC 8259, IETF, 2017. https://www.rfc-editor.org/rfc/rfc8259
- Crockford, D. — "Introducing JSON." json.org. https://www.json.org/json-en.html
- Fielding, R. T. — "Architectural Styles and the Design of Network-based
  Software Architectures." PhD dissertation, UC Irvine, 2000, Chapter 5:
  "Representational State Transfer (REST)."
  https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm
- OWASP — "Cross Site Scripting (XSS) Prevention Cheat Sheet."
  https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- MDN Web Docs — "Cross-Origin Resource Sharing (CORS)." Mozilla.
  https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
- JSONPlaceholder — "Free fake API for testing." https://jsonplaceholder.typicode.com/
