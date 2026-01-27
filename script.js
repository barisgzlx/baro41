const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let players = {}, foods = [], myId = null;
let mouse = { x: 0, y: 0 };

socket.on('connect', () => { myId = socket.id; });
socket.on('init', (data) => { players = data.players; foods = data.foods; });
socket.on('newPlayer', (p) => { players[p.id] = p; });
socket.on('playerMoved', (p) => { players[p.id] = p; });
socket.on('removePlayer', (id) => { delete players[id]; });

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX - canvas.width / 2;
    mouse.y = e.clientY - canvas.height / 2;
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!myId || !players[myId]) { requestAnimationFrame(draw); return; }

    const me = players[myId];
    // Basit hareket mantığı
    me.x += mouse.x * 0.015;
    me.y += mouse.y * 0.015;
    socket.emit('move', { x: me.x, y: me.y });

    ctx.save();
    ctx.translate(canvas.width / 2 - me.x, canvas.height / 2 - me.y);

    // Yemleri çiz
    foods.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
    });

    // Oyuncuları çiz
    Object.values(players).forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(p.name, p.x, p.y + 5);
    });

    ctx.restore();
    requestAnimationFrame(draw);
}
draw();