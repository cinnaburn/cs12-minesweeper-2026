# Copilot Instructions for Minesweeper

These instructions guide GitHub Copilot when generating or suggesting code for this project.
Follow all conventions below consistently across every file.

---

## Meaningful Naming

Always use full, descriptive names for every variable, parameter, and function. Never use
single-letter names or cryptic abbreviations.

### Variable naming

| Avoid                    | Use instead                                      |
| ------------------------ | ------------------------------------------------ |
| `r`                      | `row`                                            |
| `c`                      | `col`                                            |
| `nr`                     | `neighbourRow`                                   |
| `nc`                     | `neighbourCol`                                   |
| `dr`                     | `directionalRow`                                 |
| `dc`                     | `directionalCol`                                 |
| `i`, `j` (in grid loops) | `row`, `col`                                     |
| `n`                      | `count` or a domain-specific name                |
| `el`                     | `element`                                        |
| `btn`                    | `button`                                         |
| `val`                    | `value`                                          |
| `arr`                    | `array` or a domain-specific name (e.g. `cells`) |

### Function naming

- Use verb-noun pairs that clearly describe what the function does.
- Examples: `revealCell`, `countAdjacentMines`, `toggleFlag`, `checkWinCondition`, `renderBoard`.

### General rules

- Prioritise readability over brevity.
- Names must be self-documenting: a reader should understand intent without needing a comment.
- Use camelCase for variables and functions, UPPER_SNAKE_CASE for top-level constants.

---

## Enums and Constants

Use constant objects (enum-style) instead of raw string or number literals wherever a fixed set
of values exists. Define these objects at the top of the relevant module.

### Pattern

```js
const CELL_STATE = {
  OPEN: 'open',
  CLOSED: 'closed',
  FLAGGED: 'flagged',
};

const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const CELL_CONTENT = {
  MINE: 'mine',
  EMPTY: 'empty',
};
```

### Usage

```js
// Good
cell.state = CELL_STATE.CLOSED;
game.status = GAME_STATUS.PLAYING;

// Bad — never use raw literals scattered through the code
cell.state = 'closed';
game.status = 'playing';
```

### Rules

- Always reference the constant object in logic, conditionals, and assignments.
- Never duplicate the same string or magic number in more than one place.
- Group related constants into a single object.
- Place constant objects at the top of the file, before any functions.

---

## Spacing and Formatting

Consistent spacing makes the code easier to scan and review.

### Group separation

Separate distinct groups of code with a single blank line:

1. **Constants / configuration** — one block at the top.
2. **Helper / utility functions** — one block.
3. **Core logic functions** — one block.
4. **Rendering / DOM functions** — one block.
5. **`return` statement** — always preceded by a blank line when inside a function body.

### Example

```js
const CELL_STATE = {
  OPEN: 'open',
  CLOSED: 'closed',
  FLAGGED: 'flagged',
};

const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function countAdjacentMines(board, row, col) {
  let mineCount = 0;

  for (const [directionalRow, directionalCol] of DIRECTIONS) {
    const neighbourRow = row + directionalRow;
    const neighbourCol = col + directionalCol;

    if (isInBounds(board, neighbourRow, neighbourCol)) {
      if (board[neighbourRow][neighbourCol].hasMine) {
        mineCount++;
      }
    }
  }

  return mineCount;
}

function revealCell(board, row, col) {
  const cell = board[row][col];

  if (cell.state !== CELL_STATE.CLOSED) {
    return;
  }

  cell.state = CELL_STATE.OPEN;

  return cell;
}
```

### Rules

- One blank line between logical sections inside a function.
- Two blank lines between top-level function definitions.
- A blank line before every `return` statement (except single-expression arrow functions).
- No trailing whitespace.
- Use 2-space indentation consistently.

---

## General Best Practices

- **Pure functions where possible** — avoid side effects inside helpers that compute values.
- **Single responsibility** — each function should do exactly one thing.
- **No magic numbers** — define numeric constants (e.g. `const DEFAULT_MINE_COUNT = 10`).
- **Early returns** — use guard clauses to reduce nesting instead of deeply nested `if/else`.
- **Consistent style** — apply all rules above to every file in the project, not just new code.

---

## Repository Structure

All files submitted by a student must be placed inside a dedicated top-level folder named
after the student using the `SurnameName` format (e.g. `SmithJohn/`, `MokhNazar/`).

### Rules

- Every new file must reside under `/{SurnameName}/` — never in the repository root or any
  other folder.
- The folder name must follow the `SurnameName` convention: surname first, given name second,
  no separator, each part capitalised (PascalCase).
- Do not modify files outside your own `/{SurnameName}/` folder.

### Examples

```
SmithWill/
  index.html
  styles.css
  script.js

DeppJohny/
  index.html
  styles.css
```

---

## Pull Request Conventions

### Title format

Every pull request title must begin with a lab identifier followed by a colon and a space:

```
lab{number}: <short description>
```

### Examples

```
lab1: initial board rendering
lab2: mine placement logic
lab3: reveal and flag interactions
```

### Rules

- `{number}` is a positive integer matching the lab assignment number (e.g. `lab1`, `lab12`).
- The description after the colon must be lowercase and concise.
- No PR should be opened without the `lab{number}:` prefix — reviewers will reject titles that
  do not follow this format.

### Reviewer checks

When reviewing a pull request, verify all of the following before approving:

1. **PR title** starts with `lab{number}: ` as described above.
2. **All changed files** are inside the author's own `/{SurnameName}/` folder — no files
   outside that folder should be added, modified, or deleted.
3. **No top-level directory has been fully deleted.** If the diff shows that every file under
   a `/{SurnameName}/` folder belonging to _another_ student has been removed, comment this in the PR. This is the most common way a student accidentally wipes a peer's work.
   - Check the list of deleted files: if all deletions share the same top-level folder and
     that folder is **not** the PR author's own folder, flag it.
   - Request changes with a comment explaining which directory was unintentionally deleted and asking the author to restore it before the PR can be merged suggesting the way how to do that.
