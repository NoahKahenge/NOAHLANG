# NoahLang

### A General-Purpose Programming Language Built in Zambia 🇿🇲

**NoahLang is a general-purpose programming language created in Zambia by Noah Kahenge.** It is designed around readable, English-inspired syntax, explicit block structures, and an extensible library system.

Like Python, C++, Java, and Ruby, NoahLang provides programming constructs for developing software, processing data, automating tasks, and solving real-world problems. It includes variables, functions, closures, loops, records, lists, ranges, imports, and error handling.

Its defining syntax convention is simple: **every structured block opens with a keyword and closes with an explicit `end <keyword>` statement.** This makes program structure visible and helps developers understand where instructions begin and end.

NoahLang is not limited to web development. Its first standard library, **Forge**, enables developers to generate HTML pages and serve them over HTTP. The language itself remains domain-neutral: its capabilities can be extended through libraries without requiring every new application domain to become part of the language core.

```noah
write "Hello, world!"
```

A simple program. A readable language. A foundation for building more.

---

## Table of Contents

- [Why NoahLang?](#why-noahlang)
- [What Makes NoahLang Different?](#what-makes-noahlang-different)
- [What You Can Build](#what-you-can-build)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Syntax Guidelines](#syntax-guidelines)
- [Language Reference](#language-reference)
- [Built-in Functions](#built-in-functions)
- [Forge: The Web Library](#forge-the-web-library)
- [Command-Line Interface](#command-line-interface)
- [Complete Examples](#complete-examples)
- [How NoahLang Executes Programs](#how-noahlang-executes-programs)
- [Current Capabilities and Limitations](#current-capabilities-and-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Why NoahLang?

Programming languages offer different ways to express computational ideas. NoahLang explores an approach that prioritises readability, explicit structure, and extensibility.

Its goal is to make programs easier to follow without restricting developers to a single type of application.

### What makes NoahLang different?

**1. English-inspired syntax**

NoahLang uses readable keywords such as `define`, `if`, `for`, `while`, `repeat`, `attempt`, and `recover`. These words communicate the purpose of the code and make program flow easier to follow.

**2. Explicit block endings**

Structured blocks close with `end` followed by the corresponding keyword.

```noah
if age >= 18
    write "Adult"
else
    write "Minor"
end if
```

The closing `end if` clearly identifies the end of the conditional.

**3. General-purpose programming**

NoahLang supports variables, functions, closures, lists, records, loops, and error handling. These building blocks allow developers to create programs that perform different tasks.

**4. An extensible library system**

The `pull` keyword loads reusable `.noah` files. The language can therefore be extended with libraries that provide functionality for specific application domains.

**5. A growing ecosystem**

Forge is the first standard library. Future libraries could introduce additional capabilities for data processing, networking, desktop interfaces, mobile interfaces, and other domains.

### Why learn NoahLang?

- Explore a different approach to programming language design.
- Learn programming through explicit, readable syntax.
- Practise fundamental programming concepts.
- Build command-line programs and generate web pages.
- Experiment with creating and extending programming libraries.
- Explore a programming language developed independently in Zambia.

NoahLang is not intended to replace every existing language. It provides another approach that developers can learn, evaluate, and use where its capabilities are appropriate.

---

## What You Can Build

### 1. Command-line tools

Write programs that process text, work with files, collect user input, and perform calculations.

```noah
write "What is your name?"
let name = receive()

write "Welcome, {name}!"
```

### 2. Data-processing programs

Use variables, loops, lists, records, and functions to process information.

```noah
let numbers = [10, 20, 30, 40]
let total = 0

for number in numbers
    set total = total + number
end for

write "Total: {total}"
```

### 3. Websites and web applications

Use Forge to generate HTML and serve pages.

```noah
pull "Forge.noah"

page("My Website")
head1("Welcome")
para("This page was generated using NoahLang.")
done()

serve(3000)
```

### 4. Desktop and mobile application experiments

Generated HTML can be used as a starting point for experiments involving desktop or mobile application containers. However, NoahLang v2.0.7 does not include dedicated native desktop or mobile development libraries in the specification documented here.

### 5. Future application domains

The language's existing programming constructs provide a foundation for developing libraries for additional domains. Dedicated game development, networking, IoT, and other specialised libraries remain future possibilities rather than established standard-library features.

**The language is general-purpose; the available libraries determine which specialised capabilities are immediately accessible.**

---

# Installation

## Requirements

NoahLang requires:

- Node.js 16 or later.
- npm, which is distributed with Node.js.
- A terminal or command prompt.

## Install using npm

Run:

```bash
npm install -g noahlang
```

Verify the installation:

```bash
noah --version
```

Expected output:

```text
NoahLang 2.0.7
```

You can also display the available commands:

```bash
noah --help
```

### What gets installed?

The installer provides:

- The `noah` command, available from your terminal.
- Forge, installed at `~/.noahlang/lib/Forge.noah`.
- A default stylesheet at `~/.noahlang/lib/style.css`.

The exact filesystem location depends on your operating system and home directory.

## Install on macOS or Linux

If Node.js is already installed, the installation script can be used:

```bash
curl -fsSL https://raw.githubusercontent.com/NoahKahenge/NOAHLANG/main/install/install.sh | bash
```

## Install on Windows

Open PowerShell and run:

```powershell
iwr -useb https://raw.githubusercontent.com/NoahKahenge/NOAHLANG/main/install/install.ps1 | iex
```

The installer checks for Node.js, installs it if necessary, and then installs NoahLang.

**Security note:** Before executing an installation script downloaded from the internet, inspect its contents and verify that it comes from the official repository.

### Official repository

[NoahLang on GitHub](https://github.com/NoahKahenge/NOAHLANG)

---

# Quick Start

## Your first NoahLang program

Create a file called `hello.noah`.

```noah
write "Hello, world!"
```

Run it:

```bash
noah hello.noah
```

Output:

```text
Hello, world!
```

You have now written and executed a NoahLang program.

## Your first website

Create a file called `site.noah`.

```noah
pull "Forge.noah"

page("My First Website")
head1("Welcome to NoahLang")
para("I built this page using a NoahLang program.")
done()

serve(3000)
```

Run the program:

```bash
noah site.noah
```

Open your browser at:

```text
http://localhost:3000/
```

Your program generates an HTML page and starts an HTTP server.

## Enable watch mode

For development, run:

```bash
noah --watch site.noah
```

Watch mode reruns the program when the main `.noah` file or a file it imports changes. When the program uses `serve()`, the browser can reload automatically.

Stop the process with `Ctrl+C`.

---

# Syntax Guidelines

This section describes the core conventions for writing NoahLang programs.

## 1. File extension

NoahLang source files use the `.noah` extension.

Examples:

```text
hello.noah
calculator.noah
data_processor.noah
site.noah
```

Run a source file using:

```bash
noah hello.noah
```

## 2. Comments

Use `//` to write comments.

```noah
// This is a comment.

write "Hello, world!" // This is a trailing comment.
```

Comments are intended to explain code and are not executed as program instructions.

## 3. Variables

Use `let` to declare a new variable.

```noah
let name = "Noah"
let age = 25
let active = true
```

Use `set` to change the value of an existing variable.

```noah
let score = 50

set score = 75

write score
```

Output:

```text
75
```

### Variable rules

- `let` declares a variable in the current scope.
- Declaring the same variable name twice in the same scope is an error.
- `set` reassigns an existing variable.
- Reassignment searches enclosing scopes.
- Reassigning an undeclared variable is an error.

## 4. Naming variables and functions

Use descriptive names that communicate the purpose of a variable or function.

```noah
let studentName = "Alice"
let totalMarks = 450
let passingScore = 50

define calculateAverage(totalMarks, subjects)
    return totalMarks / subjects
end define
```

The examples use camelCase for multiword identifiers. Follow a consistent naming style throughout your projects.

## 5. Indentation and block structure

Indent the statements inside a block to make the program easier to read.

```noah
if temperature > 90
    write "Temperature is high."

    if temperature > 100
        write "Warning: overheating."
    end if
end if
```

Indentation communicates the intended structure to readers. NoahLang uses explicit closing statements to mark block boundaries.

## 6. Closing blocks

Every structured block must use the appropriate closing keyword.

| Opening statement | Closing statement |
|---|---|
| `if condition` | `end if` |
| `for item in items` | `end for` |
| `while condition` | `end while` |
| `repeat 3 times` | `end repeat` |
| `define greet()` | `end define` |
| `record person` | `end record` |
| `attempt` | `end attempt` |

For example:

```noah
define greet(name)
    write "Hello, {name}!"
end define

greet("Noah")
```

A closing keyword should match the block being closed.

## 7. Strings

Strings can use double or single quotation marks.

```noah
let first = "Hello"
let second = 'World'

write first
write second
```

Use double quotes or single quotes consistently according to your project's conventions.

### String interpolation

Insert expressions into a string using `{...}`.

```noah
let name = "Noah"
let age = 25

write "My name is {name}."
write "Next year I will be {age + 1}."
```

Output:

```text
My name is Noah.
Next year I will be 26.
```

To represent literal braces, escape them:

```noah
write "Literal braces: \{name\}"
```

### Supported escape sequences

| Sequence | Meaning |
|---|---|
| `\n` | New line |
| `\r` | Carriage return |
| `\t` | Tab |
| `\b` | Backspace |
| `\f` | Form feed |
| `\v` | Vertical tab |
| `\0` | Null character |
| `\\` | Backslash |
| `\"` | Double quotation mark |
| `\'` | Single quotation mark |
| `\uXXXX` | Unicode escape |

## 8. Values and data types

NoahLang supports the following value categories.

| Type | Examples | Description |
|---|---|---|
| Number | `42`, `3.14`, `-7` | Numeric values |
| String | `"hello"`, `'world'` | Text |
| Boolean | `true`, `false` | Logical values |
| Null | `null` | Absence of a value |
| List | `[1, 2, 3]` | Ordered collection |
| Record | `record person ... end record` | Named fields |
| Range | `0..10` | Numeric sequence used in `for` loops |

### Booleans

```noah
let isActive = true
let hasAccess = false

write isActive
write hasAccess
```

### Null

```noah
let result = null

write result
```

Use `null` to represent the absence of a value where appropriate.

## 9. Operators

The following table shows operator precedence from highest to lowest.

| Level | Operators | Purpose |
|---|---|---|
| 1 | `( )`, `[ ]`, field access | Grouping, indexing, and field access |
| 2 | Unary `-`, unary `+` | Numeric sign |
| 3 | `*`, `/`, `%` | Multiplication, division, remainder |
| 4 | `+`, `-` | Addition, string concatenation, subtraction |
| 5 | `==`, `!=`, `<`, `>`, `<=`, `>=` | Comparisons |
| 6 | `and`, `or`, `not` | Logical operations |
| 7 | `then` | Function pipeline |

### Arithmetic

```noah
let a = 10
let b = 3

write a + b
write a - b
write a * b
write a / b
write a % b
```

Division by zero produces an error.

### String concatenation

The `+` operator concatenates values when either operand is a string.

```noah
let firstName = "Noah"
let lastName = "Kahenge"

write firstName + " " + lastName
```

For mixed values, use `str()` when you want explicit string conversion.

```noah
let age = 25

write "Age: " + str(age)
```

### Comparison operators

```noah
write 10 == 10
write 10 != 5
write 10 > 5
write 5 < 10
write 10 >= 10
write 5 <= 10
```

Equality is strict.

### Logical operators

```noah
let age = 25
let hasID = true

if age >= 18 and hasID
    write "Requirements satisfied."
end if
```

The logical operators use short-circuit evaluation.

### The `then` operator

The `then` operator provides a function pipeline.

```noah
value then function
```

This means that the value is passed to the function.

For example, where `double` is defined:

```noah
define double(n)
    return n * 2
end define

write 5 then double
```

Output:

```text
10
```

## 10. Lists

Lists hold ordered collections of values.

```noah
let names = ["Alice", "Bob", "Charlie"]

write names[0]
write names[1]
write len(names)
```

Output:

```text
Alice
Bob
Charlie
3
```

List indexing starts at zero.

Lists can contain different supported value types, including other lists and records.

```noah
let values = [10, "hello", true, null]
let matrix = [[1, 2], [3, 4]]
```

### Working with lists

```noah
let numbers = [10, 20, 30]

let updated = append(numbers, 40)
let shortened = remove(updated, 1)

write len(numbers)
write len(updated)
write len(shortened)
```

`append()` and `remove()` return new lists according to their documented behaviour.

## 11. Records

Records group related values under named fields.

```noah
record person
    name: "Noah"
    age: 25
    city: "Lusaka"
end record
```

Access fields using dot notation:

```noah
write person.name
write person.age
```

You can also use bracket notation:

```noah
write person["city"]
```

Records can contain lists and other records.

```noah
record person
    name: "Alice"
    hobbies: ["reading", "coding"]
end record

write person.name
write person.hobbies[0]
```

## 12. Ranges

Ranges use the `..` operator.

```noah
0..5
```

The ending value is exclusive, so `0..5` represents the values `0`, `1`, `2`, `3`, and `4`.

Ranges are used in `for` loops.

```noah
for i in 0..5
    write i
end for
```

Output:

```text
0
1
2
3
4
```

## 13. Conditional statements

Use `if` to execute statements when a condition is true.

```noah
let score = 85

if score >= 90
    write "Excellent"
else if score >= 70
    write "Good"
else
    write "Keep practising"
end if
```

A conditional can contain:

- An `if` branch.
- Optional `else if` branches.
- An optional `else` branch.
- A matching `end if`.

## 14. Loops

NoahLang supports `for`, `while`, and `repeat` loops.

### The `for` loop

Use `for` to iterate over a list, string, or range.

```noah
for name in ["Alice", "Bob", "Charlie"]
    write name
end for
```

Iterate over a range:

```noah
for i in 0..5
    write i
end for
```

Use `at` to access the current index when iterating over a list:

```noah
for letter at i in ["a", "b", "c"]
    write "{i}: {letter}"
end for
```

### The `while` loop

A `while` loop repeats as long as its condition remains true.

```noah
let count = 0

while count < 5
    write count
    set count = count + 1
end while
```

Ensure that the loop's condition eventually becomes false when you do not intend an infinite loop.

### The `repeat` loop

Use `repeat` for a fixed number of iterations.

```noah
repeat 3 times
    write "Hello"
end repeat
```

You can also bind an iteration variable:

```noah
repeat 3 times as i
    write i
end repeat
```

### Loop control

Use `break` to exit the current loop and `continue` to skip to the next iteration.

```noah
for number in [1, 2, 3, 4, 5]
    if number == 3
        continue
    end if

    if number == 5
        break
    end if

    write number
end for
```

## 15. Functions

Declare functions using `define`.

```noah
define greet(name)
    write "Hello, {name}!"
end define

greet("Noah")
```

### Returning values

The last expression in a function body is its return value. Use `return` when you want to return explicitly or exit a function early.

```noah
define square(n)
    return n * n
end define

write square(7)
```

Output:

```text
49
```

### Functions with multiple arguments

```noah
define add(a, b)
    return a + b
end define

write add(10, 20)
```

### First-class functions and closures

Functions are first-class values and use lexical scoping. A function can therefore be treated as a value, and a function defined inside another function can close over the environment in which it was defined.

```noah
define makeGreeting(greeting)
    define greet(name)
        return greeting + ", " + name
    end define

    return greet
end define

let sayHello = makeGreeting("Hello")

write sayHello("Noah")
```

This illustrates the intended closure pattern; verify it against the exact runtime behaviour of the installed interpreter.

### Multiple function clauses

NoahLang examples support multiple definitions with different parameter patterns.

```noah
define fact(0)
    return 1
end define

define fact(n)
    return n * fact(n - 1)
end define

write fact(5)
```

Output:

```text
120
```

This style allows a base case and a recursive case to be expressed separately.

## 16. Error handling

Use `attempt` and `recover with` to handle errors.

```noah
attempt
    let data = readFromFile("data.txt")
    write data
recover with err
    write "An error occurred: {err}"
end attempt
```

The `attempt` block contains the statements to execute. If an error occurs, the `recover with` branch provides the error value.

### Throwing errors

Use `fail with` to raise an error.

```noah
define divide(a, b)
    if b == 0
        fail with "Cannot divide by zero."
    end if

    return a / b
end define
```

Handle the error:

```noah
attempt
    write divide(10, 0)
recover with err
    write "Caught error: {err}"
end attempt
```

Error handling helps programs respond to failures without leaving every error unhandled.

## 17. Named blocks

NoahLang supports named blocks using `start` and a matching `end <name>` statement.

```noah
start section("services")
    head2("Our Services")
    para("We build software solutions.")
end section
```

The general form is:

```noah
start functionName(arguments)
    // Statements inside the block.
end functionName
```

The `start` statement calls the named function, executes the block body, and uses the matching closer function to finish the block.

Each `end <name>` must match the most recent corresponding `start <name>`.

Named blocks are particularly useful with Forge layout functions.

## 18. Imports

Use `pull` to load another NoahLang source file.

```noah
pull "Forge.noah"
pull "lib/math.noah"
```

### Import resolution

According to the NoahLang v2.0.7 specification:

- Paths are relative to the file containing the `pull` statement.
- If a file cannot be found locally, the loader searches `~/.noahlang/` and `~/.noahlang/lib/`.
- Each file is loaded once.
- Circular imports produce an error.

### Recommended practice

Keep reusable functionality in separate files.

For example:

```text
my-project/
├── main.noah
└── lib/
    └── math.noah
```

In `main.noah`:

```noah
pull "lib/math.noah"
```

The imported file must exist and contain valid NoahLang source code.

---

# Language Reference

This section summarises the core syntax in one place.

| Construct | General form | Closing statement |
|---|---|---|
| Variable declaration | `let name = value` | None |
| Variable reassignment | `set name = value` | None |
| Conditional | `if condition` | `end if` |
| Function | `define name(args)` | `end define` |
| Record | `record name` | `end record` |
| For loop | `for item in collection` | `end for` |
| While loop | `while condition` | `end while` |
| Repeat loop | `repeat n times` | `end repeat` |
| Error handling | `attempt` | `end attempt` |
| Import | `pull "file.noah"` | None |
| Output | `write value` | None |
| Error | `fail with "message"` | None |
| Named block | `start name(args)` | `end name` |

### Example combining core constructs

```noah
define calculateTotal(items)
    let total = 0

    for item in items
        set total = total + item
    end for

    return total
end define

let values = [10, 20, 30]
let total = calculateTotal(values)

if total >= 50
    write "Total: {total}"
else
    write "The total is below 50."
end if
```

---

# Built-in Functions

The following built-ins are documented for NoahLang v2.0.7.

| Function | Description |
|---|---|
| `write(...)` | Print values to the terminal |
| `print(...)` | Alternative output function |
| `len(x)` | Return the length of a string, list, or record |
| `str(x)` | Convert a value to a string |
| `num(x)` | Convert a value to a number |
| `bool(x)` | Convert a value to a boolean |
| `append(list, value)` | Return a list with an additional value |
| `remove(list, index)` | Return a list with the specified index removed |
| `keys(record)` | Return the keys of a record |
| `has(record, key)` | Check whether a record contains a key |
| `receive()` | Read one line from standard input |
| `collect(...)` | Build a list |
| `fail with "message"` | Raise an error |
| `writeToFile(path, content)` | Write content to a file |
| `readFromFile(path)` | Read content from a file |
| `openInBrowser(path)` | Open a file or URL in a browser |

### Example

```noah
let name = "Noah"
let values = [10, 20, 30]

write "Name: {name}"
write "Length: {len(values)}"

let updated = append(values, 40)

write updated
write has(recordExample, "name")
```

The last statement assumes that `recordExample` has been declared earlier. Define every variable before using it.

---

# Forge: The Web Library

Forge is NoahLang's first standard library for generating and serving web pages.

Load it with:

```noah
pull "Forge.noah"
```

Forge provides functions for page creation, content generation, layout, navigation, events, and serving files.

## 1. Page structure

| Function | Purpose |
|---|---|
| `page(title)` | Start a new page |
| `done()` | Write the generated `index.html` and return the HTML |

Example:

```noah
pull "Forge.noah"

page("My Website")
head1("Welcome")
para("This page was created with NoahLang.")
done()
```

## 2. Content functions

| Function | Generated HTML |
|---|---|
| `head1(text)` | `<h1>` |
| `head2(text)` | `<h2>` |
| `head3(text)` | `<h3>` |
| `para(text)` | `<p>` |
| `line(text)` | `<span>` |
| `code(text)` | `<pre><code>` |
| `link(url, label)` | `<a href>` |
| `button(label, eventId)` | `<button>` |
| `img(src, alt)` | `<img>` |
| `raw(html)` | Insert raw HTML |

### Example

```noah
pull "Forge.noah"

page("About NoahLang")
head1("About")
para("NoahLang is a general-purpose programming language.")
link("https://github.com/NoahKahenge/NOAHLANG", "View the repository")
done()
```

Use `raw(html)` carefully because raw HTML bypasses normal escaping and may introduce security risks if untrusted input is inserted.

## 3. Layout functions

| Function | Purpose |
|---|---|
| `section(name)` | Create a section |
| `container()` | Create a container |
| `navStart(brand)` | Start navigation |
| `navItem(url, label)` | Add a navigation item |
| `navEnd()` | Close navigation |
| `hero(title, subtitle, ctaLabel, ctaUrl)` | Create a hero section |
| `cardsStart()` | Start a card grid |
| `card(title, body)` | Add a card |
| `cardsEnd()` | Close the card grid |
| `columnsStart()` | Start a two-column layout |
| `columnStart()` | Start a column |
| `columnEnd()` | Close a column |
| `columnsEnd()` | Close the column layout |
| `bulletsStart()` | Start a bullet list |
| `bullet(text)` | Add a bullet |
| `bulletsEnd()` | Close the bullet list |
| `footer(brand, year)` | Create a footer |

### Example: card layout

```noah
pull "Forge.noah"

page("Services")

start section("services")
    start container()
        head2("Our Services")

        start cardsStart()
            card("Web Development", "We build websites.")
            card("Data Processing", "We organise information.")
            card("Training", "We help teams learn.")
        end cardsStart
    end container
end section

done()
```

The matching `end` statements close the named blocks.

## 4. Serving a website

Use `serve(port)` to start an HTTP server.

```noah
pull "Forge.noah"

page("My Website")
head1("Hello from NoahLang")
para("The server is running.")
done()

serve(3000)
```

Open:

```text
http://localhost:3000/
```

The server serves files from the current directory according to the documented behaviour.

## 5. Events

Forge supports event handlers for buttons.

```noah
pull "Forge.noah"

let count = 0

define onIncrement()
    set count = count + 1
    rebuild()
end define

define rebuild()
    page("Counter")
    head1("Counter")
    para("Current value: {count}")
    button("Increment", "inc")
    bindEvent("inc", onIncrement)
    done()
end define

rebuild()
serve(3000)
```

The documented event mechanism works as follows:

1. `button(label, eventId)` creates a button associated with an event identifier.
2. `bindEvent(eventId, fn)` registers the handler.
3. Clicking the button requests the event endpoint.
4. The server executes the handler and reloads the page.

**Implementation note:** Verify event behaviour, state persistence, and security against the current Forge implementation before relying on it for production applications.

## 6. CSS styling

Place a `style.css` file beside the `.noah` file.

```text
my-website/
├── site.noah
└── style.css
```

Forge's `done()` function links the stylesheet automatically:

```html
<link rel="stylesheet" href="style.css">
```

Example stylesheet:

```css
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 2rem;
}

h1 {
    margin-bottom: 1rem;
}

.container {
    max-width: 1100px;
    margin: 0 auto;
}
```

The HTML structure is generated by NoahLang; CSS controls the presentation.

---

# Command-Line Interface

NoahLang provides a command-line interface for executing source files and managing development sessions.

| Command | Purpose |
|---|---|
| `noah <file.noah>` | Execute a NoahLang program |
| `noah --watch <file.noah>` | Execute and rerun when watched files change |
| `noah --version` | Display the installed version |
| `noah --help` | Display command help |

### Watch mode example

```bash
noah --watch site.noah
```

Example terminal messages:

```text
[watch] site.noah changed — reloading
[serve] listening at http://localhost:3000/
```

The exact output depends on the running version and application.

---

# Complete Examples

## Example 1: Hello World

```noah
write "Hello, world!"
```

## Example 2: A calculator

```noah
define add(a, b)
    return a + b
end define

define subtract(a, b)
    return a - b
end define

define multiply(a, b)
    return a * b
end define

write add(10, 5)
write subtract(10, 5)
write multiply(10, 5)
```

## Example 3: Factorial

```noah
define fact(0)
    return 1
end define

define fact(n)
    return n * fact(n - 1)
end define

write fact(5)
```

Output:

```text
120
```

## Example 4: Processing a list

```noah
define total(items)
    let sum = 0

    for item in items
        set sum = sum + item
    end for

    return sum
end define

write total([1, 2, 3, 4, 5])
```

Output:

```text
15
```

## Example 5: Reading input

```noah
write "What is your name?"

let name = receive()

write "Hello, {name}!"
```

## Example 6: A person's record

```noah
record person
    name: "Noah"
    age: 25
    hobbies: ["reading", "coding"]
end record

write person.name
write person.age

for hobby in person.hobbies
    write "- {hobby}"
end for
```

## Example 7: Reading a file

```noah
attempt
    let content = readFromFile("data.txt")
    write content
recover with err
    write "Could not read the file: {err}"
end attempt
```

## Example 8: A complete website

```noah
pull "Forge.noah"

page("EasyInfo Innovations")

start navStart("EasyInfo Innovations")
    navItem("#services", "Services")
    navItem("#about", "About")
    navItem("#contact", "Contact")
end navStart

hero(
    "Software that works for you",
    "We build practical digital solutions.",
    "Get in touch",
    "#contact"
)

start section("services")
    start container()
        head2("Our Services")

        start cardsStart()
            card("Web Development", "Websites and dashboards.")
            card("Data Solutions", "Tools for collecting and processing data.")
            card("Training", "Practical software training.")
        end cardsStart
    end container
end section

start section("about")
    head2("About Us")
    para("We develop software to solve everyday problems.")
end section

footer("EasyInfo Innovations", 2026)

done()
serve(3000)
```

---

# How NoahLang Executes Programs

NoahLang executes `.noah` programs through a Node.js-based runtime.

A typical execution follows this sequence:

1. **Load the source:** The runtime reads the `.noah` file.
2. **Parse the program:** The interpreter processes the source according to NoahLang's syntax.
3. **Execute instructions:** Statements run in sequence, including function calls, loops, and conditionals.
4. **Load libraries:** Any `pull` statements load the required source files.
5. **Perform the program's tasks:** Depending on the code and loaded libraries, the program may process data, read files, print output, or generate HTML.
6. **Serve output when requested:** If the program calls Forge's `serve()`, the HTTP server starts according to the library's implementation.

For example:

```noah
pull "Forge.noah"

page("Example")
head1("Generated by NoahLang")
para("This HTML comes from a NoahLang program.")
done()

serve(3000)
```

In this example, NoahLang executes the program, Forge generates the HTML, and the server makes the generated page available over HTTP.

The browser interprets the resulting HTML and CSS; it does not execute the `.noah` source file.

This makes the current Forge workflow closer to a server-side page generator or template engine than to a browser-side framework such as React or Vue.

---

# What NoahLang Is and Isn't

## What it is

- A general-purpose programming language.
- A language with its own syntax and interpreter.
- A language supporting variables, functions, closures, loops, lists, records, and error handling.
- A language with explicit block-closing statements.
- A language that can load reusable `.noah` libraries.
- A language with Forge as its first standard library.

## What it isn't

- A browser runtime that executes `.noah` files directly.
- A replacement for Node.js; Node.js provides the runtime environment used by NoahLang.
- A web-only language.
- A language with a fully developed standard library for every possible application domain.
- A language that currently provides dedicated native desktop and mobile libraries, based on the capabilities described in this documentation.

## What it can grow into

NoahLang's library model provides a foundation for expanding into additional areas.

Potential directions include:

- Data processing and analysis.
- Networking and HTTP clients.
- Desktop user interfaces.
- Mobile user interfaces.
- Game development.
- IoT applications.
- Additional developer tools and system utilities.

These are potential extensions, not claims that all these libraries are already available.

---

# Roadmap

The following roadmap describes planned development directions. Features should be considered planned until they are implemented and released.

| Version | Planned work |
|---|---|
| **v2.1** | Additional built-ins, string and list methods, `map`, `filter`, `reduce`, JSON parsing and serialisation, and an HTTP client |
| **v2.2** | Expanded module system, named imports, namespacing, and private functions |
| **v2.3** | Packaging, distribution improvements, and additional examples |
| **v3.0** | Desktop application integration through Electron or a dedicated desktop library |
| **v3.1** | Mobile application integration through React Native or a dedicated mobile library |
| **v4.0** | A transpiler that converts `.noah` source into JavaScript |

The roadmap may change as development progresses and implementation priorities evolve.

---

# Contributing

Contributions, issues, suggestions, and pull requests are welcome.

If you want to contribute to NoahLang:

1. Explore the existing source code and documentation.
2. Create a branch for your change.
3. Keep examples consistent with the interpreter's actual syntax.
4. Add or update tests when modifying language behaviour.
5. Run the relevant examples before documenting a feature as supported.
6. Explain significant changes in your pull request.

### Areas for contribution

- Interpreter improvements.
- Syntax and parser development.
- Standard-library functionality.
- Forge enhancements.
- Documentation and examples.
- Testing and bug reporting.
- Developer tooling.
- New libraries and integrations.

### Reporting issues

When reporting a problem, include:

- The NoahLang version.
- The operating system.
- The smallest source example that reproduces the problem.
- The command used to run the program.
- The actual output or error.
- The expected behaviour.

This information makes problems easier to reproduce and resolve.

---

# License

MIT License

Copyright © Noah Kahenge.

See the [`LICENSE`](LICENSE) file for the complete licence terms.

---

# Project Information

| Property | Details |
|---|---|
| Language | NoahLang |
| Current documented version | 2.0.7 |
| Creator | Noah Kahenge |
| Origin | Zambia |
| Runtime | Node.js |
| Source extension | `.noah` |
| First standard library | Forge |
| Repository | [NoahLang on GitHub](https://github.com/NoahKahenge/NOAHLANG) |

---

## Welcome to NoahLang

NoahLang is an ongoing effort to develop a readable, extensible, general-purpose programming language.

Whether you are learning to program, exploring language design, building command-line tools, or generating websites with Forge, you are invited to explore the language and contribute to its growth.

**Built in Zambia. Designed to express ideas. Created to grow.**
