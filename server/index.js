import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("join", (username) => {
    onlineUsers.push({ id: socket.id, username });
    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("next", () => {
    const others = onlineUsers.filter(u => u.id !== socket.id);
    if (others.length === 0) {
      socket.emit("noUser");
      return;
    }
    const randomUser = others[Math.floor(Math.random() * others.length)];
    socket.emit("match", randomUser);
  });

  socket.on("privateMessage", ({ to, message }) => {
    io.to(to).emit("privateMessage", { from: socket.id, message });
  });

  socket.on("publicMessage", ({ username, message }) => {
    io.emit("publicMessage", { username, message });
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter(u => u.id !== socket.id);
    io.emit("onlineUsers", onlineUsers);
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
