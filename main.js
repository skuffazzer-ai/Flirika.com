const myVideo = document.getElementById("myVideo");
const myLabel = document.getElementById("myLabel");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const buyBtn = document.getElementById("buyBtn");

let stream = null;

// ▶️ ВКЛЮЧИТЬ КАМЕРУ + МИКРОФОН
startBtn.onclick = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    myVideo.srcObject = stream;
    myVideo.style.display = "block";
    myLabel.style.display = "none";
  } catch (err) {
    alert("Нет доступа к камере или микрофону");
    console.error(err);
  }
};

// ⏹ ВЫКЛЮЧИТЬ КАМЕРУ + МИКРОФОН
endBtn.onclick = () => {
  if (!stream) return;

  stream.getTracks().forEach(track => track.stop());
  stream = null;

  myVideo.srcObject = null;
  myVideo.style.display = "none";
  myLabel.style.display = "flex";
};

// 🔊 ЗВУК BUY
buyBtn.onclick = () => {
  const audio = new Audio("coin.mp3");
  audio.play();
};
