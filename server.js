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
        // Соединяем с ожидающим
        socket.partnerId = waitingUser.id;
        waitingUser.partnerId = socket.id;

        socket.emit('partner-found', { partnerId: waitingUser.id });
        waitingUser.emit('partner-found', { partnerId: socket.id });

        waitingUser = null;
    } else {
        waitingUser = socket;
        socket.emit('waiting', 'Ждем собеседника...');
    }

    socket.on('signal', data => {
        if (data.partnerId) {
            io.to(data.partnerId).emit('signal', { signal: data.signal, from: socket.id });
        }
    });

    socket.on('chat-message', data => {
        if (data.partnerId) {
            io.to(data.partnerId).emit('chat-message', { message: data.message, from: socket.id });
        }
    });

    socket.on('disconnect', () => {
        if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
        if (socket.partnerId) {
            io.to(socket.partnerId).emit('partner-disconnected');
        }
        console.log('Пользователь отключился:', socket.id);
    });
});

http.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
