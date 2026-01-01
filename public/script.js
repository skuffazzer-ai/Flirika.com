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

let stream = null;
let usingFront = true;

// ===== CAMERA =====
async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: usingFront ? "user" : "environment" }, audio: true });
  myVideo.srcObject = stream;
  myVideo.style.display = "block";
  myLabel.style.display = "none";
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  myVideo.srcObject = null;
  myVideo.style.display = "none";
  myLabel.style.display = "flex";
}

// ===== CHAT =====
function addSystem(text) {
  const p = document.createElement("p");
  p.className = "system";
  p.textContent = text;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

// ===== BUTTONS =====
startBtn.onclick = () => {
  startCamera();
  startBtn.style.display = "none";
  endBtn.style.display = "block";
  nextBtn.style.display = "block";
  addSystem("Поиск собеседника...");
};

endBtn.onclick = () => {
  stopCamera();
  partnerVideo.srcObject = null;
  chat.innerHTML = "";
  addSystem("Чат завершён");
  startBtn.style.display = "block";
  endBtn.style.display = "none";
  nextBtn.style.display = "none";
};

nextBtn.onclick = () => {
  partnerVideo.srcObject = null;
  addSystem("Поиск следующего...");
};

// ===== FLIP CAMERA =====
flipBtn.onclick = () => {
  usingFront = !usingFront;
  stopCamera();
  startCamera();
};

// ===== CHAT MESSAGES =====
sendBtn.onclick = () => {
  if (input.value.trim()) {
    const p = document.createElement("p");
    p.textContent = "Вы: " + input.value;
    chat.appendChild(p);
    input.value = "";
    chat.scrollTop = chat.scrollHeight;
  }
};

input.addEventListener("keydown", e => {
  if (e.key === "Enter") sendBtn.click();
});

// ===== BUY SOUND =====
buyBtn.onclick = () => {
  const audio = new Audio("/coin.mp3");
  audio.play();
};

// ===== ALERT BUTTONS =====
reportBtn.onclick = () => alert("Сигнал отправлен!");
likeBtn.onclick = () => alert("Вы лайкнули собеседника!");
giftBtn.onclick = () => alert("Подарок отправлен!");
