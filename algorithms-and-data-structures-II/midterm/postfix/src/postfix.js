/**
 * Postfix++ interpreter.
 *
 * Postfix++ is a stack-based language for evaluating postfix arithmetic
 * expressions with single-letter variables (A-Z). This file implements the
 * three original algorithms designed for the coursework. Each JavaScript
 * function is written to match, line for line, the Cormen-style pseudocode:
 *
 *   HASH            -> SymbolTable.hash
 *   HASH-INSERT     -> SymbolTable.insert
 *   HASH-SEARCH     -> SymbolTable.search
 *   RESOLVE-OPERAND -> PostfixInterpreter.resolveOperand
 *   APPLY-OPERATOR  -> PostfixInterpreter.applyOperator
 *   EVALUATE-LINE   -> PostfixInterpreter.evaluateLine
 */

// Size of the symbol-table array. Small (a prime, < 26) on purpose: the target
// hardware has very limited memory, so collisions are expected and must be
// resolved by linear probing.
const TABLE_SIZE = 13

// The four supported binary operators.
const OPERATORS = ['+', '-', '*', '/']

/**
 * Stack
 * -----
 * A last-in-first-out collection backed by a dynamic array. Postfix evaluation
 * only ever touches the top element, so push/pop/peek are all O(1).
 */
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

  // Renders the stack as [top ... bottom], as notated in the brief
  // (the stack top is the leftmost token).
  toString() {
    return `[${this.items.slice().reverse().join(' ')}]`
  }
}

/**
 * SymbolTable
 * -----------
 * An open-addressing hash table that maps a variable name (key) to its value.
 * Collisions are resolved with LINEAR PROBING. It supports INSERT and SEARCH,
 * matching the generic symbol-table interface described in the brief.
 */
class SymbolTable {
  constructor(size = TABLE_SIZE) {
    this.size = size
    // Each slot is either null (NIL) or an object { key, value }.
    this.slots = new Array(size).fill(null)
    this.count = 0
  }

  /**
   * HASH(key) -> index in [0, size).
   * Division method: fold the key's character code onto the table using mod.
   * O(1) time.
   */
  hash(key) {
    return key.charCodeAt(0) % this.size
  }

  /**
   * HASH-INSERT(key, value).
   * Probes linearly from HASH(key). Updates the value if the key already
   * exists; otherwise stores it in the first NIL slot. If a full cycle finds
   * neither the key nor a free slot, the table is full.
   * O(1) on average, O(size) worst case.
   */
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

  /**
   * HASH-SEARCH(key) -> value or null (NIL).
   * Probes linearly from HASH(key). Stops at the first NIL slot: since no key
   * is ever deleted, a NIL means the key was never inserted.
   * O(1) on average, O(size) worst case.
   */
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

/**
 * PostfixInterpreter
 * ------------------
 * Evaluates Postfix++ one line at a time. The evaluation stack is reset for
 * every line (each line is a self-contained expression), while the symbol
 * table persists across the whole session so variables keep their values.
 */
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

  /**
   * APPLY-OPERATOR(op, a, b) -> a (op) b.
   * Real (floating-point) arithmetic; division by zero is an error.
   */
  applyOperator(op, a, b) {
    if (op === '+') return a + b
    if (op === '-') return a - b
    if (op === '*') return a * b
    if (b === 0) {
      throw new Error('division by zero')
    }
    return a / b
  }

  /**
   * EVALUATE-LINE(line) -> value on top of the stack, or null if empty.
   * Reads tokens left to right: operands are pushed; an operator pops two
   * operands, combines them and pushes the result; '=' pops a value and a
   * variable name and stores the binding in the symbol table.
   * O(n) in the number of tokens.
   */
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

// Interactive demonstration. Runs only when the file is executed directly
// (node src/postfix.js), not when it is required by the test suite.
if (require.main === module) {
  const interpreter = new PostfixInterpreter()

  const run = (line) => {
    try {
      const result = interpreter.evaluateLine(line)
      const shown = result === null ? '' : ` => ${result}`
      console.log(`> ${line}${shown}`)
    } catch (error) {
      console.log(`> ${line} => ERROR: ${error.message}`)
    }
  }

  console.log('=== Postfix arithmetic (brief examples) ===')
  run('3 4 +')
  run('3 4 5 + *')

  console.log('\n=== Variables and the symbol table ===')
  run('A 2 =')
  run('B 3 =')
  run('A B *')

  // 'A' (char code 65) and 'N' (char code 78) both hash to 65 % 13 = 0, so
  // storing N forces a linear probe into the next slot. This proves collision
  // resolution works during normal use.
  console.log('\n=== Collision + linear probing (A and N share a slot) ===')
  run('N 7 =')
  run('A N +')

  console.log('\n=== Error handling ===')
  run('5 0 /')
  run('Z 3 +')
  run('+')
  run('3 4 =')
  run('3 % 4')
}
