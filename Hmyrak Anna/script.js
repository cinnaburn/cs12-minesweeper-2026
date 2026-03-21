const DEFAULT_CONFIG = {
    rows: 8,
    cols: 8,
    minesCount: 10
};

const CELL_TYPE = {
    EMPTY: 'empty',
    MINE: 'mine',
};

const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged',
};

const GAME_STATUS = {
    PROCESS: 'process',
    WIN: 'win',
    LOSE: 'lose',
};


function createCell() {
    return {
        type: CELL_TYPE.EMPTY,
        state: CELL_STATE.CLOSED,
        neighborMines: 0,
        exploded: false,
        wrongFlag: false
    };
}


function createEmptyGrid(rows, cols) {
    const result = [];
    for (let row = 0; row < rows; row++) {
        const currentRow = [];
        for (let col = 0; col < cols; col++) {
            currentRow.push(createCell());
        }
        result.push(currentRow);
    }
    return result;
}


function inBounds(rows, cols, row, col) {
    return row >= 0 && row < rows && col >= 0 && col < cols;
}


function placeMines(grid, rows, cols, minesCount, excludeRow, excludeCol) {
    const allowedPositions = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const isInclude = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
            if (!isInclude) {
                allowedPositions.push({ row, col });
            }  
        }
    }

    if (minesCount > allowedPositions.length) {
        throw new Error('Too many mines for the given field size and first click position.');
    }

    for (let i = allowedPositions.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = allowedPositions[i];
        allowedPositions[i] = allowedPositions[j];
        allowedPositions[j] = temp;
    }
    
    for (let i = 0; i < minesCount; i++) {
        const position = allowedPositions[i];
        grid[position.row][position.col].type = CELL_TYPE.MINE;
    }
}


function countNeighbourMines(grid, rows, cols) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (grid[row][col].type === CELL_TYPE.MINE) {
                continue;
            }

            let count = 0;
            for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
                for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
                    const neighbourRow = row + directionalRow;
                    const neighbourCol = col + directionalCol;
                    if (inBounds(rows, cols, neighbourRow, neighbourCol) &&
                        grid[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) {
                        count++;
                    }
                }
            }

            grid[row][col].neighborMines = count;
        }
    }
}


function createGame(customConfig = {}) {
    const config = { ...DEFAULT_CONFIG, ...customConfig };

    const gameState = {
        rows: config.rows,
        cols: config.cols,
        minesCount: config.minesCount,
        status: GAME_STATUS.PROCESS,
        gameTime: 0,
        flagsCount: 0,
        openedCells: 0,
        firstClick: true,
        started: false,
        timerId: null
    };


    let grid = createEmptyGrid(gameState.rows, gameState.cols);


    function resetGridDerivedState() {
        gameState.flagsCount = 0;
        gameState.openedCells = 0;
    }


    function resetCellsState() {
        if (gameState.timerId !== null) {
            clearInterval(gameState.timerId);
        }
        gameState.status = GAME_STATUS.PROCESS;
        gameState.gameTime = 0;
        resetGridDerivedState();
        gameState.firstClick = true;
        gameState.started = false;
        gameState.timerId = null;
        grid = createEmptyGrid(gameState.rows, gameState.cols);
    }


    function startTimer() {
        if (gameState.timerId !== null) {
            return;
        }

        gameState.timerId = setInterval(() => {
            if (gameState.status !== GAME_STATUS.PROCESS || !gameState.started) {
                return;
            }
            gameState.gameTime++;
        }, 1000);
    }


    function generateField(rows, cols, minesCount, excludeRow = -1, excludeCol = -1) {
        resetGridDerivedState();
        grid = createEmptyGrid(rows, cols);
        placeMines(
            grid,
            rows,
            cols,
            minesCount,
            excludeRow,
            excludeCol
        );
        countNeighbourMines(grid, rows, cols);
    }


    function revealAllMines() {
        for (let row = 0; row < gameState.rows; row++) {
            for (let col = 0; col < gameState.cols; col++) {
                const cell = grid[row][col];
                if (cell.type === CELL_TYPE.MINE) {
                    if (cell.state !== CELL_STATE.FLAGGED) {
                        cell.state = CELL_STATE.OPENED;
                    }
                } else if (cell.state === CELL_STATE.FLAGGED) {
                    cell.wrongFlag = true;
                }
            }
        }
    }


    function flagAllMines() {
        for (let row = 0; row < gameState.rows; row++) {
            for (let col = 0; col < gameState.cols; col++) {
                const cell = grid[row][col];
                if (cell.type === CELL_TYPE.MINE && cell.state !== CELL_STATE.FLAGGED) {
                    cell.state = CELL_STATE.FLAGGED;
                    gameState.flagsCount++;
                }
            }
        }
    }


    function checkWinCondition() {
        const totalSafeCells = (gameState.rows * gameState.cols) - gameState.minesCount;
        if (gameState.openedCells === totalSafeCells) {
            gameState.status = GAME_STATUS.WIN;
            if (gameState.timerId !== null) {
                clearInterval(gameState.timerId);
                gameState.timerId = null;
            }
            flagAllMines();
        }
    }


    function floodOpen(row, col) {
        if (!inBounds(gameState.rows, gameState.cols, row, col)) {
            return;
        }

        const cell = grid[row][col];
        if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
            return;
        }

        if (cell.type === CELL_TYPE.MINE) {
            return;
        }

        cell.state = CELL_STATE.OPENED;
        gameState.openedCells++;

        if (cell.neighborMines !== 0) {
            return;
        }

        for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
            for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
                if (directionalRow === 0 && directionalCol === 0) {
                    continue;
                }

                floodOpen(row + directionalRow, col + directionalCol);
            }
        }
    }


    function openCell(row, col) {
        if (gameState.status !== GAME_STATUS.PROCESS) {
            return false;
        }
        if (!inBounds(gameState.rows, gameState.cols, row, col)) {
            return false;
        }

        if (gameState.firstClick) {
            gameState.firstClick = false;
            gameState.started = true;
            startTimer();
            generateField(gameState.rows, gameState.cols, gameState.minesCount, row, col);
        }

        const cell = grid[row][col];
        if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
            return false;
        }

        if (cell.type === CELL_TYPE.MINE) {
            cell.exploded = true;
            gameState.status = GAME_STATUS.LOSE;
            if (gameState.timerId !== null) {
                clearInterval(gameState.timerId);
                gameState.timerId = null;
            }
            revealAllMines();
            return true;
        }

        floodOpen(row, col);
        checkWinCondition();
        return true;
    }


    function toggleFlag(row, col) {
        if (gameState.status !== GAME_STATUS.PROCESS) {
            return false;
        }
        if (gameState.firstClick) {
            return false;
        }
        if (!inBounds(gameState.rows, gameState.cols, row, col)) {
            return false;
        }

        const cell = grid[row][col];
        if (cell.state === CELL_STATE.OPENED) {
            return false;
        }

        if (cell.state === CELL_STATE.CLOSED) {
            cell.state = CELL_STATE.FLAGGED;
            gameState.flagsCount++;
            return true;
        }

        if (cell.state === CELL_STATE.FLAGGED) {
            cell.state = CELL_STATE.CLOSED;
            gameState.flagsCount--;
            return true;
        }

        return false;
    }


    function tick(seconds = 1) {
        if (gameState.status !== GAME_STATUS.PROCESS || !gameState.started) {
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
        startTimer,
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