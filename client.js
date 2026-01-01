const socket = io();

const myVideo = document.getElementById("myVideo");
const partnerVideo = document.getElementById("partnerVideo");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");

let localStream;
let peerConnection;
let partnerId;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  myVideo.srcObject = localStream;
}

function stopStreams() {
  if (localStream) localStream.getTracks().forEach(track => track.stop());
  if (peerConnection) peerConnection.close();
  partnerVideo.srcObject = null;
}

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = (event) => {
    partnerVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate && partnerId) {
      socket.emit("signal", { peerId: partnerId, signal: event.candidate });
    }
  };
}

startBtn.onclick = async () => {
  await startCamera();
  socket.emit("readyForPeer");
};

endBtn.onclick = () => {
  stopStreams();
};

socket.on("foundPeer", async (data) => {
  partnerId = data.peerId;
  createPeerConnection();

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("signal", { peerId: partnerId, signal: offer });
});

socket.on("signal", async (data) => {
  if (!peerConnection) createPeerConnection();

  if (data.signal.type === "offer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("signal", { peerId: data.from, signal: answer });
  } else if (data.signal.type === "answer") {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
  } else if (data.signal.candidate) {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal));
  }
});
