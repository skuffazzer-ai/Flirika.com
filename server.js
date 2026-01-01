const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Статика
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

// WebRTC сигналинг через Socket.io
let users = [];

io.on('connection', socket => {
    console.log('User connected:', socket.id);

    // При поиске собеседника
    socket.on('findPartner', () => {
        const partner = users.find(u => u.id !== socket.id && !u.partner);
        if (partner) {
            users.push({ id: socket.id, partner: partner.id });
            partner.partner = socket.id;
            socket.partner = partner.id;

            socket.emit('partnerFound', { partnerId: partner.id });
            io.to(partner.id).emit('partnerFound', { partnerId: socket.id });
        } else {
            users.push({ id: socket.id });
        }
    });

    // WebRTC сигнал
    socket.on('signal', data => {
        if (socket.partner) {
            io.to(socket.partner).emit('signal', { signal: data.signal, from: socket.id });
        }
    });

    // Чат
    socket.on('chatMessage', msg => {
        if (socket.partner) {
            io.to(socket.partner).emit('chatMessage', { text: msg });
        }
    });

    // Отключение
    socket.on('disconnect', () => {
        users = users.filter(u => u.id !== socket.id && u.partner !== socket.id);
        if (socket.partner) io.to(socket.partner).emit('partnerDisconnected');
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
