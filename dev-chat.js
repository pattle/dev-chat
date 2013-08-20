//Include the express framework and then make an instance of it
var http = require('http')
var socketio = require('socket.io');
var express = require('express');
var mysql = require('mysql');
var app = express();

//Define the port we want to use
var port = 5000;

//Create the HTTP server and then include sockets.io
var server = http.createServer(app);
var io = socketio.listen(server);
server.listen(port);

//Connect to mysql
var connection = mysql.createConnection({host : 'localhost', user : 'root', password : '', database : 'devchat'});
connection.connect(function(err)
{
    if (err) throw err;
});

//For all URL's we want to load index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

//Tell node.js to use the /public directory so that we can service images, css, js etc
//in the chat.html
app.configure(function(){
    app.use(express.static(__dirname + '/public'));
});

// usernames which are currently connected to the chat
var usernames = {};
var rooms = {};

io.sockets.on('connection', function (socket)
{
    /*
    * sendmessage()
    * Receives a message and processes it
    * 
    * @param data STRING The message or code sent
    * @param type STRING The type of message (normal or code)
    */
    socket.on('sendMessage', function (data, type)
    {	
	var currentTime = Math.round(new Date().getTime() / 1000);
	socket.last_activity = currentTime;

	connection.query('SELECT message_type_id FROM message_types WHERE message_type_name = ?', [type], function(err, result)
	{
		if (err) throw err;

		var message_type_id = result[0].message_type_id;
		var aMessage  = {message_text: data, message_sent: currentTime, message_from: socket.username, room: socket.room, message_type_id: message_type_id};
		connection.query('INSERT INTO messages SET ?', aMessage, function(err, result)
		{
			if (err) throw err;
		});
	});

	var messageHTML = '<div class="' + type + '">\n';
	messageHTML += '<span class="left"><span style="color: ' + usernames[socket.username]['colour'] + ';"><b>' + socket.username + ':</b></span> ' + data + '</span>\n';
	messageHTML += '<span class="chat-time right">' + formatTimestamp(currentTime) + '</span><div class="clearfix"></div>\n';
	messageHTML += '</div>';

	//Update the conversation depending on what type of message was sent
	if(type === 'normal')
	    io.sockets.in(socket.room).emit('updateChat', socket.username, messageHTML);
	if(type === 'code')
	    io.sockets.in(socket.room).emit('updateCode', socket.username, data);
    });

    /*
    * adduser()
    * Add a new user to the chat
    * 
    * @param username STRING The persons name
    * @param room STRING The name of the chat room
    */
    socket.on('addUser', function(username, room)
    {
	if(usernames[username])
	{
	    socket.emit('duplicateUser');
	    return;
	}

	//Add the username to the socket session and store it in the array
	socket.username = username;

	usernames[username] = [];
	usernames[username]['username'] = username;
	usernames[username]['room'] = room;
	logActivity(1);

	//Add the roomt to the socket session and store it in the array
	//Put the user into the room we created for them
	socket.room = room;
	rooms[room] = [];
	rooms[room]['name'] = room;
	rooms[room]['count'] = 1;
	socket.join(room);
	logActivity(7);

	getColour(socket.username, rooms[room]['count']);

	//Let the user know they have connection sucessfully 
	socket.emit('updateChat', '', 'You have connected', 'notification');

	//Tell everyone else in the room that the new user has joined
	socket.broadcast.to(room).emit('updateChat', '', username + ' has joined', 'notification');

	//Update the list of user for this room
	socket.emit('updateUsers', usernames);
	socket.broadcast.to(room).emit('updateUsers', usernames);
    });

    /*
    * inviteUser()
    * Process a request to add a user to a room
    * 
    * @param username STRING The user to send the invitation too
    */
    socket.on('inviteUser', function(username)
    {
	var inviteRoom = usernames[username]['room'];
	socket.broadcast.to(inviteRoom).emit('updateChat', '', socket.username + ' has invited to join their room <a href="" class="accept-invite">Accept<span style="display: none">' + socket.room + '</span></a>', 'notification');

	logActivity(3);
    });

    /*
    * acceptInvite()
    * Process an accepted invitation
    * 
    * @param inviteRoom STRING The room the user has accepted the invitation too
    */
    socket.on('acceptInvite', function(inviteRoom)
    {
	logActivity(4);

	//Get the current room the user is in
	var currentRoom = usernames[socket.username]['room'];

	//Leave the current room and broadcast a notification
	socket.leave(currentRoom);
	socket.broadcast.to(currentRoom).emit('updateChat', '', socket.username + ' has left the room', 'notification');
	logActivity(6);

	//Update the users and the socket with the new room
	usernames[socket.username]['room'] = inviteRoom;
	socket.room = inviteRoom;
	rooms[socket.room]['count']++;

	getColour(socket.username, rooms[socket.room]['count']);

	//Joint the new room and broadcast a notification
	socket.join(inviteRoom);

	var messageHTML	= '<div class="notification">\n';
	messageHTML += '<span class="left">' + socket.username + ' has joined the room</span>\n';
	messageHTML += '<div class="clearfix"></div>\n';
	messageHTML += '</div>';

	socket.broadcast.to(inviteRoom).emit('updateChat', '', messageHTML);
	socket.broadcast.to(socket.room).emit('updateUsers', usernames);

	logActivity(7);
    });

    /*
    * disconnect()
    * What to do when a user disconnects from the chat
    */
    socket.on('disconnect', function()
    {
	//Remove this user
	delete usernames[socket.username];
	io.sockets.emit('updateUsers', usernames);

	//Update the room count and if there are no more users in the room delete it
	if(rooms[socket.room])
	{
	    rooms[socket.room]['count'] = rooms[socket.room]['count'] - 1;
	    if(rooms[socket.room]['count'] === 0)
		delete rooms[socket.room];
	}

//		io.sockets.emit('updateUsers', usernames);

	var messageHTML = '<div class="notification">\n';
	messageHTML += '<span class="left">' + socket.username + ' has disconnected</span>\n';
	messageHTML += '<div class="clearfix"></div>\n';
	messageHTML += '</div>';
	
	socket.broadcast.emit('updateChat', '', messageHTML);

	//Leave the room
	socket.leave(socket.room);
    });

    /*
    * heartbeat()
    * Check to see who is still active
    */
    socket.on('heartbeat', function()
    {
	//Get the current time
	var currentTime = Math.round(new Date().getTime() / 1000);

	//Check to see if more than 120 second (2 minutes) has passed since the user last did something
	//If they have been idle then trigger the idleuser() function on the frontend
	if(socket.last_activity + 120 < currentTime)
	    socket.emit('idleUser', socket.username);
    });

    /*
    * logActivity()
    * Logs an event in the database
    * 
    * @param eventId INT The id of the event
    */
    function logActivity(eventId)
    {
	var activity  = {event: eventId, activity_time: Math.round(new Date().getTime() / 1000), username: socket.username};
	connection.query('INSERT INTO activity SET ?', activity, function(err, result)
	{
	    if (err) throw err;
	});
    }

    /*
    * getColour(roomCount)
    * Gets the colour to be used for the user's messages
    * 
    * @param username The users name
    * @param roomCount The number this person will be in the room
    */
    function getColour(username, roomCount)
    {
	connection.query('SELECT hexcode FROM colours WHERE precedence = ?', [roomCount], function(err, result)
	{
	    if (err) throw err;
	    usernames[username]['colour'] = result[0].hexcode;
	});
    }

    /*
    * formatTimestamp()
    * Turns a timestamp into hours and seconds
    * 
    * @param timestamp INT The timestamp
    */
    function formatTimestamp(timestamp)
    {
	var dt = new Date(timestamp * 1000);

	var hours = dt.getHours();
	var minutes = dt.getMinutes();

	if(hours < 10) 
	    hours = '0' + hours;

	if(minutes < 10) 
	    minutes = '0' + minutes;

	return hours + ":" + minutes;
    }
});
