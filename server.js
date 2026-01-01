const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUsers = [];

io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("ready", () => {
    if (waitingUsers.length > 0) {
      const partner = waitingUsers.shift();
      socket.partner = partner;
      partner.partner = socket;

      socket.emit("match");
      partner.emit("match");
    } else {
      waitingUsers.push(socket);
    }
  });

  socket.on("offer", (data) => socket.partner?.emit("offer", data));
  socket.on("answer", (data) => socket.partner?.emit("answer", data));
  socket.on("ice-candidate", (data) => socket.partner?.emit("ice-candidate", data));

  socket.on("message", (msg) => socket.partner?.emit("message", msg));

  socket.on("disconnect", () => {
    waitingUsers = waitingUsers.filter(u => u !== socket);
    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit("partner-disconnected");
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
