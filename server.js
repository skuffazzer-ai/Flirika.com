const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Присоединяем пользователя к собеседнику
  if (waitingUser) {
    const partner = waitingUser;
    socket.partnerId = partner.id;
    partner.partnerId = socket.id;
    
    socket.emit("partnerFound");
    partner.emit("partnerFound");
    
    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  // Relay WebRTC signaling data
  socket.on("signal", (data) => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit("signal", data);
    }
  });

  // Chat messages
  socket.on("chat", (msg) => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit("chat", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket.partnerId) {
      io.to(socket.partnerId).emit("partnerLeft");
    }
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
