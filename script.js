// ... (Değişken tanımları aynı)

// HAREKET DÖNGÜSÜ - 30 FPS Sabitlendi
setInterval(() => {
    if(isPlaying && !isSpectating && otherPlayers[socket.id]) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 5) {
            // Hareket hızı 30 FPS'e göre uyarlandı
            let speed = 5.5 * Math.pow(0.93, ( (otherPlayers[socket.id].radius) - 45) / 50);
            myLocalPos.x += (dx / dist) * Math.max(1.5, speed);
            myLocalPos.y += (dy / dist) * Math.max(1.5, speed);
        }
        
        myLocalPos.x = Math.max(0, Math.min(worldSize, myLocalPos.x));
        myLocalPos.y = Math.max(0, Math.min(worldSize, myLocalPos.y));
        
        // Sunucuya 30 FPS hızında veri yolla
        socket.emit('move', { x: myLocalPos.x, y: myLocalPos.y });
    }
}, 33); // 1000/30 = 33ms

// ÇİZİM DÖNGÜSÜ
function draw() {
    // Çizim hızını tarayıcının en rahat edeceği şekilde (30-60 FPS arası) bırakıyoruz
    // Ancak veriler 30 FPS geldiği için takılma hissi kaybolacak
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) { requestAnimationFrame(draw); return; }
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-myLocalPos.x, -myLocalPos.y);
    
    // Kırmızı Sınır Çizgisi
    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);
    
    // Yemler (Performans için basit çizim)
    for(let i=0; i<foods.length; i++) {
        let f = foods[i];
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 10, 0, Math.PI * 2); ctx.fill();
    }
    
    // Oyuncular
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center"; 
        ctx.font = `bold ${Math.max(14, p.radius/2.5)}px Arial`;
        ctx.fillText(p.nick, p.x, p.y + (p.radius/10));
    });
    
    ctx.restore();
    requestAnimationFrame(draw);
}
draw();

