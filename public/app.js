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
  let playerNum = 0;
  let ready = false;
  let enemyReady = false;
  let allShipsPlaced = false;
  let shotFired = -1;

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

  const singlePlayerButton = document.querySelector("#singlePlayerButton");
  const multiPlayerButton = document.querySelector("#multiPlayerButton");

  singlePlayerButton.addEventListener("click", startSinglePlayer);
  multiPlayerButton.addEventListener("click", startMultiPlayer);

  function startMultiPlayer() {
    gameMode = "multiPlayer";

    const socket = io();

    socket.on("player-number", (num) => {
      if (num === -1) {
        infoDisplay.innerHTML = "Sorry, the server is full";
      } else {
        playerNum = parseInt(num);

        if (playerNum === 1) currentPlayer = "enemy";

        socket.emit("check-players");
      }
    });

    socket.on("player-connection", (num) => {
      console.log(`Player number ${num} has connected or disconnected`);

      playerConnectedOrDisconnected(num);
    });

    socket.on("enemy-ready", (num) => {
      enemyReady = true;

      playerReady(num);

      if (ready) playGameMulti(socket);
    });

    socket.on("check-players", (players) => {
      players.forEach((p, i) => {
        if (p.connected) playerConnectedOrDisconnected(i);

        if (p.ready) {
          playerReady(i);

          if (i !== playerReady) enemyReady = true;
        }
      });
    });

    socket.on("timeout", () => {
      infoDisplay.innerHTML = "You have reached the 10 minute limit";
    });

    startButton.addEventListener("click", () => {
      if (allShipsPlaced) playGameMulti(socket);
      else infoDisplay.innerHTML = "Please place all ships";
    });

    computerSquares.forEach((square) => {
      square.addEventListener("click", () => {
        if (!isGameOver && currentPlayer === "user" && ready && enemyReady) {
          shotFired = square.dataset.id;
          socket.emit("fire", shotFired);
        }

        if (isGameOver) {
          turnDisplay.innerHTML = "";
        }
      });
    });

    socket.on("fire", (id) => {
      enemyGo(id);
      const square = userSquares[id];
      socket.emit("fire-reply", square.classList);
      playGameMulti(socket);
    });

    socket.on("fire-reply", (classList) => {
      revealSquare(classList);
      playGameMulti(socket);
    });

    function playerConnectedOrDisconnected(num) {
      let player = `.p${parseInt(num) + 1}`;

      document
        .querySelector(`${player} .connected span`)
        .classList.toggle("green");

      if (parseInt(num) === playerNum)
        document.querySelector(player).style.fontWeight = "bold";
    }
  }

  function startSinglePlayer() {
    gameMode = "singlePlayer";

    generate(shipArray[0]);
    generate(shipArray[1]);
    generate(shipArray[2]);
    generate(shipArray[3]);
    generate(shipArray[4]);

    startButton.addEventListener("click", playGameSingle);
  }

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

    if (!displayGrid.querySelector(".ship")) allShipsPlaced = true;
  }

  function dragEnd() {}

  function playGameMulti(socket) {
    if (isGameOver) return;

    if (!ready) {
      socket.emit("player-ready");

      ready = true;

      playerReady(playerNum);
    }

    if (enemyReady) {
      if (currentPlayer === "user") {
        turnDisplay.innerHTML = "Your Go";
      }

      if (currentPlayer === "enemy") {
        turnDisplay.innerHTML = "Enemy's Go";
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`;

    document.querySelector(`${player} .ready span`).classList.toggle("green");
  }

  function playGameSingle() {
    if (isGameOver) return;

    if (currentPlayer === "user") {
      turnDisplay.innerHTML = "Your Go";

      computerSquares.forEach((square) =>
        square.addEventListener("click", function (e) {
          shotFired = square.dataset.id;
          revealSquare(square.classList);
        })
      );
    }

    if (currentPlayer === "enemy") {
      turnDisplay.innerHTML = "Computers Go";
      setTimeout(enemyGo, 1000);
    }
  }

  let destroyerCount = 0;
  let submarineCount = 0;
  let cruiserCount = 0;
  let battleshipCount = 0;
  let carrierCount = 0;

  function revealSquare(classList) {
    const enemySquare = computerGrid.querySelector(
      `div[data-id='${shotFired}']`
    );

    const obj = Object.values(classList);

    if (
      !enemySquare.classList.contains("boom") &&
      currentPlayer === "user" &&
      !isGameOver
    ) {
      if (obj.includes("destroyer")) destroyerCount++;
      if (obj.includes("submarine")) submarineCount++;
      if (obj.includes("cruiser")) cruiserCount++;
      if (obj.includes("battleship")) battleshipCount++;
      if (obj.includes("carrier")) carrierCount++;
    }

    if (obj.includes("taken")) {
      enemySquare.classList.add("boom");
    } else {
      enemySquare.classList.add("miss");
    }
    checkForWins();

    currentPlayer = "enemy";

    if (gameMode === "singlePlayer") playGameSingle();
  }

  let cpuDestroyerCount = 0;
  let cpuSubmarineCount = 0;
  let cpuCruiserCount = 0;
  let cpuBattleshipCount = 0;
  let cpuCarrierCount = 0;

  function enemyGo(square) {
    if (gameMode === "singlePlayer")
      square = Math.floor(Math.random() * userSquares.length);
    if (!userSquares[square].classList.contains("boom")) {
      userSquares[square].classList.add("boom");

      if (userSquares[square].classList.contains("destroyer"))
        cpuDestroyerCount++;

      if (userSquares[square].classList.contains("submarine"))
        cpuSubmarineCount++;

      if (userSquares[square].classList.contains("cruiser")) cpuCruiserCount++;

      if (userSquares[square].classList.contains("battleship"))
        cpuBattleshipCount++;

      if (userSquares[square].classList.contains("carrier")) cpuCarrierCount++;

      checkForWins();
    } else if (gameMode === "singlePlayer") enemyGo();

    currentPlayer = "user";

    turnDisplay.innerHTML = "Your Go";
  }

  function checkForWins() {
    let enemy = "computer";

    if (gameMode === "multiPlayer") enemy = "enemy";

    if (destroyerCount === 2) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s destroyer`;
      destroyerCount = 10;
    }

    if (submarineCount === 3) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s submarine`;
      submarineCount = 10;
    }

    if (cruiserCount === 3) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s cruiser`;
      cruiserCount = 10;
    }

    if (battleshipCount === 4) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s battleship`;
      battleshipCount = 10;
    }

    if (carrierCount === 5) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s carrier`;
      carrierCount = 10;
    }

    if (cpuDestroyerCount === 2) {
      infoDisplay.innerHTML = `${enemy} sunk your destroyer`;
      cpuDestroyerCount = 10;
    }

    if (cpuSubmarineCount === 3) {
      infoDisplay.innerHTML = `${enemy} sunk your submarine`;
      cpuSubmarineCount = 10;
    }

    if (cpuCruiserCount === 3) {
      infoDisplay.innerHTML = `${enemy} sunk your cruiser`;
      cpuCruiserCount = 10;
    }

    if (cpuBattleshipCount === 4) {
      infoDisplay.innerHTML = `${enemy} sunk your battleship`;
      cpuBattleshipCount = 10;
    }

    if (cpuCarrierCount === 5) {
      infoDisplay.innerHTML = `${enemy} sunk your carrier`;
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
      infoDisplay.innerHTML = `${enemy.toUpperCase()} WINS`;
      gameOver();
    }
  }

  function gameOver() {
    isGameOver = true;
    startButton.removeEventListener("click", playGameSingle);
  }
});
