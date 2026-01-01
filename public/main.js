const socket = io();

const myVideo = document.getElementById("myVideo");
const partnerVideo = document.getElementById("partnerVideo");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const nextBtn = document.getElementById("nextBtn");
const sendBtn = document.getElementById("sendBtn");
const input = document.getElementById("textInput");
const chat = document.getElementById("chat");
const buyBtn = document.getElementById("buyBtn");

let localStream = null;
let peerConnection = null;
let partnerId = null;

// ICE сервер (Google STUN)
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// ===== FUNCTIONS =====
async function startMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  myVideo.srcObject = localStream;
}

function stopMedia(videoEl) {
  if (!videoEl.srcObject) return;
  videoEl.srcObject.getTracks().forEach(track => track.stop());
  videoEl.srcObject = null;
}

// ===== WEBRTC =====
function createPeerConnection(id) {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    partnerVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('signal', { candidate: event.candidate });
    }
  };

  partnerId = id;
  if (peerConnection) {
    peerConnection.createOffer()
      .then(offer => peerConnection.setLocalDescription(offer))
      .then(() => socket.emit('signal', { sdp: peerConnection.localDescription }));
  }
}

socket.on('partner-found', ({ partnerId: id }) => {
  createPeerConnection(id);
});

socket.on('signal', async (data) => {
  if (!peerConnection) createPeerConnection(null);
  if (data.sdp) {
    await peerConnection.setRemoteDescription(data.sdp);
    if (data.sdp.type === 'offer') {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('signal', { sdp: peerConnection.localDescription });
    }
  } else if (data.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

socket.on('partner-disconnected', () => {
  stopMedia(partnerVideo);
  addMessage("Собеседник отключился");
});

// ===== BUTTONS =====
startBtn.onclick = async () => {
  await startMedia();
  socket.emit('join');
  addMessage("Поиск собеседника...");
};

endBtn.onclick = () => {
  stopMedia(myVideo);
  stopMedia(partnerVideo);
  if (peerConnection) peerConnection.close();
  peerConnection = null;
  addMessage("Чат завершён");
};

nextBtn.onclick = () => {
  stopMedia(partnerVideo);
  if (peerConnection) peerConnection.close();
  peerConnection = null;
  socket.emit('join');
  addMessage("Поиск следующего собеседника...");
};

sendBtn.onclick = () => {
  if (!input.value.trim()) return;
  addMessage("Вы: " + input.value);
  socket.emit('signal', { chat: input.value });
  input.value = "";
};

function addMessage(text) {
  const p = document.createElement("p");
  p.textContent = text;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

// ===== BUY BUTTON SOUND =====
buyBtn.onclick = () => {
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  for (let i=0;i<3;i++){
    const buffer = ctx.createBuffer(1, ctx.sampleRate*0.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j=0;j<data.length;j++) data[j]=(Math.random()*2-1)*0.3;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime+0.2);
    source.connect(gain).connect(ctx.destination);
    source.start(ctx.currentTime + i*0.05);
    source.stop(ctx.currentTime + 0.25 + i*0.05);
  }
};
