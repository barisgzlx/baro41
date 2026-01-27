const socket = io(); // Sunucuya bağlan
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let players = {};

// Sunucudan gelen oyuncu listesini güncelle
socket.on('updatePlayers', (serverPlayers) => {
    players = serverPlayers;
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Tüm oyuncuları ekrana çiz
    for (let id in players) {
        let p = players[id];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = p.color || 'red';
        ctx.fill();
        ctx.closePath();
    }
    
    requestAnimationFrame(draw);
}

// Fare hareketini sunucuya gönder (Opsiyonel - Geliştirilebilir)
window.addEventListener('mousemove', (e) => {
    // Burada hareket kodlarını ileride ekleyeceğiz
});

draw();
