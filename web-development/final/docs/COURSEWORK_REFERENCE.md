# CM1040 Final Coursework — Consolidated Reference

Consolidated extraction from NotebookLM course materials (`NOTEBOOKLM.md`, `NOTEBOOKLM_2.md`), supplemented with the assessment brief (`CM1040 CW 2 _V5.pdf`) and midterm notes where the notebook had gaps.

This module uses vanilla JavaScript, manual DOM manipulation, and fundamental web principles — not React/TypeScript frameworks.

---

## Assessment Overview (from Brief)

**Task:** Create a website about the history of the internet in a country of your choosing, during your own lifetime. Minimum 3 pages. Some content must be rendered from JSON using the template engine from the module.

| Phase                  | Weight | Deliverable                                                                |
| ---------------------- | ------ | -------------------------------------------------------------------------- |
| 1. Research + planning | 20%    | Page plan, fact sheet, media with citations, project management techniques |
| 2. Wireframes          | 20%    | Desktop + mobile wireframes, user feedback evidence, design iterations     |
| 3. Build website       | 40%    | HTML/CSS/JS + template engine + JSON validation                            |
| 4. Testing             | 10%    | HTML validation + accessibility reports (before and after fixes)           |
| 5. Report + code       | 10%    | PDF report (≤1,500 words) + ZIP of website code                            |

**Extensions (bonus, not required):** REST API server (book data example), public API, visitor content contribution.

**Report sections (from brief):**

- **A.** Background research
- **B.** Planning
- **C.** Development process: prototype designs
- **D.** Development process: developing the code
- **E.** Testing: code validation reports and actions taken
- **F.** Reflections on what you learned

---

## 1. Template Engine

### Concepts (from course)

- The course builds a custom `SimpleTemplateEngine` from scratch using classes and regular expressions to separate layout from logic. It also covers ready-made engines: Handlebars, Mustache, EJS, and Pug.
- **Syntax:** Variables use double curly braces (`{{title}}`). Block helpers handle iteration (`{{#each books}} ... {{/each}}`) and conditionals (`{{#if loaded}} ... {{/if}}`).
- **Integration:** `fetch()` loads the `.html` template as text, replaces tags with JSON data, and injects into a target DOM element via `.innerHTML`.
- **Assessment expectation:** Not explicitly stated in notebook. [INFERRED: Either custom engine or ready-made is acceptable if documented; custom engine better demonstrates JavaScript fundamentals.]

### SimpleTemplateEngine — Complete Code

Source: model answer lab (last few lines truncated in notebook; variable swap and helper inferred).

```javascript
class SimpleTemplateEngine {
  constructor(template_url) {
    this.template_url = template_url
  }

  loadTemplate() {
    return fetch(this.template_url)
      .then((response) => response.text())
      .then((text) => {
        this.template = text
      })
  }

  renderTemplate(tag_id, data) {
    const tag = document.getElementById(tag_id)
    let output = this.template

    // Each loops
    output = output.replace(
      /{{#each (\w+)}}([\s\S]*?){{\/each}}/g,
      (match, arrayName, templateFragment) => {
        const ListOfThings = data[arrayName]
        if (!Array.isArray(ListOfThings)) {
          return ''
        }
        return ListOfThings.map((item) =>
          this.replaceVariablesInFragment(templateFragment, item)
        ).join('')
      }
    )

    // If-Else conditions
    output = output.replace(
      /{{#if (\w+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g,
      (match, condition, ifContent, elseContent) => {
        return data[condition] ? ifContent : elseContent
      }
    )

    // If conditions without else
    output = output.replace(
      /{{#if (\w+)}}([\s\S]*?){{\/if}}/g,
      (match, condition, ifContent) => {
        return data[condition] ? ifContent : ''
      }
    )

    // Variable swapping [INFERRED — source truncated]
    output = output.replace(/{{(\w+)}}/g, (match, dataField) => {
      return data[dataField]
    })

    tag.innerHTML = output
  }

  replaceVariablesInFragment(templateFragment, dataItem) {
    return templateFragment.replace(/{{(\w+)}}/g, (match, dataKey) => {
      return dataItem[dataKey]
    })
  }
}
```

### Usage (fetch + render)

```javascript
const tEngine = new SimpleTemplateEngine('templates/events.html')

fetch('data/timeline.json')
  .then((response) => response.json())
  .then((data) => {
    tEngine.loadTemplate().then(() => {
      tEngine.renderTemplate('content', data)
    })
  })
  .catch((error) => console.error('Error fetching JSON:', error))
```

### Recommended folder structure

```
final/
├── index.html
├── timeline.html
├── figures.html
├── style.css
├── script.js                 # SimpleTemplateEngine + fetch + validation
├── templates/
│   └── events.html           # {{#each events}} ...
├── data/
│   ├── milestones.json
│   └── figures.json
└── docs/                     # wireframes, report, test screenshots
```

Minimum course structure: `index.html`, `template.html`, `script.js`.

---

## 2. Book Data Project (Course Example)

### Folder structure

- `website/` — client code (`index.html`, `script.js`)
- `restserver/` or `bookserver/` — Node.js Express API

`server.js` (Express): **not found in notebook** — only referenced as a ZIP download.

### Frontend HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Book API Interaction</title>
    <script defer src="script.js"></script>
  </head>
  <body>
    <h1>Book API Interaction</h1>
    <h2>Books</h2>
    <div id="books"></div>

    <h2>Authors</h2>
    <div id="authors"></div>

    <h2>Categories</h2>
    <div id="categories"></div>

    <h2>Add a New Book</h2>
    <form id="addBookForm">
      <label for="title">Title:</label>
      <input type="text" id="title" name="title" required />
      <label for="author_id">Author ID:</label>
      <input type="number" id="author_id" name="author_id" required />
      <label for="genre_id">Genre ID:</label>
      <input type="number" id="genre_id" name="genre_id" required />
      <button type="submit">Add Book</button>
    </form>
  </body>
</html>
```

### Frontend JavaScript (REST API)

```javascript
document.addEventListener('DOMContentLoaded', () => {
  fetchBooks()
  fetchAuthors()
  document.getElementById('addBookForm').addEventListener('submit', addBook)
})

function fetchBooks() {
  fetch('http://localhost:3000/api/books')
    .then((response) => response.json())
    .then((data) => {
      const booksDiv = document.getElementById('books')
      booksDiv.innerHTML = data
        .map((book) => `<p>${book.title} by ${book.author}</p>`)
        .join('')
    })
    .catch((error) => console.error('Error fetching books:', error))
}

function fetchAuthors() {
  fetch('http://localhost:3000/api/authors')
    .then((response) => response.json())
    .then((data) => {
      const authorsDiv = document.getElementById('authors')
      authorsDiv.innerHTML = data
        .map((author) => `<p>${author.author}</p>`)
        .join('')
    })
    .catch((error) => console.error('Error fetching authors:', error))
}

function addBook(event) {
  event.preventDefault()
  const form = event.target
  const newBook = {
    title: form.title.value,
    author_id: parseInt(form.author_id.value, 10),
    genre_id: parseInt(form.genre_id.value, 10)
  }

  fetch('http://localhost:3000/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newBook)
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Book added:', data)
      fetchBooks()
    })
    .catch((error) => console.error('Error adding book:', error))
}
```

### JSON schema example

```json
{
  "bookstore": [
    {
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "price": 10.99
    }
  ]
}
```

---

## 3. JSON and Validation

### Format (from course)

- Objects `{}`, arrays `[]`, key-value pairs `"key": value`
- Types: strings, numbers, booleans, arrays, objects, null
- Example fields: `title`, `author`, `price`

### Validation taught in course

```javascript
const ListOfThings = data[arrayName]
if (!Array.isArray(ListOfThings)) {
  return ''
}
```

Additional validation beyond `Array.isArray()`: **not found in notebook**.

### Recommended validation (for assessment brief)

The brief asks to check required fields before rendering. Implement beyond what the course teaches:

```javascript
function validateEvent(event) {
  return (
    event &&
    typeof event.year === 'number' &&
    typeof event.title === 'string' &&
    typeof event.description === 'string'
  )
}

function validateEventsData(data) {
  if (!data || !Array.isArray(data.events)) {
    return { valid: false, error: 'Missing or invalid events array' }
  }
  const invalid = data.events.filter((e) => !validateEvent(e))
  if (invalid.length > 0) {
    return {
      valid: false,
      error: `${invalid.length} event(s) failed validation`
    }
  }
  return { valid: true, data }
}
```

### Error handling (from course)

```javascript
.catch((error) => console.error('Error fetching JSON:', error))
```

---

## 4. HTML, CSS, and Responsive Layout

### Semantic HTML5

Use `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, and `<figure>` for logical structure and screen readers.

### Responsive design

- **Primary:** CSS Grid — `display: grid`, `grid-template-columns: repeat(3, 1fr)`, `minmax()` for dynamic row heights
- **Also used:** Flexbox for column layouts in wireframe templates
- **Foundation:** mentioned briefly (`grid-x`, `cell`) — not confirmed as required; vanilla CSS Grid is sufficient [INFERRED]

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(500px, auto);
}

/* Responsive alternative */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

### Navigation

```html
<nav>
  <ul>
    <li><a href="index.html">Home</a></li>
    <li><a href="timeline.html">Timeline</a></li>
    <li><a href="figures.html">Figures</a></li>
  </ul>
</nav>
```

### Accessibility (from course)

- High color contrast, scalable font sizes, clear keyboard tabbing
- ARIA attributes for complex controls; prefer semantic HTML first
- Automated contrast checkers and browser DevTools mentioned; WAVE/Lighthouse/axe **not found in notebook**

---

## 5. JavaScript and Data

### fetch()

Course uses Promise chaining (`.then()`). Explicit `async/await` not in notebook but acceptable (used in midterm).

```javascript
fetch('data/timeline.json')
  .then((response) => response.json())
  .then((data) => {
    // Process data
  })
  .catch((error) => console.error('Error fetching data:', error))
```

### HTTP vs file://

Browsers block local file fetching (CORS). Files must be served over HTTP.

### VS Code Live Server

- Serves static frontend (HTML, CSS, JS) — typically port **5500**
- Required for `fetch()` to load local JSON/templates

### Express REST API (extension)

- `npm install` then `node server.js` on `http://localhost:3000`
- Serves API endpoints only when using REST approach
- **Live Server + Express together:** Live Server (5500) for frontend, Express (3000) for API data

### JSON local vs REST API

- **Minimum (brief):** fetch local `.json` files via Live Server
- **Extension (bonus):** REST API as in book data example [INFERRED]

---

## 6. Wireframes and Planning

### Project management

Gantt, MoSCoW, user stories: **not found in notebook**. Topic 7 mentions website lifecycle (requirements, prototyping, testing, deployment, maintenance) without depth.

**Required by brief:** reference project planning techniques in Phase 1 — document your approach even if not detailed in notebook.

### Wireframes (from course)

- Clean, black-and-white grid layouts
- Separate versions for desktop and mobile
- Focus on layout, not styling

### User feedback

**Not found in notebook.** Brief requires evidence of presenting designs to others and iterations based on feedback.

---

## 7. Testing and Validation

### HTML validation

- **W3C Markup Validation Service:** https://validator.w3.org/

### Accessibility

- Contrast checkers and browser DevTools (from course)
- Lighthouse (Chrome DevTools) — standard industry tool, not in notebook
- Before/after report format: **not in notebook** — capture screenshots before fixes, after fixes, and describe changes in report Section E

---

## 8. Security (from Midterm — notebook gap)

Not covered in notebook. From CM1040 midterm notes:

- Use `textContent` (not `innerHTML`) when injecting untrusted API data to prevent XSS
- Template engines use `innerHTML` for rendered templates — acceptable for structured templates with validated JSON
- HTTPS encrypts data in transit
- CORS controls cross-origin access
- Never hard-code API keys in client-side JavaScript

---

## 9. Technical Decisions Summary

| Decision            | Recommendation                            |
| ------------------- | ----------------------------------------- |
| Template engine     | `SimpleTemplateEngine` (custom)           |
| Data source (MVP)   | Local JSON via `fetch('data/...')`        |
| Data source (bonus) | Express REST API on port 3000             |
| CSS                 | Vanilla CSS Grid (no framework required)  |
| Server              | Live Server (port 5500) for MVP           |
| Validation          | `Array.isArray()` + required field checks |

---

## 10. Glossary

- **REST:** Architectural style with endpoints (e.g. `/api/books`) serving data over HTTP
- **JSON:** Lightweight text format with objects and arrays (Douglas Crockford)
- **Template Engine:** Separates HTML structure from data and logic
- **Semantic HTML:** Elements (`<main>`, `<nav>`) that describe meaning to browsers and assistive tech
- **Accessibility:** Designing for users with varying abilities
- **DOM:** Tree structure the browser builds from HTML

---

## 11. Pitfalls and Common Mistakes

- Using `<table>` for layout instead of CSS Grid
- Querying REST API without running `npm install` and `node server.js`
- Opening files via `file://` instead of Live Server
- Using `==` instead of `===`
- Neglecting color contrast and semantic structure
- Midterm = presentation only; final = fully coded, validated, interactive website [INFERRED]

---

## 12. Gap Analysis

Still missing from notebook — use brief, midterm, or external sources:

1. **Project management** — user stories, MoSCoW, Gantt for Phase 1
2. **User testing** — template for wireframe feedback documentation (Phase 2)
3. **Testing tools** — exact accessibility tool names and before/after report format (Phase 4)
4. **Security** — covered above via midterm notes
5. **Report structure** — covered above via assessment brief

---

## 13. Implementation Checklist

### Phase 1 — Research + Planning (20%)

- [ ] Choose country and lifetime period
- [ ] Research key events (ISPs, academic networks, public WiFi, etc.)
- [ ] Create fact sheet and page-by-page content plan
- [ ] Gather images/media with source citations
- [ ] Document project management approach

### Phase 2 — Wireframes (20%)

- [ ] Wireframes for all 3+ pages (desktop + mobile)
- [ ] Present to others and record feedback
- [ ] Iterate designs based on feedback

### Phase 3 — Build (40%)

- [ ] Set up project structure
- [ ] Build semantic HTML shells for all pages
- [ ] Apply responsive CSS Grid styling
- [ ] Implement `SimpleTemplateEngine`
- [ ] Create JSON data files
- [ ] Fetch JSON, validate, render via template engine
- [ ] Serve via Live Server

### Phase 4 — Testing (10%)

- [ ] Run W3C HTML validation — capture before report
- [ ] Run accessibility checks — capture before report
- [ ] Fix issues
- [ ] Capture after reports

### Phase 5 — Submit (10%)

- [ ] Write PDF report (≤1,500 words), sections A–F
- [ ] ZIP website code (standard zip format)
- [ ] Submit to Coursera

---

## 14. Suggested 3-Page Structure

### Page 1: Home / Overview

- **Static HTML:** Header, intro, footer, navigation
- **JSON dynamic:** Key milestones list via template engine

### Page 2: Timeline

- **Static HTML:** Page layout, CSS Grid timeline aesthetic
- **JSON dynamic:** Historical events (`year`, `title`, `description`, `imageUrl`) — use `{{#each events}}`

### Page 3: Important Figures / Innovations

- **Static HTML:** Layout structure
- **JSON dynamic:** Gallery/list of people and technologies, validated before render

---

## Sources

- NotebookLM extraction (pass 1 and pass 2)
- `CM1040 CW 2 _V5.pdf` — assessment brief
- `web-development/midterm/NOTES.md` — security and fetch patterns
