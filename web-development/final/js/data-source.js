/* ===========================================================================
   DataSource
   CM1040 final coursework - The Internet in Brazil, 1995-2026

   The website reads its content from JSON. That JSON can come from two places:

   1. the static files in `data/`, which always work as long as the site is
      served over HTTP, and
   2. the optional Express API in `server/`, which serves the same content and
      additionally accepts new visitor memories.

   The API is an extension, not a dependency. Anyone who unzips this project
   and opens it with Live Server gets a complete, working website without
   installing anything. If the API happens to be running, the site notices and
   uses it; if it stops mid-session, individual requests fall back to the
   static files rather than failing.

   Which source is in use is shown on the page rather than hidden in the
   console, because it is information the visitor benefits from: it explains
   why the contribution form is or is not available.
   =========================================================================== */

const API_BASE = 'http://localhost:3000/api'
const STATIC_BASE = 'data'

/* The probe has to fail fast. A visitor without the server running should not
   wait on a connection timeout before seeing the page, so the probe is
   abandoned after a short interval and the static files are used. */
const PROBE_TIMEOUT_MS = 1200

/* The result is remembered for the browsing session so that only the first
   page load pays for the probe. sessionStorage rather than localStorage: the
   answer is only valid while the server keeps running. */
const SESSION_KEY = 'cm1040:api-available'

const DATASETS = {
  milestones: { file: 'milestones.json', path: 'milestones', schema: 'milestones' },
  timeline: { file: 'timeline.json', path: 'timeline', schema: 'timeline' },
  access: { file: 'access.json', path: 'access', schema: 'access' },
  features: { file: 'features.json', path: 'features', schema: 'features' },
  memories: { file: 'memories.json', path: 'memories', schema: 'memories' }
}

const DataSource = {
  /* 'api' once the server has answered, 'static' otherwise, null before the
     first probe. Read by the page scripts to render the indicator. */
  active: null,

  async fetchWithTimeout(url, options = {}, timeoutMs = PROBE_TIMEOUT_MS) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      return await fetch(url, { ...options, signal: controller.signal })
    } finally {
      clearTimeout(timer)
    }
  },

  /* Asks the server whether it is there. Any failure at all - refused
     connection, timeout, wrong status - is treated the same way: no API. */
  async detect() {
    if (this.active !== null) {
      return this.active
    }

    const remembered = sessionStorage.getItem(SESSION_KEY)
    if (remembered !== null) {
      this.active = remembered === 'true' ? 'api' : 'static'
      return this.active
    }

    let available = false

    try {
      const response = await this.fetchWithTimeout(`${API_BASE}/health`)
      available = response.ok
    } catch (error) {
      // Expected whenever the optional server is not running.
      available = false
    }

    sessionStorage.setItem(SESSION_KEY, String(available))
    this.active = available ? 'api' : 'static'
    return this.active
  },

  /* Loads and validates one dataset.

     Always returns a result object rather than throwing, so a page can render
     a readable message in place of the missing section instead of breaking. */
  async load(name) {
    const dataset = DATASETS[name]

    if (!dataset) {
      return {
        ok: false,
        source: null,
        errors: [`Unknown dataset "${name}"`],
        data: null
      }
    }

    const source = await this.detect()
    let raw = null
    let usedSource = source

    if (source === 'api') {
      raw = await this.readJson(`${API_BASE}/${dataset.path}`)

      // The server was there for the probe but not for this request. Rather
      // than showing an error, drop back to the file that is always present.
      if (raw === null) {
        console.warn(
          `DataSource: API request for "${name}" failed, using static file`
        )
        usedSource = 'static'
      }
    }

    if (raw === null) {
      raw = await this.readJson(`${STATIC_BASE}/${dataset.file}`)
      usedSource = 'static'
    }

    if (raw === null) {
      return {
        ok: false,
        source: usedSource,
        errors: [
          `Could not load ${dataset.file}. If you opened this page directly from the file system, serve it over HTTP instead.`
        ],
        data: null
      }
    }

    // Validation happens here, before any page gets the chance to render it.
    const result = validateDataset(dataset.schema, raw)

    if (!result.valid) {
      console.error(`DataSource: "${name}" failed validation`, result.errors)
    }

    return {
      ok: result.valid,
      source: usedSource,
      errors: result.errors,
      data: result.data
    }
  },

  /* Returns parsed JSON, or null for any failure. Callers decide what a
     failure means; some are fatal and some are just a cue to fall back. */
  async readJson(url) {
    try {
      const response = await this.fetchWithTimeout(url, {}, 8000)

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      return null
    }
  },

  /* Posts a visitor memory. Only possible with the API running, because
     static files cannot be written to from the browser. */
  async submitMemory(submission) {
    const source = await this.detect()

    if (source !== 'api') {
      return {
        ok: false,
        errors: [
          'Contributions need the optional data server. See server/README.md for how to start it.'
        ]
      }
    }

    // Checked here for an immediate response, and again on the server, since
    // anything validated only in the browser can be bypassed.
    const check = validateSubmission(submission)
    if (!check.valid) {
      return { ok: false, errors: check.errors }
    }

    try {
      const response = await this.fetchWithTimeout(
        `${API_BASE}/memories`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission)
        },
        8000
      )

      const body = await response.json().catch(() => null)

      if (!response.ok) {
        return {
          ok: false,
          errors: (body && body.errors) || [
            `The server rejected the submission (${response.status}).`
          ]
        }
      }

      return { ok: true, errors: [], memory: body }
    } catch (error) {
      return {
        ok: false,
        errors: ['Could not reach the data server. Is it still running?']
      }
    }
  },

  /* Plain-language description for the on-page indicator. */
  describe() {
    if (this.active === 'api') {
      return {
        label: 'Live data server on localhost:3000',
        detail: 'Contributions are open.',
        canContribute: true
      }
    }

    return {
      label: 'Static JSON files',
      detail: 'The optional data server is not running, so contributions are closed.',
      canContribute: false
    }
  }
}
