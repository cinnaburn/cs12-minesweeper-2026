const gameState = {
	rows: 9,
	cols: 9,
	minesCount: 10,
	status: 'process', // 'process' | 'win' | 'lose'
	gameTime: 0,
	timerId: null,
};

let field = [];

function generateField(rows, cols, minesCount) {
	const grid = Array.from({ length: rows }, () =>
			Array.from({ length: cols }, () => ({
				type: 'empty',
				neighborMines: 0,
				state: 'closed',
			}))
	);

	let placed = 0;
	while (placed < minesCount) {
		const r = Math.floor(Math.random() * rows);
		const c = Math.floor(Math.random() * cols);
		if (grid[r][c].type !== 'mine') {
			grid[r][c].type = 'mine';
			placed++;
		}
	}

	countNeighbourMines(grid, rows, cols);
	return grid;
}

function countNeighbourMines(grid, rows, cols) {
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (grid[r][c].type === 'mine') continue;
			let count = 0;
			for (let dr = -1; dr <= 1; dr++) {
				for (let dc = -1; dc <= 1; dc++) {
					if (dr === 0 && dc === 0) continue;
					const nr = r + dr;
					const nc = c + dc;
					if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
						if (grid[nr][nc].type === 'mine') count++;
					}
				}
			}
			grid[r][c].neighborMines = count;
		}
	}
}

function openCell(row, col) {
	if (gameState.status !== 'process') return;

	const cell = field[row][col];
	if (cell.state === 'opened' || cell.state === 'flagged') return;

	cell.state = 'opened';

	if (cell.type === 'mine') {
		cell.exploded = true;
		gameState.status = 'lose';
		stopTimer();
		revealAllMines();
		return;
	}

	if (cell.neighborMines === 0) {
		for (let dr = -1; dr <= 1; dr++) {
			for (let dc = -1; dc <= 1; dc++) {
				if (dr === 0 && dc === 0) continue;
				const nr = row + dr;
				const nc = col + dc;
				if (
						nr >= 0 && nr < gameState.rows &&
						nc >= 0 && nc < gameState.cols &&
						field[nr][nc].state === 'closed'
				) {
					openCell(nr, nc);
				}
			}
		}
	}

	checkWin();
}

function toggleFlag(row, col) {
	if (gameState.status !== 'process') return;
	const cell = field[row][col];
	if (cell.state === 'opened') return;
	cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
}

function checkWin() {
	let openedCount = 0;
	for (let r = 0; r < gameState.rows; r++) {
		for (let c = 0; c < gameState.cols; c++) {
			if (field[r][c].state === 'opened') openedCount++;
		}
	}
	if (openedCount === gameState.rows * gameState.cols - gameState.minesCount) {
		gameState.status = 'win';
		stopTimer();
	}
}

function revealAllMines() {
	for (let r = 0; r < gameState.rows; r++) {
		for (let c = 0; c < gameState.cols; c++) {
			const cell = field[r][c];
			if (cell.state === 'flagged' && cell.type !== 'mine') {
				cell.revealedWrong = true;
			}
			if (cell.type === 'mine' && !cell.exploded) {
				cell.state = 'opened';
			}
		}
	}
}

function startTimer() {
	gameState.timerId = setInterval(() => {
		gameState.gameTime++;
	}, 1000);
}

function stopTimer() {
	if (gameState.timerId) {
		clearInterval(gameState.timerId);
		gameState.timerId = null;
	}
}

function initGame() {
	stopTimer();
	gameState.status = 'process';
	gameState.gameTime = 0;
	gameState.timerId = null;
	field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
	startTimer();
}

initGame();