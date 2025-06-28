const PostfixPlusPlus = require('./postfix')

describe('PostfixPlusPlus Interpreter', () => {
  let calc

  beforeEach(() => {
    calc = new PostfixPlusPlus()
  })

  test('evaluates simple expression', () => {
    expect(calc.evaluate('3 4 +')).toBe(7)
  })

  test('supports multiple operations', () => {
    expect(calc.evaluate('3 4 5 + *')).toBe(27) // 3 * (4 + 5)
  })

  test('assignment and variable usage', () => {
    calc.evaluate('A 3 =')
    expect(calc.symbolTable['A']).toBe(3)
    expect(calc.evaluate('A 5 +')).toBe(8)
  })

  test('multiple variable assignments', () => {
    calc.evaluate('A 2 =')
    calc.evaluate('B 3 =')
    expect(calc.evaluate('A B *')).toBe(6)
  })

  test('assignment overwrites', () => {
    calc.evaluate('A 2 =')
    calc.evaluate('A 5 =')
    expect(calc.symbolTable['A']).toBe(5)
  })

  test('throws on division by zero', () => {
    expect(() => calc.evaluate('5 0 /')).toThrow('Division by zero.')
  })

  test('throws on undefined variable', () => {
    expect(() => calc.evaluate('Z 3 +')).toThrow()
  })

  test('throws on invalid assignment', () => {
    expect(() => calc.evaluate('3 4 =')).toThrow('Invalid variable name.')
  })

  test('throws on insufficient operands', () => {
    expect(() => calc.evaluate('+')).toThrow('Insufficient operands.')
  })

  test('ignores extra spaces', () => {
    expect(calc.evaluate('  7    8  +  ')).toBe(15)
  })
})
