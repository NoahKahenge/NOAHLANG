# NoahLang AI Guide

> **Purpose:** Help AI assistants, coding agents, tutors, and developers
> understand and use NoahLang accurately.
>
> **Official repository:** https://github.com/NoahKahenge/NOAHLANG\
> **Official README:**
> https://github.com/NoahKahenge/NOAHLANG/blob/main/README.md\
> **npm package:** https://www.npmjs.com/package/noahlang\
> **Language files:** `.noah`\
> **Command-line executable:** `noah`

## Instructions for AI assistants

When helping with NoahLang:

1.  Treat NoahLang as its own programming language. Do not silently
    translate requests into Python, JavaScript, or another language.
2.  Use this guide and the official README as the primary references. If
    the repository or installed package is available, inspect its
    current implementation and tests before making claims about
    behaviour.
3.  Do not invent syntax, keywords, built-in functions, libraries, CLI
    flags, or language features. If a feature is not documented or
    verified, say so and suggest how to check it.
4.  Prefer small, complete `.noah` examples. Explain what each example
    does and show how to run it.
5.  Preserve NoahLang's explicit block endings. Match each opener with
    its documented closer, such as `if` / `end if` and `define` /
    `end define`.
6.  Distinguish language features from Forge library features. Forge is
    a library for generating HTML and serving pages; its functions are
    not automatically core language keywords.
7.  When debugging, ask for the NoahLang version, the complete error
    message, the relevant `.noah` file, and the command used to run it.
    Do not assume JavaScript or Python error semantics apply.
8.  Be transparent about uncertainty. Label examples that have not been
    executed as **documentation-based, not runtime-verified**.
9.  Do not claim code has been tested unless it was actually run using
    the relevant NoahLang interpreter/version.
10. For changes to the language or documentation, check that examples
    agree with the current implementation and automated tests.

## What is NoahLang?

NoahLang is a general-purpose programming language created in Zambia by
Noah Kahenge. It emphasizes readable, English-inspired syntax, explicit
block structure, and an extensible library system.

The documented language includes variables, functions, closures, loops,
records, lists, ranges, imports, and error handling. Its first standard
library, Forge, provides tools for generating HTML pages and serving
them over HTTP.

NoahLang is evolving. Capabilities and examples can differ between
releases, so always check the version in use. The README currently
documents version `2.0.7`; confirm this against the installed or
published package before relying on it.

## Installation and first run

Requirements documented by the project: Node.js 16 or later, npm, and a
terminal.

Install globally:

``` bash
npm install -g noahlang
```

Check the installed version and available commands:

``` bash
noah --version
noah --help
```

Create `hello.noah`:

``` noah
write "Hello, world!"
```

Run it:

``` bash
noah hello.noah
```

Expected output:

``` text
Hello, world!
```

The project README also documents watch mode:

``` bash
noah --watch site.noah
```

Check `noah --help` for the exact options supported by the installed
version.

## Core syntax at a glance

The following examples are based on the project's README. Unless
specifically executed against a named interpreter version, treat them as
documentation examples rather than independently verified tests.

### Comments

``` noah
// This is a comment.
write "Hello!" // This is a trailing comment.
```

### Variables and reassignment

Use `let` to declare a variable and `set` to reassign an existing
variable.

``` noah
let name = "Noah"
let score = 50
set score = 75

write name
write score
```

The README says declaring the same variable name twice in the same scope
is an error, and `set` on an undeclared variable is an error.

### Values and collections

Documented value categories include numbers, strings, booleans, `null`,
lists, records, and ranges.

``` noah
let age = 25
let active = true
let result = null
let names = ["Alice", "Bob", "Charlie"]

write names[0]
write len(names)
```

List indexing starts at zero.

### Strings and interpolation

Single- and double-quoted strings are documented. Use `{...}` to
interpolate values or expressions inside a string.

``` noah
let name = "Noah"
let age = 25

write "Hello, {name}!"
write "Next year you will be {age + 1}."
```

### Operators

Documented operators include:

-   Arithmetic: `+`, `-`, `*`, `/`, `%`
-   Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
-   Logical: `and`, `or`, `not`
-   Range: `..`
-   Function pipeline: `then`

The README documents strict equality and short-circuit evaluation for
logical operators. Division by zero produces an error.

``` noah
let a = 10
let b = 3

write a + b
write a % b
write a == 10
```

### Conditionals

Use `if`, optional `else if` branches, optional `else`, and `end if`.

``` noah
let score = 85

if score >= 90
    write "Excellent"
else if score >= 70
    write "Good"
else
    write "Keep practising"
end if
```

### Loops

Documented loop forms are `for`, `while`, and `repeat`.

``` noah
for number in [1, 2, 3]
    write number
end for
```

``` noah
let count = 0

while count < 3
    write count
    set count = count + 1
end while
```

``` noah
repeat 3 times
    write "Hello"
end repeat
```

The README documents `break` and `continue` for loop control. Range end
values are exclusive: `0..5` iterates over `0`, `1`, `2`, `3`, and `4`.

### Functions

Use `define` and close the function with `end define`.

``` noah
define square(n)
    return n * n
end define

write square(7)
```

The README says the last expression in a function body is its return
value, and `return` can be used for explicit returns or early exits.

### Records

``` noah
record person
    name: "Noah"
    age: 25
end record

write person.name
write person["age"]
```

The README documents both dot notation and bracket notation for field
access.

### Error handling

The documented pattern uses `attempt`, `recover with`, and
`end attempt`.

``` noah
attempt
    let value = 10 / 0
    write value
recover with err
    write "An error occurred: {err}"
end attempt
```

Use the actual error-handling behaviour supported by the installed
version. Do not assume that all runtime errors can be recovered in every
context.

### Imports

Use `pull` to load another NoahLang source file.

``` noah
pull "lib/math.noah"
```

The README documents paths relative to the file containing the `pull`
statement, with fallback searches in `~/.noahlang/` and
`~/.noahlang/lib/`. It also documents that each file is loaded once and
circular imports produce an error. Confirm these details against the
version being used.

## Forge: web development library

Forge is a library, not a replacement for the core language. The README
documents it for generating HTML and serving pages.

``` noah
pull "Forge.noah"

page("My First Website")
head1("Welcome to NoahLang")
para("This page was generated using NoahLang.")
done()

serve(3000)
```

Run the file:

``` bash
noah site.noah
```

Then open `http://localhost:3000/` in a browser on the same machine.

The README also documents functions for page headings, paragraphs,
sections, containers, navigation, cards, columns, lists, buttons, event
handlers, and CSS integration. Before generating a larger Forge
application, consult the current Forge section of the official README
and verify function signatures and behaviour.

Do not claim NoahLang has dedicated native mobile or desktop frameworks
unless the current official project confirms that capability. The README
describes those as experiments or future possibilities rather than
established native libraries in the documented version.

## Common mistakes to avoid

-   Using Python syntax such as `def`, `print`, or indentation-only
    block endings instead of NoahLang syntax.
-   Using JavaScript syntax such as `const`, `let` with JavaScript
    semantics, braces for blocks, or semicolons by habit.
-   Forgetting the matching explicit closer: `end if`, `end for`,
    `end while`, `end repeat`, `end define`, `end record`, or
    `end attempt`.
-   Using `set` to create a variable instead of declaring it with `let`
    first.
-   Assuming a library function is built into the language core.
-   Assuming an undocumented feature exists because another language
    supports it.
-   Assuming examples work on every release without checking the
    installed version.
-   Saying code was executed or tested when it was only reasoned about.

## Recommended workflow for AI-generated NoahLang code

1.  **Identify the environment.** Ask which NoahLang version is
    installed and whether Forge or other libraries are involved.
2.  **Consult the source of truth.** Read the official README and, where
    available, the implementation and tests.
3.  **Write a minimal program.** Use `.noah` files and documented
    syntax.
4.  **Run it.** Use `noah filename.noah` in an environment with NoahLang
    installed.
5.  **Check the output and errors.** Do not rely on visual plausibility
    alone.
6.  **Expand incrementally.** Add one feature at a time and rerun the
    program.
7.  **Report verification accurately.** State the exact version and
    whether the example was actually executed.

If execution is unavailable, say so plainly and provide the user with
the commands needed to verify the program locally.

## Reference links

-   Repository: https://github.com/NoahKahenge/NOAHLANG
-   README: https://github.com/NoahKahenge/NOAHLANG/blob/main/README.md
-   Raw README:
    https://raw.githubusercontent.com/NoahKahenge/NOAHLANG/main/README.md
-   npm package: https://www.npmjs.com/package/noahlang

## Maintenance checklist

Update this guide whenever the language or package changes.

-   [ ] Confirm the current published npm version.
-   [ ] Check every syntax example against the current interpreter.
-   [ ] Link to automated tests for non-trivial behaviour.
-   [ ] Update CLI commands and installation instructions.
-   [ ] Separate implemented features from roadmap items.
-   [ ] Remove or correct examples that no longer run.
-   [ ] Keep the README and this guide consistent.

------------------------------------------------------------------------

**Project maintainer:** Noah Kahenge\
**Project:** NoahLang --- a programming language built in Zambia.
