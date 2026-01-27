const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud'); // HTML'deki HUD

let otherPlayers = {};
let foods = [];
let myLocalPos = { x: 1500, y: 1500 }; 
let isPlaying = false;
let mousePos = { x: 0, y: 0 };
const worldSize = 3000;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (f) => foods = f);
socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    if (p[socket.id]) {
        const sP = p[socket.id];
        const dist = Math.sqrt((sP.x - myLocalPos.x)**2 + (sP.y - myLocalPos.y)**2);
        if (dist > 80) { myLocalPos.x = sP.x; myLocalPos.y = sP.y; }
    }
});

// ESC VE S TUŞU
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        overlay.style.display = (overlay.style.display === 'none') ? 'flex' : 'none';
        hud.style.display = (overlay.style.display === 'none') ? 'block' : 'none';
    }
    if (e.key.toLowerCase() === 's') socket.emit('buyScore');
});

// OYNA FONKSİYONU (HTML ile %100 uyumlu)
function join(spectate) {
    const nickVal = document.getElementById('nick').value || "baro";
    const roomVal = document.getElementById('room').value;
    
    overlay.style.display = 'none';
    hud.style.display = 'block'; // Giriş yapınca HUD'ı göster
    isPlaying = true;
    socket.emit('join', { room: roomVal, nick: nickVal, spectate: spectate });
}

window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

setInterval(() => {
    if (isPlaying && otherPlayers[socket.id]) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
            myLocalPos.x += (dx / dist) * 4.5;
            myLocalPos.y += (dy / dist) * 4.5;
        }
        myLocalPos.x = Math.max(0, Math.min(worldSize, myLocalPos.x));
        myLocalPos.y = Math.max(0, Math.min(worldSize, myLocalPos.y));
        socket.emit('move', { x: myLocalPos.x, y: myLocalPos.y });
    }
}, 16);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) { requestAnimationFrame(draw); return; }

    const me = otherPlayers[socket.id];
    ctx.save();
    ctx.translate(canvas.width / 2 - myLocalPos.x, canvas.height / 2 - myLocalPos.y);

    // Grid ve Sınır
    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2); ctx.fill();
    });

    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        const dX = (id === socket.id) ? myLocalPos.x : p.x;
        const dY = (id === socket.id) ? myLocalPos.y : p.y;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(dX, dY, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "bold 16px Arial";
        ctx.fillText(p.nick, dX, dY + 5);
    });
    ctx.restore();

    // HUD Güncelleme (Sol Üst)
    if (me) {
        ctx.fillStyle = "yellow"; ctx.font = "bold 22px Arial";
        ctx.fillText(`Gold: ${me.gold}`, 20, 40);
        ctx.fillStyle = "white";
        ctx.fillText(`Skor: ${Math.floor(me.score)}`, 20, 70);
    }
    requestAnimationFrame(draw);
}
draw();
