# Optional data server

**The website does not need this.** Serve the project folder over HTTP with
anything at all, Live Server included, and all five pages work: they read their
content from the JSON files in `data/`.

What the server adds is the one capability a static site cannot have. It
accepts a new memory from the form on the Memories page and stores it, so the
wall grows.

## Running it

```bash
cd server
npm install
npm start
```

The server listens on `http://localhost:3000`. Reload the website and the
indicator at the top of each page changes from "Static JSON files" to "Live
data server on localhost:3000", and the contribution form becomes available.

Stop the server and reload: the site falls back to the static files and says
so. Nothing breaks.

## How the site decides

`js/data-source.js` asks `GET /api/health` once per browsing session, with a
1.2 second timeout, and remembers the answer in `sessionStorage`. A visitor
without the server running therefore waits a fraction of a second on their
first page and nothing at all afterwards. If the server stops mid-session, an
individual request that fails drops back to the static file for that dataset
rather than showing an error.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | What the browser probes. |
| GET | `/api/milestones` | Home page cards. |
| GET | `/api/timeline` | Timeline events. |
| GET | `/api/access` | Chart, source comparison and access eras. |
| GET | `/api/features` | Made in Brazil entries. |
| GET | `/api/memories` | The memory wall. |
| POST | `/api/memories` | Add a memory. Returns 201, or 400 with an `errors` array. |

Reads and writes go to the same files in `data/` that the static site uses, so
a memory added through the API is still there after the server is stopped.

## Validation

`server.js` requires `../js/validate.js`, which is the same file the browser
loads with a script tag. It is a plain script that exports itself when a
CommonJS `module` is present, so there is one set of rules rather than two
copies that can drift apart.

This matters because validating in the browser is not a security control. The
form can be bypassed entirely:

```bash
curl -X POST http://localhost:3000/api/memories \
  -H 'Content-Type: application/json' \
  -d '{"name":"","year":1200,"text":"no"}'
```

The server answers `400` with the three specific reasons, exactly as the page
would have.

Submissions are stored as typed. Escaping happens when the text is rendered,
in the template engine, not when it is stored: storing pre-escaped text would
corrupt the data for anything else that reads the file, and would still not
protect a consumer that forgot to escape.

## Known limitations

Deliberate, given the scope of the coursework:

- **No rate limiting.** A script could fill the wall. A real deployment would
  need a per-address limit and probably moderation.
- **Read-modify-write on a file.** Two submissions arriving in the same
  instant could lose one. A database would use a transaction.
- **No authentication.** Anyone who can reach the port can post.
