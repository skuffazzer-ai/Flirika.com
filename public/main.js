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

const reportBtn = document.getElementById("reportBtn");
const likeBtn = document.getElementById("likeBtn");
const giftBtn = document.getElementById("giftBtn");

let localStream;
let pc;
let usingFront = true;

// ===== CAMERA =====
async function startCamera(){
  localStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: usingFront ? "user" : "environment" },
    audio: true
  });
  myVideo.srcObject = localStream;
  myVideo.style.display="block";
  myLabel.style.display="none";
}

function stopCamera(){
  if(localStream) localStream.getTracks().forEach(t => t.stop());
  myVideo.srcObject = null;
  myVideo.style.display="none";
  myLabel.style.display="flex";
}

// ===== WEBRTC =====
async function startCall(){
  pc = new RTCPeerConnection();

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = event => {
    partnerVideo.srcObject = event.streams[0];
  };

  pc.onicecandidate = event => {
    if(event.candidate) socket.emit("signal", event.candidate);
  };

  socket.on("signal", async data => {
    try {
      if(data.type === "offer"){
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("signal", pc.localDescription);
      } else if(data.type === "answer"){
        await pc.setRemoteDescription(new RTCSessionDescription(data));
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
  chat.innerHTML = "";
  addSystem("Чат завершён");
  startBtn.style.display="block";
  endBtn.style.display="none";
  nextBtn.style.display="none";
  if(pc) pc.close();
};

nextBtn.onclick = () => {
  chat.innerHTML = "";
  addSystem("Поиск собеседника...");
  if(pc) pc.close();
  pc = null;
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
  p.textContent = text;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

socket.on("matched", (initiator) => {
  addSystem("Собеседник найден!");
  if(initiator) startCall();
});

socket.on("partner-left", () => {
  addSystem("Собеседник вышел");
  partnerVideo.srcObject = null;
});

// Отправка сообщений
sendBtn.onclick = () => {
  if(input.value.trim()){
    const msg = input.value;
    const p = document.createElement("p");
    p.textContent = "Вы: " + msg;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
    socket.emit("message", msg);
    input.value = "";
  }
};

socket.on("message", msg => {
  const p = document.createElement("p");
  p.textContent = "Собеседник: " + msg;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
});

// Подарки и лайки
reportBtn.onclick = () => alert("Сигнал отправлен!");
likeBtn.onclick = () => alert("Вы лайкнули собеседника!");
giftBtn.onclick = () => alert("Подарок отправлен!");
