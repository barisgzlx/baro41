const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const lbList = document.getElementById('lb-list');
const timerEl = document.getElementById('timer');
const roomLabel = document.getElementById('room-name');

let otherPlayers = {};
let foods = [];
let myLocalPos = { x: 1500, y: 1500 }; 
let isPlaying = false;
let mousePos = { x: 0, y: 0 };
const worldSize = 3000;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (f) => { foods = f; });
socket.on('respawn', () => { myLocalPos = { x: 1500, y: 1500 }; alert("Yenildin!"); });

// Sayaç Güncelleme
socket.on('timerUpdate', (seconds) => {
    let h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    let m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    let s = (seconds % 60).toString().padStart(2, '0');
    timerEl.innerText = `${h}:${m}:${s}`;
});

socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    const me = p[socket.id];
    
    if (me) {
        document.getElementById('my-gold').innerText = me.gold;
        document.getElementById('my-score').innerText = Math.floor(me.score);
    }

    if (lbList) {
        let listHTML = "";
        const sorted = Object.values(p).sort((a,b) => b.score - a.score).slice(0, 10);
        sorted.forEach((pl, i) => {
            listHTML += `<div><span>${i+1}. ${pl.nick}</span> <b>${Math.floor(pl.score)}</b></div>`;
        });
        lbList.innerHTML = listHTML;
    }
});

function join() {
    const rVal = document.getElementById('room').value;
    roomLabel.innerText = rVal.toUpperCase();
    overlay.style.display = 'none';
    isPlaying = true;
    socket.emit('join', { nick: document.getElementById('nick').value, room: rVal });
}

window.addEventListener('mousemove', (e) => { mousePos = { x: e.clientX, y: e.clientY }; });

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

    ctx.save();
    ctx.translate(canvas.width / 2 - myLocalPos.x, canvas.height / 2 - myLocalPos.y);
    ctx.strokeStyle = "red"; ctx.lineWidth = 10; ctx.strokeRect(0, 0, worldSize, worldSize);

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2); ctx.fill();
    });

    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        const rX = (id === socket.id) ? myLocalPos.x : p.x;
        const rY = (id === socket.id) ? myLocalPos.y : p.y;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(rX, rY, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(p.nick, rX, rY + 5);
    });
    ctx.restore();
    requestAnimationFrame(draw);
}
draw();
