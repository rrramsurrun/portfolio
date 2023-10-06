const fs = require("fs");
const http = require("http");
const https = require("https");

const app = require("./app");

const { codenamesserver } = require("./codenames/codenames");

const PORT = process.env.PORT || 443;

async function startServer() {
  const server = https.createServer(
    { key: fs.readFileSync("./key.pem"), cert: fs.readFileSync("./cert.pem") },
    app
  );

  const socket = codenamesserver(server);

  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
  });
}

startServer();
