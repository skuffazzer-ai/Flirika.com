const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Статические файлы (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('Новый пользователь:', socket.id);
  socket.partnerId = null;

  socket.on('join', () => {
    if (waitingUser) {
      // Соединяем с ожидающим пользователем
      socket.partnerId = waitingUser.id;
      waitingUser.partnerId = socket.id;

      socket.emit('partner-found', { partnerId: waitingUser.id });
      waitingUser.emit('partner-found', { partnerId: socket.id });

      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.emit('waiting', 'Ждем собеседника...');
    }
  });

  socket.on('signal', (data) => {
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('signal', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('Пользователь отключился:', socket.id);
    if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
    if (socket.partnerId) {
      io.to(socket.partnerId).emit('partner-disconnected');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
