# Video narration — word-for-word script

Read the plain text out loud, top to bottom. Text in **[square brackets] is an
action cue — do not read it.** Total speaking time is about 4 min 30 s, leaving
room for the demo to run. Aim for a calm, steady pace.

---

**[Show `src/postfix.js` on screen, scrolled to the top header comment.]**

Hello. In this video I present my Postfix++ calculator for the Algorithms and
Data Structures Two mid-term coursework. Postfix++ is a stack-based language that
evaluates postfix arithmetic expressions, and it also supports variables from A
to Z. The whole solution rests on two data structures — a stack and a hash table
— and five short algorithms, which you can see listed here in the header comment,
each mapped to its pseudocode name.

**[Scroll slowly to the `Stack` class.]**

First, the stack. It is a simple last-in, first-out array. During evaluation,
operands wait on the stack until an operator needs them, so push, pop, and peek
are all constant time.

**[Scroll to the `SymbolTable` class, point at `hash`.]**

Next, the symbol table, which stores the variables. It is a hash table with open
addressing. The hash function uses the division method: the character code of the
variable, modulo the table size, which is thirteen.

**[Point at the `insert` method, then the `(this.hash(key) + i) % this.size` line.]**

Here is insert. It probes linearly from the hashed slot — this line, hash plus i,
modulo size, is the linear probing that resolves collisions. Search, just below,
works the same way, and stops at the first empty slot, because an empty slot
means the variable was never stored.

**[Scroll to `evaluateLine`.]**

And here is the main loop, evaluate-line. It reads the tokens left to right:
numbers and variables are pushed; an operator pops two operands and pushes the
result; and the equals sign pops a value and a name and stores them in the symbol
table. Every function here matches my pseudocode line for line.

**[Switch to the terminal. Type `node src/postfix.js` and run it.]**

Now let me run it. I run node, source, postfix dot js.

**[Point at the arithmetic output.]**

These are the examples from the brief. Three four plus gives seven. And three
four five plus times gives twenty-seven, exactly as the brief shows.

**[Point at the variables block.]**

Here I assign A equals two, B equals three, and then A B times gives six. Notice
the symbol table keeps A and B between lines, while the stack resets on each line.

**[Point at the collision block.]**

This part demonstrates hashing collisions. The letter A is character sixty-five,
and N is seventy-eight. Sixty-five and seventy-eight both give zero modulo
thirteen, so they collide on the same slot. When I store N, insert has to probe
to the next slot, and yet A N plus still correctly gives nine. That is linear
probing working during normal use, not just in theory.

**[Point at the error lines.]**

The calculator also handles errors safely. Division by zero, using an undefined
variable, too few operands, an invalid assignment, and an unknown token are all
caught and reported. A sixth guard, hash table overflow, is covered by a unit
test.

**[Type `npm test` and run it.]**

Finally, the tests.

**[Point at the "22 passed" summary.]**

All twenty-two tests pass. They cover the brief's examples, variable assignment,
real division, the collision and overflow cases, and every error.

**[Look at the camera or hold on the code.]**

In summary, the design uses a stack for evaluation and a hash table with linear
probing for the variables, it runs in linear time per line, and the JavaScript
matches the pseudocode exactly. Thank you for watching.
