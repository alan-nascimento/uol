/* ===========================================================================
   Smoke test
   CM1040 final coursework - The Internet in Brazil, 1995-2026

   Run with:  node tests/smoke-test.js

   No dependencies and no test framework. It loads the real engine, the real
   validator and the real data files, renders every template, and fails loudly
   if anything is wrong. It exists because the alternative - opening five pages
   and reading them - misses the failures that are invisible on screen. A
   template tag that never resolves renders as nothing at all, and a page with
   a silently missing field looks exactly like a page without one.

   The browser files are plain scripts rather than modules, so they are
   evaluated into a shared context here the same way successive script tags
   would evaluate them in a page.
   =========================================================================== */

const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.join(__dirname, '..')
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8')

const context = vm.createContext({
  console: { warn() {}, error() {}, log() {} },
  document: { getElementById: () => null }
})

vm.runInContext(read('js/template-engine.js'), context)
vm.runInContext(read('js/validate.js'), context)

const SimpleTemplateEngine = vm.runInContext('SimpleTemplateEngine', context)
const validateDataset = vm.runInContext('validateDataset', context)
const validateSubmission = vm.runInContext('validateSubmission', context)

let failures = 0

function check(name, condition, detail) {
  if (condition) {
    console.log(`  ok    ${name}`)
    return
  }
  failures += 1
  console.log(`  FAIL  ${name}`)
  if (detail) {
    console.log(`        ${detail}`)
  }
}

function renderWith(templatePath, data) {
  const engine = new SimpleTemplateEngine(templatePath)
  engine.template = read(templatePath)
  return engine.render(engine.template, data)
}

/* --- Every dataset validates and renders --------------------------------- */

const CASES = [
  ['milestones', 'data/milestones.json', 'templates/milestones.html'],
  ['timeline', 'data/timeline.json', 'templates/timeline.html'],
  ['access', 'data/access.json', 'templates/access.html'],
  ['features', 'data/features.json', 'templates/features.html'],
  ['memories', 'data/memories.json', 'templates/memories.html']
]

console.log('\nDatasets')

for (const [schema, dataFile, templateFile] of CASES) {
  const result = validateDataset(schema, JSON.parse(read(dataFile)))

  check(`${schema} validates`, result.valid, (result.errors || []).join('; '))

  if (!result.valid) {
    continue
  }

  const html = renderWith(templateFile, result.data)

  /* An unresolved tag is the failure mode this file exists to catch: it
     renders as nothing, so the page looks merely short rather than broken. */
  const leftover = html.match(/\{\{[^}]*\}\}/g)
  check(
    `${schema} leaves no unrendered tags`,
    leftover === null,
    leftover && [...new Set(leftover)].join(', ')
  )

  check(
    `${schema} prints no literal "undefined"`,
    !html.includes('undefined')
  )
}

/* --- Every source is cited ------------------------------------------------
   The schema requires source and sourceUrl, so this cannot fail while the
   validator passes. It is asserted anyway, because the requirement is an
   academic one rather than a technical one: if the schema is ever relaxed,
   this is the test that should object.
   ------------------------------------------------------------------------- */

console.log('\nCitations')

const timeline = JSON.parse(read('data/timeline.json'))
const uncited = timeline.events.filter((e) => !e.source || !e.sourceUrl)
check(`all ${timeline.events.length} timeline events cite a source`, uncited.length === 0)

const noAlt = timeline.events.filter((e) => e.imageUrl && !e.imageAlt)
check('no timeline image lacks alt text', noAlt.length === 0)

/* --- Escaping -------------------------------------------------------------
   The reason the engine departs from the module's version. Visitor text is
   written to innerHTML, so it has to arrive inert.
   ------------------------------------------------------------------------- */

console.log('\nEscaping')

const hostile = renderWith('templates/memories.html', {
  memories: [
    {
      year: 2001,
      name: '<img src=x onerror="alert(1)">',
      text: '<script>alert("stored xss")</script>'
    }
  ]
})

check(
  'a hostile submission produces no live markup',
  !/<script|<img|onerror\s*=\s*"/.test(hostile)
)
check(
  'a hostile submission is visible as escaped text',
  hostile.includes('&lt;script&gt;')
)

/* --- Submission rules ----------------------------------------------------- */

console.log('\nSubmission rules')

const rejected = validateSubmission({ name: '', year: 1200, text: 'no' })
check('an empty name, impossible year and short text are all rejected',
  !rejected.valid && rejected.errors.length === 3,
  rejected.errors.join('; '))

const accepted = validateSubmission({
  name: 'Ana',
  year: 2001,
  text: 'I first went online at a lan house near my school.'
})
check('a well-formed submission is accepted', accepted.valid, accepted.errors.join('; '))

/* --- Engine behaviour the module's version did not have ------------------- */

console.log('\nEngine extensions')

check(
  'loops nest',
  renderWith('templates/access.html', validateDataset('access', JSON.parse(read('data/access.json'))).data)
    .includes('fact-value')
)

const engine = new SimpleTemplateEngine('inline')
check(
  'an empty array takes the else branch',
  engine.render('{{#if items}}yes{{else}}no{{/if}}', { items: [] }) === 'no'
)
check(
  'dotted paths resolve',
  engine.render('{{a.b.c}}', { a: { b: { c: 'found' } } }) === 'found'
)
check(
  'a missing value renders as empty, not "undefined"',
  engine.render('[{{nothing}}]', {}) === '[]'
)
check(
  'a conditional inside a loop sees the current item',
  engine.render(
    '{{#each rows}}{{#if flag}}Y{{else}}N{{/if}}{{/each}}',
    { rows: [{ flag: true }, { flag: false }, { flag: true }] }
  ) === 'YNY'
)

console.log(
  failures === 0
    ? '\nAll checks passed.\n'
    : `\n${failures} failing check${failures === 1 ? '' : 's'}.\n`
)

process.exit(failures === 0 ? 0 : 1)
