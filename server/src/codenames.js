const { Server } = require("socket.io");
const manageGame = require("./gameManager");
const { databaseStartup } = require("./gameDatabase");

async function codenamesserver(server) {
  const io = new Server(server, {
    cors: { origin: "http://localhost:3000" },
    rejectUnauthorized: false,
  });

  databaseStartup();

  io.on("connection", function socket(socket) {
    // console.log(`Connected socket ${socket.id}`);
    manageGame(io, socket);
  });
}

module.exports = { codenamesserver };
