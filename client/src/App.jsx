import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://YOUR-RENDER-SERVER.onrender.com"); // замените на URL вашего сервера

export default function App() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [match, setMatch] = useState(null);
  const [privateMsg, setPrivateMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [publicMsg, setPublicMsg] = useState("");
  const [publicMessages, setPublicMessages] = useState([]);

  useEffect(() => {
    socket.on("match", (user) => setMatch(user));
    socket.on("noUser", () => alert("Пока нет других пользователей."));
    socket.on("privateMessage", ({ from, message }) => {
      setMessages(prev => [...prev, { from, message }]);
    });
    socket.on("publicMessage", ({ username, message }) => {
      setPublicMessages(prev => [...prev, { username, message }]);
    });
  }, []);

  const joinChat = () => {
    if (!username) return alert("Введите имя");
    socket.emit("join", username);
    setJoined(true);
  };

  const nextUser = () => socket.emit("next");

  const sendPrivateMessage = () => {
    if (!match) return alert("Нет собеседника");
    socket.emit("privateMessage", { to: match.id, message: privateMsg });
    setMessages(prev => [...prev, { from: "Вы", message: privateMsg }]);
    setPrivateMsg("");
  };

  const sendPublicMessage = () => {
    if (!publicMsg) return;
    socket.emit("publicMessage", { username, message: publicMsg });
    setPublicMsg("");
  };

  if (!joined) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Введите ваше имя:</h2>
        <input value={username} onChange={e => setUsername(e.target.value)} />
        <button onClick={joinChat}>Войти</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 20, padding: 20 }}>
      {/* Личный чат */}
      <div style={{ flex: 1 }}>
        <h3>Личный чат {match ? `с ${match.username}` : ""}</h3>
        <button onClick={nextUser}>Следующий</button>
        <div style={{ border: "1px solid black", height: 300, overflowY: "auto", padding: 5 }}>
          {messages.map((m, i) => (
            <div key={i}><b>{m.from}:</b> {m.message}</div>
          ))}
        </div>
        <input value={privateMsg} onChange={e => setPrivateMsg(e.target.value)} />
        <button onClick={sendPrivateMessage}>Отправить</button>
      </div>

      {/* Общий чат */}
      <div style={{ flex: 1 }}>
        <h3>Общий чат</h3>
        <div style={{ border: "1px solid black", height: 300, overflowY: "auto", padding: 5 }}>
          {publicMessages.map((m, i) => (
            <div key={i}><b>{m.username}:</b> {m.message}</div>
          ))}
        </div>
        <input value={publicMsg} onChange={e => setPublicMsg(e.target.value)} />
        <button onClick={sendPublicMessage}>Отправить</button>
      </div>
    </div>
  );
}
