const socket = io();

const myVideo = document.getElementById("myVideo");
const partnerVideo = document.getElementById("partnerVideo");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");

let localStream;
let peerConnection;
let peerId;

// WebRTC конфиг
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  myVideo.srcObject = localStream;
}

function stopCamera() {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    myVideo.srcObject = null;
  }
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    partnerVideo.srcObject = null;
  }
}

// создаём WebRTC соединение
function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config);

  // локальные треки
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // треки собеседника
  peerConnection.ontrack = (event) => {
    partnerVideo.srcObject = event.streams[0];
  };

  // ICE кандидаты
  peerConnection.onicecandidate = (event) => {
    if (event.candidate && peerId) {
      socket.emit("signal", { to: peerId, signal: { candidate: event.candidate } });
    }
  };
}

// кнопка старт
startBtn.onclick = async () => {
  await startCamera();
};

// кнопка конец
endBtn.onclick = () => {
  stopCamera();
};

// сигнализация WebRTC
socket.on("foundPeer", async (data) => {
  peerId = data.peerId;
  createPeerConnection();

  // создаём оффер
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("signal", { to: peerId, signal: { sdp: peerConnection.localDescription } });
});

socket.on("signal", async (data) => {
  if (!peerConnection) createPeerConnection();
  
  if (data.signal.sdp) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
    if (data.signal.sdp.type === "offer") {
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("signal", { to: data.from, signal: { sdp: peerConnection.localDescription } });
    }
  } else if (data.signal.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
  }
});

socket.on("peerDisconnected", () => {
  partnerVideo.srcObject = null;
});
