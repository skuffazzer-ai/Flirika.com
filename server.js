const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let waiting = null;

io.on("connection", socket => {
  console.log("Новое соединение:", socket.id);

  socket.on("join", () => {
    if(waiting){
      // Найден собеседник
      const partner = waiting;
      waiting = null;

      socket.emit("matched", true);      // этот клиент — вызывающий
      partner.emit("matched", false);    // партнер — принимающий

      // Связываем для сигналов
      socket.partner = partner;
      partner.partner = socket;

    } else {
      waiting = socket;
    }
  });

  socket.on("signal", data => {
    if(socket.partner) socket.partner.emit("signal", data);
  });

  socket.on("disconnect", () => {
    if(waiting === socket) waiting = null;
    if(socket.partner){
      socket.partner.emit("partner-left");
      socket.partner.partner = null;
    }
  });
});

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
