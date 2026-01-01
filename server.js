const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Если есть ждущий пользователь — соединяем их
  if (waitingUser) {
    const peer1 = waitingUser;
    const peer2 = socket;
    peer1.emit("foundPeer", { peerId: peer2.id });
    peer2.emit("foundPeer", { peerId: peer1.id });
    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  // Сигналы WebRTC
  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", {
      from: socket.id,
      signal: data.signal
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
    socket.broadcast.emit("peerDisconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
