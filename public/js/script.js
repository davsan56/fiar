// New socket
var socket = io();

// Name of room
var name;

// Called when user wants to start a new game
function newG() {
 socket.emit('new');
}

// Called when user wants to join a game
function join() {
 socket.emit('join', {name: $('#joinId').val()});
}

// Called when user clicks on a column to place piece
function update(event) {
 socket.emit('update', {name: name, id: event.target.id});
}

// Called when the game is over and the player wants to restart
function restart() {
 socket.emit('restart', {name: name});
}

// Called when the user tries to join a full room
socket.on('room full', function(message) {
 $('#title').text(message.message);
 $('#contain').hide(); // hide the board
});

socket.on('invalid game id', function(message) {
 $('#message').html('<h3>' + message.message + '</h3>');
 $('#contain').hide(); // hide the board
});

// Called when the board has been updated
socket.on('new', function(game) {
 console.log(game);
 $('#restartButton').hide(); // hide the restart button
 $('#contain').show(); // show the board
 $('#board').empty(); // empty the board
 $('#message').empty(); // empty the messages
 name = game.name; // set the name of the game
 $('#title').text(game.name); // set the room code
 // Make sure there are two players
 if (game.players == 2) {
   // Let the player know who's turn it is
   if (game.turn == socket.id)
     $('#message').html('<h3>It is your turn</h3>');
   else
     $('#message').html('<h3>Waiting for other player ...</h3>');
   // Display the board
   for (var i = 0; i < 6; i++) {
     $('#board').append('\
       <div class="col s4">\
         <div class="row no-bottom-margin">\
           <div class="col s4"></div> <!-- this column empty -->\
           <div onclick="update(event)" class="col s4 box ' + getColor(game.board[(i * 7) + 0]) +
             '" id="' + ((i * 7) + 0) + '"></div>\
           <div onclick="update(event)" class="col s4 box ' + getColor(game.board[(i * 7) + 1]) +
             '" id="' + ((i * 7) + 1) + '"></div>\
         </div>\
       </div>\
       \
       <div class="col s8">\
         <div class="row no-bottom-margin">\
           <div onclick="update(event)" class="col s2 box ' + getColor(game.board[(i * 7) + 2]) +
             '" id="' + ((i * 7) + 2) + '"></div>\
           <div onclick="update(event)" class="col s2 box ' + getColor(game.board[(i * 7) + 3]) +
             '" id="' + ((i * 7) + 3) + '"></div>\
           <div onclick="update(event)" class="col s2 box ' + getColor(game.board[(i * 7) + 4]) +
             '" id="' + ((i * 7) + 4) + '"></div>\
           <div onclick="update(event)" class="col s2 box ' + getColor(game.board[(i * 7) + 5]) +
             '" id="' + ((i * 7) + 5) + '"></div>\
           <div onclick="update(event)" class="col s2 box ' + getColor(game.board[(i * 7) + 6]) +
             '" id="' + ((i * 7) + 6) + '"></div>\
           <div class="col s2"></div> <!-- this column empty -->\
         </div>\
       </div>'
     );
   }
   // If there is a winner, the game is over and someone has won
   if (game.winner) {
     if (game.winner == socket.id)
       $('#message').html('<h3>You have won!!</h3>');
     else
       $('#message').html('<h3>You have lost :(</h3>');

     $('#restartButton').show();
   }
 } else {
   // Gets here when there is only one player and shows message
   $('#message').html(game.message);
   $('#contain').hide(); // hides the board
 }
 if (game.color && $('#color').text() == "") {
   $('#color').html("<h5>Your color is: <span class='" + game.color + "'>" + game.color + "</span></h5>");
 }
});

// Gets the color based on a piece
function getColor(piece) {
 var color;
 if (piece == "-") color = "gray";
 else if (piece == "y") color = "yellow";
 else color = "red";
 return color;
}