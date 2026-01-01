const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {

  socket.on("ready", () => {
    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("match");
      waitingUser.emit("match");

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on("offer", (data) => socket.partner?.emit("offer", data));
  socket.on("answer", (data) => socket.partner?.emit("answer", data));
  socket.on("ice-candidate", (data) => socket.partner?.emit("ice-candidate", data));

  socket.on("disconnect", () => {
    if (waitingUser === socket) waitingUser = null;
    if (socket.partner) socket.partner.partner = null;
  });
});

server.listen(process.env.PORT || 3000);

