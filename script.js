const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

let players = {};
let foods = [];
let myPos = { x: 1500, y: 1500 };
let isPlaying = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', f => foods = f);
socket.on('updatePlayers', p => players = p);

function join() {
    isPlaying = true;
    overlay.style.display = 'none';
    socket.emit('join', { nick: document.getElementById('nick').value });
}

window.addEventListener('mousemove', (e) => {
    if (isPlaying) {
        // Pingi hissettirmeyen yerel hareket
        let dx = e.clientX - canvas.width / 2;
        let dy = e.clientY - canvas.height / 2;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
            myPos.x += (dx/dist) * 5;
            myPos.y += (dy/dist) * 5;
        }
        socket.emit('move', { x: myPos.x, y: myPos.y });
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) { requestAnimationFrame(draw); return; }

    ctx.save();
    ctx.translate(canvas.width/2 - myPos.x, canvas.height/2 - myPos.y);

    // Yemler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI*2); ctx.fill();
    });

    // Oyuncular
    Object.keys(players).forEach(id => {
        let p = players[id];
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(id === socket.id ? myPos.x : p.x, id === socket.id ? myPos.y : p.y, p.radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white";
        ctx.fillText(p.nick, id === socket.id ? myPos.x : p.x, (id === socket.id ? myPos.y : p.y) + 5);
    });

    ctx.restore();
    requestAnimationFrame(draw);
}
draw();
