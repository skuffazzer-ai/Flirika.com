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

let localStream, pc;
let usingFront = true;

// ===== CAMERA =====
async function startCamera() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: usingFront?"user":"environment" }, audio:true });
  myVideo.srcObject = localStream;
  myVideo.style.display="block";
  myLabel.style.display="none";
}

function stopCamera() {
  if(localStream) localStream.getTracks().forEach(t => t.stop());
  myVideo.srcObject=null;
  myVideo.style.display="none";
  myLabel.style.display="flex";
}

// ===== WEBRTC =====
async function startCall() {
  pc = new RTCPeerConnection();
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  pc.ontrack = e => partnerVideo.srcObject = e.streams[0];
  pc.onicecandidate = e => { if(e.candidate) socket.emit("signal", e.candidate); };

  socket.on("signal", async data => {
    try {
      if(data.type === "offer"){
        await pc.setRemoteDescription(data);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal", pc.localDescription);
      } else if(data.type === "answer"){
        await pc.setRemoteDescription(data);
      } else if(data.candidate){
        await pc.addIceCandidate(data);
      }
    } catch(e){ console.error(e); }
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit("signal", pc.localDescription);
}

// ===== BUTTONS =====
startBtn.onclick = async () => {
  await startCamera();
  startBtn.style.display="none";
  endBtn.style.display="block";
  nextBtn.style.display="block";
  socket.emit("join");
};

endBtn.onclick = () => {
  stopCamera();
  chat.innerHTML="";
  addSystem("Чат завершён");
  startBtn.style.display="block";
  endBtn.style.display="none";
  nextBtn.style.display="none";
  if(pc) pc.close();
  pc=null;
  partnerVideo.srcObject=null;
};

nextBtn.onclick = () => {
  chat.innerHTML="";
  addSystem("Поиск собеседника...");
  if(pc) pc.close();
  pc=null;
  partnerVideo.srcObject=null;
  socket.emit("join");
};

flipBtn.onclick = async () => {
  usingFront = !usingFront;
  stopCamera();
  await startCamera();
};

// ===== CHAT =====
function addSystem(text){
  const p = document.createElement("p");
  p.className="system";
  p.textContent=text;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

socket.on("matched", initiator => {
  addSystem("Собеседник найден!");
  if(initiator) startCall();
});

socket.on("partner-left", () => {
  addSystem("Собеседник вышел");
  partnerVideo.srcObject=null;
});

sendBtn.onclick = () => {
  if(input.value.trim()){
    const msg = input.value;
    const p = document.createElement("p");
    p.textContent="Вы: "+msg;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
    socket.emit("message", msg);
    input.value="";
  }
};

socket.on("message", msg => {
  const p = document.createElement("p");
  p.textContent="Собеседник: "+msg;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
});

// ===== BUY SOUND =====
function playCoinSound() {
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  for(let i=0;i<3;i++){
    const buffer=ctx.createBuffer(1, ctx.sampleRate*0.2, ctx.sampleRate);
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
}
buyBtn.onclick = playCoinSound;

// ===== ALERTS =====
reportBtn.onclick = ()=>alert("Сигнал отправлен!");
likeBtn.onclick = ()=>alert("Вы лайкнули собеседника!");
giftBtn.onclick = ()=>alert("Подарок отправлен!");
