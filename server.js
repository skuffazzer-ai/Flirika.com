const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("Пользователь подключился:", socket.id);

  // ===== Найти собеседника =====
  socket.on("readyForPeer", () => {
    if (waitingUser && waitingUser.id !== socket.id) {
      const peer1 = waitingUser;
      const peer2 = socket;
      peer1.emit("foundPeer", { peerId: peer2.id });
      peer2.emit("foundPeer", { peerId: peer1.id });
      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  // ===== Обмен SDP =====
  socket.on("offer", ({ target, sdp }) => {
    io.to(target).emit("offer", { sdp, from: socket.id });
  });

  socket.on("answer", ({ target, sdp }) => {
    io.to(target).emit("answer", { sdp });
  });

  // ===== ICE кандидаты =====
  socket.on("iceCandidate", ({ target, candidate }) => {
    io.to(target).emit("iceCandidate", { candidate });
  });

  // ===== Отключение =====
  socket.on("disconnect", () => {
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
    console.log("Пользователь отключился:", socket.id);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Сервер запущен на порту 3000");
});
