const socket = io();

const myVideo = document.getElementById("myVideo");
const partnerVideo = document.getElementById("partnerVideo");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const endBtn = document.getElementById("endBtn");

let localStream = null;
let peerConnection = null;
let currentPeerId = null;

const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
  myVideo.srcObject = localStream;
}

function stopCamera() {
  if(localStream) localStream.getTracks().forEach(t => t.stop());
  myVideo.srcObject = null;
}

function createPeerConnection(peerId) {
  const pc = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  pc.ontrack = e => partnerVideo.srcObject = e.streams[0];
  pc.onicecandidate = e => {
    if(e.candidate) socket.emit("iceCandidate", { target: peerId, candidate: e.candidate });
  };
  return pc;
}

startBtn.onclick = async () => {
  await startCamera();
  socket.emit("readyForPeer");
};

nextBtn.onclick = () => {
  if(peerConnection) peerConnection.close();
  partnerVideo.srcObject = null;
  socket.emit("readyForPeer");
};

endBtn.onclick = () => {
  stopCamera();
  if(peerConnection) peerConnection.close();
  partnerVideo.srcObject = null;
};

// ===== Socket.io events =====
socket.on("foundPeer", async ({ peerId }) => {
  currentPeerId = peerId;
  peerConnection = createPeerConnection(peerId);

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("offer", { target: peerId, sdp: offer });
});

socket.on("offer", async ({ sdp, from }) => {
  currentPeerId = from;
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
  if(peerConnection) await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
