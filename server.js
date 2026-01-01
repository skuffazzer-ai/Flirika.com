const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let waitingUser = null;

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  // Когда пользователь готов искать собеседника
  socket.on("readyForPeer", () => {
    if (waitingUser && waitingUser.id !== socket.id) {
      const peer1 = waitingUser;
      const peer2 = socket;

      // Оповещаем обоих, что найден собеседник
      peer1.emit("foundPeer", { peerId: peer2.id });
      peer2.emit("foundPeer", { peerId: peer1.id });

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  // Передача WebRTC сигналов (offer/answer/ice)
  socket.on("signal", data => {
    io.to(data.peerId).emit("signal", {
      signal: data.signal,
      from: socket.id
    });
  });

  socket.on("disconnect", () => {
    if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
