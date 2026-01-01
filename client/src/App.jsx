import React, { useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://REPLACE_WITH_YOUR_SERVER_URL");

export default function App() {
  const [name, setName] = useState("");
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");

  const joinChat = () => {
    if (name) socket.emit("join", name);
  };

  const sendMessage = () => {
    if (message) {
      socket.emit("message", message);
      setChat([...chat, { user: name, text: message }]);
      setMessage("");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Flirika Chat Roulette</h1>
      {!name ? (
        <>
          <input
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={joinChat}>Войти</button>
        </>
      ) : (
        <>
          <div style={{ border: "1px solid #000", height: "200px", overflowY: "scroll", marginBottom: "10px" }}>
            {chat.map((c, i) => (
              <div key={i}><b>{c.user}:</b> {c.text}</div>
            ))}
          </div>
          <input
            placeholder="Сообщение"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Отправить</button>
        </>
      )}
    </div>
  );
}
