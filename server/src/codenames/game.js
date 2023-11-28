const {
  getRoom,
  getWords,
  newGameUploadDB,
  updateGameDB,
  deleteGameDB,
  findGame,
} = require("./gameDatabase");
const { randomUUID } = require("crypto");

async function newGame(playercount) {
  const game = new Game(playercount);
  //request words and generate codex
  await game.resetGameboard(true);
  if (await game.newGameUpload()) {
    return game;
  } else {
    return false;
  }
}

async function loadGame(args) {
  const gameData = await findGame(args);
  if (!gameData) {
    return false;
  } else {
    //Load an empty game to access object functions
    const game = new Game();
    game.loader(gameData);
    return game;
  }
}

class Game {
  //Database functions
  async newGameUpload() {
    return newGameUploadDB(this);
  }
  async gameUpload() {
    return updateGameDB(this);
  }
  async gameDelete() {
    deleteGameDB(this);
  }

  constructor(playercount) {
    //Playercount is always 4 or 2
    //add playercount
    this.playercount = playercount;
    //Doesn't reset between games
    this.room = null;
    //Values which are reset individually
    this.userIds = Array(4);
    this.nicknames = Array(4);
    //Values that are reset with a new game
    this.resetGamestate();
    //reset with resetGameboard
    this.words = [];
    this.codex = {};
    this.firstTurn = "";
  }
  resetGamestate() {
    //Array of pairs - [[word, colour],...]
    this.revealed = Array(25);
    this.resetGameSurvey = Array(4).fill(false);
    this.win = null;
    this.turn = Math.random() < 0.5 ? 0 : 2;
    //Codex has 1 extra card for starting team
    if (this.playercount === 4) {
      this.firstTurn = this.turn === 0 ? "red" : "blue";
    }

    this.turnNo = 0;
    //Array of 1:many arrays - [[clue1, [guess1,guess2,...]],...]
    this.clues = [];
  }
  async resetGameboard(newGame) {
    this.words = [];
    this.codex = {};
    //Get room if new game
    if (newGame) {
      this.room = await getRoom();
    }
    let tempArray;
    tempArray = await getWords().then((data) => {
      return data;
    });
    this.words = tempArray;
    this.generateCodex();
  }
  generateCodex() {
    if (this.playercount === 4) {
      const deepCopy = JSON.parse(JSON.stringify(this.words));
      //1 black card, 9 cards to first team, 8 cards to second team
      deepCopy
        .sort(() => 0.5 - Math.random())
        .slice(0, 18)
        .forEach((e, i) => {
          if (i === 0) {
            this.codex[e] = "black";
          } else if (i <= 9) {
            //first team has nine cards
            this.codex[e] = this.firstTurn;
          } else {
            //Other team has 8 cards
            this.codex[e] = this.firstTurn === "red" ? "blue" : "red";
          }
        });
    }
    if (this.playercount === 2) {
      const deepCopy = JSON.parse(JSON.stringify(this.words));
      const player1Colours = [
        "black",
        "cream",
        "cream",
        "cream",
        "cream",
        "cream",
        "green",
        "green",
        "green",
        "green",
        "green",
        "green",
        "green",
        "green",
        "green",
        "cream",
        "black",
        "cream",
        "cream",
        "cream",
        "cream",
        "cream",
        "cream",
        "cream",
        "black",
      ];
      const player2Colours = [
        "green",
        "green",
        "green",
        "green",
        "green",
        "green",
        "green",
        "green",
        "green",
        "cream",
        "cream",
        "cream",
        "cream",
        "cream",
        "black",
        "black",
        "black",
        "cream",
        "cream",
        "cream",
        "cream",
        "cream",
        "cream",
        "cream",
        "cream",
      ];
      deepCopy
        .sort(() => 0.5 - Math.random())
        .forEach((e, i) => {
          this.codex[e] = [player1Colours[i], player2Colours[i]];
        });
    }
  }

  loader(gameData) {
    for (const k in this) {
      this[k] = gameData[k];
    }
  }

  async resetGame() {
    this.resetGamestate();
    await this.resetGameboard(false);
  }

  gameUpdate() {
    //Provide data on other users and turn progression
    return JSON.stringify({
      header: "gameUpdate",
      nicknames: this.nicknames,
      turn: this.turn,
      clues: this.clues,
      guesses: this.guesses,
      win: this.win,
      revealed: this.revealed,
      resetGameSurvey: this.resetGameSurvey,
    });
  }
  gameJoinData(id) {
    //provide user-specific data and game board
    //these will only change between games

    return JSON.stringify({
      header: "gameJoinData",
      room: this.room,
      playercount: this.playercount,
      userId: this.userIds.filter((i) => i == id)[0],
      role: this.userIds.indexOf(id),
      words: this.words,
      codex: this.sendCodex(id),
      firstTurn: this.firstTurn,
    });
  }
  gameJoinPacket(id) {
    //game board data that changes with a reset
    return {
      header: "gameResetData",
      words: this.words,
      codex: this.sendCodex(id),
    };
  }
  sendCodex(id) {
    const i = this.userIds.indexOf(id);
    if (this.playercount === 4) {
      return i % 2 ? (this.win === null ? null : this.codex) : this.codex;
    }
    if (this.playercount === 2) {
      const halfcodex = {};
      for (const [k, v] of Object.entries(this.codex)) {
        halfcodex[k] = v[i === 2 ? 1 : 0];
      }
      return halfcodex;
    }
  }
  playerData() {
    //Provide player/role data for individuals looking to join a game
    return JSON.stringify({
      header: "playerData",
      nicknames: this.nicknames,
      room: this.room,
      playercount: this.playercount,
    });
  }
  endTurn(userId) {
    let userpos = this.userIds.indexOf(userId);
    if (this.playercount === 4) {
      if (userpos === this.turn) {
        this.turn = (this.turn + 1) % 4;
        return true;
      } else {
        return false;
      }
    }
    if (this.playercount === 2) {
      if (userpos + this.turn === 3) {
        this.turn = (this.turn + 1) % 4;
        return true;
      } else {
        return false;
      }
    }
  }

  clickWord(userId, i) {
    let userpos = this.userIds.indexOf(userId);

    if (
      (this.playercount === 4 && userpos === this.turn) ||
      (this.playercount === 2 && userpos + this.turn === 3)
    ) {
      const word = this.words[i];
      let color;
      if (this.playercount === 4) {
        //Find word color
        color = this.codex[word] ?? "cream";
        //Update revealed list
        this.revealed[i] = color;
        //apply game logic to word choice
        if (
          color === "cream" ||
          (this.turn === 1) & (color === "blue") ||
          (this.turn === 3) & (color === "red")
        ) {
          //selected other team's card
          this.endTurn(userId);
        } else if (color === "black") {
          //selected assassin card, end game
          this.win = this.turn === 1 ? "blue" : "red";
          this.populateRevealed();
        }
        //check for win status
        if (
          this.revealed.filter((wordcolor) => wordcolor == "blue").length ===
          (this.firstTurn === "blue" ? 9 : 8)
        ) {
          this.win = "blue";
          this.populateRevealed();
        }
        if (
          this.revealed.filter((wordcolor) => wordcolor == "red").length ===
          (this.firstTurn === "red" ? 9 : 8)
        ) {
          this.win = "red";
          this.populateRevealed();
        }
      }
      if (this.playercount === 2) {
        //Find the colour of the word on the partner's codex
        userpos = userpos === 2 ? 1 : 0;
        const otherpos = userpos === 1 ? 0 : 1;
        color = this.codex[word][otherpos];
        const owncolor = this.codex[word][userpos];
        //if undefined, create an array
        if (this.revealed[i] === null) {
          this.revealed[i] = [];
        }
        //add color to other array (mirroring the codex)
        this.revealed[i][otherpos] = color;

        if (color === "black") {
          //Selected Assassin card
          this.win = "lose";
          this.populateRevealed();
        } else if (color === "cream") {
          //Selected civillian card
          this.endTurn(userId);
        } else if (color === "green") {
          //check for win condition
          if (
            this.revealed.filter(
              (wordcolor) =>
                wordcolor !== null &&
                (wordcolor[0] === "green" ||
                  (wordcolor.length === 2 && wordcolor[1] === "green"))
            ).length === 15
          ) {
            this.win = "win";
            this.populateRevealed();
          }
        }
      }

      //Add guesses to clues, if no guesses against clue add an array of 1
      //if previous guesses against clues, add clue guess to existing guess array
      this.clues[this.clues.length - 1].length == 3
        ? this.clues[this.clues.length - 1].push([this.words[i]])
        : this.clues[this.clues.length - 1][3].push(this.words[i]);
      this.turnNo++;

      return true;
    } else {
      return false;
    }
  }
  populateRevealed() {
    if (this.playercount === 2) {
      for (const [k, v] of Object.entries(this.codex)) {
        const i = this.words.indexOf(k);
        if (this.revealed[i] === null) {
          this.revealed[i] = [];
        }
        this.revealed[i][0] = v[0];
        this.revealed[i][1] = v[1];
      }
    }
    if (this.playercount === 4) {
      for (const [k, v] of Object.entries(this.codex)) {
        const i = this.words.indexOf(k);
        this.revealed[i] = v ?? "cream";
      }
    }
  }
  sendClue(userId, clueArr) {
    if (this.userIds.indexOf(userId) === this.turn) {
      clueArr.unshift(this.userIds.indexOf(userId));
      this.clues.push(clueArr);
      this.turn = (this.turn + 1) % 4;
      this.turnNo++;
      return true;
    } else {
      return false;
    }
  }

  setUser(role, nickname) {
    if (role && this.playercount === 4) {
      let x;
      switch (role) {
        case "red Spymaster":
          x = 0;
          break;
        case "red Operative":
          x = 1;
          break;
        case "blue Spymaster":
          x = 2;
          break;
        case "blue Operative":
          x = 3;
          break;
      }
      return this.setAndReturnUser(x, nickname);
    }
    const tempId = this.setAndReturnUser(0, nickname);
    if (tempId === false) {
      return this.setAndReturnUser(2, nickname);
    }
    return tempId;
  }
  setAndReturnUser(x, nickname) {
    if (this.userIds[x] === undefined || this.userIds[x] === null) {
      this.userIds[x] = randomUUID();
      this.nicknames[x] = nickname;
      return this.userIds[x];
    } else {
      return false;
    }
  }
  deleteUser(userId) {
    let userPos;
    if (!this.userIds.includes(userId)) {
      return false;
    } else {
      userPos = this.userIds.indexOf(userId);
    }
    this.nicknames[userPos] = null;
    this.userIds[userPos] = null;
    return true;
  }
  rejoinUser(userId) {
    if (!this.userIds.includes(userId)) {
      return false;
    } else {
      return userId;
    }
  }

  confirmReset(userId) {
    let userPos;
    if (!this.userIds.includes(userId)) {
      return false;
    }
    userPos = this.userIds.indexOf(userId);
    this.resetGameSurvey[userPos] = true;
    return true;
  }

  rejectReset(userId) {
    if (!this.userIds.includes(userId)) {
      return false;
    }
    this.resetGameSurvey.fill(false);
    return true;
  }

  checkResetStatus(check) {
    return (
      this.resetGameSurvey.filter((i) => i === check).length ===
      this.userIds.filter((i) => i !== null).length
    );
  }

  checkActiveUsers() {
    return this.userIds.filter((i) => i !== null).length > 0;
  }
}

module.exports = { newGame, loadGame };
