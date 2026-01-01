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

let localStream = null;
let pc = null;
let ws = null;
let usingFront = true;

// ===== CAMERA =====
async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: usingFront ? "user" : "environment" },
    audio: true
  });
  myVideo.srcObject = localStream;
  myVideo.style.display = "block";
  myLabel.style.display = "none";
}

function stopCamera() {
  if(localStream) localStream.getTracks().forEach(track => track.stop());
  myVideo.srcObject = null;
  myVideo.style.display = "none";
  myLabel.style.display = "flex";
}

// ===== WEBSOCKET =====
function connectWS() {
  ws = new WebSocket(`ws://${location.host}`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: "join" }));
  };

  ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);

    if(data.type === "matched") {
      startWebRTC();
    }
    if(data.type === "signal") {
      await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
      if(data.signal.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "signal", signal: answer }));
      }
    }
    if(data.type === "chat") addMessage("Собеседник", data.message);
    if(data.type === "partner-left") {
      partnerVideo.srcObject = null;
      addSystem("Собеседник покинул чат");
    }
    if(data.type === "searching") addSystem("Поиск собеседника...");
  };
}

// ===== WEBRTC =====
function startWebRTC() {
  pc = new RTCPeerConnection();

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = e => {
    partnerVideo.srcObject = e.streams[0];
    partnerVideo.style.display = "block";
  };

  pc.onicecandidate = e => {
    if(e.candidate) return;
    ws.send(JSON.stringify({ type: "signal", signal: pc.localDescription }));
  };

  createOffer();
}

async function createOffer() {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  ws.send(JSON.stringify({ type: "signal", signal: offer }));
}

// ===== CHAT =====
function addSystem(text) {
  const p = document.createElement("p");
  p.className = "system";
  p.textContent = text;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

function addMessage(sender, text) {
  const p = document.createElement("p");
  p.textContent = `${sender}: ${text}`;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

// ===== BUTTONS =====
startBtn.onclick = async () => {
  await startCamera();
  startBtn.style.display = "none";
  endBtn.style.display = "block";
  nextBtn.style.display = "block";
  connectWS();
};

endBtn.onclick = () => {
  stopCamera();
  if(pc) pc.close();
  partnerVideo.srcObject = null;
  if(ws) ws.send(JSON.stringify({ type: "end" }));
  chat.innerHTML = "";
  addSystem("Чат завершён");
  startBtn.style.display = "block";
  endBtn.style.display = "none";
  nextBtn.style.display = "none";
};

nextBtn.onclick = () => {
  if(pc) pc.close();
  partnerVideo.srcObject = null;
  ws.send(JSON.stringify({ type: "next" }));
};

// ===== OTHER BUTTONS =====
flipBtn.onclick = async () => {
  usingFront = !usingFront;
  stopCamera();
  await startCamera();
};

sendBtn.onclick = () => {
  if(input.value.trim()) {
    addMessage("Вы", input.value);
    ws.send(JSON.stringify({ type: "chat", message: input.value }));
    input.value = "";
  }
};

input.addEventListener("keydown", e => {
  if(e.key === "Enter") sendBtn.click();
});

// ===== BUY SOUND =====
function playCoinSound() {
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  for (let i=0;i<3;i++) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate*0.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j=0;j<data.length;j++) data[j] = (Math.random()*2-1) * 0.3;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime+0.2);
    source.connect(gain).connect(ctx.destination);
    source.start(ctx.currentTime + i*0.05);
    source.stop(ctx.currentTime+0.25+i*0.05);
  }
}
buyBtn.onclick = playCoinSound;
