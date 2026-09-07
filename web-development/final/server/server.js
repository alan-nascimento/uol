/* ===========================================================================
   Optional data server
   CM1040 final coursework - The Internet in Brazil, 1995-2026

   The website works without this. Everything the server does for reading, it
   does by serving the same files from `data/` that the browser would otherwise
   fetch directly. What it adds is the one thing a static site cannot do:
   accept a new visitor memory and keep it.

   Two things are worth pointing out about how it is built.

   First, it requires `js/validate.js` - the same file the browser loads with a
   script tag. Client-side validation is a courtesy to the person filling in
   the form; it is not a security control, because anyone can post straight to
   this endpoint with curl and skip the page entirely. Sharing the module means
   the two sides cannot drift apart on what counts as acceptable.

   Second, submissions are stored exactly as they were typed. Escaping happens
   when the text is rendered, in the template engine, not when it is stored.
   Storing pre-escaped text would corrupt the data for any other consumer and
   would still not help a consumer that failed to escape.
   =========================================================================== */

const express = require('express')
const fs = require('fs/promises')
const path = require('path')
const crypto = require('crypto')

const { validateDataset, validateSubmission } = require('../js/validate.js')

const app = express()
const PORT = 3000
const DATA_DIR = path.join(__dirname, '..', 'data')

/* A cap on the body size, applied before the JSON is even parsed. Length
   limits in the schema cannot help with a payload designed to exhaust memory
   during parsing. */
app.use(express.json({ limit: '10kb' }))

/* The site is served on one port and this API listens on another, so browsers
   treat the requests as cross-origin. Only the two methods actually used are
   allowed. */
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

const READABLE = {
  milestones: { file: 'milestones.json', schema: 'milestones' },
  timeline: { file: 'timeline.json', schema: 'timeline' },
  access: { file: 'access.json', schema: 'access' },
  features: { file: 'features.json', schema: 'features' },
  memories: { file: 'memories.json', schema: 'memories' }
}

async function readDataset(name) {
  const raw = await fs.readFile(path.join(DATA_DIR, READABLE[name].file), 'utf8')
  return JSON.parse(raw)
}

/* What the browser probes to decide whether this server is running. */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', datasets: Object.keys(READABLE) })
})

/* One handler for every dataset. The name is looked up in READABLE rather than
   being joined onto a path, so a request for ../../etc/passwd resolves to no
   entry and returns 404 instead of reaching the file system. */
app.get('/api/:name', async (req, res) => {
  const dataset = READABLE[req.params.name]

  if (!dataset) {
    return res.status(404).json({ errors: [`Unknown dataset "${req.params.name}"`] })
  }

  try {
    const data = await readDataset(req.params.name)
    const result = validateDataset(dataset.schema, data)

    // The server refuses to hand out data that fails its own schema, so a
    // damaged file surfaces here rather than halfway through a page render.
    if (!result.valid) {
      console.error(`Dataset "${req.params.name}" failed validation`, result.errors)
      return res.status(500).json({ errors: result.errors })
    }

    res.json(data)
  } catch (error) {
    console.error(error)
    res.status(500).json({ errors: ['Could not read the dataset'] })
  }
})

app.post('/api/memories', async (req, res) => {
  /* Taken field by field rather than spreading the request body, so a caller
     cannot supply their own id or submittedAt, or smuggle in extra keys that
     the validator was never asked about. */
  const submission = {
    name: typeof req.body.name === 'string' ? req.body.name.trim() : req.body.name,
    year: Number(req.body.year),
    text: typeof req.body.text === 'string' ? req.body.text.trim() : req.body.text
  }

  const check = validateSubmission(submission)

  if (!check.valid) {
    return res.status(400).json({ errors: check.errors })
  }

  const memory = {
    id: crypto.randomUUID(),
    name: submission.name,
    year: submission.year,
    text: submission.text,
    submittedAt: new Date().toISOString()
  }

  try {
    const data = await readDataset('memories')
    data.memories.unshift(memory)

    await fs.writeFile(
      path.join(DATA_DIR, 'memories.json'),
      `${JSON.stringify(data, null, 2)}\n`,
      'utf8'
    )

    res.status(201).json(memory)
  } catch (error) {
    console.error(error)
    res.status(500).json({ errors: ['Could not save the memory'] })
  }
})

app.listen(PORT, () => {
  console.log(`Data server listening on http://localhost:${PORT}`)
  console.log('The website works without it; this adds the contribution form.')
})
