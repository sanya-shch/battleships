document.addEventListener("DOMContentLoaded", () => {
  const userGrid = document.querySelector(".grid-user");
  const computerGrid = document.querySelector(".grid-computer");
  const displayGrid = document.querySelector(".grid-display");

  const ships = document.querySelectorAll(".ship");
  const destroyer = document.querySelector(".destroyer-container");
  const submarine = document.querySelector(".submarine-container");
  const cruiser = document.querySelector(".cruiser-container");
  const battleship = document.querySelector(".battleship-container");
  const carrier = document.querySelector(".carrier-container");

  const startButton = document.querySelector("#start");
  const rotateButton = document.querySelector("#rotate");
  const turnDisplay = document.querySelector("#whose-go");
  const infoDisplay = document.querySelector("#info");

  const width = 10;
  const userSquares = [];
  const computerSquares = [];

  let isHorizontal = true;
  let isGameOver = false;
  let currentPlayer = "user";

  function createBoard(grid, squares) {
    for (let i = 0; i < width * width; i++) {
      const square = document.createElement("div");
      square.dataset.id = i;
      grid.appendChild(square);
      squares.push(square);
    }
  }
  createBoard(userGrid, userSquares);
  createBoard(computerGrid, computerSquares);

  const shipArray = [
    {
      name: "destroyer",
      directions: [
        [0, 1],
        [0, width],
      ],
    },
    {
      name: "submarine",
      directions: [
        [0, 1, 2],
        [0, width, width * 2],
      ],
    },
    {
      name: "cruiser",
      directions: [
        [0, 1, 2],
        [0, width, width * 2],
      ],
    },
    {
      name: "battleship",
      directions: [
        [0, 1, 2, 3],
        [0, width, width * 2, width * 3],
      ],
    },
    {
      name: "carrier",
      directions: [
        [0, 1, 2, 3, 4],
        [0, width, width * 2, width * 3, width * 4],
      ],
    },
  ];

  function generate(ship) {
    let randomDirection = Math.floor(Math.random() * ship.directions.length);
    let current = ship.directions[randomDirection];
    let direction = 1;

    if (randomDirection === 0) direction = 1;
    if (randomDirection === 1) direction = 10;

    let randomStart = Math.abs(
      Math.floor(
        Math.random() * computerSquares.length -
          ship.directions[0].length * direction
      )
    );

    const isTaken = current.some((index) =>
      computerSquares[randomStart + index].classList.contains("taken")
    );
    const isAtRightEdge = current.some(
      (index) => (randomStart + index) % width === width - 1
    );
    const isAtLeftEdge = current.some(
      (index) => (randomStart + index) % width === 0
    );

    if (!isTaken && !isAtRightEdge && !isAtLeftEdge)
      current.forEach((index) =>
        computerSquares[randomStart + index].classList.add("taken", ship.name)
      );
    else generate(ship);
  }
  generate(shipArray[0]);
  generate(shipArray[1]);
  generate(shipArray[2]);
  generate(shipArray[3]);
  generate(shipArray[4]);

  function rotate() {
    destroyer.classList.toggle("destroyer-container-vertical");
    submarine.classList.toggle("submarine-container-vertical");
    cruiser.classList.toggle("cruiser-container-vertical");
    battleship.classList.toggle("battleship-container-vertical");
    carrier.classList.toggle("carrier-container-vertical");

    isHorizontal = !isHorizontal;
  }
  rotateButton.addEventListener("click", rotate);

  ships.forEach((ship) => ship.addEventListener("dragstart", dragStart));
  userSquares.forEach((square) =>
    square.addEventListener("dragstart", dragStart)
  );
  userSquares.forEach((square) =>
    square.addEventListener("dragover", dragOver)
  );
  userSquares.forEach((square) =>
    square.addEventListener("dragenter", dragEnter)
  );
  userSquares.forEach((square) =>
    square.addEventListener("dragleave", dragLeave)
  );
  userSquares.forEach((square) => square.addEventListener("drop", dragDrop));
  userSquares.forEach((square) => square.addEventListener("dragend", dragEnd));

  let selectedShipNameWithIndex;
  let draggedShip;
  let draggedShipLength;

  ships.forEach((ship) =>
    ship.addEventListener("mousedown", (e) => {
      selectedShipNameWithIndex = e.target.id;
    })
  );

  function dragStart() {
    draggedShip = this;
    draggedShipLength = this.childNodes.length;
  }

  function dragOver(e) {
    e.preventDefault();
  }

  function dragEnter(e) {
    e.preventDefault();
  }

  function dragLeave() {}

  function dragDrop() {
    let shipNameWithLastId = draggedShip.lastChild.id;
    let shipClass = shipNameWithLastId.slice(0, -2);
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
    let shipLastId = lastShipIndex + parseInt(this.dataset.id);

    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));

    shipLastId = isHorizontal
      ? shipLastId - selectedShipIndex
      : parseInt(this.dataset.id) +
        (draggedShipLength - selectedShipIndex - 1) * 10;

    const shipFirstId = isHorizontal
      ? shipLastId - draggedShipLength + 1
      : parseInt(this.dataset.id) - selectedShipIndex * 10;

    let isEveryEmpty = true;

    if (
      isHorizontal &&
      shipFirstId >= 0 &&
      shipLastId < 100 &&
      (shipFirstId > 9 ? shipFirstId % 10 : shipFirstId) <
        (shipLastId > 9 ? shipLastId % 10 : shipLastId)
    ) {
      for (let i = 0; i < draggedShipLength; i++) {
        if (
          userSquares[
            parseInt(this.dataset.id) - selectedShipIndex + i
          ].classList.contains("taken")
        ) {
          isEveryEmpty = false;
        }
      }

      if (isEveryEmpty) {
        for (let i = 0; i < draggedShipLength; i++) {
          userSquares[
            parseInt(this.dataset.id) - selectedShipIndex + i
          ].classList.add("taken", shipClass);
        }
      } else return;
    } else if (!isHorizontal && shipFirstId >= 0 && shipLastId < 100) {
      for (let i = 0; i < draggedShipLength; i++) {
        if (userSquares[shipFirstId + width * i].classList.contains("taken")) {
          isEveryEmpty = false;
        }
      }

      if (isEveryEmpty) {
        for (let i = 0; i < draggedShipLength; i++) {
          userSquares[shipFirstId + width * i].classList.add(
            "taken",
            shipClass
          );
        }
      } else return;
    } else return;

    displayGrid.removeChild(draggedShip);
  }

  function dragEnd() {}

  function playGame() {
    if (isGameOver) return;
    if (currentPlayer === "user") {
      turnDisplay.innerHTML = "Your Go";
      computerSquares.forEach((square) =>
        square.addEventListener("click", function (e) {
          revealSquare(square);
        })
      );
    }
    if (currentPlayer === "computer") {
      turnDisplay.innerHTML = "Computers Go";
      setTimeout(computerGo, 1000);
    }
  }
  startButton.addEventListener("click", playGame);

  let destroyerCount = 0;
  let submarineCount = 0;
  let cruiserCount = 0;
  let battleshipCount = 0;
  let carrierCount = 0;

  function revealSquare(square) {
    if (!square.classList.contains("boom")) {
      if (square.classList.contains("destroyer")) destroyerCount++;
      if (square.classList.contains("submarine")) submarineCount++;
      if (square.classList.contains("cruiser")) cruiserCount++;
      if (square.classList.contains("battleship")) battleshipCount++;
      if (square.classList.contains("carrier")) carrierCount++;
    }
    if (square.classList.contains("taken")) {
      square.classList.add("boom");
    } else {
      square.classList.add("miss");
    }
    checkForWins();
    currentPlayer = "computer";
    playGame();
  }

  let cpuDestroyerCount = 0;
  let cpuSubmarineCount = 0;
  let cpuCruiserCount = 0;
  let cpuBattleshipCount = 0;
  let cpuCarrierCount = 0;

  function computerGo() {
    let random = Math.floor(Math.random() * userSquares.length);
    if (!userSquares[random].classList.contains("boom")) {
      userSquares[random].classList.add("boom");
      if (userSquares[random].classList.contains("destroyer"))
        cpuDestroyerCount++;
      if (userSquares[random].classList.contains("submarine"))
        cpuSubmarineCount++;
      if (userSquares[random].classList.contains("cruiser")) cpuCruiserCount++;
      if (userSquares[random].classList.contains("battleship"))
        cpuBattleshipCount++;
      if (userSquares[random].classList.contains("carrier")) cpuCarrierCount++;
      checkForWins();
    } else computerGo();
    currentPlayer = "user";
    turnDisplay.innerHTML = "Your Go";
  }

  function checkForWins() {
    if (destroyerCount === 2) {
      infoDisplay.innerHTML = "You sunk the computers destroyer";
      destroyerCount = 10;
    }
    if (submarineCount === 3) {
      infoDisplay.innerHTML = "You sunk the computers submarine";
      submarineCount = 10;
    }
    if (cruiserCount === 3) {
      infoDisplay.innerHTML = "You sunk the computers cruiser";
      cruiserCount = 10;
    }
    if (battleshipCount === 4) {
      infoDisplay.innerHTML = "You sunk the computers battleship";
      battleshipCount = 10;
    }
    if (carrierCount === 5) {
      infoDisplay.innerHTML = "You sunk the computers carrier";
      carrierCount = 10;
    }
    if (cpuDestroyerCount === 2) {
      infoDisplay.innerHTML = "You sunk the computers Destroyer";
      cpuDestroyerCount = 10;
    }
    if (cpuSubmarineCount === 3) {
      infoDisplay.innerHTML = "You sunk the computers Submarine";
      cpuSubmarineCount = 10;
    }
    if (cpuCruiserCount === 3) {
      infoDisplay.innerHTML = "You sunk the computers Cruiser";
      cpuCruiserCount = 10;
    }
    if (cpuBattleshipCount === 4) {
      infoDisplay.innerHTML = "You sunk the computers Battleship";
      cpuBattleshipCount = 10;
    }
    if (cpuCarrierCount === 5) {
      infoDisplay.innerHTML = "You sunk the computers Carrier";
      cpuCarrierCount = 10;
    }
    if (
      destroyerCount +
        submarineCount +
        cruiserCount +
        battleshipCount +
        carrierCount ===
      50
    ) {
      infoDisplay.innerHTML = "YOU WIN";
      gameOver();
    }
    if (
      cpuDestroyerCount +
        cpuSubmarineCount +
        cpuCruiserCount +
        cpuBattleshipCount +
        cpuCarrierCount ===
      50
    ) {
      infoDisplay.innerHTML = "COMPUTER WINS";
      gameOver();
    }
  }

  function gameOver() {
    isGameOver = true;
    startButton.removeEventListener("click", playGame);
  }
});