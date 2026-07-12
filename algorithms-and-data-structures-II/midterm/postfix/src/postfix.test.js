const { PostfixInterpreter, SymbolTable } = require('./postfix')

describe('Postfix arithmetic (examples from the brief)', () => {
  let calc

  beforeEach(() => {
    calc = new PostfixInterpreter()
  })

  test('3 4 + evaluates to 7', () => {
    expect(calc.evaluateLine('3 4 +')).toBe(7)
  })

  test('3 4 5 + * evaluates to 27', () => {
    expect(calc.evaluateLine('3 4 5 + *')).toBe(27)
  })

  test('supports subtraction, respecting operand order', () => {
    expect(calc.evaluateLine('10 3 -')).toBe(7)
  })

  test('division is real (floating point)', () => {
    expect(calc.evaluateLine('7 2 /')).toBe(3.5)
  })

  test('accepts negative and decimal literals', () => {
    expect(calc.evaluateLine('-3 1.5 +')).toBe(-1.5)
  })

  test('a single number returns itself', () => {
    expect(calc.evaluateLine('42')).toBe(42)
  })

  test('an empty line returns null', () => {
    expect(calc.evaluateLine('   ')).toBeNull()
  })
})

describe('Variables and the symbol table', () => {
  let calc

  beforeEach(() => {
    calc = new PostfixInterpreter()
  })

  test('assignment stores the value and returns null', () => {
    expect(calc.evaluateLine('A 3 =')).toBeNull()
    expect(calc.symbolTable.search('A')).toBe(3)
  })

  test('brief session: A 2 =, B 3 =, A B * => 6', () => {
    calc.evaluateLine('A 2 =')
    calc.evaluateLine('B 3 =')
    expect(calc.evaluateLine('A B *')).toBe(6)
  })

  test('a variable can be assigned from another variable', () => {
    calc.evaluateLine('A 9 =')
    calc.evaluateLine('B A =')
    expect(calc.symbolTable.search('B')).toBe(9)
  })

  test('reassignment overwrites the previous value', () => {
    calc.evaluateLine('A 2 =')
    calc.evaluateLine('A 5 =')
    expect(calc.symbolTable.search('A')).toBe(5)
  })

  test('the symbol table persists across lines', () => {
    calc.evaluateLine('A 4 =')
    expect(calc.evaluateLine('A 10 +')).toBe(14)
  })

  test('the stack is reset for every line', () => {
    calc.evaluateLine('1 2 +')
    expect(calc.evaluateLine('5')).toBe(5)
  })
})

describe('Hashing: collisions and linear probing', () => {
  test("'A' and 'N' hash to the same slot but both are stored", () => {
    const table = new SymbolTable()
    expect(table.hash('A')).toBe(table.hash('N')) // 65 % 13 === 78 % 13 === 0
    table.insert('A', 1)
    table.insert('N', 2)
    expect(table.search('A')).toBe(1)
    expect(table.search('N')).toBe(2)
  })

  test('the interpreter computes correctly across a collision', () => {
    const calc = new PostfixInterpreter()
    calc.evaluateLine('A 2 =')
    calc.evaluateLine('N 7 =')
    expect(calc.evaluateLine('A N +')).toBe(9)
  })

  test('SEARCH returns null for a key that was never inserted', () => {
    const table = new SymbolTable()
    expect(table.search('Q')).toBeNull()
  })
})

describe('Error handling', () => {
  let calc

  beforeEach(() => {
    calc = new PostfixInterpreter()
  })

  test('insufficient operands', () => {
    expect(() => calc.evaluateLine('+')).toThrow('insufficient operands')
  })

  test('undefined variable', () => {
    expect(() => calc.evaluateLine('Z 3 +')).toThrow('undefined variable Z')
  })

  test('division by zero', () => {
    expect(() => calc.evaluateLine('5 0 /')).toThrow('division by zero')
  })

  test('invalid token', () => {
    expect(() => calc.evaluateLine('3 4 %')).toThrow('invalid token %')
  })

  test('invalid assignment (target is not a variable)', () => {
    expect(() => calc.evaluateLine('3 4 =')).toThrow('invalid assignment')
  })

  test('hash table overflow when no slot is free', () => {
    const table = new SymbolTable(2)
    table.insert('A', 1) // 65 % 2 = 1
    table.insert('B', 2) // 66 % 2 = 0
    expect(() => table.insert('C', 3)).toThrow('hash table overflow')
  })
})
