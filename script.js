// ... (Değişkenlerin altına ekle)
let score = 0;
const worldSize = 3000; // Harita büyüklüğü (Agarz stili geniş alan)

function joinGame(spectate) {
    // ... (Eski join kodun)
    document.getElementById('gui').style.display = 'block'; // Arayüzü aç
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Kendi karakterimizi bulalım
    const me = otherPlayers[socket.id];
    
    ctx.save();
    if (me) {
        // KAMERA: Ekran seni tam ortada tutacak şekilde kaysın
        ctx.translate(canvas.width/2 - me.x, canvas.height/2 - me.y);
        document.getElementById('score').innerText = Math.floor(me.radius);
    }

    // 1. HARITA SINIRLARINI ÇİZ (Kırmızı çerçeve)
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, worldSize, worldSize);

    // 2. GRID ÇİZ (Gri kareler)
    ctx.beginPath();
    ctx.strokeStyle = "#222";
    for(let i=0; i<=worldSize; i+=50) {
        ctx.moveTo(i, 0); ctx.lineTo(i, worldSize);
        ctx.moveTo(0, i); ctx.lineTo(worldSize, i);
    }
    ctx.stroke();

    // 3. OYUNCULARI VE YEMLERİ ÇİZ
    Object.keys(otherPlayers).forEach(id => {
        let p = otherPlayers[id];
        // Baloncuğu çiz
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        // İsmi çiz
        ctx.fillStyle = "white";
        ctx.font = `bold ${p.radius/2}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(p.nick, p.x, p.y + (p.radius/4));
    });

    ctx.restore();
    requestAnimationFrame(draw);
}
