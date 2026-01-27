// ... (Değişkenlerin altına ekle)
let foods = [];
let timeLeft = 3600; // 60 dakika (Agarz süresi)

socket.on('initFood', (serverFood) => { foods = serverFood; });

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const me = otherPlayers[socket.id];

    ctx.save();
    if (me) {
        ctx.translate(canvas.width/2 - me.x, canvas.height/2 - me.y);
        
        // ÜSTTE SÜRE GÖSTERİMİ
        let mins = Math.floor(timeLeft / 60);
        let secs = timeLeft % 60;
        document.title = `FFA-1 [${mins}:${secs < 10 ? '0'+secs : secs}]`;
    }

    // KIRMIZI SINIRLAR
    ctx.strokeStyle = "red";
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, worldSize, worldSize);

    // YEMLERİ ÇİZ
    foods.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
    });

    // OYUNCULARI ÇİZ (Mevcut kodun)
    // ... 
    ctx.restore();
    requestAnimationFrame(draw);
}

// HIZLI HAREKET (Agarz Mantığı)
window.addEventListener('mousemove', (e) => {
    if (isPlaying && otherPlayers[socket.id] && overlay.style.display === 'none') {
        const me = otherPlayers[socket.id];
        // Fare ile merkez arasındaki farka göre hızı ayarla
        const dx = e.clientX - canvas.width / 2;
        const dy = e.clientY - canvas.height / 2;
        
        // Hızı hissedilir şekilde artırdık
        const nextX = me.x + (dx * 0.15);
        const nextY = me.y + (dy * 0.15);
        
        socket.emit('move', { 
            x: Math.max(0, Math.min(worldSize, nextX)), 
            y: Math.max(0, Math.min(worldSize, nextY)) 
        });
    }
});

// Süreyi her saniye düşür
setInterval(() => { if(timeLeft > 0) timeLeft--; }, 1000);
