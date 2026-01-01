const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waiting = null;

io.on("connection", socket => {
  if (waiting) {
    socket.partner = waiting;
    waiting.partner = socket;

    socket.emit("match", { initiator: true });
    waiting.emit("match", { initiator: false });

    waiting = null;
  } else {
    waiting = socket;
  }

  socket.on("signal", data => {
    if (socket.partner) {
      socket.partner.emit("signal", data);
    }
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("leave");
      socket.partner.partner = null;
    }
    if (waiting === socket) waiting = null;
  });
});

server.listen(process.env.PORT || 3000);
