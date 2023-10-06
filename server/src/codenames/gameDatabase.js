const mongoose = require("mongoose");
const fs = require("fs");
let URL;

// mongoose.connection.once("open", () => {
//   console.log("Mongoose connected");
// });

async function connectDatabase(URL) {
  mongoose.connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

const codenamesGameSchema = new mongoose.Schema(
  {
    room: String,
    userIds: [String],
    nicknames: [String],

    revealed: [],
    resetGameSurvey: [Boolean],
    win: String,
    turn: Number,
    firstTurn: String,
    turnNo: Number,
    clues: [],

    words: [String],
    codex: Map,
  },
  { collection: "games" }
);
const codenamesGame = mongoose.model("codenamesGame", codenamesGameSchema);

const codenamesWordSchema = new mongoose.Schema(
  {
    word: String,
  },
  { collection: "words" }
);

const codenamesWords = mongoose.model("codenamesWords", codenamesWordSchema);

async function getWords() {
  return codenamesWords.aggregate([{ $sample: { size: 25 } }]).then((coll) => {
    return coll.map((item) => item.word);
  });
}

async function getRoom() {
  let room;
  while (true) {
    room = await codenamesWords
      .aggregate([{ $sample: { size: 3 } }])
      .then((coll) => {
        return coll.map((item) => item.word).join("-");
      });
    const existing = await codenamesGame.exists({ room: room });
    if (!existing) {
      break;
    }
  }
  return room;
}
async function findGame(args) {
  let gameData = null;
  for (const [key, value] of Object.entries(args)) {
    await codenamesGame.findOne({ [key]: value }).then((obj) => {
      if (obj !== null) {
        gameData = obj;
      }
    });
    if (gameData !== null) return gameData;
  }

  return false;
}

async function newGameUploadDB(game) {
  return codenamesGame.exists({ room: game.room }).then((obj1) => {
    if (!obj1) {
      return codenamesGame
        .insertMany([game])
        .then(function () {
          return true;
        })
        .catch(function (error) {
          console.log(error);
          return false;
        });
    }
  });
}
async function updateGameDB(game) {
  return codenamesGame
    .findOneAndReplace({ room: game.room }, game, {
      upsert: true,
    })
    .then((obj) => {
      if (obj) {
        return true;
      }
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
}
async function deleteGameDB(game) {
  await codenamesGame.deleteOne({ room: game.room });
}

function databaseStartup() {
  fs.readFile("./mongoURL.txt", (err, data) => {
    if (err) throw err;
    URL = data.toString();
    connectDatabase(URL);
  });
}

module.exports = {
  databaseStartup,
  getRoom,
  getWords,
  newGameUploadDB,
  updateGameDB,
  deleteGameDB,
  findGame,
};
