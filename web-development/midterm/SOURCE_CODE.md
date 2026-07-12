# Source Code — Data-to-Device Catalog (CM1040 Midterm Demo)

This document contains the full source code of the demo application built to
explore **Topic 3 (Layout for Different Devices)** and **Topic 5 (Working with
Data Sources and Data Security)**. Use these exact snippets in the presentation
slides.

The app fetches user data from a public REST API (JSONPlaceholder) over HTTPS,
parses the JSON, and renders each record as a card inside a responsive CSS Grid.
It also includes two live toggles used for the comparison experiments:
- Experiment 1: CSS Grid `auto-fit/minmax` vs manual media-query breakpoints.
- Experiment 2: `fetch()` + async/await vs `XMLHttpRequest`.

---

## index.html

Semantic HTML5 structure: a `<header>` for identity plus the experiment
controls, and a `<main id="catalog-container">` that starts empty and is
populated dynamically by JavaScript at runtime.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Data-to-Device Catalog | CM1040 Midterm Demo</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <header>
      <h1>Data-to-Device Catalog</h1>
      <p>
        A live demo connecting
        <strong>Topic 3: Layout for Different Devices</strong> and
        <strong>Topic 5: Working with Data Sources and Data Security</strong>.
      </p>

      <div class="controls" role="group" aria-label="Experiment controls">
        <fieldset>
          <legend>Experiment 1 — Layout strategy (Topic 3)</legend>
          <label>
            <input type="radio" name="layout" value="grid-autofit" checked />
            CSS Grid: <code>repeat(auto-fit, minmax(250px, 1fr))</code>
          </label>
          <label>
            <input type="radio" name="layout" value="media-query" />
            Manual media-query breakpoints
          </label>
        </fieldset>

        <fieldset>
          <legend>Experiment 2 — Fetch strategy (Topic 5)</legend>
          <label>
            <input type="radio" name="fetch-strategy" value="fetch" checked />
            <code>fetch()</code> + async/await
          </label>
          <label>
            <input type="radio" name="fetch-strategy" value="xhr" />
            <code>XMLHttpRequest</code>
          </label>
        </fieldset>

        <button id="reload-btn" type="button">Reload data</button>
        <p id="status" role="status" aria-live="polite"></p>
      </div>
    </header>

    <!-- Main catalog: populated dynamically by script.js -->
    <main id="catalog-container" aria-label="User catalog">
      <!-- Cards are injected here at runtime -->
    </main>

    <footer>
      <p>
        Data source:
        <a
          href="https://jsonplaceholder.typicode.com/users"
          target="_blank"
          rel="noopener noreferrer"
          >JSONPlaceholder REST API</a
        >
        (served over HTTPS, no API key required).
      </p>
    </footer>

    <script src="script.js"></script>
  </body>
</html>
```

---

## style.css

**Topic 3.** The key responsive line is
`grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))` — one rule that
adapts from 1 column on mobile to several on desktop. The `.media-query` variant
below reproduces the "old way" (fixed breakpoints) for Experiment 1.

```css
/* Base / typography */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f4f6f8;
  color: #1f2933;
}

header {
  padding: 1.5rem 2rem;
  background-color: #1f2933;
  color: #ffffff;
}

header h1 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
}

header p {
  margin: 0 0 1rem;
  color: #cbd2d9;
}

footer {
  padding: 1rem 2rem;
  font-size: 0.85rem;
  color: #616e7c;
  text-align: center;
}

footer a {
  color: #4f8cff;
}

/* Experiment controls */
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
}

.controls fieldset {
  border: 1px solid #3e4c59;
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.controls legend {
  font-size: 0.85rem;
  color: #cbd2d9;
}

.controls label {
  display: block;
  font-size: 0.9rem;
  margin: 0.25rem 0;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  cursor: pointer;
}

.controls input[type='radio'] {
  cursor: pointer;
}

.controls code {
  background: rgba(255, 255, 255, 0.1);
  padding: 0 0.25rem;
  border-radius: 4px;
}

#reload-btn {
  align-self: center;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  background-color: #4f8cff;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

#reload-btn:hover {
  background-color: #3a75e0;
}

#status {
  align-self: center;
  font-size: 0.85rem;
  color: #cbd2d9;
  margin: 0;
}

/* TOPIC 3 — Strategy A: native CSS Grid, auto-fit + minmax */
#catalog-container {
  padding: 1.5rem 2rem;
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

/* TOPIC 3 — Strategy B (Experiment 1): manual media-query breakpoints */
#catalog-container.media-query {
  grid-template-columns: 1fr; /* mobile-first: 1 column by default */
}

@media (min-width: 600px) {
  #catalog-container.media-query {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  #catalog-container.media-query {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1200px) {
  #catalog-container.media-query {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Card component (shared by both layout strategies) */
.card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: #1f2933;
}

.card p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: #52606d;
}

.card .card-meta {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: #9aa5b1;
}

.card.error {
  border: 1px solid #e12d39;
  color: #e12d39;
}
```

---

## script.js

**Topic 5.** Fetches JSON from the REST API, parses it with `response.json()`,
iterates with `.forEach()`, and builds DOM cards using `textContent` (never
`innerHTML`) to prevent XSS. Includes both the modern `fetch`/async-await path
and the older `XMLHttpRequest` path for Experiment 2, plus timing logs.

```javascript
/* TOPIC 5 — Working with Data Sources and Data Security
   Data source: JSONPlaceholder, a public fake REST API.
   Endpoint: GET https://jsonplaceholder.typicode.com/users
   - Served over HTTPS (encrypted in transit).
   - Requires no API key (a real key must NEVER be hard-coded in client JS).
   - CORS-enabled, so the browser is allowed to read the cross-origin response. */

const API_URL = 'https://jsonplaceholder.typicode.com/users'

const catalogContainer = document.getElementById('catalog-container')
const statusEl = document.getElementById('status')
const reloadBtn = document.getElementById('reload-btn')
const layoutRadios = document.querySelectorAll('input[name="layout"]')
const fetchRadios = document.querySelectorAll('input[name="fetch-strategy"]')

/* Security note: build elements with textContent (never innerHTML) so any
   HTML/script characters in the payload render as plain text, not executed
   — a basic defence against Cross-Site Scripting (XSS). */
function createCard(user) {
  const card = document.createElement('div')
  card.className = 'card'

  const title = document.createElement('h2')
  title.textContent = user.name // safe: textContent, not innerHTML

  const email = document.createElement('p')
  email.textContent = `Email: ${user.email}`

  const company = document.createElement('p')
  company.textContent = `Company: ${user.company?.name ?? 'n/a'}`

  const meta = document.createElement('p')
  meta.className = 'card-meta'
  meta.textContent = `${user.address?.city ?? ''}`

  card.append(title, email, company, meta)
  return card
}

function renderError(message) {
  catalogContainer.innerHTML = ''
  const card = document.createElement('div')
  card.className = 'card error'
  card.textContent = message
  catalogContainer.append(card)
}

function renderUsers(users) {
  catalogContainer.innerHTML = ''
  // Iterate over the parsed JSON array and turn each object into a DOM
  // element, dynamically building the page from data instead of static HTML.
  users.forEach((user) => {
    const card = createCard(user)
    catalogContainer.append(card)
  })
}

/* Strategy A — fetch() + async/await (modern, promise-based) */
async function loadWithFetch() {
  const response = await fetch(API_URL)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  const data = await response.json() // parse JSON response body
  return data
}

/* Strategy B — XMLHttpRequest (older, callback-based) */
function loadWithXhr() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', API_URL)
    xhr.responseType = 'json'

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response)
      } else {
        reject(new Error(`Request failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send()
  })
}

function getSelectedFetchStrategy() {
  return document.querySelector('input[name="fetch-strategy"]:checked').value
}

function getSelectedLayout() {
  return document.querySelector('input[name="layout"]:checked').value
}

function applyLayoutStrategy() {
  const layout = getSelectedLayout()
  catalogContainer.classList.toggle('media-query', layout === 'media-query')
}

async function loadCatalog() {
  const strategy = getSelectedFetchStrategy()
  statusEl.textContent = `Loading data via ${strategy}...`

  const startTime = performance.now()

  try {
    const data =
      strategy === 'xhr' ? await loadWithXhr() : await loadWithFetch()

    const elapsedMs = Math.round(performance.now() - startTime)
    console.log(`[Experiment 2] Strategy "${strategy}" took ${elapsedMs} ms`)
    console.table(data) // inspect the parsed JSON array in the console

    renderUsers(data)
    statusEl.textContent = `Loaded ${data.length} users via ${strategy} in ${elapsedMs} ms.`
  } catch (err) {
    console.error(err)
    renderError(`Could not load data: ${err.message}`)
    statusEl.textContent = 'Failed to load data.'
  }
}

layoutRadios.forEach((radio) =>
  radio.addEventListener('change', applyLayoutStrategy)
)
fetchRadios.forEach((radio) =>
  radio.addEventListener('change', () => loadCatalog())
)
reloadBtn.addEventListener('click', () => loadCatalog())

applyLayoutStrategy()
loadCatalog()
```
