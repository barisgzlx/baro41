const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const worldSize = 3000;

let players = {}; // Sunucudan gelen ham veriler
let renderPlayers = {}; // Ekranda çizilen yumuşatılmış veriler
let foods = [];
let myPos = { x: 1500, y: 1500 };
let zoom = 1;
let isPlaying = false;

// Yumuşatma fonksiyonu (Lagı gizler)
function lerp(start, end, amt) { return (1 - amt) * start + amt * end; }

socket.on('updatePlayers', (serverPlayers) => {
    players = serverPlayers;
    // Yeni oyuncuları render listesine ekle
    for (let id in players) {
        if (!renderPlayers[id]) renderPlayers[id] = { ...players[id] };
    }
});

socket.on('initFood', (f) => { foods = f; });

function gameLoop() {
    if (!isPlaying) return;

    // Kendi hareketimiz (Anında tepki)
    const me = players[socket.id];
    if (me) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            let speed = 5 * Math.pow(0.93, (me.radius - 45) / 50);
            myPos.x += (dx / dist) * speed;
            myPos.y += (dy / dist) * speed;
        }
        myPos.x = Math.max(0, Math.min(worldSize, myPos.x));
        myPos.y = Math.max(0, Math.min(worldSize, myPos.y));
        socket.emit('move', { x: myPos.x, y: myPos.y });
        zoom = lerp(zoom, Math.pow(Math.min(1, 45 / me.radius), 0.3), 0.1);
    }

    // DİĞER OYUNCULARI YUMUŞATARAK ÇİZ (Interpolation)
    for (let id in renderPlayers) {
        if (players[id]) {
            renderPlayers[id].x = lerp(renderPlayers[id].x, players[id].x, 0.2);
            renderPlayers[id].y = lerp(renderPlayers[id].y, players[id].y, 0.2);
            renderPlayers[id].radius = lerp(renderPlayers[id].radius, players[id].radius, 0.1);
        } else {
            delete renderPlayers[id];
        }
    }

    draw();
    requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-myPos.x, -myPos.y);

    // Kırmızı Sınır
    ctx.strokeStyle = "red"; ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, worldSize, worldSize);

    // Yemler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 10, 0, Math.PI * 2); ctx.fill();
    });

    // Yumuşatılmış Oyuncuları Çiz
    for (let id in renderPlayers) {
        const p = renderPlayers[id];
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.font = `bold ${Math.max(14, p.radius/2.5)}px Arial`;
        ctx.fillText(p.nick, p.x, p.y + (p.radius/10));
    }
    ctx.restore();
}

let mousePos = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => { mousePos = { x: e.clientX, y: e.clientY }; });
function join() { isPlaying = true; socket.emit('join', { nick: document.getElementById('nick').value }); document.getElementById('overlay').style.display='none'; requestAnimationFrame(gameLoop); }
