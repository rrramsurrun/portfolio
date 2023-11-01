import socketIO from "socket.io-client";

class SocketHandler extends socketIO {
  constructor(url, options) {
    super(url, options);
    this.userId = null;
  }
  connecttoserver = function () {
    if (!this.connected) {
      this.connect((err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  };
  decorativeEmit = function (requestType, args) {
    this.connecttoserver();
    this.emit(requestType, args);
  };

  newGame = function (role, nickname, playercount) {
    this.decorativeEmit("newGame", {
      role: role,
      nickname: nickname,
      playercount: playercount,
    });
  };

  findGame = function (room) {
    this.decorativeEmit("findGame", { room: room });
  };
  joinGame = function (room, role, nickname) {
    this.decorativeEmit("joinGame", {
      room: room,
      role: role,
      nickname: nickname,
    });
  };
  rejoinGame = function (userId) {
    this.decorativeEmit("rejoinGame", { userId: userId });
  };

  leaveGame = function () {
    this.decorativeEmit("leaveGame", { userId: this.userId });
  };

  resetGame = function () {
    this.decorativeEmit("resetGame", { userId: this.userId });
  };

  resetConfirm = function (reset) {
    if (reset) {
      this.decorativeEmit("resetGameConfirm", { userId: this.userId });
    } else {
      this.decorativeEmit("resetGameReject", { userId: this.userId });
    }
  };
  requestNewWords = function () {
    this.decorativeEmit("requestNewWords", { userId: this.userId });
  };

  sendClue = function (clue, clueCount) {
    this.decorativeEmit("sendClue", {
      userId: this.userId,
      clue: clue,
      clueCount: clueCount,
    });
  };
  clickWord = function (wordIndex) {
    this.decorativeEmit("clickWord", {
      userId: this.userId,
      wordIndex: wordIndex,
    });
  };
  endTurn = function () {
    this.decorativeEmit("endTurn", { userId: this.userId });
  };
}

const URL =
  process.env.NODE_ENV === "production"
    ? "wss://ramsurrun-portfolio.com"
    : "wss://localhost";

export const mysocket = new SocketHandler(URL, {
  autoConnect: false,
});
