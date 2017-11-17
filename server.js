var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
var path = require('path')
var schedule = require('node-schedule');
 
// Loads the static CSS and JS files in the public folder
app.use(express.static(path.join(__dirname, 'public')));
 
// Empty games object
var games = {};
 
// Loads index.html
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
 
// On a connection
io.on('connection', function(socket){
  // When player wants to start a new game
  socket.on('new', function(user) {
    // Make sure the user isn't in any other rooms
    disconnectUser(socket, user);
 
    // generate random 6 alpha numeric string
    var name = Math.random().toString(36).substr(2, 5);
   
    // make sure it is unique
    while (games[name]) {
      name = Math.random().toString(36).substr(2, 5);
    }
 
    // Add new board
    games[name] = {users: [socket.id],
                   board: ["-", "-", "-", "-", "-", "-", "-",
                           "-", "-", "-", "-", "-", "-", "-",
                           "-", "-", "-", "-", "-", "-", "-",
                           "-", "-", "-", "-", "-", "-", "-",
                           "-", "-", "-", "-", "-", "-", "-",
                           "-", "-", "-", "-", "-", "-", "-",],
                   turn: '1'
                  };
                 
    // Have user join room
    socket.join(name);
    // tell the player the room
    io.to(name).emit('new', {name: name, players: 1,
      message: '<h3>You have started the game. Send the room ID <mark>' +
        name + '</mark> to a friend to play</h3><h3>Waiting for one more player</h3>',
      color: 'yellow'});
  });
 
  // Called when a user joins a game
  socket.on('join', function(user) {
    // Make sure the provided game is actually a game
    if (games[user.name]) {
      // Only allow 2 players in a room
      if (games[user.name].users.length < 2) {
        // Make sure the same user isn't trying to join the room twice
        if (games[user.name].users.indexOf(socket.id) < 0) {
          // Join the room
          socket.join(user.name);
          // Update the user list
          games[user.name].users.push((socket.id));
          // Update the turn
          games[user.name].turn = games[user.name].users[Math.floor(Math.random() * 2)];
          // Let everyone know the game board
          io.to(user.name).emit('new', {name: user.name, board: games[user.name].board, players: 2,
            turn: games[user.name].turn, color: 'red'});
        }
      } else {
        // Game is full
        socket.join('game-full-room');
        io.to('game-full-room').emit('room full', {message: "Sorry, this room is full"});
      }
    } else {
      // Invalid game
      socket.join('invalid-game-id-room');
      io.to('invalid-game-id-room').emit('invalid game id', {message: "That game ID does not exist"});
    }
  });
 
  // Called when the user updates a block
  socket.on('update', function(user) {
    // Makes sure it is the correct users turn
    if (games[user.name].turn == socket.id) {
      // Sets the color of the select
      var successful;
      if (games[user.name].users.indexOf(socket.id) == 0)
        successful = updateBoard(games[user.name].board, findCol(user.id), "y");
      else
        successful = updateBoard(games[user.name].board, findCol(user.id), "r");
      // If the move was valid
      if (successful) {
        // Check if there is a win state
        if (calculateWinState(games[user.name].board)) {
          // There is a win
          // Emit to users in room that there is win
          io.to(user.name).emit('update', {index: successful, color: games[user.name].board[successful],
            turn: undefined, winner: games[user.name].turn});
        } else {
          // There isn't a win yet
          // Set whos turn it is if valid move
          if (successful)
            games[user.name].turn =
              games[user.name].users[Math.abs(games[user.name].users.indexOf(socket.id) - 1)];
          // Emit to users in room the new board
          io.to(user.name).emit('update', {index: successful, color: games[user.name].board[successful],
            turn: games[user.name].turn});
        }
      }
    }
  });
 
  // Called when the game is over and a player wants to restart
  socket.on('restart', function(user) {
    // Add new board
    games[user.name].board = ["-", "-", "-", "-", "-", "-", "-",
              "-", "-", "-", "-", "-", "-", "-",
              "-", "-", "-", "-", "-", "-", "-",
              "-", "-", "-", "-", "-", "-", "-",
              "-", "-", "-", "-", "-", "-", "-",
              "-", "-", "-", "-", "-", "-", "-",];
   
    // Pick a random person to start
    games[user.name].turn = games[user.name].users[Math.abs(games[user.name].users.indexOf(socket.id) - 1)];
    // Emit to users in room the new board
    io.to(user.name).emit('new', {name: user.name, board: games[user.name].board, players: 2,
      turn: games[user.name].turn});
  });
 
  // Called when a player disconnects
  socket.on('disconnect', function(user) {
    // Find what game they are in
    disconnectUser(socket, user);
  });
});
 
// Start the node server
http.listen(8081, function () {
  var host = "http://prod.qvqxpdkqjm.us-east-1.elasticbeanstalk.com/";

  // Set up clearing out of games at 2am
  var rule = new schedule.RecurrenceRule();
  rule.hour = 2;
  rule.minute = 0;
 
  var j = schedule.scheduleJob(rule, function(){
     games = {};
     console.log("Cleared out all the games:");
     console.log(games);
   });
});
 
// Called when the user disconnects from server or starts a new room
function disconnectUser(socket, user) {
  // Find what game they are in
  for (game in games) {
    var index = games[game].users.indexOf(socket.id);
    if (index > -1) {
      // Remove them from the players list
      games[game].users.splice(index, 1);
      // Remove the game if there are no users
      if (games[game].users.length == 0)
        delete games[game];
      else {
        // Want to let the user know someone disconnected and tell them to send the code again
        io.to(game).emit('new', {name: game, board: games[game].board, players: 1,
          message: '<h3>A user has disconnected. Either start a new game, or give them this ID, <mark>'
          + game + '</mark>, to continue</h3>'})
      }
    }
  }
}
 
// Find what column the click box is in
function findCol(x) {
  return x % 7;
}
 
// Update the board with the correct color given a column number
function updateBoard(board, columnNumber, color) {
  columnNumber = parseInt(columnNumber);
  if (board[35 + columnNumber] == '-') {
    board[35 + columnNumber] = color;
    return 35 + columnNumber;
  } else if (board[28 + columnNumber] == '-') {
    board[28 + columnNumber] = color;
    return 28 + columnNumber;
  } else if (board[21 + columnNumber] == '-') {
    board[21 + columnNumber] = color;
    return 21 + columnNumber;
  } else if (board[14 + columnNumber] == '-') {
    board[14 + columnNumber] = color;
    return 14 + columnNumber;
  } else if (board[7 + columnNumber] == '-') {
    board[7 + columnNumber] = color;
    return 7 + columnNumber;
  } else if (board[0 + columnNumber] == '-') {
    board[0 + columnNumber] = color;
    return 0 + columnNumber;
  } else {
    // Column full
    return -1;
  }
}
 
// Check if there is a win on the board
function calculateWinState(board) {
  for (var i = 0; i < board.length; i++) {
    // 4 types of wins
    var win1, win2, win3, win4 = false;
    // If there is a piece in that spot
    if (board[i] != '-') {
      // Check 4 win cases
      win1 = checkVerticalWin(board, i);
      win2 = checkHorizontalWin(board, i);
      win3 = checkDiagnol1Win(board, i);
      win4 = checkDiagnol2Win(board, i);
      // If any of them are a win, the game is over and has been won
      if (win1 || win2 || win3 || win4) {
        return true;
      }
    }
  }
  return false;
}
 
// Check if there is a win vertically starting at the given index
function checkVerticalWin(board, index) {
  // Make sure we don't go below the board
  if (index < 21)
    return findWinHelper(board, index, 7);
  else
    return false;
}
 
// Check if there is a win horizontally starting at the given index
function checkHorizontalWin(board, index) {
  // To make sure we dont go into the next row
  if (findCol(index) < 4)
    return findWinHelper(board, index, 1);
  else
    return false;
}
 
// Check if there is a win diagnolly down to the left starting at the given index
function checkDiagnol1Win(board, index) {
  // To make sure we dont go into the next row
  if (findCol(index) > 2 && index < 21)
    return findWinHelper(board, index, 6);
  else
    return false;
}
 
// Check if there is a win diagnolly down to the right starting at the given index
function checkDiagnol2Win(board, index) {
  // To make sure we dont go into the next row
  if (findCol(index) < 4 && index < 21)
    return findWinHelper(board, index, 8);
  else
    return false;
}
 
// Called by the win states to check for 4 in a row
function findWinHelper(board, cur, increment) {
  // Current piece
  var letter = board[cur];
  // Check for 3 more that match
  for (var i = 0; i < 3; i++) {
      cur += increment;
      // If they don't match, don't contue
      if (board[cur] != letter)
          return false;
  }
  return true;
}