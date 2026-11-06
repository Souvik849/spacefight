const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// আপনার GitHub Pages-এর গেমকে কানেক্ট করার পারমিশন দেওয়া হচ্ছে (CORS)
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

let players = {};

io.on('connection', (socket) => {
  console.log('নতুন প্লেয়ার এসেছে! ID:', socket.id);

  // নতুন প্লেয়ারের প্রাথমিক পজিশন
  players[socket.id] = { x: 0, y: 0, angle: 0 };

  // নতুন প্লেয়ারকে বর্তমান সব প্লেয়ারের লিস্ট পাঠানো
  socket.emit('currentPlayers', players);

  // পুরনো প্লেয়ারদের জানিয়ে দেওয়া যে নতুন কেউ এসেছে
  socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });

  // প্লেয়ার যখন মুভ করবে বা জয়স্টিক ঘোরাবে
  socket.on('playerMovement', (movementData) => {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].angle = movementData.angle;
    
    // মুভমেন্টের ডেটা বাকি সব প্লেয়ারের কাছে পাঠানো
    socket.broadcast.emit('playerMoved', { id: socket.id, x: movementData.x, y: movementData.y, angle: movementData.angle });
  });

  // প্লেয়ার গেম থেকে বের হয়ে গেলে
  socket.on('disconnect', () => {
    console.log('প্লেয়ার চলে গেছে ID:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`সার্ভার চলছে পোর্ট ${PORT} তে`);
});
