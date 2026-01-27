const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');

let playerActive = false;
let otherPlayers = {};

function joinRoom(roomName) {
    menu.style.display = 'none'; // Menüyü gizle
    canvas.style.display = 'block'; // Oyunu göster
    playerActive = true;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    socket.emit('join', roomName); // Sunucuya "ben bu odaya girdim" de
}

// ... Geri kalan draw ve move kodların aynı kalabilir ...
// Sadece draw fonksiyonunun en başına şunu ekle:
// if (!playerActive) return;
