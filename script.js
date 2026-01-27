const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let otherPlayers = {};
let foods = [];
const worldSize = 3000;
let isPlaying = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (f) => foods = f);
socket.on('updatePlayers', (p) => otherPlayers = p);

function join(spectate) {
    const nick = document.getElementById('nick').value;
    const room = document.getElementById('room').value;
    document.getElementById('overlay').style.display = 'none';
    isPlaying = true;
    socket.emit('join', { room, nick, spectate });
}

// FARE HASSASİYETİ: Farenin dünyadaki gerçek koordinatını hesapla
window.addEventListener('mousemove', (e) => {
    if (isPlaying && otherPlayers[socket.id]) {
        const me = otherPlayers[socket.id];
        // Ekranın merkezini (karakteri) baz alarak farenin haritadaki yerini bul
        const worldMouseX = me.x + (e.clientX - canvas.width / 2);
        const worldMouseY = me.y + (e.clientY - canvas.height / 2);
        
        socket.emit('move', { x: worldMouseX, y: worldMouseY });
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const me = otherPlayers[socket.id];

    ctx.save();
    if (me) ctx.translate(canvas.width/2 - me.x, canvas.height/2 - me.y);

    // Grid ve Sınır
    ctx.strokeStyle = "red"; ctx.lineWidth = 10; ctx.strokeRect(0,0,worldSize,worldSize);
    
    // Yemler ve Oyuncular
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI*2); ctx.fill();
    });

    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.fillText(p.nick, p.x, p.y + 5);
    });

    ctx.restore();
    requestAnimationFrame(draw);
}
draw();
