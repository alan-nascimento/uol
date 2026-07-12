/* ==========================================================================
   TOPIC 5 — Working with Data Sources and Data Security
   ==========================================================================
   Data source: JSONPlaceholder, a public fake REST API.
   Endpoint used: GET https://jsonplaceholder.typicode.com/users
   - Served over HTTPS (encrypted in transit).
   - Requires no API key, so there is nothing secret to leak from this
     client-side script (a real key must NEVER be hard-coded in JS that
     ships to the browser — see the security notes below).
   - CORS-enabled, which is why a browser running this file is allowed to
     read a response from a different origin (jsonplaceholder.typicode.com)
     at all.
   ========================================================================== */

const API_URL = 'https://jsonplaceholder.typicode.com/users'

const catalogContainer = document.getElementById('catalog-container')
const statusEl = document.getElementById('status')
const reloadBtn = document.getElementById('reload-btn')
const layoutRadios = document.querySelectorAll('input[name="layout"]')
const fetchRadios = document.querySelectorAll('input[name="fetch-strategy"]')

/* --------------------------------------------------------------------------
   Security note: escaping data before it touches the DOM.
   The API response is treated as untrusted text. We build elements with
   `textContent` (never `innerHTML`) so that any HTML/script characters in
   the payload are rendered as plain text, not executed — a basic defence
   against Cross-Site Scripting (XSS) when injecting remote data into the
   page.
   -------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
   Strategy A — fetch() + async/await (modern, promise-based)
   -------------------------------------------------------------------------- */
async function loadWithFetch() {
  const response = await fetch(API_URL)
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }
  const data = await response.json() // parse JSON response body
  return data
}

/* --------------------------------------------------------------------------
   Strategy B — XMLHttpRequest (older, callback-based)
   Kept side-by-side with fetch() for Experiment 2: same endpoint, same
   result, different amount of code and a different programming style
   (event callbacks vs promises/async-await).
   -------------------------------------------------------------------------- */
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
