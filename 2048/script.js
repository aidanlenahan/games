// Constants
const gridSize = 4;
const initialTileCount = 2;

// Game state
let board = [];
let score = 0;
let globalScore = 0;
let globalName = "---";

// Initialize game
function initGame() {
    board = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
    score = 0;
    updateScore();
    addInitialTiles();
    renderBoard();
    fetchGlobalScore();
}

// Fetch global score from scores.json
async function fetchGlobalScore() {
    try {
        const response = await fetch("scores.json?cachebuster=" + Date.now());
        const data = await response.json();
        globalScore = data.topScore;
        globalName = data.player;
        updateGlobalScoreDisplay();
    } catch (err) {
        console.error("Could not load global score:", err);
    }
}

function updateGlobalScoreDisplay() {
    const valEl = document.getElementById("global-score-value");
    const nameEl = document.getElementById("global-score-name");
    if (valEl && nameEl) {
        valEl.textContent = globalScore;
        nameEl.textContent = globalName;
    } else {
        const container = document.getElementById("global-score");
        if (container) container.textContent = `${globalName} - ${globalScore}`;
    }
}

// Add initial tiles
function addInitialTiles() {
    for (let i = 0; i < initialTileCount; i++) addRandomTile();
}

// Add random tile (2 or 4)
function addRandomTile() {
    const emptyCells = [];
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (board[row][col] === 0) emptyCells.push({ row, col });
        }
    }

    if (emptyCells.length > 0) {
        const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
}

// Render board
function renderBoard() {
    const gridContainer = document.getElementById("grid-container");
    gridContainer.innerHTML = "";

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const tile = document.createElement("div");
            tile.classList.add("grid-cell");
            const value = board[row][col];
            tile.textContent = value === 0 ? "" : value;
            tile.style.backgroundColor = getTileColor(value);

            if (tile.textContent !== "" && tile.classList) {
                tile.classList.add("appear");
                setTimeout(() => tile.classList.remove("appear"), 150);
            }

            gridContainer.appendChild(tile);
        }
    }
}

// Tile colors
function getTileColor(value) {
    switch (value) {
        case 2: return "#eee4da";
        case 4: return "#ede0c8";
        case 8: return "#f2b179";
        case 16: return "#f59563";
        case 32: return "#f67c5f";
        case 64: return "#f65e3b";
        case 128: return "#edcf72";
        case 256: return "#edcc61";
        case 512: return "#edc850";
        case 1024: return "#edc53f";
        case 2048: return "#edc22e";
        default: return "#cdc1b4";
    }
}

// Update score display
function updateScore() {
    document.getElementById("score-value").textContent = score;
}

// Cheat function
// Usage from browser console: cheat(value, x, y)
// - value: must be one of [2,4,8,16,...,32768]
// - x: lateral distance from bottom-left corner (0..3), 0 is left
// - y: vertical distance from bottom-left corner (0..3), 0 is bottom
// Example: cheat(32,0,3) -> places 32 at top-left
function cheat(value, x, y) {
    const allowedValues = [
        2, 4, 8, 16, 32, 64, 128, 256, 512,
        1024, 2048, 4096, 8192, 16384, 32768
    ];

    // Validate value
    if (!Number.isInteger(value)) {
        throw new Error("The tile value must be an integer.");
    }
    if (!allowedValues.includes(value)) {
        throw new Error("Invalid tile value. Must be a multiple of 2 (power-of-two) between 2 and 32768.");
    }

    // Validate coordinates
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
        throw new Error("Coordinates x and y must be integers between 0 and 3.");
    }
    if (x < 0 || x > gridSize - 1 || y < 0 || y > gridSize - 1) {
        throw new Error("Coordinates out of range. x and y must be between 0 and 3 (inclusive).");
    }

    // Convert (x,y) from bottom-left origin to board indices (row, col)
    const row = gridSize - 1 - y;
    const col = x;

    board[row][col] = value;
    renderBoard();
}

// Make sure cheat is accessible from DevTools
if (typeof window !== 'undefined') {
    window.cheat = cheat;
    try { console.info('cheat() is exposed on window'); } catch (e) {}
}

// Key controls
document.addEventListener("keydown", (event) => {
    let moved = false;
    switch (event.key) {
        case "ArrowUp": moved = moveTilesUp(); break;
        case "ArrowDown": moved = moveTilesDown(); break;
        case "ArrowLeft": moved = moveTilesLeft(); break;
        case "ArrowRight": moved = moveTilesRight(); break;
    }

    if (moved) {
        addRandomTile();
        renderBoard();
        if (!canMove()) {
            setTimeout(showGameOverModal, 100);
        }
    }
});

// Movement utilities
function compress(row) {
    return row.filter(x => x !== 0).concat(Array(gridSize - row.filter(x => x !== 0).length).fill(0));
}

function combine(row) {
    for (let i = 0; i < gridSize - 1; i++) {
        if (row[i] !== 0 && row[i] === row[i + 1]) {
            row[i] *= 2;
            score += row[i];
            row[i + 1] = 0;
        }
    }
    return row;
}

// Move functions
function moveTilesLeft() {
    let moved = false;
    for (let row = 0; row < gridSize; row++) {
        const original = [...board[row]];
        let newRow = compress(board[row]);
        newRow = combine(newRow);
        newRow = compress(newRow);
        board[row] = newRow;
        if (JSON.stringify(original) !== JSON.stringify(newRow)) moved = true;
    }
    updateScore();
    return moved;
}

function moveTilesRight() {
    let moved = false;
    for (let row = 0; row < gridSize; row++) {
        const original = [...board[row]];
        let newRow = compress(board[row].slice().reverse());
        newRow = combine(newRow);
        newRow = compress(newRow);
        newRow.reverse();
        board[row] = newRow;
        if (JSON.stringify(original) !== JSON.stringify(newRow)) moved = true;
    }
    updateScore();
    return moved;
}

function moveTilesUp() {
    let moved = false;
    for (let col = 0; col < gridSize; col++) {
        const column = [];
        for (let row = 0; row < gridSize; row++) column.push(board[row][col]);
        const original = [...column];
        let newCol = compress(column);
        newCol = combine(newCol);
        newCol = compress(newCol);
        for (let row = 0; row < gridSize; row++) board[row][col] = newCol[row];
        if (JSON.stringify(original) !== JSON.stringify(newCol)) moved = true;
    }
    updateScore();
    return moved;
}

function moveTilesDown() {
    let moved = false;
    for (let col = 0; col < gridSize; col++) {
        const column = [];
        for (let row = 0; row < gridSize; row++) column.push(board[row][col]);
        const original = [...column];
        let newCol = compress(column.reverse());
        newCol = combine(newCol);
        newCol = compress(newCol);
        newCol.reverse();
        for (let row = 0; row < gridSize; row++) board[row][col] = newCol[row];
        if (JSON.stringify(original) !== JSON.stringify(newCol)) moved = true;
    }
    updateScore();
    return moved;
}

// Check for moves left
function canMove() {
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (board[row][col] === 0) return true;
            if (col < gridSize - 1 && board[row][col] === board[row][col + 1]) return true;
            if (row < gridSize - 1 && board[row][col] === board[row + 1][col]) return true;
        }
    }
    return false;
}

// Restart button
document.getElementById("restart-button").addEventListener("click", initGame);

// Game Over Modal
function showGameOverModal() {
    document.getElementById("final-score").textContent = score;
    const modal = document.getElementById("game-over-modal");
    modal.style.display = "flex";

    document.getElementById("submit-score-button").onclick = () => {
        const initials = document.getElementById("initials-input").value.toUpperCase();
        if (initials.length === 3) {
            modal.style.display = "none";
            if (score > globalScore) {
                updateGlobalScore(initials, score);
            }
            initGame();
        } else {
            alert("Please enter 3 letters.");
        }
    };

    document.getElementById("close-modal-button").onclick = () => {
        modal.style.display = "none";
        initGame();
    };
}

// Simulate GitHub update (local only right now)
function updateGlobalScore(initials, newScore) {
    globalScore = newScore;
    globalName = initials;
    updateGlobalScoreDisplay();
    console.log("Pretending to update scores.json:", { player: initials, topScore: newScore });
    // Later: GitHub Action/API call here
}

async function fetchGlobalHighScore() {
    try {
        const resp = await fetch('highscore.json');
        const data = await resp.json();
        const container = document.getElementById('global-score');
        if (container) container.textContent = `Global: ${data.name} - ${data.score}`;
    } catch (err) {
        // ignore errors; optional file may not exist
        console.warn('Could not fetch highscore.json:', err);
    }
}

// Call this once at page load
fetchGlobalHighScore();

// Start game
initGame();
