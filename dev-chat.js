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
var rooms = new Array();

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
	    io.sockets.in(socket.room).emit('updateChat', usernames[socket.username]['class_username'], messageHTML);
	if(type === 'code')
	    io.sockets.in(socket.room).emit('updateCode', usernames[socket.username]['class_username'], data);
    });

    /*
    * adduser()
    * Add a new user to the chat
    * 
    * @param username STRING The persons name
    * @param room STRING The name of the chat room
    */
    socket.on('addUser', function(username)
    {
	if(usernames[username])
	{
	    socket.emit('duplicateUser');
	    return;
	}

	//Add the username to the socket session and store it in the array
	socket.username = username;

	var room = generateRoom();

	usernames[username] = {};
	usernames[username]['class_username'] = username.toLowerCase().replace(new RegExp('[.]', 'g'), '').replace('@', '');
	usernames[username]['username'] = username;
	logActivity(1);

	//Add the roomt to the socket session and store it in the array
	//Put the user into the room we created for them
	changeRoom(room, 'join');
	logActivity(7);
	
	getColour(socket.username, rooms[room]['count']);
	
	//Let the user know they have connection sucessfully
	socket.emit('updateChat', '', buildNotification('You have connected'));

	//Tell everyone else in the room that the new user has joined
	socket.broadcast.to(room).emit('updateChat', '', buildNotification(socket.username + ' has joined'));

	//Update the list of user for this room
	socket.emit('updateUsers', usernames[username], 'single');
	io.sockets.in(room).emit('updateUsers', {users: getAllRoomUsers(room)}, 'room');
	//socket.broadcast.to(room).emit('updateRoomCount', 4);
	
	socket.emit('updateRoom', room);
    });

    /*
    * inviteUser()
    * Process a request to add a user to a room
    * 
    * @param username STRING The user to send the invitation too
    */
    socket.on('inviteUser', function(username)
    {
	//Get the room the person being invited is in
	var inviteRoom = usernames[username]['room'];
	
	//Send an invite to that room
	socket.broadcast.to(inviteRoom).emit('updateChat', '', buildNotification(socket.username + ' has invited you to join their room <a href="" class="accept-invite">Accept<span style="display: none">' + socket.room + '</span></a> <a href="" class="reject-invite">Reject<span style="display: none">' + socket.room + '</span></a>', 'invite' + socket.room));

	//Log the invite
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
	socket.broadcast.to(currentRoom).emit('updateChat', '', buildNotification(socket.username + ' has left the room'));
	
	changeRoom(currentRoom, 'leave');
	
	logActivity(6);

	changeRoom(inviteRoom, 'join');

	getColour(socket.username, rooms[socket.room]['count']);

	socket.broadcast.to(inviteRoom).emit('updateChat', '', buildNotification(socket.username + ' has joined the room'));
	io.sockets.in(inviteRoom).emit('updateUsers', {users: getAllRoomUsers(inviteRoom)}, 'room');

	socket.emit('updateRoom', inviteRoom);
	logActivity(7);
    });
    
    socket.on('rejectInvite', function(inviteRoom)
    {
	socket.broadcast.to(inviteRoom).emit('updateChat', '', buildNotification(socket.username + ' has rejected the invitation'));
    });

    /*
    * disconnect()
    * What to do when a user disconnects from the chat
    */
    socket.on('disconnect', function()
    {
	socket.broadcast.to(socket.room).emit('updateChat', '', buildNotification(socket.username + ' has disconnected'));
	io.sockets.in(socket.room).emit('updateUsers', {users: getAllRoomUsers(socket.room)}, 'room');
	
	//Remove this user
	delete usernames[socket.username];

	changeRoom(socket.room, 'leave');
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
	    if(usernames[socket.username]['class_username'])
		socket.emit('idleUser', usernames[socket.username]['class_username']);
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
     * generateRoom
     * Generates a room number for a new user
     * 
     * @return nextRoom INT The next room number
     */
    function generateRoom()
    {
	//I MAY NEED TO RESET ARRAY KEYS BEFORE I DO THIS
	
	var nextRoom = 1;
	
	//Get number of rooms
	var roomLength = rooms.length;

	if(roomLength > 0 && rooms[roomLength-1])
	{
	    //Get the last room that was added.  This will be the latest
	    var lastRoom = rooms[roomLength-1];
	    nextRoom = lastRoom['name'] + 1;
	}
	
	return nextRoom;
    }
    
    /*
     * changeRoom()
     * Changes the room and user is in and updates
     * 
     * @param room INT The room number
     * @param type STRING 'join' if the user is joining a new room, 'leave' if the user is leaving their current room
     */
    function changeRoom(room, type)
    {
	if(type === 'join')
	{
	    //Update the socket with the new room
	    socket.room = room;
	    socket.join(room);
	    
	    //Update the array of users
	    usernames[socket.username]['room'] = room;
	    
	    //If this room doesn't exist create it, otherwise increase the user count
	    if(!rooms[room])
	    {
		rooms[room] = [];
		rooms[room]['name'] = room;
		rooms[room]['count'] = 1;
	    }
	    else
	    {
		rooms[room]['count']++;
	    }
	}
	
	if(type === 'leave')
	{
	    if(rooms[room])
	    {
		rooms[room]['count'] = rooms[room]['count'] - 1;
		if(rooms[room]['count'] === 0)
		    delete rooms[room];
	    }
	    
	    socket.leave(room);
	}
    }
    
    /*
     * getAllRoomUsers()
     * Gets all of the users in a specific room
     * 
     * @param INT The number of the room to check
     * 
     * @return OBJECT Returns an object with all the usernames in
     */
    function getAllRoomUsers(room)
    {
	var allUsers = {};
	
	for(var key in usernames)
	{
	    var obj = usernames[key];

	    if(obj['room'] === room)
	    {
		allUsers[obj['username']] = {}
		allUsers[obj['username']]['class_username'] = obj['class_username'];
		allUsers[obj['username']]['username'] = obj['username'];
	    }
	 }

	 return allUsers;
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
	    usernames[username]['colour'] = result[0].hexcode;
	});
    }
    
    /*
     * buildNotification()
     * Build the HTML for a notification
     * 
     * @param notification STRING The notification text
     * 
     * @return messageHTML STRING The HTML for the notification
     */
    function buildNotification(notification, extraClass)
    {
	var className = '';
	if(extraClass)
	    className = ' ' + extraClass;

	var messageHTML	= '<div class="notification' + className + '">\n';
	messageHTML += '<span class="left">' + notification + '</span>\n';
	messageHTML += '<div class="clearfix"></div>\n';
	messageHTML += '</div>';
	
	return messageHTML;
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
