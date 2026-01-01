const myVideo = document.getElementById("myVideo");
const partnerVideo = document.getElementById("partnerVideo");
const myLabel = document.getElementById("myLabel");
const chat = document.getElementById("chat");
const input = document.getElementById("textInput");

const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const nextBtn = document.getElementById("nextBtn");
const flipBtn = document.getElementById("flipBtn");
const sendBtn = document.getElementById("sendBtn");
const buyBtn = document.getElementById("buyBtn");

const reportBtn = document.getElementById("reportBtn");
const likeBtn = document.getElementById("likeBtn");
const giftBtn = document.getElementById("giftBtn");

let stream = null;
let pc = null;
let ws = null;
let usingFront = true;

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: usingFront ? "user" : "environment" }, audio:true });
  myVideo.srcObject = stream;
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  myVideo.srcObject = null;
}

// WebSocket
function connectWS() {
  ws = new WebSocket(`wss://${window.location.host}`);
  ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);
    if (data.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      if (data.sdp.type === 'offer') {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ sdp: pc.localDescription }));
      }
    } else if (data.ice) {
      try { await pc.addIceCandidate(data.ice); } catch {}
    } else if (data.chat) {
      const p = document.createElement("p");
      p.textContent = "Собеседник: " + data.chat;
      chat.appendChild(p);
      chat.scrollTop = chat.scrollHeight;
    }
  };
}

// Peer Connection
function createPeer() {
  pc = new RTCPeerConnection();
  stream.getTracks().forEach(track => pc.addTrack(track, stream));
  pc.ontrack = e => { partnerVideo.srcObject = e.streams[0]; };
  pc.onicecandidate = e => { if (e.candidate) ws.send(JSON.stringify({ ice: e.candidate })); };
}

// CHAT
sendBtn.onclick = () => {
  if(input.value.trim()) {
    const msg = input.value;
    chat.innerHTML += `<p>Вы: ${msg}</p>`;
    ws.send(JSON.stringify({ chat: msg }));
    input.value = "";
    chat.scrollTop = chat.scrollHeight;
  }
};

input.addEventListener("keydown", e => { if(e.key==="Enter") sendBtn.click(); });

// BUTTONS
startBtn.onclick = async () => {
  await startCamera();
  connectWS();
  createPeer();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({ sdp: pc.localDescription }));
};

endBtn.onclick = () => {
  stopCamera();
  if(pc) pc.close();
  partnerVideo.srcObject = null;
  chat.innerHTML = "<p class='system'>Чат завершён</p>";
};

nextBtn.onclick = () => {
  if(pc) pc.close();
  partnerVideo.srcObject = null;
  chat.innerHTML = "<p class='system'>Поиск собеседника...</p>";
};

flipBtn.onclick = async () => {
  usingFront = !usingFront;
  stopCamera();
  await startCamera();
};

// BUY SOUND
buyBtn.onclick = () => {
  const audio = new Audio("assets/coin.mp3");
  audio.play();
};
