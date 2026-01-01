const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("Новый пользователь подключен:", socket.id);

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

  socket.on("signal", (data) => {
    io.to(data.peerId).emit("signal", {
      signal: data.signal,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
    console.log("Пользователь отключился:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
