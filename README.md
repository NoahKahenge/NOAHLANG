# NoahLang for VS Code

Syntax highlighting, snippets, and language support for **NoahLang** — a small, indentation-based teaching language.

> **Interpreter:** v2.0.7 · **Extension:** 0.1.0

## Features

- Syntax highlighting for `.noah` files
- Snippets for common statements
- Variable declarations with `let`
- Variable reassignment with `set`
- Output with `write`
- Function definitions and calls
- `if` / `else` conditionals
- Arithmetic, comparison operators, strings, booleans, and `null`

> Hover documentation, live diagnostics, formatting, pipelines, loops, indexing, pattern-matching function clauses, and string interpolation are not documented as implemented features here because they are not supported by the interpreter source currently provided.

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Language guide](#language-guide)
  - [Comments](#comments)
  - [Variables](#variables)
  - [Values](#values)
  - [Operators](#operators)
  - [Conditionals](#conditionals)
  - [Functions](#functions)
  - [Built-in functions](#built-in-functions)
- [Examples](#examples)
- [CLI](#cli)
- [Error format](#error-format)
- [Cheat sheet](#cheat-sheet)
- [VS Code extension development](#-vs-code-extension-development)
- [Contributing](#contributing)
- [License](#license)

---

## Install

### Run the interpreter

Make sure [Node.js](https://nodejs.org/) is installed. Save the interpreter as `noah.js`, then run a NoahLang file:

```bash
node noah.js hello.noah
```

If the `noah` command has been installed and configured on your system, you can run:

```bash
noah hello.noah
```

### Install the VS Code extension from source

From the extension repository:

```bash
git clone https://github.com/NoahKahenge/noahlang-vscode
cd noahlang-vscode
npm install
```

Package and install the extension using the scripts configured in your repository. For example, if `vsce` and a `package` script are configured:

```bash
npm run package
code --install-extension noahlang-0.1.0.vsix
```

The repository URL, script names, and generated VSIX filename should be checked against the actual project before running these commands.

---

## Quick start

Create a file named `hello.noah`:

```noah
let name = "world"
write "Hello, " + name
```

Run it:

```bash
node noah.js hello.noah
```

Expected output:

```text
Hello, world
```

---

## Language guide

NoahLang uses indentation to group statements inside functions and conditionals. Blocks begin with a colon (`:`), and their statements must be indented. Tabs are treated as four spaces by the interpreter.

### Comments

Use `//` for single-line comments. Comments can also appear after a statement.

```noah
// This is a comment
let x = 10 // This is a trailing comment
write x
```

### Variables

| Form | Meaning |
|---|---|
| `let name = expression` | Declare or assign a variable in the current environment. |
| `set name = expression` | Reassign an existing variable. The name must already exist in the current environment. |

Example:

```noah
let age = 42
set age = age + 1
write age
```

Output:

```text
43
```

Using `set` before declaring a variable with `let` produces an error:

```noah
set score = 100
```

### Values

| Type | Examples |
|---|---|
| Number | `42`, `3.14`, `-7` |
| String | `"hello"`, `'hi'`, `"line\nbreak"` |
| Boolean | `true`, `false` |
| Null | `null` |
| Array-like value | `collect(1, 2, 3)` |

`collect(...)` currently returns a JavaScript array from the interpreter's built-in function. Array indexing and array-specific helper functions are not implemented in the provided interpreter.

### Operators

| Operators | Meaning |
|---|---|
| `(...)` | Grouping expressions |
| Unary `-`, `+` | Negative or positive numeric value |
| `*`, `/`, `%` | Multiplication, division, remainder |
| `+`, `-` | Addition or subtraction; `+` concatenates when either operand is a string |
| `==`, `!=` | Strict equality and inequality |
| `<`, `>`, `<=`, `>=` | Comparisons |

Division by zero raises a NoahLang error. Arithmetic operations convert operands to numbers where needed.

### Conditionals

Use `if` and `else` with an indented block:

```noah
let score = 72

if score >= 50:
    write "Pass"
else:
    write "Try again"
```

The condition is evaluated using JavaScript truthiness. Comparisons such as `score >= 50` return a Boolean.

The currently provided interpreter supports `if` and `else`. Chained `else if` and conditional expressions have not been implemented in this version.

### Functions

Define functions using `define name(parameters):` followed by an indented body.

```noah
define greet(name):
    write "Hello, " + name

greet("Noah")
```

Output:

```text
Hello, Noah
```

Functions can accept parameters and use `return` to return a value:

```noah
define add(a, b):
    return a + b

let result = add(5, 7)
write result
```

Output:

```text
12
```

A function that reaches the end without an explicit `return` returns `null`.

The current interpreter does not support the brace-based function syntax (`define greet() { ... }`) or the multi-clause pattern-matching syntax shown in some proposed NoahLang examples.

### Built-in functions

| Function | Current behavior |
|---|---|
| `write(...)` | The expression-level built-in prints its arguments separated by spaces. The `write expression` statement also prints a value. |
| `collect(a, b, ...)` | Returns the supplied arguments as an array. |
| `receive()` | Returns the next value supplied through the interpreter's `input` option, if one exists. Otherwise, it raises an error because interactive input is not enabled in this build. |

For example, `collect(1, 2, 3)` returns an array, but array indexing and functions such as `len`, `append`, and `remove` are not currently implemented.

---

## Examples

### Variable reassignment

```noah
let x = 5
set x = x + 1
write x
```

Output:

```text
6
```

### Conditional and reassignment

```noah
let x = 5

if x >= 5:
    set x = x - 1

write x
```

Output:

```text
4
```

### Function with a return value

```noah
define square(n):
    return n * n

write square(7)
```

Output:

```text
49
```

### String concatenation

```noah
let name = "Noah"
write "Hello, " + name
```

Output:

```text
Hello, Noah
```

---

## CLI

```text
noah <file.noah>    Run a NoahLang program
noah --version      Display the interpreter version
noah -v             Display the interpreter version
```

If you run the interpreter directly with Node.js:

```bash
node noah.js --version
node noah.js hello.noah
```

The current interpreter prints `NoahLang 1.1.0` for the version command. It does not currently implement `--help`, interactive terminal input, or piped input for `receive()`.

### Exit codes

- `0`: successful execution or successful version display
- `1`: missing filename, missing file, or a language/runtime error

---

## Error format

Errors are printed to the terminal in this form:

```text
NoahLang error: Line 3: undefined variable 'score'
```

The interpreter reports the line number and error description. Column numbers and source-line caret diagnostics are not currently implemented.

---

## Cheat sheet

| Task | Syntax |
|---|---|
| Comment | `// note` |
| Declare a variable | `let x = 5` |
| Reassign a variable | `set x = 6` |
| Print a value | `write x` |
| Concatenate strings | `write "Hello, " + name` |
| Define a function | `define greet(name):` |
| Call a function | `greet("Noah")` |
| Return a value | `return value` |
| Conditional | `if condition:` |
| Alternative branch | `else:` |
| Create an array-like value | `collect(1, 2, 3)` |

---

## VS Code extension development

This repository is intended to provide NoahLang language support in Visual Studio Code. The exact extension features depend on the files and contributions configured in the repository's `package.json`.

Common VS Code extension project files include:

- `package.json` — extension metadata and contributed features
- `syntaxes/noahlang.tmLanguage.json` — TextMate syntax grammar
- `snippets/noahlang.json` — editor snippets
- `language-configuration.json` — comments, brackets, and indentation settings
- `examples/` — sample `.noah` programs

Open the repository in VS Code and press **F5** to launch an Extension Development Host if the project has a debug configuration set up.

To package the extension, ensure the VS Code Extension Manager (`vsce`) and a packaging script are configured. Do not assume a particular script or output filename until you verify the repository's `package.json`.

---

## Contributing

Issues and pull requests are welcome.

1. Create a branch for your change.
2. Keep documentation examples consistent with the interpreter's implemented syntax.
3. Add or update `.noah` examples when introducing language features.
4. Test examples using the interpreter before documenting them as supported.

---

## License

MIT © Noah Kahenge

If the repository uses a different license, update this section to match the project's `LICENSE` file.
