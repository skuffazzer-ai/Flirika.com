const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

// Раздаём статические файлы из папки public
app.use(express.static('public'));

// Хранение ожидания одного пользователя для соединения
let waitingUser = null;

io.on('connection', socket => {
  console.log('Новый пользователь подключился:', socket.id);

  if (waitingUser) {
    // Если уже есть кто-то в ожидании, соединяем их
    socket.emit('partner-found', { partnerId: waitingUser.id });
    waitingUser.emit('partner-found', { partnerId: socket.id });
    waitingUser = null;
  } else {
    // Иначе ставим пользователя в очередь
    waitingUser = socket;
    socket.emit('waiting', 'Ждём собеседника...');
  }

  // Обработка сигналов WebRTC
  socket.on('signal', data => {
    io.to(data.partnerId).emit('signal', { signal: data.signal, from: socket.id });
  });

  // Обработка сообщений чата
  socket.on('chat-message', data => {
    io.to(data.partnerId).emit('chat-message', { message: data.message, from: socket.id });
  });

  // Когда пользователь отключается
  socket.on('disconnect', () => {
    if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
    socket.broadcast.emit('partner-disconnected', socket.id);
    console.log('Пользователь отключился:', socket.id);
  });
});

// Запуск сервера
http.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
