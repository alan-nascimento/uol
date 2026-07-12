# Video demonstration script — Postfix++ (≤ 5 min, ≥ 720p)

Goal: show the commented source running, so an examiner can cross-check it
against the pseudocode in `SUBMISSION.md`. Keep the editor font large and the
code visible throughout.

Setup before recording:

- Open `src/postfix.js` in the editor (this is what must be on screen).
- Have a terminal ready in the `midterm/` folder.
- Screen recording at 1280×720 or higher; MP4 output.

---

## 0:00–0:30 — Intro and the idea

- "This is a Postfix++ interpreter: a stack-based calculator with A–Z variables."
- On screen: scroll the header comment of `src/postfix.js` that lists the five
  algorithms and how each maps to the pseudocode.
- One sentence: "Operands go on a stack; an operator pops what it needs and
  pushes the result; variables live in a hash table."

## 0:30–1:45 — Walk the commented code (matches the pseudocode)

Scroll slowly and point at each block, naming the matching pseudocode procedure:

- `Stack` — LIFO, all operations O(1).
- `SymbolTable.hash` → `HASH`: "division method, `code mod m`, table size 13."
- `SymbolTable.insert` → `HASH-INSERT`: point at the `while` loop and the
  `(hash + i) % size` line — "this is the linear probing."
- `SymbolTable.search` → `HASH-SEARCH`: "stops at the first empty slot."
- `resolveOperand` / `applyOperator` / `evaluateLine` → the interpreter loop.

## 1:45–2:45 — Run the brief's examples

In the terminal: `node src/postfix.js`

- Point at output `3 4 + => 7` and `3 4 5 + * => 27` — "matches the brief."
- Point at the variables block: `A 2 =`, `B 3 =`, `A B * => 6` — "the symbol
  table keeps A and B between lines; the stack resets each line."

## 2:45–3:45 — Show collisions and linear probing (Topic 5)

- "A is character 65, N is 78, and 65 mod 13 = 78 mod 13 = 0, so they collide."
- Point at the demo output:
  - `N 7 =` then `A N + => 9`.
- "Storing N had to probe to the next slot, and lookup still finds both — that is
  linear probing working during normal use."

## 3:45–4:30 — Error handling

Point at the error lines in the demo output, naming each guard in the code:

- `5 0 / => division by zero`
- `Z 3 + => undefined variable Z`
- `+ => insufficient operands`
- `3 4 = => invalid assignment`
- `3 % 4 => invalid token %`
- Mention the sixth guard, `hash table overflow`, and that it is covered by a
  unit test.

## 4:30–5:00 — Tests and close

- Run `npm test`; show "22 passed".
- "Every algorithm is covered, including the collision and overflow cases, and
  the code matches the pseudocode line for line." Done.

---

## Commands cheat-sheet

```bash
cd algorithms-and-data-structures-II/midterm
npm install      # first time only
node src/postfix.js
npm test
```
