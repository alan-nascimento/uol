/**
 * PostfixPlusPlus - A simple interpreter for evaluating Postfix++ expressions.
 * Supports basic arithmetic and variable assignment for variables 'A' to 'Z'.
 */
class PostfixPlusPlus {
  constructor() {
    // The stack used to evaluate expressions
    this.stack = []
    // Symbol table maps variable names to their values (e.g. { A: 5, B: 2 })
    this.symbolTable = {}
  }

  /**
   * Helper method to resolve an operand.
   * If it's a variable name, returns its value (throws if undefined).
   * If it's a number, returns the number itself.
   */
  resolveOperand(operand) {
    if (typeof operand === 'string') {
      if (!(operand in this.symbolTable)) {
        throw new Error(`Variable ${operand} is not defined.`)
      }
      return this.symbolTable[operand]
    }
    return operand
  }

  /**
   * Evaluates a single line of Postfix++ expression.
   * Supports numbers, operators (+, -, *, /), variable assignment (=), and variable usage (A-Z).
   * Throws errors for invalid expressions or operations.
   */
  evaluate(line) {
    // Reset the stack for each evaluation
    this.stack = []
    // Split input by whitespace into tokens
    const tokens = line.trim().split(/\s+/)

    // Process each token in sequence
    for (const token of tokens) {
      // If token is a number, push it to the stack
      if (!isNaN(token)) {
        this.stack.push(Number(token))
        continue
      }

      // If token is an arithmetic operator
      if (['+', '-', '*', '/'].includes(token)) {
        // Ensure there are enough operands on the stack
        if (this.stack.length < 2) {
          throw new Error('Insufficient operands.')
        }
        // Pop two operands (b is on top, then a)
        let b = this.resolveOperand(this.stack.pop())
        let a = this.resolveOperand(this.stack.pop())

        // Evaluate the operation
        let res
        switch (token) {
          case '+':
            res = a + b
            break
          case '-':
            res = a - b
            break
          case '*':
            res = a * b
            break
          case '/':
            if (b === 0) throw new Error('Division by zero.')
            res = a / b
            break
        }
        // Push the result back onto the stack
        this.stack.push(res)
        continue
      }

      // If token is the assignment operator (=)
      if (token === '=') {
        // Pop value and variable name from the stack
        const value = this.stack.pop()
        const varName = this.stack.pop()

        // Variable name must be a single uppercase letter
        if (typeof varName !== 'string' || !/^[A-Z]$/.test(varName)) {
          throw new Error('Invalid variable name.')
        }

        // If value is a variable, resolve its value
        this.symbolTable[varName] =
          typeof value === 'string' ? this.resolveOperand(value) : value
        continue
      }

      // If token is a variable name (A-Z), push the name as a string to the stack
      if (/^[A-Z]$/.test(token)) {
        this.stack.push(token)
        continue
      }

      // If token didn't match any case, it's invalid
      throw new Error(`Unknown token: ${token}`)
    }

    // Return the result at the top of the stack (if any)
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : undefined
  }

  /**
   * Prints the current state of the stack and symbol table.
   * Useful for debugging and demonstration.
   */
  printState() {
    if (this.stack.length) {
      // Print stack (top of stack is leftmost)
      console.log(`Stack: [${this.stack.slice().reverse().join(', ')}]`)
    } else {
      console.log('Stack: []')
    }
    if (Object.keys(this.symbolTable).length) {
      // Print symbol table in JSON format
      console.log('Symbol Table:', JSON.stringify(this.symbolTable))
    } else {
      console.log('Symbol Table: {}')
    }
    console.log('--------------------------')
  }
}

module.exports = PostfixPlusPlus

// Example usage (runs only if called directly from command line, not on require)
if (require.main === module) {
  const calc = new PostfixPlusPlus()

  console.log('> 3 4 +')
  calc.evaluate('3 4 +')
  calc.printState()

  console.log('> A 2 =')
  calc.evaluate('A 2 =')
  calc.printState()

  console.log('> B 3 =')
  calc.evaluate('B 3 =')
  calc.printState()

  console.log('> A B *')
  calc.evaluate('A B *')
  calc.printState()

  console.log('> 3 4 5 + *')
  calc.evaluate('3 4 5 + *')
  calc.printState()

  console.log('> Z 5 =')
  calc.evaluate('Z 5 =')
  calc.printState()

  console.log('> Z 10 +')
  calc.evaluate('Z 10 +')
  calc.printState()
}
