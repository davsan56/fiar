// New socket
var socket = io();

// Name of room
var name;
var board;
var color;

// Called when user wants to start a new game
function newG() {
 socket.emit('new');
}

// Called when user wants to join a game
function join() {
 socket.emit('join', {name: $('#joinId').val().toLocaleLowerCase()});
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
 board = game.board; // set the board
 $('#title').text(game.name); // set the room code
 // Display the board
 if (game.board) {
   for (var i = 0; i < 6; i++) {
     $('#board').append('\
       <div class="col s4">\
         <div class="row no-bottom-margin">\
           <div class="col s4"></div> <!-- this column empty -->\
           <button onclick="update(event)" class="btn col s4 box ' + getColor(game.board[(i * 7) + 0]) +
             '" id="' + ((i * 7) + 0) + '"></button>\
           <button onclick="update(event)" class="btn col s4 box ' + getColor(game.board[(i * 7) + 1]) +
             '" id="' + ((i * 7) + 1) + '"></button>\
         </div>\
       </div>\
       \
       <div class="col s8">\
         <div class="row no-bottom-margin">\
           <button onclick="update(event)" class="btn col s2 box ' + getColor(game.board[(i * 7) + 2]) +
             '" id="' + ((i * 7) + 2) + '"></button>\
           <button onclick="update(event)" class="btn col s2 box ' + getColor(game.board[(i * 7) + 3]) +
             '" id="' + ((i * 7) + 3) + '"></button>\
           <button onclick="update(event)" class="btn col s2 box ' + getColor(game.board[(i * 7) + 4]) +
             '" id="' + ((i * 7) + 4) + '"></button>\
           <button onclick="update(event)" class="btn col s2 box ' + getColor(game.board[(i * 7) + 5]) +
             '" id="' + ((i * 7) + 5) + '"></button>\
           <button onclick="update(event)" class="btn col s2 box ' + getColor(game.board[(i * 7) + 6]) +
             '" id="' + ((i * 7) + 6) + '"></button>\
           <div class="col s2"></div> <!-- this column empty -->\
         </div>\
       </div>'
     );
   }
 }
 // Gets here when there is only one player and shows message
 $('#message').html(game.message);
 $('#contain').hide(); // hides the board
 if (game.color && $('#color').text() == "") {
   $('#color').html("<h5>Your color is: <span class='" + game.color + "'>" + game.color + "</span></h5>");
   color = game.color;
 }
 if (game.players == 2) {
   // Show the board
   $('#contain').show();
   // Let the player know who's turn it is
   if (game.turn == socket.id)
     $('#message').html('<h3>It is your turn</h3>');
   else
     $('#message').html('<h3>Waiting for other player ...</h3>');
 }
});

// Get every mouseenter and mouseleave event on all the buttons
$(document).on({
 // Mouse enter
 mouseenter: function () {
   // Get the id
   var id = $(this).attr('id');
   // If there is an id add the hover class so the player knows where their piece will go
   if (id) {
     var column = id % 7;
     $('#' + getIndexToHover(column)).addClass(color + "-hover");
     console.log($('#' + getIndexToHover(column)))
   }
 },
 // Mouse leave
 mouseleave: function () {
   // Get the id
   var id = $(this).attr('id');
   // If there is an id, remove a hover class
   if (id) {
     var column = id % 7;
     $('#' + getIndexToHover(column)).removeClass(color + "-hover");
   }
 }
}, "button");

// Update the board with the correct color given a column number
function getIndexToHover(columnNumber) {
 columnNumber = parseInt(columnNumber);
 if (board[35 + columnNumber] == '-') {
   return 35 + columnNumber;
 } else if (board[28 + columnNumber] == '-') {
   return 28 + columnNumber;
 } else if (board[21 + columnNumber] == '-') {
   return 21 + columnNumber;
 } else if (board[14 + columnNumber] == '-') {
   return 14 + columnNumber;
 } else if (board[7 + columnNumber] == '-') {
   return 7 + columnNumber;
 } else if (board[0 + columnNumber] == '-') {
   return 0 + columnNumber;
 } else {
   // Column full
   return -1;
 }
}

// Called when there is an update to the game
socket.on('update', function(game) {
 // Let the player know who's turn it is
 if (game.turn == socket.id)
   $('#message').html('<h3>It is your turn</h3>');
 else
   $('#message').html('<h3>Waiting for other player ...</h3>');
 // Update the board
 $('#' + game.index).addClass(getColor(game.color));
 board[game.index] = getColor(game.color);
 // Remove any pulsing pieces
 $('.pulse').each(function(i, obj) {
   $('#' + obj.id).removeClass("btn btn-floating pulse");
 });
 // Make the latest piece pulse
 $('#' + game.index).addClass("btn btn-floating pulse");
 // Check for win
 // If there is a winner, the game is over and someone has won
 if (game.winner) {
   if (game.winner == socket.id)
     $('#message').html('<h3>You have won!!</h3>');
   else
     $('#message').html('<h3>You have lost :(</h3>');

   $('#restartButton').show();
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