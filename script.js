const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const nickInput = document.getElementById('nick');
const roomSelect = document.getElementById('roomSelect');

let isPlaying = false;
let isSpectating = false;
let player = { x: 0, y: 0, radius: 20, color: 'dodgerblue', nick: '' };
let otherPlayers = {};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Oyuna Giriş Fonksiyonu
function joinGame(spectate) {
    isSpectating = spectate;
    isPlaying = !spectate;
    player.nick = nickInput.value || "Adsız";
    overlay.style.display = 'none'; // Menüyü gizle
    
    socket.emit('join', {
        room: roomSelect.value,
        nick: player.nick,
        spectate: spectate
    });
}

// ESC Tuşu Dinleyici
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        overlay.style.display = 'flex'; // Menüyü göster
        isPlaying = false;
        isSpectating = false;
    }
});

socket.on('updatePlayers', (serverPlayers) => {
    otherPlayers = serverPlayers;
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Arka Plan Grid (Çizgiler)
    ctx.strokeStyle = '#222';
    for(let x=0; x<canvas.width; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for(let y=0; y<canvas.height; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

    // Tüm Oyuncuları Çiz
    Object.keys(otherPlayers).forEach(id => {
        let p = otherPlayers[id];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();

        // İsim Yaz
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p.nick, p.x, p.y + 5);
    });

    requestAnimationFrame(draw);
}

window.addEventListener('mousemove', (e) => {
    if (isPlaying) {
        player.x = e.clientX;
        player.y = e.clientY;
        socket.emit('move', { x: player.x, y: player.y, radius: player.radius });
    }
});

draw();
