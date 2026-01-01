const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let waitingUser = null;

// Отдаём статические файлы из public/
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", socket => {
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

// На любой GET / отдаём index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port", PORT));
