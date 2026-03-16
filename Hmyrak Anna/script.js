const DEFAULT_CONFIG = {
    rows: 8,
    cols: 8,
    minesCount: 10
};

function createCell() {
    return {
        type: 'empty',
        state: 'closed',
        neighborMines: 0,
        exploded: false,
        wrongFlag: false
    };
}

function createEmptyGrid(rows, cols) {
    const result = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push(createCell());
        }
        result.push(row);
    }
    return result;
}

function inBounds(rows, cols, row, col) {
    return row >= 0 && row < rows && col >= 0 && col < cols;
}

function placeMines(grid, rows, cols, minesCount, excludeRow, excludeCol) {
    let minesPlaced = 0;

    while (minesPlaced < minesCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        const isExcluded = Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1;
        if (grid[r][c].type !== 'mine' && !isExcluded) {
            grid[r][c].type = 'mine';
            minesPlaced++;
        }
    }
}

function countNeighbourMines(grid, rows, cols) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c].type === 'mine') {
                continue;
            }

            let count = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const nr = r + i;
                    const nc = c + j;

                    if (inBounds(rows, cols, nr, nc) && grid[nr][nc].type === 'mine') {
                        count++;
                    }
                }
            }

            grid[r][c].neighborMines = count;
        }
    }
}

function createGame(customConfig = {}) {
    const config = { ...DEFAULT_CONFIG, ...customConfig };

    const gameState = {
        rows: config.rows,
        cols: config.cols,
        minesCount: config.minesCount,
        status: 'process',
        gameTime: 0,
        flagsCount: 0,
        openedCells: 0,
        firstClick: true,
        started: false
    };

    let grid = createEmptyGrid(gameState.rows, gameState.cols);

    function resetCellsState() {
        gameState.status = 'process';
        gameState.gameTime = 0;
        gameState.flagsCount = 0;
        gameState.openedCells = 0;
        gameState.firstClick = true;
        gameState.started = false;
        grid = createEmptyGrid(gameState.rows, gameState.cols);
    }

    function generateField(excludeRow = -1, excludeCol = -1) {
        grid = createEmptyGrid(gameState.rows, gameState.cols);
        placeMines(
            grid,
            gameState.rows,
            gameState.cols,
            gameState.minesCount,
            excludeRow,
            excludeCol
        );
        countNeighbourMines(grid, gameState.rows, gameState.cols);
    }

    function revealAllMines() {
        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                const cell = grid[r][c];
                if (cell.type === 'mine') {
                    if (cell.state !== 'flagged') {
                        cell.state = 'opened';
                    }
                } else if (cell.state === 'flagged') {
                    cell.wrongFlag = true;
                }
            }
        }
    }

    function flagAllMines() {
        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                const cell = grid[r][c];
                if (cell.type === 'mine' && cell.state !== 'flagged') {
                    cell.state = 'flagged';
                    gameState.flagsCount++;
                }
            }
        }
    }

    function checkWinCondition() {
        const totalSafeCells = (gameState.rows * gameState.cols) - gameState.minesCount;
        if (gameState.openedCells === totalSafeCells) {
            gameState.status = 'win';
            flagAllMines();
        }
    }

    function floodOpen(startRow, startCol) {
        const stack = [[startRow, startCol]];

        while (stack.length > 0) {
            const [row, col] = stack.pop();
            if (!inBounds(gameState.rows, gameState.cols, row, col)) {
                continue;
            }

            const cell = grid[row][col];
            if (cell.state === 'opened' || cell.state === 'flagged') {
                continue;
            }
            if (cell.type === 'mine') {
                continue;
            }

            cell.state = 'opened';
            gameState.openedCells++;

            if (cell.neighborMines === 0) {
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) {
                            continue;
                        }
                        stack.push([row + i, col + j]);
                    }
                }
            }
        }
    }

    function openCell(row, col) {
        if (gameState.status !== 'process') {
            return false;
        }
        if (!inBounds(gameState.rows, gameState.cols, row, col)) {
            return false;
        }

        if (gameState.firstClick) {
            gameState.firstClick = false;
            gameState.started = true;
            generateField(row, col);
        }

        const cell = grid[row][col];
        if (cell.state === 'opened' || cell.state === 'flagged') {
            return false;
        }

        if (cell.type === 'mine') {
            cell.exploded = true;
            gameState.status = 'lose';
            revealAllMines();
            return true;
        }

        floodOpen(row, col);
        checkWinCondition();
        return true;
    }

    function toggleFlag(row, col) {
        if (gameState.status !== 'process') {
            return false;
        }
        if (!inBounds(gameState.rows, gameState.cols, row, col)) {
            return false;
        }

        const cell = grid[row][col];
        if (cell.state === 'opened') {
            return false;
        }

        if (cell.state === 'closed') {
            cell.state = 'flagged';
            gameState.flagsCount++;
            return true;
        }

        if (cell.state === 'flagged') {
            cell.state = 'closed';
            gameState.flagsCount--;
            return true;
        }

        return false;
    }

    function tick(seconds = 1) {
        if (gameState.status !== 'process' || !gameState.started) {
            return gameState.gameTime;
        }

        const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
        gameState.gameTime += safeSeconds;
        return gameState.gameTime;
    }

    function getMinesLeft() {
        return gameState.minesCount - gameState.flagsCount;
    }

    function getState() {
        return {
            ...gameState,
            minesLeft: getMinesLeft()
        };
    }

    function getGrid() {
        return grid.map((row) => row.map((cell) => ({ ...cell })));
    }

    function initGame() {
        resetCellsState();
        return getState();
    }

    initGame();

    return {
        initGame,
        openCell,
        toggleFlag,
        tick,
        getState,
        getGrid,
        getMinesLeft
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createGame
    };
}

if (typeof window !== 'undefined') {
    window.MinesweeperLogic = {
        createGame
    };
}