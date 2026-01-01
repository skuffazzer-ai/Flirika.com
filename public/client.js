const socket = io();

const myVideo = document.getElementById("myVideo");
const partnerVideo = document.getElementById("partnerVideo");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");

let localStream;
let peer;
let isInitiator = false;

startBtn.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  myVideo.srcObject = localStream;
};

socket.on("match", async data => {
  isInitiator = data.initiator;

  peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream.getTracks().forEach(track =>
    peer.addTrack(track, localStream)
  );

  peer.ontrack = e => {
    partnerVideo.srcObject = e.streams[0];
  };

  peer.onicecandidate = e => {
    if (e.candidate) {
      socket.emit("signal", { candidate: e.candidate });
    }
  };

  if (isInitiator) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("signal", { offer });
  }
});

socket.on("signal", async data => {
  if (data.offer) {
    await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit("signal", { answer });
  }

  if (data.answer) {
    await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
  }

  if (data.candidate) {
    await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

endBtn.onclick = () => {
  peer?.close();
  localStream?.getTracks().forEach(t => t.stop());
  location.reload();
};
