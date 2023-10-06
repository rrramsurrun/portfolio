const {
  getRoom,
  getWords,
  newGameUploadDB,
  updateGameDB,
  deleteGameDB,
  findGame,
} = require("./gameDatabase");
const { randomUUID } = require("crypto");

async function newGame() {
  const game = new Game();
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

  constructor() {
    //Never reset
    this.room = null;
    //Values which are reset individually
    this.userIds = Array(4);
    this.nicknames = Array(4);
    //Values that are reset with a new game
    this.resetGamestate();
    //reset with resetGameboard
    this.words = [];
    this.codex = {};
  }
  resetGamestate() {
    //Array of pairs - [[word, colour],...]
    this.revealed = new Array(25).fill("");
    this.resetGameSurvey = Array(4).fill(false);
    this.win = null;
    this.turn = 0; //In build: Math.random() < 0.5 ? 0 : 2;
    this.firstTurn = this.turn === 0 ? "red" : "blue";
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
      userId: this.userIds.filter((i) => i == id)[0],
      role: this.userIds.indexOf(id),
      words: this.words,
      codex:
        this.userIds.indexOf(id) % 2
          ? this.win === null
            ? null
            : this.codex
          : this.codex,
    });
  }
  gameJoinPacket(id) {
    //game board data that changes with a reset
    return {
      header: "gameResetData",
      words: this.words,
      codex:
        this.userIds.indexOf(id) % 2
          ? this.win === null
            ? null
            : this.codex
          : this.codex,
    };
  }
  // gameData(id) {
  //   return JSON.stringify({
  //     header: "gameData",
  //     ...this,
  //     userIds: null,
  //     userId: this.userIds.filter((i) => i == id)[0],
  //     role: this.userIds.indexOf(id),
  //     codex:
  //       this.userIds.indexOf(id) % 2
  //         ? this.win === null
  //           ? null
  //           : this.codex
  //         : this.codex,
  //   });
  // }
  playerData() {
    //Provide player/role data for individuals looking to join a game
    return JSON.stringify({
      header: "playerData",
      nicknames: this.nicknames,
      room: this.room,
    });
  }
  endTurn(userId) {
    if (this.userIds.indexOf(userId) === this.turn) {
      this.turn = (this.turn + 1) % 2; //In build: this.turn = (this.turn + 1) % 4;
      return true;
    } else {
      return false;
    }
  }

  clickWord(userId, i) {
    if (this.userIds.indexOf(userId) === this.turn) {
      //Find word color
      const color = this.codex.get(this.words[i]) ?? "cream";
      //Update revealed list
      this.revealed[i] = [this.words[i], color];
      //Add guesses to clues, if no guesses against clue add an array of 1
      //if previous guesses against clues, add clue guess to existing guess array
      this.clues[this.clues.length - 1].length == 2
        ? this.clues[this.clues.length - 1].push([this.words[i]])
        : this.clues[this.clues.length - 1][2].push(this.words[i]);
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
      }
      //check for win status
      if (
        this.revealed.filter((wordArr) => wordArr[1] == "blue").length ===
        (this.firstTurn === "blue" ? 9 : 8)
      ) {
        this.win = "blue";
      }
      if (
        this.revealed.filter((wordArr) => wordArr[1] == "red").length ===
        (this.firstTurn === "red" ? 9 : 8)
      ) {
        this.win = "red";
      }
      this.turnNo++;

      return true;
    } else {
      return false;
    }
  }
  sendClue(userId, clueArr) {
    if (this.userIds.indexOf(userId) === this.turn) {
      this.clues.push(clueArr);
      this.turn = (this.turn + 1) % 4;
      this.turnNo++;

      return true;
    } else {
      return false;
    }
  }
  setUser(role, nickname) {
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

    if (this.userIds[x] == undefined) {
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
