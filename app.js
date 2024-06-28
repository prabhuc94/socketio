var express = require('express');
var app = express();
app.use(express.static('public')); 
var http = require('http').Server(app);
var port = process.env.PORT || 3001;
var socketIo = require('socket.io');
// setup my socket server
var io = socketIo(http, {
    cors: {
      origin: "*", // Adjust according to your needs
      methods: ["GET", "POST"]
    }
  });
 
io.on('connection', function(socket) {

    socket.on("room",function(room) {
        console.log("Room: " + room);
        socket.join(room);
        console.log(`Connected Room: ${socket.id} join room ${room}`);
        // Emit the current user count in the room to the client
        const userCount = getUserCountInRoom(room);
        io.to(room).emit('userCount',userCount);
    });

    socket.on('leaveRoom', (room) => {
      socket.leave(room);
      console.log(`${socket.id} left room ${room}`);
  
      // Emit the updated user count in the room to the client
      const userCount = getUserCountInRoom(room);
      io.to(room).emit('userCount', userCount);
    });
    
    console.log('New connection');
    const count = io.engine.clientsCount;
    console.log("Connected clients: " + count);
    io.emit('participants',count);
    // to do: count clients in a room 
    // https://stackoverflow.com/questions/31468473/how-to-get-socket-io-number-of-clients-in-room

    // Called when the client calls socket.emit('message')
    socket.on('message', function(obj) {
        console.log('Chatlog - Room: ' + obj.room + ' | ' + obj.userid + ': ' + obj.msg);     
        // socket.broadcast.emit('message', msg); // to all, but the sender
        io.to(obj.room).emit('message',obj); // to all, including the sender
    });

    // Called when the client calls socket.emit('message')
    socket.on('screenshare', function(obj) {
        console.log('Screenshare - Room: ' + obj.room + ' | ' + obj.userid + ': ' + obj.msg + ": "+obj.base64String);     
        // socket.broadcast.emit('message', msg); // to all, but the sender
        io.to(obj.room).emit('screenshare',obj); // to all, including the sender
    });

    // Called when a client disconnects
    socket.on('disconnect', function() {
        console.log('Disconnection');
        const count = io.engine.clientsCount;
        console.log("Connected clients: " + count);
        io.emit('participants',count);
        var userList = getRooms();
        console.log("Connected users: " + userList);
        userList.forEach((r) => {
          const userCount = getUserCountInRoom(r);
          io.to(r).emit('userCount', userCount);
        });
    });
});

function getRooms() {
  const rooms = [];
  const roomsMap = io.sockets.adapter.rooms;
  roomsMap.forEach((_, room) => {
    // Ignore rooms that are individual socket IDs
    if (!io.sockets.adapter.sids.get(room)) {
      rooms.push(room);
    }
  });
  return rooms;
}

function getUserCountInRoom(room) {
  const roomInfo = io.sockets.adapter.rooms.get(room);
  return roomInfo ? roomInfo.size : 0;
}

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/default.html');
});

http.listen(port, function() {
  console.log('listening on *: ' + port);
});