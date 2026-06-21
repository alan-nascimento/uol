The Midterm Coursework for ADS2 tasks you with **designing and building an arithmetical calculator** coded in a simple language called ‘Post x++’, which is used for evaluating postfix arithmetical expressions.

To successfully complete this coursework, you will draw upon the knowledge and skills developed in **Topics 1 through 5** of the module.

### **Coursework Deliverables and Requirements**

Your submission must include the following components:

- **The essence of your solution:** A high-level overview of how you tackled the challenge (10 marks).
- **A non-technical explanation:** An explanation of your original algorithms using language that is easy to understand without deep technical knowledge (10 marks).
- **Pseudocode:** You must provide clear, correctly indented pseudocode for each original algorithm. You are heavily urged to follow the specific pseudocode conventions from Cormen et al., Chapter 2 (20 marks).
- **Data Structures:** A list of the data structures used in your solution, along with a justification of why each chosen data structure is suitable for the calculator task (20 marks).
- **JavaScript Implementation:** You must provide the actual code written as JavaScript functions. This code must exactly match the logic of the pseudocode you provided (20 marks).
- **Video Demonstration:** A maximum 5-minute video (at least 720p resolution) showing your code in execution. The commented source code must be visible to facilitate cross-checking with your pseudocode (10 marks).

### **Summary of Related Course Content (Topics 1–5)**

The coursework evaluates your ability to choose appropriate algorithms, calculate time complexity, and implement specific concepts. Here is a summary of the required knowledge from the first five topics:

**1. Analysis of Algorithms**

- **Complexity Analysis:** You need to be able to calculate and express the time and space complexity of your algorithms. This involves understanding the theoretical RAM model, where simple operations take constant time.
- **Asymptotic Notation:** You must be familiar with describing algorithm performance bounds using **Big-O** (upper bound), **Omega** (lower bound), and **Theta** (tight/average bound) notations. You must understand constant, linear, logarithmic, quadratic, and exponential growth functions.

**2. Recursive Algorithms**

- **Recursion Principles:** Understanding how algorithms can call themselves to solve smaller subproblems. You must know how to define a **base case** to terminate the recursion and a **recursive case**.
- **Analysis:** You should be able to trace recursive algorithms step-by-step and calculate their time complexity using recurrence relations and methods like the Master Theorem.
- **Iterative vs. Recursive:** You need the ability to convert iterative algorithms into recursive ones and understand the trade-offs (e.g., recursion often uses more memory).

**3. Comparison Sorting Algorithms**

- **Core Algorithms:** Familiarity with the mechanics, strengths, and weaknesses of bubble sort, insertion sort, selection sort, merge sort, and quicksort.
- **Time Complexity:** Understanding that comparison-based sorts cannot run faster than $O(n \log n)$ in the worst case (like merge sort), while others like bubble or insertion sort can degrade to $O(n^2)$.

**4. Non-Comparison Sorting Algorithms**

- **Core Algorithms:** Understanding counting sort, radix sort, and bucket sort, which can achieve linear time complexities by circumventing direct element comparisons.
- **Constraints:** Recognizing the specific data types and conditions where these excel, such as counting sort's reliance on a known range of integers or bucket sort's reliance on uniform data distribution.

**5. Hashing**

- **Concepts:** Understanding how hash functions transform sequences of characters into fixed-size values (keys) to map data to a hash table. One of the specific learning outcomes for Coursework 1 is to create an algorithm based on the concept of a hash.
- **Collision Resolution:** Because multiple keys can hash to the same index, you must be familiar with collision resolution methods, particularly **linear probing**, chaining, and quadratic probing.
