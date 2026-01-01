// Элементы
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
let partnerStream = null;
let usingFront = true;

// ===== CAMERA & MIC =====
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: usingFront ? "user" : "environment" }, audio: true });
        myVideo.srcObject = stream;
        myVideo.style.display = "block";
        myLabel.style.display = "none";
        // Здесь WebRTC логика для передачи потока partnerVideo
        // TODO: подключение к собеседнику через Socket.IO + RTCPeerConnection
    } catch(e) {
        alert("Не удалось включить камеру/микрофон: " + e.message);
    }
}

function stopCamera() {
    if(stream) stream.getTracks().forEach(t => t.stop());
    myVideo.srcObject = null;
    myVideo.style.display = "none";
    myLabel.style.display = "flex";
}

function stopPartner() {
    if(partnerStream) partnerStream.getTracks().forEach(t => t.stop());
    partnerVideo.srcObject = null;
}

// ===== CHAT =====
function addSystem(text){
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

nextBtn.onclick = () => {
    stopPartner();
    addSystem("Поиск следующего...");
};

endBtn.onclick = () => {
    stopCamera();
    stopPartner();
    chat.innerHTML = "";
    addSystem("Чат завершён");
    startBtn.style.display = "block";
    endBtn.style.display = "none";
    nextBtn.style.display = "none";
};

flipBtn.onclick = () => {
    usingFront = !usingFront;
    stopCamera();
    startCamera();
};

sendBtn.onclick = () => {
    if(input.value.trim()){
        const p = document.createElement("p");
        p.textContent = "Вы: " + input.value;
        chat.appendChild(p);
        // TODO: отправка текста через Socket.IO собеседнику
        input.value = "";
        chat.scrollTop = chat.scrollHeight;
    }
};

// BUY SOUND
function playCoinSound() {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    for(let i=0;i<3;i++){
        const buffer = ctx.createBuffer(1, ctx.sampleRate*0.2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let j=0;j<data.length;j++) data[j] = (Math.random()*2-1)*0.3;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime+0.2);
        source.connect(gain).connect(ctx.destination);
        source.start(ctx.currentTime + i*0.05);
        source.stop(ctx.currentTime+0.25+i*0.05);
    }
}
buyBtn.onclick = playCoinSound;

// ALERTS
reportBtn.onclick = () => { alert("Сигнал отправлен!"); }
likeBtn.onclick = () => { alert("Вы лайкнули собеседника!"); }
giftBtn.onclick = () => { alert("Подарок отправлен!"); }

// ENTER
input.addEventListener("keydown", e => { if(e.key === "Enter") sendBtn.click(); });
