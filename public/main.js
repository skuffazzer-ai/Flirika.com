const socket = io();

const myVideo = document.getElementById('myVideo');
const partnerVideo = document.getElementById('partnerVideo');
const chat = document.getElementById('chat');
const input = document.getElementById('textInput');

const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const endBtn = document.getElementById('endBtn');
const sendBtn = document.getElementById('sendBtn');

let myStream;
let peerConnection;
let partnerId;

const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// ======= CAMERA =======
async function startCamera() {
    myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    myVideo.srcObject = myStream;
    myVideo.style.display = 'block';
}

function stopCamera() {
    if (myStream) myStream.getTracks().forEach(t => t.stop());
    myVideo.srcObject = null;
    myVideo.style.display = 'none';
}

// ======= WebRTC =======
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = event => {
        if (event.candidate && partnerId) {
            socket.emit('signal', { partnerId, signal: { candidate: event.candidate } });
        }
    };

    peerConnection.ontrack = event => {
        partnerVideo.srcObject = event.streams[0];
        partnerVideo.style.display = 'block';
    };

    if (myStream) {
        myStream.getTracks().forEach(track => peerConnection.addTrack(track, myStream));
    }
}

async function startCall() {
    createPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('signal', { partnerId, signal: offer });
}

async function handleSignal(data) {
    if (!peerConnection) createPeerConnection();

    if (data.signal.type === 'offer') {
        partnerId = data.from;
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('signal', { partnerId: data.from, signal: answer });
    } else if (data.signal.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
    } else if (data.signal.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
    }
}

// ======= CHAT =======
sendBtn.onclick = () => {
    if (input.value.trim() && partnerId) {
        socket.emit('chat-message', { partnerId, message: input.value });
        addMessage(`Вы: ${input.value}`);
        input.value = '';
    }
};

function addMessage(text) {
    const p = document.createElement('p');
    p.textContent = text;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
}

// ======= BUTTONS =======
startBtn.onclick = async () => {
    await startCamera();
};

nextBtn.onclick = () => {
    if (peerConnection) {
        peerConnection.close();
        partnerVideo.srcObject = null;
        peerConnection = null;
    }
};

endBtn.onclick = () => {
    stopCamera();
    if (peerConnection) peerConnection.close();
    partnerVideo.srcObject = null;
    peerConnection = null;
};

// ======= SOCKET EVENTS =======
socket.on('partner-found', data => {
    partnerId = data.partnerId;
    if (myStream) startCall();
});

socket.on('signal', handleSignal);

socket.on('chat-message', data => addMessage(`Собеседник: ${data.message}`));

socket.on('waiting', msg => addMessage(msg));

socket.on('partner-disconnected', () => {
    addMessage('Собеседник отключился');
    partnerVideo.srcObject = null;
    peerConnection = null;
});
