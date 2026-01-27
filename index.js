const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    color: 'dodgerblue'
};

function draw() {
    // Ekranı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Karakteri çiz
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();

    requestAnimationFrame(draw);
}

// Fare hareketine göre pozisyon güncelle
window.addEventListener('mousemove', (e) => {
    player.x = e.clientX;
    player.y = e.clientY;
});

draw();
