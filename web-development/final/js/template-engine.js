/* ===========================================================================
   SimpleTemplateEngine
   CM1040 final coursework - The Internet in Brazil, 1995-2026

   This is the template engine taught in the module, kept deliberately close to
   the version built in the labs: the same class shape, the same public API
   (`loadTemplate` then `renderTemplate(tag_id, data)`), the same `{{variable}}`
   / `{{#each}}` / `{{#if}}` syntax, and the same approach of transforming the
   template with regular expressions.

   Four extensions were added. Each one exists because the original engine
   could not do something this website actually needed, and each is marked
   below with an EXTENSION comment explaining the problem it solves.

   1. HTML escaping by default, with a `{{{triple-brace}}}` opt-out.
      The Memories page renders text submitted by visitors. The original engine
      assigns its output to `.innerHTML`, so a visitor could submit
      `<script>...</script>` and have it execute for every later visitor - a
      stored cross-site scripting hole. Escaping by default and requiring an
      explicit triple brace to emit raw HTML follows the convention used by
      Mustache and Handlebars, the ready-made engines covered in the module.

   2. Balanced block matching instead of a non-greedy regex.
      The original `{{#each (\w+)}}([\s\S]*?){{\/each}}` stops at the *first*
      `{{/each}}`, so a loop cannot contain another loop. The Getting Online
      page iterates eras and, inside each era, that era's key figures. Blocks
      are therefore located by scanning and counting depth.

   3. Conditionals evaluated against the surrounding loop item.
      In the original, `{{#each}}` substituted only plain variables inside its
      fragment, so an `{{#if}}` written inside a loop was later evaluated
      against the top-level data rather than the current item. Rendering is now
      recursive: each loop item is rendered as a template in its own right.

   4. Dotted paths, and empty output for missing values.
      `{{chart.title}}` reads nested objects, which keeps the templates flat.
      A missing key renders as an empty string and logs a warning, instead of
      printing the literal text "undefined" into the page.

   Known limitation, left in deliberately: this is still a string-rewriting
   engine, not a parser. It does not support helpers, partials or expressions
   inside tags. That is appropriate for the scope of this project.
   =========================================================================== */

class SimpleTemplateEngine {
  constructor(template_url) {
    this.template_url = template_url
    this.template = null
  }

  /* Loads the template file over HTTP. Templates are fetched rather than
     embedded so that layout stays separate from logic, which is the whole
     point of using a template engine. Requires the site to be served over
     HTTP: opening the pages from file:// will fail here. */
  loadTemplate() {
    return fetch(this.template_url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Template request failed: ${response.status} ${response.statusText} (${this.template_url})`
          )
        }
        return response.text()
      })
      .then((text) => {
        this.template = text
        return this.template
      })
  }

  /* Renders the loaded template with `data` into the element with `tag_id`.
     Signature kept identical to the module's version. */
  renderTemplate(tag_id, data) {
    const tag = document.getElementById(tag_id)

    if (!tag) {
      console.error(`SimpleTemplateEngine: no element with id "${tag_id}"`)
      return
    }

    if (this.template === null) {
      console.error(
        'SimpleTemplateEngine: renderTemplate called before loadTemplate resolved'
      )
      return
    }

    tag.innerHTML = this.render(this.template, data)
  }

  /* The recursive core. `context` is the object that variable names are
     resolved against: the whole data object at the top level, or the current
     item inside a loop.

     Order matters. Loops run first so their contents are expanded, then
     conditionals, then plain variables - otherwise a variable substitution
     could produce text that looks like a block tag. */
  render(template, context) {
    let output = template
    output = this.renderEachBlocks(output, context)
    output = this.renderIfBlocks(output, context)
    output = this.replaceVariablesInFragment(output, context)
    return output
  }

  /* EXTENSION 2: locates a balanced `{{#keyword expr}} ... {{/keyword}}` pair,
     counting nested openings of the same keyword so that inner blocks do not
     terminate the outer one. Returns null when no block is found, and also
     when a block is opened but never closed - an unclosed tag is reported
     rather than silently swallowing the rest of the template. */
  findBlock(template, keyword) {
    const opening = new RegExp(`\\{\\{#${keyword}\\s+([\\w.]+)\\}\\}`)
    const openMatch = opening.exec(template)

    if (!openMatch) {
      return null
    }

    const contentStart = openMatch.index + openMatch[0].length
    const scanner = new RegExp(
      `\\{\\{(#${keyword}\\s+[\\w.]+|\\/${keyword})\\}\\}`,
      'g'
    )
    scanner.lastIndex = contentStart

    let depth = 1
    let match

    while ((match = scanner.exec(template)) !== null) {
      depth += match[1].charAt(0) === '#' ? 1 : -1

      if (depth === 0) {
        return {
          blockStart: openMatch.index,
          blockEnd: match.index + match[0].length,
          expression: openMatch[1],
          content: template.slice(contentStart, match.index)
        }
      }
    }

    console.error(
      `SimpleTemplateEngine: unclosed {{#${keyword}}} block for "${openMatch[1]}"`
    )
    return null
  }

  /* Expands every `{{#each}}` loop.

     Output is accumulated left to right and the already-rendered part is never
     re-scanned. That matters for safety as well as speed: if a visitor
     submitted the literal text "{{#each something}}", re-scanning the rendered
     output would treat their text as a template instruction. */
  renderEachBlocks(template, context) {
    let output = ''
    let rest = template
    let block

    while ((block = this.findBlock(rest, 'each')) !== null) {
      output += rest.slice(0, block.blockStart)

      // The array check taught in the module, kept as the last line of defence
      // even though validate.js has already checked the data by this point.
      const listOfThings = this.resolvePath(context, block.expression)

      if (Array.isArray(listOfThings)) {
        // EXTENSION 3: each item is rendered as a full template, so loops and
        // conditionals inside the fragment resolve against that item.
        output += listOfThings
          .map((item) => this.render(block.content, item))
          .join('')
      } else {
        console.warn(
          `SimpleTemplateEngine: {{#each ${block.expression}}} expected an array, got ${typeof listOfThings}`
        )
      }

      rest = rest.slice(block.blockEnd)
    }

    return output + rest
  }

  /* Expands every `{{#if}}` block, with or without an `{{else}}` branch. */
  renderIfBlocks(template, context) {
    let output = ''
    let rest = template
    let block

    while ((block = this.findBlock(rest, 'if')) !== null) {
      output += rest.slice(0, block.blockStart)

      const branches = this.splitOnElse(block.content)
      const value = this.resolvePath(context, block.expression)
      const chosen = this.isTruthy(value)
        ? branches.ifContent
        : branches.elseContent

      output += this.render(chosen, context)
      rest = rest.slice(block.blockEnd)
    }

    return output + rest
  }

  /* Splits an if-block on its own `{{else}}`, ignoring any `{{else}}` that
     belongs to a nested conditional. */
  splitOnElse(content) {
    const scanner = /\{\{(#if\s+[\w.]+|else|\/if)\}\}/g
    let depth = 0
    let match

    while ((match = scanner.exec(content)) !== null) {
      const token = match[1]

      if (token.charAt(0) === '#') {
        depth += 1
      } else if (token === '/if') {
        depth -= 1
      } else if (depth === 0) {
        return {
          ifContent: content.slice(0, match.index),
          elseContent: content.slice(match.index + match[0].length)
        }
      }
    }

    return { ifContent: content, elseContent: '' }
  }

  /* An empty array counts as false, matching Handlebars. Without this,
     `{{#if memories}}` would take the truthy branch for an empty wall and
     render a heading above nothing at all. */
  isTruthy(value) {
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return Boolean(value)
  }

  /* EXTENSION 4: resolves "chart.title" as well as "title". */
  resolvePath(context, path) {
    if (context === null || context === undefined) {
      return undefined
    }

    return path
      .split('.')
      .reduce(
        (current, key) =>
          current === null || current === undefined ? undefined : current[key],
        context
      )
  }

  /* Substitutes variables. Triple braces are handled first: the double-brace
     pattern would otherwise match the inner two braces of `{{{name}}}` and
     escape content that was explicitly marked as trusted.

     Kept as a named method because the module's engine has one, though it now
     handles escaping too. */
  replaceVariablesInFragment(templateFragment, dataItem) {
    // {{{raw}}} - trusted HTML, author-controlled only.
    let output = templateFragment.replace(
      /\{\{\{([\w.]+)\}\}\}/g,
      (match, dataKey) => this.lookupForOutput(dataItem, dataKey, match)
    )

    // {{escaped}} - the default, safe for untrusted content.
    output = output.replace(/\{\{([\w.]+)\}\}/g, (match, dataKey) =>
      SimpleTemplateEngine.escapeHtml(
        this.lookupForOutput(dataItem, dataKey, match)
      )
    )

    return output
  }

  /* Missing keys render as nothing rather than the string "undefined", which
     would otherwise appear as visible text on the page. The warning keeps the
     mistake findable during development. */
  lookupForOutput(context, path, originalTag) {
    const value = this.resolvePath(context, path)

    if (value === undefined || value === null) {
      console.warn(
        `SimpleTemplateEngine: no value for ${originalTag}, rendered as empty`
      )
      return ''
    }

    return value
  }

  /* EXTENSION 1: converts the five characters that carry meaning in HTML into
     entities, so untrusted text is displayed rather than interpreted.
     Ampersand must be replaced first, or the ampersands introduced by the
     later replacements would themselves be re-encoded. */
  static escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }
}
