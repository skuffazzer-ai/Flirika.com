const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

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

  socket.on("offer", (data) => {
    io.to(data.to).emit("offer", { sdp: data.sdp, from: socket.id });
  });

  socket.on("answer", (data) => {
    io.to(data.to).emit("answer", { sdp: data.sdp, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    io.to(data.to).emit("ice-candidate", { candidate: data.candidate, from: socket.id });
  });

  socket.on("disconnect", () => {
    if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
    io.emit("peerDisconnected", { id: socket.id });
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
