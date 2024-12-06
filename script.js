const playerBoard = document.getElementById('player-board');
const enemyBoard = document.getElementById('enemy-board');
const messageDiv = document.getElementById('message');
const startButton = document.getElementById('start-game');
const shipButtons = document.querySelectorAll('.ship-btn'); // Riferimento ai pulsanti delle navi

// Aggiunge l'event listener ai pulsanti
shipButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
        selectedShipSize = parseInt(btn.dataset.size); // Imposta la dimensione della nave
        console.log(`Nave selezionata: ${selectedShipSize}`); // Debug per confermare la selezione
    })
);

const rotateButton = document.getElementById('rotate-ship');
const playAgainButton = document.getElementById('play-again');

let playerShips = [];
let enemyShips = [];
let placedShips = {};
let selectedShipSize = null;
let isHorizontal = true;
let playerTurn = true;
let cpuMoves = [];
let playerWins = 0;
let cpuWins = 0;

function initializeShipTracking() {
    placedShips = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

function createBoard(boardElement, isPlayerBoard = false) {
    boardElement.innerHTML = '';
    for (let i = 0; i < 100; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;
        boardElement.appendChild(cell);

        if (isPlayerBoard) {
            cell.addEventListener('click', () => placeShip(cell));
        } else {
            cell.addEventListener('click', () => {
                if (playerTurn) playerMove(parseInt(cell.dataset.index));
            });
        }
    }
}

function placeShip(cell) {
    if (!selectedShipSize) return;

    const index = parseInt(cell.dataset.index); // Indice della cella selezionata
    const row = Math.floor(index / 10); // Righe vanno da 0 a 9
    const col = index % 10; // Colonne vanno da 0 a 9

    // Controlla se la posizione è valida
    if (!checkPlacement(index, row, selectedShipSize)) {
        alert('Posizionamento non valido!');
        return;
    }

    // Creazione della nave
    const shipElement = document.createElement('div');
    shipElement.classList.add('ship-image', `ship-${selectedShipSize}`);
    if (!isHorizontal) shipElement.classList.add('vertical');

    // Aggiunge il background dell'immagine corretta
    const shipImage = isHorizontal
        ? `images/ship-${selectedShipSize}.png`
        : `images/ship-${selectedShipSize}-v.png`;
    shipElement.style.backgroundImage = `url("${shipImage}")`;

    // Imposta le coordinate CSS Grid
    shipElement.style.gridRowStart = row + 1; // Le righe CSS Grid iniziano da 1
    shipElement.style.gridColumnStart = col + 1; // Le colonne CSS Grid iniziano da 1
    if (isHorizontal) {
        shipElement.style.gridColumnEnd = `span ${selectedShipSize}`;
    } else {
        shipElement.style.gridRowEnd = `span ${selectedShipSize}`;
    }

    // Aggiunge l'elemento alla griglia del giocatore
    playerBoard.appendChild(shipElement);

    // Salva le coordinate della nave
    for (let i = 0; i < selectedShipSize; i++) {
        const offset = isHorizontal ? i : i * 10;
        playerShips.push(index + offset);
    }

    // Disabilita il pulsante per la nave posizionata
    placedShips[selectedShipSize]++;
    disableShipButton(selectedShipSize);
    selectedShipSize = null;
    checkAllShipsPlaced();
}


function checkPlacement(index, row, size) {
    for (let i = 0; i < size; i++) {
        const offset = isHorizontal ? i : i * 10;
        const cellIndex = index + offset;

        if (
            cellIndex >= 100 || // Fuori dalla griglia
            (isHorizontal && Math.floor(cellIndex / 10) !== row - 1) || // Non sulla stessa riga
            (!isHorizontal && (cellIndex % 10) !== (index % 10)) || // Non sulla stessa colonna
            playerShips.includes(cellIndex) // Già occupata
        ) {
            return false;
        }
    }
    return true;
}


function checkPlacementForEnemy(index, row, size, horizontal) {
    for (let i = 0; i < size; i++) {
        const offset = horizontal ? i : i * 10;
        const cellIndex = index + offset;

        if (
            cellIndex >= 100 || // Fuori dalla griglia
            (horizontal && Math.floor(cellIndex / 10) !== row) || // Non sulla stessa riga (orizzontale)
            (!horizontal && Math.floor(cellIndex / 10) !== row + i) || // Non sulla stessa colonna (verticale)
            enemyShips.includes(cellIndex) // Posizione già occupata
        ) {
            return false;
        }
    }
    return true;
}

function disableShipButton(size) {
    const button = [...shipButtons].find((btn) => btn.dataset.size == size);
    button.disabled = true;
}

function checkAllShipsPlaced() {
    if (Object.values(placedShips).reduce((a, b) => a + b, 0) === 5) {
        startButton.disabled = false;
    }
}

function populateEnemyShips() {
    const sizes = [5, 4, 3, 2, 1]; // Dimensioni delle navi
    enemyShips = []; // Resetta l'array delle navi della CPU
    console.log('Inizio posizionamento navi CPU');

    sizes.forEach((size) => {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 100) { // Evita loop infiniti
            attempts++;
            const horizontal = Math.random() > 0.5; // Direzione casuale
            const startIndex = Math.floor(Math.random() * 100); // Posizione iniziale

            if (canPlaceShipForEnemy(startIndex, size, horizontal)) {
                for (let i = 0; i < size; i++) {
                    const offset = horizontal ? i : i * 10;
                    const shipIndex = startIndex + offset;
                    enemyShips.push(shipIndex);
                }
                placed = true;
            }
        }

        if (!placed) {
            console.error(`Impossibile posizionare la nave da ${size} caselle dopo ${attempts} tentativi.`);
        }
    });

    console.log('Navi CPU posizionate:', enemyShips);
}


function canPlaceShipForEnemy(startIndex, size, horizontal) {
    const row = Math.floor(startIndex / 10);

    for (let i = 0; i < size; i++) {
        const offset = horizontal ? i : i * 10;
        const currentIndex = startIndex + offset;

        if (
            currentIndex >= 100 || // Fuori dalla griglia
            (horizontal && Math.floor(currentIndex / 10) !== row) || // Orizzontale ma non sulla stessa riga
            (!horizontal && currentIndex % 10 !== startIndex % 10) || // Verticale ma non sulla stessa colonna
            enemyShips.includes(currentIndex) // Posizione già occupata
        ) {
            console.log(`Posizione non valida per la nave a indice ${currentIndex}`);
            return false;
        }
    }
    return true;
}

function startGame() {
    console.log("Funzione startGame() chiamata"); // Debug per verificare
    populateEnemyShips(); // Posiziona le navi della CPU
    console.log('Navi nemiche inizializzate:', enemyShips); // Debug
    startButton.disabled = true;
    shipButtons.forEach((btn) => (btn.disabled = true));
    messageDiv.innerText = 'Il gioco è iniziato! Tocca a te.';
}


function playerMove(index) {
    const cell = enemyBoard.children[index];
    if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
        console.log(`Giocatore attacca cella ${index}`); // Debug
        if (enemyShips.includes(index)) {
            console.log(`Colpito nave CPU in cella ${index}`); // Debug
            cell.classList.add('hit');
            cell.style.backgroundColor = '#ff6666'; // Cambia il colore per indicare un colpo
            enemyShips = enemyShips.filter((i) => i !== index); // Rimuove la cella colpita
            if (enemyShips.length === 0) {
                endGame('win');
                return;
            }
        } else {
            console.log(`Mancato in cella ${index}`); // Debug
            cell.classList.add('miss');
            cell.style.backgroundColor = '#cccccc'; // Cambia il colore per indicare un mancato
        }
        playerTurn = false; // Passa il turno alla CPU
        setTimeout(cpuMove, 1000); // Attendi 1 secondo per la mossa della CPU
    }
}


function cpuMove() {
    let targetIndex;
    do {
        targetIndex = Math.floor(Math.random() * 100);
    } while (cpuMoves.includes(targetIndex));

    cpuMoves.push(targetIndex);
    const cell = playerBoard.children[targetIndex];

    if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
        if (playerShips.includes(targetIndex)) {
            cell.classList.add('hit');
            playerShips = playerShips.filter((i) => i !== targetIndex);
            if (playerShips.length === 0) {
                endGame('lose');
                return;
            }
        } else {
            cell.classList.add('miss');
        }
        playerTurn = true;
    }
}

function endGame(result) {
    // Verifica chi ha vinto
    if (result === 'win') {
        messageDiv.innerHTML = 'Hai vinto! 🎉';
        playerWins++;  // Incrementa il punteggio del giocatore
    } else {
        messageDiv.innerHTML = 'Hai perso! 😢';
        cpuWins++;  // Incrementa il punteggio della CPU
    }

    // Mostra il pulsante "Gioca Ancora"
    playAgainButton.style.display = 'block'; 
    messageDiv.appendChild(playAgainButton); // Aggiunge il pulsante sotto il messaggio

    // Aggiorna i punteggi
    updateScore(); // Chiamata alla funzione che aggiorna il punteggio
}

function updateScore() {
    const playerScoreElement = document.getElementById('player-score');
    const cpuScoreElement = document.getElementById('cpu-score');

    if (playerScoreElement) {
        playerScoreElement.textContent = playerWins; // Mostra i punti del giocatore
    }
    if (cpuScoreElement) {
        cpuScoreElement.textContent = cpuWins; // Mostra i punti della CPU
    }
}

function checkPlacement(index, row, size) {
    for (let i = 0; i < size; i++) {
        const offset = isHorizontal ? i : i * 10;
        const cellIndex = index + offset;

        if (
            cellIndex >= 100 || // Fuori dai limiti
            (isHorizontal && Math.floor(cellIndex / 10) !== row) || // Errore orizzontale
            (!isHorizontal && cellIndex % 10 !== index % 10) || // Errore verticale
            playerShips.includes(cellIndex) // Sovrapposizione
        ) {
            return false;
        }
    }
    return true;
}

function resetGame() {
    playerShips = [];
    enemyShips = [];
    cpuMoves = [];
    placedShips = {};
    isHorizontal = true;
    playerTurn = true;
    initializeShipTracking();
    createBoard(playerBoard, true);
    createBoard(enemyBoard, false);
    playAgainButton.style.display = 'none'; // Nasconde il pulsante "Gioca Ancora"
    messageDiv.innerText = ''; // Resetta il messaggio
    startButton.disabled = true; // Disabilita il pulsante "Inizia Gioco" fino a quando le navi non sono posizionate
    shipButtons.forEach((btn) => (btn.disabled = false)); // Riabilita i pulsanti delle navi
}

shipButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
        selectedShipSize = parseInt(btn.dataset.size);
    })
);

rotateButton.addEventListener('click', () => {
    isHorizontal = !isHorizontal;
    rotateButton.innerText = isHorizontal
        ? 'Ruota Nave (Orizzontale)'
        : 'Ruota Nave (Verticale)';
});

playAgainButton.addEventListener('click', resetGame);

initializeShipTracking();
createBoard(playerBoard, true);
createBoard(enemyBoard, false);

console.log("Eseguo populateEnemyShips() manualmente");
populateEnemyShips();
console.log("Navi CPU:", enemyShips);
console.log(`Caricamento immagine: ${isHorizontal ? `ship-${selectedShipSize}.png` : `ship-${selectedShipSize}-v.png`}`);
console.log(`Nave selezionata per il posizionamento: ${selectedShipSize}`);

