const socket = io();

const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const localVideo = document.getElementById("myVideo");
const remoteVideo = document.getElementById("partnerVideo");

let localStream;
let peerConnection;

const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// ===== НАЧАТЬ
startBtn.onclick = async () => {
  startBtn.disabled = true;

  // 1. Включаем камеру и микрофон
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  // 2. Сообщаем серверу, что мы готовы
  socket.emit("ready");
};

// ===== ОКОНЧАНИЕ
endBtn.onclick = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
    localVideo.srcObject = null;
  }

  remoteVideo.srcObject = null;
  startBtn.disabled = false;
};

// ===== WebRTC СИГНАЛИЗАЦИЯ
socket.on("match", async () => {
  createPeer();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("offer", offer);
});

socket.on("offer", async (offer) => {
  createPeer();

  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
  await peerConnection.setRemoteDescription(answer);
});

socket.on("ice-candidate", (candidate) => {
  if (peerConnection) peerConnection.addIceCandidate(candidate);
});

function createPeer() {
  peerConnection = new RTCPeerConnection(config);

  if (localStream) {
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  }

  peerConnection.ontrack = (e) => {
    remoteVideo.srcObject = e.streams[0];
  };

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) socket.emit("ice-candidate", e.candidate);
  };
}

