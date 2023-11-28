// Handle all socket code here
const { newGame, loadGame } = require("./game");

async function createGame(io, socket, args) {
  const game = await newGame(args.playercount);
  if (!game) {
    socket.emit("errormsg", "Could not create game");
    return;
  }
  joinGame(io, socket, game, args);
}

async function findGame(socket, room) {
  const game = await loadGame({ room: room });
  if (!game) {
    socket.emit("errormsg", `Could not find the game in room ${room}`);
    return;
  }
  socket.emit("findGameResponse", game.playerData());
}

async function findandjoinGame(io, socket, args) {
  const game = await loadGame({ room: args.room });

  if (!game) {
    socket.emit("errormsg", "Could not find that game");
    return;
  }

  joinGame(io, socket, game, args);
}

async function joinGame(io, socket, game, args) {
  const userId = game.setUser(args.role, args.nickname);
  if (!userId) {
    socket.emit("errormsg", "Could not assign role");
    return;
  }
  if (!(await game.gameUpload())) {
    socket.emit("errormsg", "Could not save game to database");
    return;
  }
  socket.join(game.room);
  socket.emit("joinGameResponse", game.gameJoinData(userId));
  io.to(game.room).emit("gameUpdate", game.gameUpdate());
}

async function leaveGame(io, socket, args) {
  const game = await loadGame({ userIds: args.userId });
  if (!game) {
    socket.emit("errormsg", "Could not find that game");
    return;
  }
  if (!game.deleteUser(args.userId)) {
    socket.emit("errormsg", "Somehow failed to delete you as a user.");
    return;
  }
  if (!(await game.gameUpload())) {
    socket.emit("errormsg", "Could not save deletion to database");
    return;
  }
  socket.emit("leaveGameResponse", JSON.stringify({ userId: args.userId }));

  //Delete games with no users
  if (!game.checkActiveUsers()) {
    //delete game
    game.gameDelete();
    return;
  }
  //If a reset game poll is active, trigger a reset if appropriate
  if (!game.checkResetStatus(true)) {
    io.to(game.room).emit("gameUpdate", game.gameUpdate());
    return;
  }
  //Reset game
  await game.resetGame(io, socket, game);
  if (!(await game.gameUpload())) {
    socket.emit("errormsg", "Could not save game reset to database");
    return;
  }

  io.to(game.room).emit("resetGameResponse");
}

async function rejoinGame(io, socket, args) {
  const game = await loadGame({ userIds: args.userId });
  if (!game) {
    socket.emit("errormsg", "Couldn't find game using that user ID");
    return;
  }

  if (!game.rejoinUser(args.userId)) {
    socket.emit("errormsg", "Could not find that game to rejoin");
    return;
  }
  if (!(await game.gameUpload())) {
    socket.emit("errormsg", "Could not save game to database");
    return;
  }

  socket.join(game.room);
  socket.emit("joinGameResponse", game.gameJoinData(args.userId));
  io.to(game.room).emit("gameUpdate", game.gameUpdate());
}

//a 'ResetGameResponse' triggers the clients to request these new words
async function requestNewWords(socket, args) {
  const game = await loadGame({ userIds: args.userId });
  if (!game) {
    socket.emit("errormsg", "You are not registered on a game");
    return;
  }

  const packet = game.gameJoinPacket(args.userId);
  socket.emit("gameUpdate", JSON.stringify(packet));
  socket.emit("gameUpdate", game.gameUpdate());
}

async function resetGameRequest(io, socket, confirm, args) {
  //confirm indicates this is a resetGameConfirmation, rather than a new request
  const game = await loadGame({ userIds: args.userId });
  if (!game) {
    socket.emit("errormsg", "You are not registered on a game");
    return;
  }

  //If game has been rejected then ignore the confirm rejection
  if (confirm) {
    if (game.checkResetStatus(false)) {
      socket.emit("errormsg", "Reset game has already been rejected");
      return;
    }
  }

  if (!game.confirmReset(args.userId)) {
    socket.emit("errormsg", "You are not registered on a game");
    return;
  }

  //Otherwise prompt users to confirm/reject reset
  if (!game.checkResetStatus(true)) {
    if (!(await game.gameUpload())) {
      socket.emit("errormsg", "Server failed to update game");
      return;
    }
    io.to(game.room).emit("gameUpdate", game.gameUpdate());
    return;
  }

  //If all users have confirmed reset then reset the game and ask clients to request new words
  await game.resetGame(io, socket, game);

  if (await game.gameUpload()) {
    io.to(game.room).emit("resetGameResponse");
    return;
  } else {
    socket.emit("errormsg", "Server failed to update game");
  }
}

async function resetGameReject(io, socket, args) {
  const game = await loadGame({ userIds: args.userId });
  if (!game) {
    socket.emit("errormsg", "You are not registered on a game");
    return;
  }

  game.rejectReset();
  if (await game.gameUpload()) {
    socket.broadcast.emit("errormsg", "A user rejected the game reset");
    io.to(game.room).emit("gameUpdate", game.gameUpdate());
    return;
  }

  socket.emit("errormsg", "Unexpected error in rejecting game message");
}

async function sendClue(io, socket, args) {
  const game = await loadGame({ userIds: args.userId });

  if (!game) {
    socket.emit("errormsg", "You are not registered on a game");
    return;
  }
  if (!game.sendClue(args.userId, [args.clue, args.clueCount])) {
    socket.emit("errormsg", "It is not your turn to send a clue");
    return;
  }
  if (await game.gameUpload()) {
    io.to(game.room).emit("gameUpdate", game.gameUpdate());
  } else {
    socket.emit("errormsg", "Server failed to update game");
  }
}

async function clickWord(io, socket, args) {
  const game = await loadGame({ userIds: args.userId });
  if (!game) {
    socket.emit("errormsg", "You are not registered on a game");
    return;
  }

  if (!game.clickWord(args.userId, args.wordIndex)) {
    socket.emit("errormsg", "It is not your turn to click a word");
    return;
  }
  if (await game.gameUpload()) {
    io.to(game.room).emit("gameUpdate", game.gameUpdate());
  } else {
    socket.emit("errormsg", "Server failed to update game");
  }
}

async function endTurn(io, socket, args) {
  const game = await loadGame({ userIds: args.userId });
  if (!game) {
    socket.emit("errormsg", "You are not registered on a game");
    return;
  }

  if (!game.endTurn(args.userId)) {
    socket.emit("errormsg", "It is not even your turn");
  }
  if (await game.gameUpload()) {
    io.to(game.room).emit("gameUpdate", game.gameUpdate());
  } else {
    socket.emit("errormsg", "Server failed to update game");
  }
}

async function sendFullCodex(io, socket, args) {
  const game = await loadGame({ userIds: args.userId });
  if (!game) {
    socket.emit("errormsg", "You are not registered on a game");
    return;
  }
  const fullCodex = "";
  if (fullCodex) {
    socket.emit("sendFullCodex", fullCodex);
  }
}

function manageGame(io, socket) {
  //New Game
  socket.on("newGame", (args) => {
    if (keyCheck("newGame", socket, args)) {
      createGame(io, socket, args);
    }
  });
  //Find Game
  socket.on("findGame", (args) => {
    if (keyCheck("findGame", socket, args)) {
      findGame(socket, args.room);
    }
  });
  //Join game
  socket.on("joinGame", (args) => {
    if (keyCheck("joinGame", socket, args)) {
      findandjoinGame(io, socket, args);
    }
  });
  //Rejoin game
  socket.on("rejoinGame", (args) => {
    if (keyCheck("rejoinGame", socket, args)) {
      rejoinGame(io, socket, args);
    }
  });
  //Leave Game
  socket.on("leaveGame", (args) => {
    if (keyCheck("leaveGame", socket, args)) {
      leaveGame(io, socket, args);
    }
  });
  socket.on("resetGame", (args) => {
    if (keyCheck("resetGame", socket, args)) {
      resetGameRequest(io, socket, false, args);
    }
  });
  socket.on("resetGameConfirm", (args) => {
    if (keyCheck("resetGameConfirm", socket, args)) {
      resetGameRequest(io, socket, true, args);
    }
  });
  socket.on("resetGameReject", (args) => {
    if (keyCheck("resetGameReject", socket, args)) {
      resetGameReject(io, socket, args);
    }
  });
  socket.on("requestNewWords", (args) => {
    if (keyCheck("requestNewWords", socket, args)) {
      requestNewWords(socket, args);
    }
  });

  //Send Clue
  socket.on("sendClue", (args) => {
    if (keyCheck("sendClue", socket, args)) {
      sendClue(io, socket, args);
    }
  });
  //Make guess
  socket.on("clickWord", (args) => {
    if (keyCheck("clickWord", socket, args)) {
      clickWord(io, socket, args);
    }
  });

  //End Turn
  socket.on("endTurn", (args) => {
    if (keyCheck("endTurn", socket, args)) {
      endTurn(io, socket, args);
    }
  });

  //Request full codex
  socket.on("requestFullCodex", (args) => {
    if (keyCheck("requestFullCodex", socket, args)) {
      sendFullCodex(io, socket, args);
    }
  });
}

function keyCheck(requestType, socket, args) {
  const keysMap = new Map();
  keysMap
    .set("newGame", ["role", "nickname", "playercount"])
    .set("findGame", ["room"])
    .set("joinGame", ["room", "role", "nickname"])
    .set("rejoinGame", ["userId"])
    .set("leaveGame", ["userId"])
    .set("resetGame", ["userId"])
    .set("resetGameConfirm", ["userId"])
    .set("resetGameReject", ["userId"])
    .set("requestNewWords", ["userId"])
    .set("sendClue", ["userId", "clue", "clueCount"])
    .set("clickWord", ["userId", "wordIndex"])
    .set("endTurn", ["userId"])
    .set("requestFullCodex", ["userId"]);
  if (
    keysMap.get(requestType).every((key) => Object.keys(args).includes(key))
  ) {
    return true;
  } else {
    socket.emit(
      "errormsg",
      `A ${requestType} request requires the key(s): ${keysMap
        .get(requestType)
        .join(", ")}`
    );
    return false;
  }
}

module.exports = manageGame;
