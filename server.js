const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const io = new Server(server);

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", () => {
    if (waitingUser) {
      const partner = waitingUser;
      waitingUser = null;

      socket.partner = partner.id;
      partner.partner = socket.id;

      socket.emit("partnerFound", partner.id);
      partner.emit("partnerFound", socket.id);
    } else {
      waitingUser = socket;
      socket.emit("waiting");
    }
  });

  socket.on("signal", (data) => {
    if (socket.partner) {
      io.to(socket.partner).emit("signal", { from: socket.id, data });
    }
  });

  socket.on("disconnect", () => {
    if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
    if (socket.partner) io.to(socket.partner).emit("partnerDisconnected");
  });
});

server.listen(process.env.PORT || 3000, () => console.log("Server running..."));
