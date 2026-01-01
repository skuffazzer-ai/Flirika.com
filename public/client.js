const socket = io(); // подключение к серверу

const myVideo = document.getElementById("myVideo");
const partnerVideo = document.getElementById("partnerVideo");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");

let localStream;
let peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  myVideo.srcObject = localStream;
}

startBtn.onclick = async () => {
  await startCamera();
  socket.emit("readyForPeer");
};

// Найден собеседник
socket.on("foundPeer", async ({ peerId }) => {
  peerConnection = new RTCPeerConnection(config);

  // Локальные треки
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  // Получаем треки собеседника
  peerConnection.ontrack = event => {
    partnerVideo.srcObject = event.streams[0];
  };

  // ICE кандидаты
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("signal", { peerId, signal: event.candidate });
    }
  };

  // Создаём offer
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("signal", { peerId, signal: offer });
});

// Получаем сигнал от другого пользователя
socket.on("signal", async data => {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
      partnerVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit("signal", { peerId: data.from, signal: event.candidate });
      }
    };
  }

  if (data.signal.type === "offer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("signal", { peerId: data.from, signal: answer });
  } else if (data.signal.type === "answer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
  } else if (data.signal.candidate) {
    try { await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal)); } 
    catch(e){ console.error(e); }
  }
});

endBtn.onclick = () => {
  if (peerConnection) peerConnection.close();
  if (localStream) localStream.getTracks().forEach(track => track.stop());
  myVideo.srcObject = null;
  partnerVideo.srcObject = null;
};
