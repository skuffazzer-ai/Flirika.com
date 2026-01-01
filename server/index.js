import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let users = [];

io.on("connection", (socket) => {
  console.log("New user connected");

  socket.on("join", (name) => {
    socket.data.name = name;
    users.push(socket);
    console.log(`${name} joined`);
  });

  socket.on("message", (msg) => {
    // Отправляем всем
    io.emit("message", { user: socket.data.name, text: msg });
  });

  socket.on("disconnect", () => {
    users = users.filter((u) => u.id !== socket.id);
    console.log(`${socket.data.name} disconnected`);
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
