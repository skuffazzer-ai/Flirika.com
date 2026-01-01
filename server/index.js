import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let clients = [];

wss.on("connection", (ws) => {
  clients.push(ws);
  console.log("Новый клиент подключился");

  ws.on("message", (message) => {
    // Передаём сообщение другому пользователю
    const other = clients.find(c => c !== ws);
    if (other && other.readyState === other.OPEN) {
      other.send(message);
    }
  });

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
    console.log("Клиент отключился");
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Сервер сигналинга запущен на порту 3000");
});
