const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', socket => {
    console.log('Новый пользователь:', socket.id);

    if (waitingUser) {
        // соединяем с ожидающим
        socket.emit('partner-found', { partnerId: waitingUser.id });
        waitingUser.emit('partner-found', { partnerId: socket.id });
        waitingUser = null;
    } else {
        waitingUser = socket;
        socket.emit('waiting', 'Ждем собеседника...');
    }

    socket.on('signal', data => {
        io.to(data.partnerId).emit('signal', { signal: data.signal, from: socket.id });
    });

    socket.on('chat-message', data => {
        io.to(data.partnerId).emit('chat-message', { message: data.message, from: socket.id });
    });

    socket.on('disconnect', () => {
        if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
        socket.broadcast.emit('partner-disconnected', socket.id);
        console.log('Пользователь отключился:', socket.id);
    });
});

http.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
