const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", socket => {
  socket.on("join", () => {
    if (waitingUser) {
      socket.emit("matched", true);
      waitingUser.emit("matched", false);
      waitingUser = null;
    } else waitingUser = socket;
  });

  socket.on("signal", data => {
    socket.broadcast.emit("signal", data);
  });

  socket.on("disconnect", () => {
    if (waitingUser === socket) waitingUser = null;
    socket.broadcast.emit("partner-left");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

