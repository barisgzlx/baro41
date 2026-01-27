const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

let otherPlayers = {};
let foods = [];
const worldSize = 3000;
let isPlaying = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (f) => foods = f);
socket.on('updatePlayers', (p) => otherPlayers = p);

// TUŞ KONTROLLERİ (ESC ve S)
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        overlay.style.display = (overlay.style.display === 'none') ? 'flex' : 'none';
    }
    if (e.key.toLowerCase() === 's') {
        socket.emit('buyScore');
    }
});

function join(spectate) {
    const nick = document.getElementById('nick').value;
    const room = document.getElementById('room').value;
    overlay.style.display = 'none';
    isPlaying = true;
    socket.emit('join', { room, nick, spectate });
}

window.addEventListener('mousemove', (e) => {
    if (isPlaying && otherPlayers[socket.id]) {
        const me = otherPlayers[socket.id];
        const worldMouseX = me.x + (e.clientX - canvas.width / 2);
        const worldMouseY = me.y + (e.clientY - canvas.height / 2);
        socket.emit('move', { x: worldMouseX, y: worldMouseY });
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const me = otherPlayers[socket.id];

    ctx.save();
    if (me) {
        ctx.translate(canvas.width / 2 - me.x, canvas.height / 2 - me.y);
    }

    // Grid ve Sınır
    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 1;
    for(let i=0; i<=worldSize; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, worldSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(worldSize, i); ctx.stroke();
    }

    // Yemler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI * 2); ctx.fill();
    });

    // Oyuncular
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.font = "bold 14px Arial";
        ctx.fillText(p.nick, p.x, p.y + 5);
    });

    ctx.restore();

    // HUD: Skor ve Gold (Sabit Ekran)
    if (me) {
        ctx.fillStyle = "yellow"; ctx.font = "bold 22px Arial";
        ctx.fillText(`Gold: ${me.gold}`, 20, 40);
        ctx.fillStyle = "white";
        ctx.fillText(`Skor: ${Math.floor(me.score)}`, 20, 70);
    }

    requestAnimationFrame(draw);
}
draw();
