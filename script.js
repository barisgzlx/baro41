const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

let otherPlayers = {};
let foods = [];
const worldSize = 3000;
let isPlaying = false;
let myLocalPos = { x: 1500, y: 1500 }; 
let mousePos = { x: 0, y: 0 };

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (f) => foods = f);
socket.on('updatePlayers', (p) => { otherPlayers = p; });

function join(spectate) {
    const nickVal = document.getElementById('nick').value || "baro";
    const roomVal = document.getElementById('room').value;
    overlay.style.display = 'none';
    isPlaying = true;
    socket.emit('join', { room: roomVal, nick: nickVal, spectate: spectate });
}

window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

// Ping Engelleyici Akıcı Hareket
setInterval(() => {
    if (isPlaying && otherPlayers[socket.id]) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
            myLocalPos.x += (dx / dist) * 4;
            myLocalPos.y += (dy / dist) * 4;
        }
        myLocalPos.x = Math.max(0, Math.min(worldSize, myLocalPos.x));
        myLocalPos.y = Math.max(0, Math.min(worldSize, myLocalPos.y));
        socket.emit('move', { x: myLocalPos.x, y: myLocalPos.y });
    }
}, 16);

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") overlay.style.display = (overlay.style.display === 'none') ? 'flex' : 'none';
    if (e.key.toLowerCase() === 's') socket.emit('buyScore');
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) { requestAnimationFrame(draw); return; }

    const me = otherPlayers[socket.id];
    ctx.save();
    ctx.translate(canvas.width / 2 - myLocalPos.x, canvas.height / 2 - myLocalPos.y);

    // Grid ve Sinirlar
    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI * 2); ctx.fill();
    });

    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        const dX = (id === socket.id) ? myLocalPos.x : p.x;
        const dY = (id === socket.id) ? myLocalPos.y : p.y;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(dX, dY, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.fillText(p.nick, dX, dY + 5);
    });

    ctx.restore();
    if (me) {
        ctx.fillStyle = "yellow"; ctx.font = "20px Arial";
        ctx.fillText(`Gold: ${me.gold} | Skor: ${Math.floor(me.score)}`, 20, 40);
    }
    requestAnimationFrame(draw);
}
draw();
