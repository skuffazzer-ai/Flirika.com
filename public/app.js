const socket = io();

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

let localStream;
let peerConnection;
let partnerId = null;
let usingFront = true;

async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:usingFront?"user":"environment"}, audio:true });
  myVideo.srcObject = localStream;
  myVideo.style.display="block";
  myLabel.style.display="none";
}

function stopCamera() {
  if(localStream) localStream.getTracks().forEach(t=>t.stop());
  myVideo.srcObject=null;
  myVideo.style.display="none";
  myLabel.style.display="flex";
}

function addSystem(text){
  const p=document.createElement("p");
  p.className="system";
  p.textContent=text;
  chat.appendChild(p);
  chat.scrollTop=chat.scrollHeight;
}

startBtn.onclick = async () => {
  await startCamera();
  startBtn.style.display="none";
  endBtn.style.display="block";
  nextBtn.style.display="block";
  socket.emit("join");
};

endBtn.onclick = () => {
  stopCamera();
  if(peerConnection) {
    peerConnection.getSenders().forEach(s=>s.track.stop());
    peerConnection.close();
    peerConnection = null;
  }
  chat.innerHTML="";
  addSystem("Чат завершён");
  startBtn.style.display="block";
  endBtn.style.display="none";
  nextBtn.style.display="none";
};

nextBtn.onclick = () => {
  if(peerConnection) {
    peerConnection.getSenders().forEach(s=>s.track.stop());
    peerConnection.close();
    peerConnection = null;
  }
  chat.innerHTML="";
  addSystem("Поиск следующего собеседника...");
  socket.emit("join");
};

flipBtn.onclick = () => {
  usingFront = !usingFront;
  stopCamera();
  startCamera();
};

sendBtn.onclick = () => {
  if(input.value.trim()) {
    const p = document.createElement("p");
    p.textContent = "Вы: "+input.value;
    chat.appendChild(p);
    socket.emit("signal", { chat: input.value });
    input.value="";
    chat.scrollTop=chat.scrollHeight;
  }
};

input.addEventListener("keydown", e => { if(e.key==="Enter") sendBtn.click(); });

buyBtn.onclick = () => {
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  for(let i=0;i<3;i++){
    const buffer=ctx.createBuffer(1,ctx.sampleRate*0.2,ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let j=0;j<data.length;j++) data[j]=(Math.random()*2-1)*0.3;
    const source=ctx.createBufferSource();
    source.buffer=buffer;
    const gain=ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime+0.2);
    source.connect(gain).connect(ctx.destination);
    source.start(ctx.currentTime+i*0.05);
    source.stop(ctx.currentTime+0.25+i*0.05);
  }
};

// WebRTC
socket.on("partnerFound", (id) => {
  partnerId = id;
  peerConnection = new RTCPeerConnection({ iceServers:[{urls:"stun:stun.l.google.com:19302"}] });
  localStream.getTracks().forEach(track=>peerConnection.addTrack(track, localStream));
  peerConnection.ontrack = e => { partnerVideo.srcObject = e.streams[0]; };
  peerConnection.onicecandidate = e => { if(e.candidate) socket.emit("signal", { candidate:e.candidate }); };
  peerConnection.createOffer().then(offer => {
    peerConnection.setLocalDescription(offer);
    socket.emit("signal", { sdp: offer });
  });
});

socket.on("signal", async data => {
  if(data.data.sdp){
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.data.sdp));
    if(data.data.sdp.type==="offer"){
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("signal",{ sdp: answer });
    }
  } else if(data.data.candidate){
    await peerConnection.addIceCandidate(data.data.candidate);
  } else if(data.data.chat){
    const p=document.createElement("p");
    p.textContent = "Собеседник: "+data.data.chat;
    chat.appendChild(p);
    chat.scrollTop=chat.scrollHeight;
  }
});

socket.on("waiting", () => addSystem("Ждем собеседника..."));
socket.on("partnerDisconnected", () => addSystem("Собеседник отключился."));

reportBtn.onclick = () => alert("Сигнал отправлен!");
likeBtn.onclick = () => alert("Вы лайкнули собеседника!");
giftBtn.onclick = () => alert("Подарок отправлен!");
