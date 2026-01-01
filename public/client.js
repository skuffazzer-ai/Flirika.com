const socket = io();

const myVideo = document.getElementById("myVideo");
const partnerVideo = document.getElementById("partnerVideo");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const endBtn = document.getElementById("endBtn");
const chat = document.getElementById("chat");
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");

let localStream, peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

function appendMessage(msg) {
  const p = document.createElement("p");
  p.textContent = msg;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

startBtn.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
  myVideo.srcObject = localStream;

  socket.emit("ready");
};

nextBtn.onclick = () => {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    partnerVideo.srcObject = null;
  }
  socket.emit("ready");
};

endBtn.onclick = () => {
  if (peerConnection) peerConnection.close();
  if (localStream) localStream.getTracks().forEach(t => t.stop());
  myVideo.srcObject = null;
  partnerVideo.srcObject = null;
};

sendBtn.onclick = () => {
  const msg = textInput.value.trim();
  if (!msg) return;
  appendMessage("Вы: " + msg);
  socket.emit("message", msg);
  textInput.value = "";
};

socket.on("message", msg => appendMessage("Собеседник: " + msg));

socket.on("match", async () => {
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = e => {
    partnerVideo.srcObject = e.streams[0];
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate) socket.emit("ice-candidate", e.candidate);
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
});

socket.on("offer", async offer => {
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = e => {
    partnerVideo.srcObject = e.streams[0];
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate) socket.emit("ice-candidate", e.candidate);
  };

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
});

socket.on("answer", async answer => {
  await peerConnection.setRemoteDescription(answer);
});

socket.on("ice-candidate", async candidate => {
  try { await peerConnection.addIceCandidate(candidate); } catch(e) {}
});

socket.on("partner-disconnected", () => {
  if (peerConnection) peerConnection.close();
  peerConnection = null;
  partnerVideo.srcObject = null;
  appendMessage("Собеседник отключился");
});
