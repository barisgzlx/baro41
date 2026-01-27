const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const lbList = document.getElementById('lb-list');
const timerEl = document.getElementById('timer');

let otherPlayers = {};
let foods = [];
let myLocalPos = { x: 1500, y: 1500 }; 
let isPlaying = false;
let isSpectating = false;
let zoom = 1;
const worldSize = 3000;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (f) => { foods = f; });
socket.on('initWinner', (w) => { document.querySelector('#last-winner span').innerText = w; });
socket.on('updateWinPage', (stats) => {
    let list = document.getElementById('win-list');
    list.innerHTML = "";
    for(let name in stats) { list.innerHTML += `<div><b>${name}</b>: ${stats[name]} galibiyet</div>`; }
});

function toggleWinPanel() {
    const p = document.getElementById('win-panel');
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
}

socket.on('gameFinished', (data) => { alert("Süre Bitti! Şampiyon: " + data.winner); location.reload(); });
socket.on('respawn', () => { alert("Yenildin!"); isPlaying = false; overlay.style.display = 'flex'; });

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") overlay.style.display = 'flex';
    if (e.key.toLowerCase() === 's') socket.emit('buyScore');
});

socket.on('timerUpdate', (sec) => {
    let m = Math.floor(sec / 60); let s = sec % 60;
    timerEl.innerText = `${m}:${s < 10 ? '0'+s : s}`;
});

socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    const me = p[socket.id];
    if (me) {
        document.getElementById('my-gold').innerText = me.gold;
        document.getElementById('my-score').innerText = Math.floor(me.score);
        zoom = Math.pow(Math.min(1, 45 / me.radius), 0.3);
    } else if (isSpectating) {
        let sorted = Object.values(p).sort((a,b) => b.score - a.score);
        if(sorted[0]) { myLocalPos.x = sorted[0].x; myLocalPos.y = sorted[0].y; zoom = Math.pow(Math.min(1, 45 / sorted[0].radius), 0.3); }
    }
    let html = "";
    Object.values(p).sort((a,b) => b.score - a.score).slice(0, 10).forEach((pl, i) => {
        html += `<div><span>${i+1}. ${pl.nick}</span> <b>${Math.floor(pl.score)}</b></div>`;
    });
    lbList.innerHTML = html;
});

function join(spec) {
    isSpectating = spec;
    socket.emit('join', { nick: document.getElementById('nick').value || "Baro", spectate: spec });
    overlay.style.display = 'none';
    isPlaying = true;
}

// 30 FPS Hareket Döngüsü
setInterval(() => {
    if(isPlaying && !isSpectating && otherPlayers[socket.id]) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
            let speed = 5.2 * Math.pow(0.93, ( (otherPlayers[socket.id].radius) - 45) / 50);
            myLocalPos.x += (dx / dist) * Math.max(1.5, speed);
            myLocalPos.y += (dy / dist) * Math.max(1.5, speed);
        }
        myLocalPos.x = Math.max(0, Math.min(worldSize, myLocalPos.x));
        myLocalPos.y = Math.max(0, Math.min(worldSize, myLocalPos.y));
        socket.emit('move', { x: myLocalPos.x, y: myLocalPos.y });
    }
}, 33);

let mousePos = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => { mousePos = { x: e.clientX, y: e.clientY }; });

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) { requestAnimationFrame(draw); return; }
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-myLocalPos.x, -myLocalPos.y);
    // Kırmızı Sınır [Geri Getirildi]
    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);
    foods.forEach(f => { ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, 10, 0, Math.PI * 2); ctx.fill(); });
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center"; 
        ctx.font = `bold ${Math.max(14, p.radius/2.5)}px Arial`;
        ctx.fillText(p.nick, p.x, p.y + (p.radius/10));
    });
    ctx.restore();
    requestAnimationFrame(draw);
}
draw();
