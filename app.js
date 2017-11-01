var _ = require('underscore');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

// rooms which are currently available in chat
var rooms = [];

/**
{
  id: socket.id,
  userCount: 1 or 2,
  users: []
}
**/

var connectedUsers = 0;

io.on('connection', function(socket) {
	console.log(socket.id);
	connectedUsers++;

  // when the client emits 'add_user', this listens and executes
	socket.on('add_user', function () {
    console.log('add_user');
		// store the room name in the socket session for this client
    var room = get_room(socket);
		socket.room = room.id;
		// send client to room 1
		socket.join(room.id);
		// echo to client they've connected
		socket.emit('connected', 'SERVER', room.id);
		// echo to room that a person has connected to their room
	});

  // when the client emits 'send_message', this listens and executes
	socket.on('send_message', function (user, data) {
		// we tell the client to execute 'message' with 2 parameters
		io.sockets.in(socket.room).emit('broadcast_message', socket.room, data);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function() {
		// echo to room that this client has left
    io.sockets.in(socket.room).emit('leave', 'SERVER', socket.room);
    leave_room(socket.room);
    socket.leave(socket.room);
	});
});

function get_room(socket) {
  var single_room = _.findWhere(rooms, {userCount: 1});
  if (!single_room) {
    single_room = {
      id: socket.id,
      userCount: 1,
      users: [socket.id]
    };

    rooms.push(single_room);
  } else {
    single_room.userCount = 2;
    single_room.users.push(socket.id);
  }

  console.log('get_room: ', rooms);
  return single_room;
}

function leave_room(removed_room) {
  rooms = _.reject(rooms,
    function (room) {
      if (_.contains(room.users, removed_room))
        return true;
      else
        return false;
    }
  );

  console.log('leave_room: ', rooms);
}

http.listen(3000, function(){
  console.log('app listening on: 3000');
});