# Postfix++ Calculator — Mid-term Coursework Submission (CM2035 ADS2)

Each numbered section below maps to one Coursera text box. Paste the text of a
section straight into its matching box. Pseudocode is plain, indented text (not
an image). The JavaScript in Section 5 is identical to `src/postfix.js`.

---

## 1. The essence of the solution [10 marks]

Postfix++ is a stack-based language: reading a line from left to right, every
operand is pushed onto a stack, and every operator pops the operands it needs,
combines them, and pushes the result back. The answer is always whatever sits on
top of the stack at the end of the line. My interpreter is built directly around
this observation, so a whole line is evaluated in a **single left-to-right pass**
using one auxiliary stack.

The "++" adds named variables (A–Z). Storing and retrieving those values is a
lookup problem, so I back the variable store with a **hash table** (the "symbol
table" from the brief) that offers average O(1) `INSERT` and `SEARCH`. The
assignment operator `=` simply pops a value and a variable name and calls
`HASH-INSERT`; whenever a variable is used as an operand, `HASH-SEARCH` resolves
it to its value.

The design therefore rests on exactly two data structures and five short
algorithms:

- `HASH`, `HASH-INSERT`, `HASH-SEARCH` — the symbol table.
- `RESOLVE-OPERAND`, `APPLY-OPERATOR`, `EVALUATE-LINE` — the interpreter loop.

Evaluation is linear in the number of tokens on a line, O(n), and each variable
operation is O(1) on average. The evaluation stack is reset for every line
(each line is a self-contained expression), while the symbol table persists for
the whole session so variables keep their values between lines — matching the
interactive session shown in the brief. Because the target hardware has very
limited memory, the symbol table is deliberately small and resolves the
resulting collisions with **linear probing**.

---

## 2. Non-technical explanation [10 marks]

**Working out the sums (the stack).** Imagine a spike you can slide index cards
onto — you can only add to or take from the top. Reading the expression left to
right, every number is written on a card and slid onto the spike. When you meet
an operation such as "+", you lift off the top two cards, do the sum, and slide a
new card with the answer back on. When the line ends, the answer is the card on
top. This "only touch the top" pile is why the calculator never has to look back
or rewrite anything — it just keeps working forwards.

**Remembering variables (the hash table).** Now imagine a small wall of numbered
pigeonholes for remembering values such as "A is 2". To decide which hole holds
"A", we run its letter through a fixed rule that always gives the same hole
number — so we can later find it again instantly, without searching every hole.
Sometimes the rule sends two different letters to the *same* hole (a
"collision"). The rule for that is simple and human: if your hole is taken, walk
to the next hole along, and keep walking until you find a free one. Looking a
value up works the same way: go to the hole the rule picks, and if it holds a
different letter, step along until you find yours (or an empty hole, meaning it
was never stored). Because the wall is small (limited memory), collisions really
do happen — for example "A" and "N" are sent to the same starting hole — and the
"walk to the next one" rule is what keeps everything working.

---

## 3. Pseudocode [20 marks]

Conventions follow Cormen et al., Chapter 2: indentation shows block structure;
`=` is assignment and `==` is a test; `//` marks comments; `NIL` is the empty
value; `error "msg"` reports a failure; procedure names are in capitals. The
symbol table `T` has `m` slots `T[0 . . m-1]`; each slot is `NIL` or a pair
`(key, value)`. Standard stack operators `PUSH`, `POP`, `TOP`, `STACK-EMPTY`
(Cormen §10.1) are used as-is.

### 3.1 HASH — map a variable name to a slot index

```
HASH(key, m)
1   return CHAR-CODE(key) mod m        // division method
```

### 3.2 HASH-INSERT — store a binding, resolving collisions by linear probing

```
HASH-INSERT(T, key, value)
 1   i = 0
 2   while i < m
 3       j = (HASH(key, m) + i) mod m
 4       if T[j] == NIL                 // free slot: store new binding
 5           T[j] = (key, value)
 6           T.count = T.count + 1
 7           return j
 8       if T[j].key == key             // key already present: overwrite
 9           T[j].value = value
10           return j
11       i = i + 1                      // slot taken by another key: probe on
12   error "hash table overflow"        // probed every slot, none is free
```

### 3.3 HASH-SEARCH — look up a value, resolving collisions by linear probing

```
HASH-SEARCH(T, key)
1   i = 0
2   while i < m
3       j = (HASH(key, m) + i) mod m
4       if T[j] == NIL                  // empty slot: key was never inserted
5           return NIL
6       if T[j].key == key
7           return T[j].value
8       i = i + 1
9   return NIL
```

### 3.4 RESOLVE-OPERAND — turn a token into a number

```
RESOLVE-OPERAND(token)
 1   if token is a numeric value        // already-computed result on the stack
 2       return token
 3   if IS-VARIABLE(token)              // a name A-Z
 4       value = HASH-SEARCH(T, token)
 5       if value == NIL
 6           error "undefined variable"
 7       return value
 8   if IS-NUMBER(token)                // a numeric literal
 9       return TO-NUMBER(token)
10   error "invalid operand"
```

### 3.5 APPLY-OPERATOR — combine two operands

```
APPLY-OPERATOR(op, a, b)
1   if op == "+"
2       return a + b
3   if op == "-"
4       return a - b
5   if op == "*"
6       return a * b
7   if b == 0                          // op is "/"
8       error "division by zero"
9   return a / b
```

### 3.6 EVALUATE-LINE — evaluate one line of Postfix++

```
EVALUATE-LINE(line)
 1   S = empty stack                    // reset for every line
 2   tokens = TOKENIZE(line)            // split on whitespace
 3   if tokens is empty
 4       return NIL
 5   for each token in tokens           // left to right
 6       if IS-NUMBER(token) or IS-VARIABLE(token)
 7           PUSH(S, token)
 8       elseif IS-OPERATOR(token)
 9           if S.size < 2
10               error "insufficient operands"
11           b = RESOLVE-OPERAND(POP(S))
12           a = RESOLVE-OPERAND(POP(S))
13           PUSH(S, APPLY-OPERATOR(token, a, b))
14       elseif token == "="
15           if S.size < 2
16               error "insufficient operands"
17           value = RESOLVE-OPERAND(POP(S))
18           name = POP(S)
19           if not IS-VARIABLE(name)
20               error "invalid assignment"
21           HASH-INSERT(T, name, value)
22       else
23           error "invalid token"
24   if STACK-EMPTY(S)
25       return NIL
26   return RESOLVE-OPERAND(TOP(S))     // result is the top of the stack
```

### 3.7 Complexity (Topic 1) and iterative vs. recursive (Topic 2)

Under the RAM model each primitive step is constant time. Let `n` be the number
of tokens on a line and `m` the table size.

| Algorithm | Best / Average | Worst | Space |
|---|---|---|---|
| `HASH` | Θ(1) | Θ(1) | Θ(1) |
| `HASH-INSERT` / `HASH-SEARCH` | O(1) | O(m) | Θ(1) |
| `RESOLVE-OPERAND` | O(1) | O(m) | Θ(1) |
| `APPLY-OPERATOR` | Θ(1) | Θ(1) | Θ(1) |
| `EVALUATE-LINE` | Θ(n) | O(n·m) | O(n) |

The average O(1) for the table assumes simple uniform hashing and a bounded load
factor α = count/m; the worst case O(m) happens only if probing crosses many
occupied slots. `EVALUATE-LINE` makes one pass over the tokens (Θ(n)); the O(n·m)
worst case bundles in the rare long probes for each variable token.

The loops here are naturally **iterative** because a stack already holds the
pending work explicitly — that is exactly the structure a recursive version would
otherwise push onto the call stack. The probing loops in `HASH-INSERT` and
`HASH-SEARCH` are tail-recursive in shape (`probe(i)` calls `probe(i+1)`), so they
could be rewritten recursively with an identical O(m) bound; I kept them
iterative to avoid the extra call-stack memory, which matters on the
memory-constrained target device.

---

## 4. Data structures and justification [20 marks]

**1. Stack (evaluation stack).** A last-in-first-out array. Postfix evaluation is
the textbook use of a stack: operands wait on the stack until an operator
consumes the two most recent ones, which is precisely LIFO order. Only the top is
ever read or written, so `PUSH`, `POP` and `TOP` are all O(1), and the whole line
is evaluated in one linear pass with no backtracking. Its maximum depth is bounded
by the number of operands on the line, giving O(n) space. A queue or a plain list
would force searching or shifting to reach the right operands; the stack gives the
correct element in O(1) with no extra bookkeeping.

**2. Hash table (symbol table).** A fixed-size array with **open addressing** and
**linear probing**, mapping a variable name (key) to its value. This is the
symbol-table structure the brief asks for, supporting `INSERT` and `SEARCH` in
O(1) on average — far better than the O(n) scan a plain list would need on every
variable reference. It is chosen over alternatives for concrete reasons:

- *Hash table vs. sorted array / balanced tree:* those give O(log n) lookup and
  need ordering the keys do not require; hashing gives average O(1).
- *Open addressing (linear probing) vs. separate chaining:* chaining needs a
  linked list per slot, i.e. extra pointers and heap allocations. On a device
  with **very limited memory** open addressing stores everything in one flat
  array with no per-node overhead, and linear probing has excellent cache
  locality because it scans neighbouring slots.

*Hash function.* Keys are single characters, so `HASH` uses the division method
on the character's code, `code mod m`. A small **prime** table size (`m = 13`) is
used deliberately: it spreads the codes well and, being smaller than the 26-letter
namespace, guarantees that collisions occur during ordinary use (for example `A`
and `N` both hash to slot 0), which is exactly what linear probing is there to
resolve. Because the table is intentionally small to fit the limited memory, it
holds up to `m` distinct variables at once; requesting more than that is reported
as `hash table overflow`, a genuine, testable condition rather than a theoretical
one. `DELETE` is not required by this calculator, so I omit it; this keeps
`HASH-SEARCH` simple, since a `NIL` slot can always be treated as "not present".

**Underlying arrays.** Both structures are built on plain arrays — contiguous,
constant-time indexed memory — which is why every core operation reaches its O(1)
target and why the footprint stays predictable on constrained hardware.

---

## 5. JavaScript implementation [20 marks]

The functions below match the pseudocode in Section 3 one-to-one. They are the
core of `src/postfix.js` (which additionally contains a `Stack.toString` helper
for printing and an interactive demo block). Do not paste as an image — this is
plain JavaScript text.

```javascript
const TABLE_SIZE = 13
const OPERATORS = ['+', '-', '*', '/']

// Stack: LIFO collection backed by a dynamic array (all operations O(1)).
class Stack {
  constructor() {
    this.items = []
  }
  push(value) {
    this.items.push(value)
  }
  pop() {
    return this.items.pop()
  }
  peek() {
    return this.items[this.items.length - 1]
  }
  isEmpty() {
    return this.items.length === 0
  }
  size() {
    return this.items.length
  }
}

// SymbolTable: open-addressing hash table with linear probing.
class SymbolTable {
  constructor(size = TABLE_SIZE) {
    this.size = size
    this.slots = new Array(size).fill(null) // each slot: null or { key, value }
    this.count = 0
  }

  // HASH(key, m): division method on the character code.
  hash(key) {
    return key.charCodeAt(0) % this.size
  }

  // HASH-INSERT(key, value): probe linearly; overwrite if present.
  insert(key, value) {
    let i = 0
    while (i < this.size) {
      const j = (this.hash(key) + i) % this.size
      if (this.slots[j] === null) {
        this.slots[j] = { key, value }
        this.count += 1
        return j
      }
      if (this.slots[j].key === key) {
        this.slots[j].value = value
        return j
      }
      i += 1
    }
    throw new Error('hash table overflow')
  }

  // HASH-SEARCH(key): probe linearly; null (NIL) means not present.
  search(key) {
    let i = 0
    while (i < this.size) {
      const j = (this.hash(key) + i) % this.size
      if (this.slots[j] === null) {
        return null
      }
      if (this.slots[j].key === key) {
        return this.slots[j].value
      }
      i += 1
    }
    return null
  }
}

class PostfixInterpreter {
  constructor() {
    this.symbolTable = new SymbolTable()
  }

  isNumber(token) {
    return /^-?\d+(\.\d+)?$/.test(token)
  }
  isVariable(token) {
    return /^[A-Z]$/.test(token)
  }
  isOperator(token) {
    return OPERATORS.includes(token)
  }

  // RESOLVE-OPERAND(token): literal -> number, variable -> looked-up value.
  resolveOperand(token) {
    if (typeof token === 'number') {
      return token
    }
    if (this.isVariable(token)) {
      const value = this.symbolTable.search(token)
      if (value === null) {
        throw new Error(`undefined variable ${token}`)
      }
      return value
    }
    if (this.isNumber(token)) {
      return Number(token)
    }
    throw new Error(`invalid operand ${token}`)
  }

  // APPLY-OPERATOR(op, a, b): real arithmetic; divide-by-zero is an error.
  applyOperator(op, a, b) {
    if (op === '+') return a + b
    if (op === '-') return a - b
    if (op === '*') return a * b
    if (b === 0) {
      throw new Error('division by zero')
    }
    return a / b
  }

  // EVALUATE-LINE(line): single left-to-right pass over the tokens.
  evaluateLine(line) {
    const stack = new Stack()
    const trimmed = line.trim()
    if (trimmed === '') {
      return null
    }
    const tokens = trimmed.split(/\s+/)

    for (const token of tokens) {
      if (this.isNumber(token) || this.isVariable(token)) {
        stack.push(token)
        continue
      }
      if (this.isOperator(token)) {
        if (stack.size() < 2) {
          throw new Error('insufficient operands')
        }
        const b = this.resolveOperand(stack.pop())
        const a = this.resolveOperand(stack.pop())
        stack.push(this.applyOperator(token, a, b))
        continue
      }
      if (token === '=') {
        if (stack.size() < 2) {
          throw new Error('insufficient operands')
        }
        const value = this.resolveOperand(stack.pop())
        const name = stack.pop()
        if (!this.isVariable(name)) {
          throw new Error('invalid assignment')
        }
        this.symbolTable.insert(name, value)
        continue
      }
      throw new Error(`invalid token ${token}`)
    }

    if (stack.isEmpty()) {
      return null
    }
    return this.resolveOperand(stack.peek())
  }
}

module.exports = { PostfixInterpreter, SymbolTable, Stack, TABLE_SIZE }
```

---

## 6. Video demonstration [10 marks]

See `video-script.md` for the recording plan (≤ 5 minutes, ≥ 720p, commented
source visible on screen). Run the live demo with `node src/postfix.js` and the
test suite with `npm test`.

---

## 7. Defects and suggested remedies [10 marks]

The solution meets the brief, but it has real shortcomings. The most important
ones, with remedies, are below.

**1. The table cannot hold the whole namespace.** The symbol table has `m = 13`
slots, but the language allows 26 names (A–Z). Assigning more than 13 distinct
variables raises `hash table overflow`, so a valid program can fail. This was a
deliberate trade-off to make collisions and probing occur in normal use, but it
limits capacity. *Remedy:* keep the small table but add **dynamic resizing** —
when the load factor `α = count / m` exceeds, say, 0.7, allocate a larger prime
table and **rehash** every binding into it. This preserves average O(1)
operations while removing the fixed ceiling. Since the key set is in fact the
known finite range A–Z, an alternative is **direct addressing / perfect hashing**
(`m = 26`, index `= code − 65`), which guarantees no collisions and holds all 26
variables — at the cost of never exercising the probing logic.

**2. No `DELETE`, and the current design cannot support it safely.** `HASH-SEARCH`
stops at the first `NIL` slot, which is only correct because nothing is ever
removed. Adding a naive delete (setting a slot back to `NIL`) would break probe
chains: a key stored after a collision could become unreachable. *Remedy:*
introduce a distinct **`DELETED` tombstone** marker — `SEARCH` treats it as
"keep probing" while `INSERT` may reuse it — and rehash periodically to clear
accumulated tombstones.

**3. Linear probing suffers primary clustering.** Because probes step to the very
next slot, occupied cells coalesce into long runs, so lookups degrade toward
O(m) as the table fills. *Remedy:* switch collision resolution to **double
hashing** (or quadratic probing), which spreads the probe sequence and keeps runs
short, at the cost of slightly worse cache locality.

**4. Malformed lines with leftover operands are silently accepted.** A line such
as `1 2 3` or `3 4 5 +` leaves more than one value on the stack, and
`EVALUATE-LINE` returns only the top, silently discarding the rest instead of
flagging a likely typo. *Remedy:* after the token loop, if `S.size > 1`, raise
`malformed expression: leftover operands`. This is a one-line check and turns a
silent bug into a clear error.

**5. Floating-point precision.** Arithmetic uses IEEE-754 doubles, so
`0.1 0.2 +` yields `0.30000000000000004`. *Remedy:* round results to a fixed
number of decimals for display, or use an arbitrary-precision decimal/rational
type if exactness is required; either way, document the numeric model.

**6. A narrow, rigid token set.** Only uppercase single letters are variables and
only `+ - * /` are supported, so `a`, `AB`, or `%` are rejected as invalid
tokens, and there is no unary minus (negating a variable needs `0 A -`).
*Remedy:* widen `IS-VARIABLE` to multi-character names and, crucially, replace the
single-character hash with a **polynomial (Horner) string hash**; that both
generalises the language and makes the hash function genuinely non-trivial.
Adding unary operators and more binary operators is a localised extension to
`APPLY-OPERATOR` and the token classifier.
