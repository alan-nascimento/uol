# Postfix++ Calculator

Mid-term coursework for **CM2035 – Algorithms and Data Structures II**
(University of London).

An interpreter for **Postfix++**, a small stack-based language that evaluates
postfix arithmetic expressions with single-letter variables (`A`–`Z`).

```
> 3 4 5 + *
27
> A 2 =
> B 3 =
> A B *
6
```

## How it works

Each line is read left to right in a single pass:

- operands are pushed onto an **evaluation stack**;
- an operator (`+ - * /`) pops the two most recent operands, combines them, and
  pushes the result;
- the assignment operator `=` pops a value and a variable name and stores the
  binding in a **symbol table**;
- the result is whatever sits on top of the stack at the end of the line.

The evaluation stack is reset for every line (each line is a self-contained
expression); the symbol table persists for the whole session so variables keep
their values.

## Data structures

- **Stack** — LIFO array; `push`/`pop`/`peek` are O(1). Ideal for postfix, where
  only the most recent operands are ever needed.
- **Symbol table** — a hash table with **open addressing** and **linear
  probing**, giving average O(1) `insert`/`search`. The table is deliberately
  small (`m = 13`, prime) to reflect the memory-constrained target hardware, so
  collisions (e.g. `A` and `N` both hash to slot 0) really occur and are resolved
  by probing. See [`SUBMISSION.md`](./SUBMISSION.md) for the full justification.

## Algorithms

| Pseudocode        | JavaScript                          |
| ----------------- | ----------------------------------- |
| `HASH`            | `SymbolTable.hash`                  |
| `HASH-INSERT`     | `SymbolTable.insert`                |
| `HASH-SEARCH`     | `SymbolTable.search`                |
| `RESOLVE-OPERAND` | `PostfixInterpreter.resolveOperand` |
| `APPLY-OPERATOR`  | `PostfixInterpreter.applyOperator`  |
| `EVALUATE-LINE`   | `PostfixInterpreter.evaluateLine`   |

The pseudocode (Cormen et al., Chapter 2 conventions) and the matching
complexity analysis are in [`SUBMISSION.md`](./SUBMISSION.md).

## Usage

Requires Node.js (tested on v22+).

```bash
npm install        # first time only, installs Jest
node src/postfix.js  # run the interactive demo
npm test           # run the test suite (22 tests)
```

Errors handled: insufficient operands, undefined variable, division by zero,
invalid token, invalid assignment, hash table overflow.

## Project structure

```
midterm/
├── src/
│   ├── postfix.js       # interpreter (Stack, SymbolTable, PostfixInterpreter)
│   └── postfix.test.js  # Jest test suite
├── SUBMISSION.md        # coursework answers (essence, pseudocode, data structures, JS)
├── video-script.md      # recording plan for the demo video
├── content.md           # coursework brief summary
├── README.md
└── package.json
```
