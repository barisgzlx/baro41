const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const worldSize = 3000;

let players = {};
let renderPlayers = {};
let foods = [];
let myPos = { x: 1500, y: 1500 };
let zoom = 1;
let isPlaying = false;
let mousePos = { x: window.innerWidth/2, y: window.innerHeight/2 };

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function lerp(start, end, amt) { return (1 - amt) * start + amt * end; }

// KLAVYE DİNLEYİCİ - Gold ve ESC Sorunu Çözümü
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        overlay.style.display = 'flex'; // Menüyü her zaman açar
    }
    if (e.key.toLowerCase() === 's') {
        socket.emit('buyScore'); // Sunucuya gold basma komutu yolla
        // Yerel gold miktarını düşür (Görsel olarak)
        let g = Number(localStorage.getItem('baro_gold') || 0);
        if(g >= 100) {
            localStorage.setItem('baro_gold', g - 100);
            document.getElementById('my-gold').innerText = (g - 100).toLocaleString();
        }
    }
});

socket.on('updatePlayers', (serverPlayers) => {
    players = serverPlayers;
    for (let id in players) {
        if (!renderPlayers[id]) renderPlayers[id] = { ...players[id] };
    }
});

socket.on('initFood', (f) => { foods = f; });
socket.on('timerUpdate', (sec) => {
    let m = Math.floor(sec / 60); let s = sec % 60;
    document.getElementById('timer').innerText = `${m}:${s < 10 ? '0'+s : s}`;
});

function gameLoop() {
    if (!isPlaying) return;

    const me = players[socket.id];
    if (me) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 5) {
            // Hız Dengelendi (Çok hızlı gitme sorunu çözüldü)
            let speed = 3.8 * Math.pow(0.93, (me.radius - 45) / 50);
            myPos.x += (dx / dist) * speed;
            myPos.y += (dy / dist) * speed;
        }
        myPos.x = Math.max(0, Math.min(worldSize, myPos.x));
        myPos.y = Math.max(0, Math.min(worldSize, myPos.y));
        socket.emit('move', { x: myPos.x, y: myPos.y });
        
        document.getElementById('my-score').innerText = Math.floor(me.score);
        document.getElementById('my-gold').innerText = Number(localStorage.getItem('baro_gold') || 0).toLocaleString();
        zoom = lerp(zoom, Math.pow(Math.min(1, 45 / me.radius), 0.3), 0.1);
    }

    for (let id in renderPlayers) {
        if (players[id]) {
            renderPlayers[id].x = lerp(renderPlayers[id].x, players[id].x, 0.25);
            renderPlayers[id].y = lerp(renderPlayers[id].y, players[id].y, 0.25);
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

    ctx.strokeStyle = "red"; ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, worldSize, worldSize);

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 10, 0, Math.PI * 2); ctx.fill();
    });

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

window.addEventListener('mousemove', (e) => { mousePos = { x: e.clientX, y: e.clientY }; });

function join() { 
    isPlaying = true; 
    overlay.style.display = 'none'; 
    socket.emit('join', { nick: document.getElementById('nick').value || "Baro" }); 
    requestAnimationFrame(gameLoop); 
}
