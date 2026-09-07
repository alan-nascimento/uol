/* ===========================================================================
   JSON validation
   CM1040 final coursework - The Internet in Brazil, 1995-2026

   The brief requires code that "checks the needed things are in the JSON data
   before attempting to render the template". Rather than scattering ad-hoc
   `if` statements through the page scripts, each dataset is described by a
   schema and one validator walks it. Adding a dataset means adding a schema,
   not writing new validation code.

   Three of the rules are not generic data hygiene - they encode requirements
   from the coursework brief itself, so that breaking a requirement breaks the
   build rather than quietly slipping through:

   - `source` and `sourceUrl` are mandatory on every factual record, because
     the brief requires every fact and every piece of media to be citable.
   - `imageAlt` is mandatory whenever `imageUrl` is present, so an image can
     never reach the page without alternative text. This is an accessibility
     requirement enforced at the data layer rather than discovered later by an
     audit tool.
   - `year` is constrained to 1995-2026, the period the brief defines as the
     author's lifetime. A stray 1989 entry is rejected as out of scope.

   Validation never throws. It returns a result object so the caller can show
   a readable message on the page instead of leaving a blank region and an
   error only visible in the console.

   This file is shared with the optional Express server (see server/server.js)
   so that client and server enforce exactly the same rules.
   =========================================================================== */

const LIFETIME_START = 1995
const LIFETIME_END = 2026

/* Field specification vocabulary:
     type          'string' | 'number' | 'boolean' | 'array' | 'object'
     required      must be present and non-empty
     requiredWith  required only when the named sibling field is present
     min / max     numeric bounds
     minLength     minimum trimmed string length
     maxLength     maximum trimmed string length
     of            schema applied to every element of an array
     shape         schema applied to a nested object                          */

const SCHEMAS = {
  milestones: {
    collection: 'milestones',
    fields: {
      year: { type: 'number', required: true, min: LIFETIME_START, max: LIFETIME_END },
      title: { type: 'string', required: true, maxLength: 120 },
      summary: { type: 'string', required: true, maxLength: 400 },
      source: { type: 'string', required: true },
      sourceUrl: { type: 'string', required: true }
    }
  },

  timeline: {
    collection: 'events',
    fields: {
      year: { type: 'number', required: true, min: LIFETIME_START, max: LIFETIME_END },
      era: { type: 'string', required: true },
      title: { type: 'string', required: true, maxLength: 120 },
      description: { type: 'string', required: true, maxLength: 800 },
      imageUrl: { type: 'string' },
      imageAlt: { type: 'string', requiredWith: 'imageUrl' },
      imageCredit: { type: 'string', requiredWith: 'imageUrl' },
      source: { type: 'string', required: true },
      sourceUrl: { type: 'string', required: true }
    }
  },

  access: {
    /* Not a flat collection: this dataset is one object holding a chart, a
       source comparison and a list of eras, each era holding its own list of
       figures. It exercises the nested iteration the template engine had to be
       extended to support. */
    shape: {
      chart: {
        type: 'object',
        required: true,
        shape: {
          title: { type: 'string', required: true },
          unit: { type: 'string', required: true },
          /* Mandatory. This series is not methodologically continuous, and a
             chart of it without a caveat would mislead. Requiring the note
             makes that impossible to forget. */
          note: { type: 'string', required: true, maxLength: 700 },
          source: { type: 'string', required: true },
          sourceUrl: { type: 'string', required: true },
          points: {
            type: 'array',
            required: true,
            of: {
              year: { type: 'number', required: true, min: LIFETIME_START, max: LIFETIME_END },
              value: { type: 'number', required: true, min: 0, max: 100 },
              /* Which methodology produced this figure. Mandatory per point,
                 because the survey changed its coverage and its device rules
                 twice during the series, and a reader comparing 2013 with
                 2014 is not comparing like with like. */
              regime: { type: 'string', required: true }
            }
          }
        }
      },

      /* Two official bodies measure household internet access and publish
         figures that differ by roughly ten percentage points. Rather than
         picking one and hiding the problem, the disagreement is shown. */
      comparison: {
        type: 'object',
        required: true,
        shape: {
          title: { type: 'string', required: true },
          note: { type: 'string', required: true, maxLength: 700 },
          source: { type: 'string', required: true },
          sourceUrl: { type: 'string', required: true },
          rows: {
            type: 'array',
            required: true,
            of: {
              year: { type: 'number', required: true, min: LIFETIME_START, max: LIFETIME_END },
              cetic: { type: 'number', required: true, min: 0, max: 100 },
              ibge: { type: 'number', required: true, min: 0, max: 100 },
              /* Stored rather than calculated: the template engine performs no
                 arithmetic, so any derived figure has to exist in the data. */
              gap: { type: 'string', required: true }
            }
          }
        }
      },
      eras: {
        type: 'array',
        required: true,
        of: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          yearsLabel: { type: 'string', required: true },
          description: { type: 'string', required: true, maxLength: 900 },
          facts: {
            type: 'array',
            required: true,
            of: {
              label: { type: 'string', required: true },
              value: { type: 'string', required: true }
            }
          },
          source: { type: 'string', required: true },
          sourceUrl: { type: 'string', required: true }
        }
      }
    }
  },

  features: {
    collection: 'features',
    fields: {
      id: { type: 'string', required: true },
      name: { type: 'string', required: true, maxLength: 120 },
      yearsLabel: { type: 'string', required: true },
      description: { type: 'string', required: true, maxLength: 900 },
      globalSignificance: { type: 'string', required: true, maxLength: 500 },
      imageUrl: { type: 'string' },
      imageAlt: { type: 'string', requiredWith: 'imageUrl' },
      imageCredit: { type: 'string', requiredWith: 'imageUrl' },
      /* An optional pull-quote. The same requiredWith device used for image
         alt text is used here for attribution: a quotation cannot reach the
         page without naming who said it, where it was published and where it
         can be checked. An unattributed quotation is exactly the kind of
         thing this project should not be able to publish by accident. */
      quote: { type: 'string', maxLength: 400 },
      quoteAuthor: { type: 'string', requiredWith: 'quote' },
      quoteSource: { type: 'string', requiredWith: 'quote' },
      quoteUrl: { type: 'string', requiredWith: 'quote' },
      source: { type: 'string', required: true },
      sourceUrl: { type: 'string', required: true }
    }
  },

  memories: {
    /* Visitor-submitted, therefore untrusted. The length caps are not
       cosmetic: they are the first control against someone pasting a very
       large payload, and they are applied on the server as well as here,
       because validation performed only in the browser can be bypassed by
       posting to the API directly. */
    collection: 'memories',
    /* The only collection that may legitimately be empty. Nobody has
       contributed yet is a state the wall is designed to show, not a fault in
       the data, so it must not be reported as one. */
    allowEmpty: true,
    fields: {
      id: { type: 'string', required: true },
      name: { type: 'string', required: true, minLength: 1, maxLength: 40 },
      year: { type: 'number', required: true, min: LIFETIME_START, max: LIFETIME_END },
      text: { type: 'string', required: true, minLength: 10, maxLength: 500 },
      submittedAt: { type: 'string', required: true }
    }
  }
}

function isEmpty(value) {
  if (value === undefined || value === null) {
    return true
  }
  if (typeof value === 'string') {
    return value.trim().length === 0
  }
  return false
}

function typeOf(value) {
  if (Array.isArray(value)) {
    return 'array'
  }
  if (value === null) {
    return 'null'
  }
  return typeof value
}

/* Checks one field against its specification, pushing human-readable messages
   onto `errors`. `path` describes where the problem is, e.g.
   "events[3].imageAlt", so a failure points at the offending record. */
function validateField(record, fieldName, spec, path, errors) {
  const value = record[fieldName]
  const where = `${path}${fieldName}`

  const isRequired =
    spec.required === true ||
    (spec.requiredWith !== undefined && !isEmpty(record[spec.requiredWith]))

  if (isEmpty(value)) {
    if (isRequired) {
      errors.push(
        spec.requiredWith
          ? `${where} is required because ${path}${spec.requiredWith} is present`
          : `${where} is required`
      )
    }
    return
  }

  const actualType = typeOf(value)

  if (spec.type && actualType !== spec.type) {
    errors.push(`${where} should be a ${spec.type} but is a ${actualType}`)
    return
  }

  if (spec.type === 'number') {
    if (Number.isNaN(value)) {
      errors.push(`${where} is not a number`)
      return
    }
    if (spec.min !== undefined && value < spec.min) {
      errors.push(`${where} is ${value}, below the minimum of ${spec.min}`)
    }
    if (spec.max !== undefined && value > spec.max) {
      errors.push(`${where} is ${value}, above the maximum of ${spec.max}`)
    }
  }

  if (spec.type === 'string') {
    const length = value.trim().length
    if (spec.minLength !== undefined && length < spec.minLength) {
      errors.push(`${where} is shorter than ${spec.minLength} characters`)
    }
    if (spec.maxLength !== undefined && length > spec.maxLength) {
      errors.push(`${where} is longer than ${spec.maxLength} characters`)
    }
  }

  if (spec.type === 'array' && spec.of) {
    value.forEach((item, index) => {
      validateRecord(item, spec.of, `${where}[${index}].`, errors)
    })
  }

  if (spec.type === 'object' && spec.shape) {
    validateRecord(value, spec.shape, `${where}.`, errors)
  }
}

function validateRecord(record, fields, path, errors) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    errors.push(`${path.replace(/\.$/, '')} should be an object`)
    return
  }

  Object.keys(fields).forEach((fieldName) => {
    validateField(record, fieldName, fields[fieldName], path, errors)
  })
}

/* Validates a parsed JSON document against a named schema.

   Returns { valid, errors, data }. The caller decides what to do; this
   function deliberately has no opinion about the DOM. */
function validateDataset(schemaName, data) {
  const schema = SCHEMAS[schemaName]
  const errors = []

  if (!schema) {
    return {
      valid: false,
      errors: [`No schema is defined for "${schemaName}"`],
      data: null
    }
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return {
      valid: false,
      errors: ['The data file did not contain a JSON object'],
      data: null
    }
  }

  if (schema.collection) {
    const list = data[schema.collection]

    // The array check taught in the module, kept as the outermost guard.
    if (!Array.isArray(list)) {
      return {
        valid: false,
        errors: [`Expected "${schema.collection}" to be an array`],
        data: null
      }
    }

    /* An empty editorial dataset means something went wrong upstream, so it is
       an error. An empty visitor dataset just means nobody has written in yet,
       which the template handles with its else branch. */
    if (list.length === 0 && !schema.allowEmpty) {
      return {
        valid: false,
        errors: [`"${schema.collection}" is empty, so there is nothing to show`],
        data: null
      }
    }

    list.forEach((record, index) => {
      validateRecord(
        record,
        schema.fields,
        `${schema.collection}[${index}].`,
        errors
      )
    })
  } else if (schema.shape) {
    validateRecord(data, schema.shape, '', errors)
  }

  return { valid: errors.length === 0, errors, data: errors.length ? null : data }
}

/* Validates a single visitor submission before it is sent or stored. Reuses
   the memories schema minus the fields the server assigns, so the browser and
   the server cannot drift apart on what counts as acceptable. */
function validateSubmission(submission) {
  const errors = []
  const fields = SCHEMAS.memories.fields

  validateRecord(
    submission,
    {
      name: fields.name,
      year: fields.year,
      text: fields.text
    },
    '',
    errors
  )

  return { valid: errors.length === 0, errors }
}

/* Available as globals in the browser, and as a module to the Express server
   so both sides enforce one set of rules. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SCHEMAS,
    validateDataset,
    validateSubmission,
    LIFETIME_START,
    LIFETIME_END
  }
}
