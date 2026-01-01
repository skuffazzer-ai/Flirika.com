const socket = io();

// DOM элементы
const myVideo = document.getElementById("myVideo");
const partnerVideo = document.getElementById("partnerVideo");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");

let localStream = null;
let peerConnection = null;

// ICE сервера для WebRTC
const config = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

// ===== Камера =====
async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  myVideo.srcObject = localStream;
}

function stopCamera() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    myVideo.srcObject = null;
  }
}

// ===== WebRTC соединение =====
function createPeerConnection(peerId) {
  peerConnection = new RTCPeerConnection(config);

  // Добавляем локальные треки
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // Когда приходит удаленный поток
  peerConnection.ontrack = (event) => {
    partnerVideo.srcObject = event.streams[0];
  };

  // ICE кандидаты
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("iceCandidate", { target: peerId, candidate: event.candidate });
    }
  };

  return peerConnection;
}

// ===== Кнопки =====
startBtn.onclick = async () => {
  await startCamera();
  socket.emit("readyForPeer");
};

endBtn.onclick = () => {
  stopCamera();
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    partnerVideo.srcObject = null;
  }
};

// ===== Socket.io события =====
socket.on("foundPeer", async ({ peerId }) => {
  peerConnection = createPeerConnection(peerId);

  // Создаем предложение
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("offer", { target: peerId, sdp: offer });
});

socket.on("offer", async ({ sdp, from }) => {
  peerConnection = createPeerConnection(from);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  socket.emit("answer", { target: from, sdp: answer });
});

socket.on("answer", async ({ sdp }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
});

socket.on("iceCandidate", async ({ candidate }) => {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (e) {
    console.error("Ошибка добавления ICE кандидата:", e);
  }
});
