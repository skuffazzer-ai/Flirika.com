const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", socket => {
  console.log("User connected:", socket.id);

  socket.on("readyForPeer", () => {
    if(waitingUser && waitingUser.id !== socket.id) {
      const peer1 = waitingUser;
      const peer2 = socket;
      peer1.emit("foundPeer", { peerId: peer2.id });
      peer2.emit("foundPeer", { peerId: peer1.id });
      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  socket.on("offer", ({ target, sdp }) => io.to(target).emit("offer", { sdp, from: socket.id }));
  socket.on("answer", ({ target, sdp }) => io.to(target).emit("answer", { sdp }));
  socket.on("iceCandidate", ({ target, candidate }) => io.to(target).emit("iceCandidate", { candidate }));

  socket.on("disconnect", () => { if(waitingUser && waitingUser.id === socket.id) waitingUser=null; });
});

server.listen(process.env.PORT || 3000, () => console.log("Server running"));
