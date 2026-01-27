const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const nickInput = document.getElementById('nickname');

let isPlaying = false;
let isSpectating = false;
let currentRoom = 'ffa1';
let otherPlayers = {};
let myId = "";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Oda seçimi
function selectRoom(room, element) {
    currentRoom = room;
    document.querySelectorAll('.room-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

// Oyunu Başlat
function startGame(spectate) {
    isSpectating = spectate;
    isPlaying = !spectate;
    overlay.style.display = 'none';
    
    socket.emit('join', {
        room: currentRoom,
        nick: nickInput.value || "Adsız",
        spectate: spectate
    });
}

// ESC ile Menüye Dön
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        overlay.style.display = 'flex';
        isPlaying = false;
        isSpectating = false;
    }
});

socket.on('updatePlayers', (serverPlayers) => {
    otherPlayers = serverPlayers;
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Kareli Arkaplan Çizimi (Agar stili)
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    // (Arkaplan için canvas CSS gradyanı kullanıldı, burası temiz kalabilir)

    // Oyuncuları Çiz
    Object.keys(otherPlayers).forEach((id) => {
        let p = otherPlayers[id];
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();

        // İsimleri yaz
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p.nick, p.x, p.y + 5);
    });

    requestAnimationFrame(draw);
}

window.addEventListener('mousemove', (e) => {
    if (isPlaying) {
        socket.emit('move', { x: e.clientX, y: e.clientY });
    }
});

draw();
