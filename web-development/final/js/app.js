/* ===========================================================================
   Page controller
   CM1040 final coursework - The Internet in Brazil, 1995-2026

   Each page declares what it is with a data-page attribute on <body>, and this
   file maps that to the datasets it needs. Adding a page is a matter of adding
   an entry to PAGE_SECTIONS rather than writing another script.

   The pipeline is the same everywhere: fetch the data, validate it, and only
   then hand it to the template engine. If validation fails the page shows what
   is wrong where the content would have gone, instead of rendering a broken
   section or failing silently into the console.
   =========================================================================== */

const PAGE_SECTIONS = {
  home: [
    {
      dataset: 'milestones',
      template: 'templates/milestones.html',
      target: 'milestones'
    }
  ],
  timeline: [
    {
      dataset: 'timeline',
      template: 'templates/timeline.html',
      target: 'timeline',
      onRendered: initEraFilter
    }
  ],
  'getting-online': [
    { dataset: 'access', template: 'templates/access.html', target: 'access' }
  ],
  'made-in-brazil': [
    {
      dataset: 'features',
      template: 'templates/features.html',
      target: 'features'
    }
  ],
  memories: [
    {
      dataset: 'memories',
      template: 'templates/memories.html',
      target: 'memory-wall'
    }
  ]
}

/* Builds a message panel using createElement and textContent rather than
   innerHTML. Validation messages can quote values that came from the data
   itself, so treating them as text closes the same hole the template engine's
   escaping closes. */
function showMessage(targetId, { title, body, errors = [], kind = 'is-error' }) {
  const target = document.getElementById(targetId)
  if (!target) {
    return
  }

  const panel = document.createElement('div')
  panel.className = `message ${kind}`

  const heading = document.createElement('h2')
  heading.textContent = title
  panel.appendChild(heading)

  if (body) {
    const paragraph = document.createElement('p')
    paragraph.textContent = body
    panel.appendChild(paragraph)
  }

  if (errors.length > 0) {
    const list = document.createElement('ul')
    errors.forEach((error) => {
      const item = document.createElement('li')
      item.textContent = error
      list.appendChild(item)
    })
    panel.appendChild(list)
  }

  target.replaceChildren(panel)
}

async function renderSection(section) {
  const target = document.getElementById(section.target)
  if (!target) {
    return
  }

  target.innerHTML = '<p class="loading">Loading…</p>'

  const result = await DataSource.load(section.dataset)

  if (!result.ok) {
    showMessage(section.target, {
      title: 'This content could not be shown',
      body:
        'The data behind this section did not pass validation, so it has not been rendered.',
      errors: result.errors
    })
    return
  }

  const engine = new SimpleTemplateEngine(section.template)

  try {
    await engine.loadTemplate()
  } catch (error) {
    showMessage(section.target, {
      title: 'This content could not be shown',
      body: `The template could not be loaded: ${error.message}`
    })
    return
  }

  engine.renderTemplate(section.target, result.data)

  if (typeof section.onRendered === 'function') {
    section.onRendered()
  }
}

/* Names the data source on the page. Useful to the visitor, because it is what
   explains whether the contribution form is open, and useful as evidence that
   the fallback works without needing to start the optional server. */
function renderSourceIndicator() {
  const target = document.getElementById('data-source')
  if (!target) {
    return
  }

  const description = DataSource.describe()

  const label = document.createElement('strong')
  label.textContent = description.label

  const detail = document.createTextNode(` — ${description.detail}`)

  target.replaceChildren(document.createTextNode('Data source: '), label, detail)
}

/* Filters timeline entries by era. Progressive rather than essential: the
   controls are added by script, so a visitor without JavaScript sees the
   complete timeline instead of a row of buttons that do nothing. */
function initEraFilter() {
  const container = document.getElementById('era-filter')
  const events = Array.from(document.querySelectorAll('.timeline-event'))

  if (!container || events.length === 0) {
    return
  }

  const eras = ['All', ...new Set(events.map((event) => event.dataset.era))]
  const list = document.createElement('ul')

  eras.forEach((era, index) => {
    const item = document.createElement('li')
    const button = document.createElement('button')

    button.type = 'button'
    button.textContent = era
    button.setAttribute('aria-pressed', String(index === 0))

    button.addEventListener('click', () => {
      events.forEach((event) => {
        event.hidden = era !== 'All' && event.dataset.era !== era
      })
      list.querySelectorAll('button').forEach((other) => {
        other.setAttribute('aria-pressed', String(other === button))
      })
    })

    item.appendChild(button)
    list.appendChild(item)
  })

  container.replaceChildren(list)
  container.hidden = false
}

/* The contribution form. Disabled with an explanation when the optional server
   is not running, because a form that silently fails is worse than one that
   says why it cannot be used. */
async function initMemoryForm() {
  const form = document.getElementById('memory-form')
  if (!form) {
    return
  }

  const status = document.getElementById('form-status')
  const submit = form.querySelector('button[type="submit"]')
  const source = await DataSource.detect()

  if (source !== 'api') {
    submit.disabled = true
    status.textContent =
      'Sharing a memory needs the optional data server. The wall below still works, and is being read from the static data files.'
    return
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const submission = {
      name: form.elements.name.value.trim(),
      year: Number(form.elements.year.value),
      text: form.elements.text.value.trim()
    }

    submit.disabled = true
    status.textContent = 'Sending…'

    const result = await DataSource.submitMemory(submission)

    if (!result.ok) {
      status.textContent = result.errors.join(' ')
      submit.disabled = false
      return
    }

    form.reset()
    status.textContent = 'Thank you. Your memory has been added below.'
    submit.disabled = false

    await renderSection(PAGE_SECTIONS.memories[0])
  })
}

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page
  const sections = PAGE_SECTIONS[page] || []

  // Probe once up front so the indicator and the form agree with each other.
  await DataSource.detect()
  renderSourceIndicator()

  for (const section of sections) {
    await renderSection(section)
  }

  await initMemoryForm()
})
