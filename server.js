const express = require("express");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "public")));

const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// WebSocket сервер для сигнализации WebRTC
const wss = new WebSocket.Server({ server });

let waitingUser = null;

wss.on("connection", ws => {
    ws.on("message", message => {
        const data = JSON.parse(message);

        // Найти собеседника
        if(data.type === "join") {
            if(waitingUser && waitingUser !== ws) {
                // Соединяем двух пользователей
                ws.partner = waitingUser;
                waitingUser.partner = ws;

                ws.send(JSON.stringify({ type: "matched" }));
                waitingUser.send(JSON.stringify({ type: "matched" }));

                waitingUser = null;
            } else {
                waitingUser = ws;
            }
        }

        // Пересылаем сигнал партнеру
        if(data.type === "signal" && ws.partner) {
            ws.partner.send(JSON.stringify({ type: "signal", signal: data.signal }));
        }

        // Чат
        if(data.type === "chat" && ws.partner) {
            ws.partner.send(JSON.stringify({ type: "chat", message: data.message }));
        }

        // Next
        if(data.type === "next") {
            if(ws.partner) {
                ws.partner.send(JSON.stringify({ type: "partner-left" }));
                ws.partner.partner = null;
                ws.partner = null;
            }
            ws.send(JSON.stringify({ type: "searching" }));
        }

        // End
        if(data.type === "end") {
            if(ws.partner) {
                ws.partner.send(JSON.stringify({ type: "partner-left" }));
                ws.partner.partner = null;
                ws.partner = null;
            }
        }
    });

    ws.on("close", () => {
        if(ws.partner) {
            ws.partner.send(JSON.stringify({ type: "partner-left" }));
            ws.partner.partner = null;
        }
        if(waitingUser === ws) waitingUser = null;
    });
});
