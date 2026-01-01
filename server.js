const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", socket => {
  console.log("User connected", socket.id);

  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("match");
    waitingUser.emit("match");

    waitingUser = null;
  } else {
    waitingUser = socket;
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
    if (waitingUser === socket) waitingUser = null;
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
