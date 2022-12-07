// AI bot using the Expectimax algorithm to compete

// Variables for tweaking the algorithm
var max_depth;
var MAXSCORE;
var MINSCORE;

function new_game() {
  // Variables for tweaking the algorithm
  //max_depth = Math.floor(Math.sqrt((WIDTH ** 2) + (HEIGHT ** 2)));
  max_depth = 8;  // Should be in increments of 2
  MAXSCORE = 1000000000;
  MINSCORE = -MAXSCORE;
  SimpleBot.board = get_board();
  //console.log(WIDTH, HEIGHT);
  //console.log(max_depth);
}

function make_move() {
  let calc_move = ExpectimaxBot.getMove()
  console.log(calc_move);
  return calc_move["bestMove"];
}

const clone = (items) => items.map(item => Array.isArray(item) ? clone(item) : item);

var ExpectimaxBot = {

  generateMoves: function(pos) {
    let x = pos[0];
    let y = pos[1];

    var nextMoves = [];  // [EAST, WEST, NORTH, SOUTH, TAKE, PASS]

    // If there is an item on this position, enable the TAKE move
    if (has_item(SimpleBot.board[x][y])) {
      nextMoves.push(TAKE);
    }

    if (x < (WIDTH-1)) {
      nextMoves.push(EAST);
    }
    if (x > 0) {
      nextMoves.push(WEST);
    }
    if (y < (HEIGHT-1)) {
      //nextMoves.push(NORTH);
      nextMoves.push(SOUTH);
    }
    if (y > 0) {
      //nextMoves.push(SOUTH);
      nextMoves.push(NORTH);
    }
    
    //nextMoves.push(PASS);

    //console.log(nextMoves);
    return nextMoves;
  },

  getMove: function() {
    let pl_x = get_my_x();
    let pl_y = get_my_y();
    let op_x = get_opponent_x();
    let op_y = get_opponent_y();
    let pl = [pl_x, pl_y];
    let op = [op_x, op_y];
    let pos1 = [pl, op];
    let pos2 = JSON.parse(JSON.stringify(pos1));  // Create a copy so that it can be modified
    //let pos2 = clone(pos1);
    //let items = [Board.totalItems, Board.myBotCollected, Board.simpleBotCollected]
    //let itemsarr = [Board.totalItems, Board.myBotCollected, Board.simpleBotCollected];
    //let items = clone(itemsarr);
    let items = JSON.parse(JSON.stringify([Board.totalItems, Board.myBotCollected, Board.simpleBotCollected]));  // Create a copy so that it can be modified

    let board1 = get_board();
    let board2 = JSON.parse(JSON.stringify(board1));  // Create a copy so that it can be modified
    //let board2 = clone(board1);
    //console.log(typeof board2)
    //console.log(typeof [1,5,2,5])
    //console.log(JSON.stringify(board2))
    // console.log(pos2[0][0], pos2[0][0]-1);
    // console.log(board2[pl_x][pl_y-1]);
    // console.log(board2[pos2[0][0]][pos2[0][0]-1]);

    // let pos1 = [pl_x, pl_y, op_x, op_y];
    // let pos2 = [...pos_1];

    // let items_pl = [...Board.myBotCollected];
    // let items_op = [...Board.simpleBotCollected];
    // let items_tot = [...Board.totalItems];
    // let items = [items_pl, items_op, items_tot];
    
    this.nodeExpanded = 0;
    return this.expectiminimax(max_depth, 0, pos2, items, board2);
  },

  expectiminimax: function(depth, player, position, items_store, board_store) {
    // Players: 0 = me, 1 = them

    //console.log('In expectimax, depth: ' + depth + ' for player ' + player);
    // generate moves
    this.nodeExpanded += 1;
    //var nextMoves = (player === 0) ? this.generateMoves(position.slice(0,2)) : this.generateMoves(position.slice(2,4));
    var nextMoves = this.generateMoves(position[player]);
    var bestScore = (player === 0) ? MINSCORE : MAXSCORE;
    var opponent = player === 0 ? 1 : 0;
    var currentScore;
    var bestMove = -1;

    // let position = JSON.parse(JSON.stringify(pos));  // Create a copy so that it can be modified
    // let items_store = JSON.parse(JSON.stringify(items));  // Create a copy so that it can be modified
    // let board_store = JSON.parse(JSON.stringify(board));  // Create a copy so that it can be modified
    // let items_pl = items_store[0];
    // let items_op = items_store[1];
    // let items_tot = items_store[2];
    // let items = [items_pl, items_op, items_tot];

    //console.log(depth);    

    if (depth == 0) {
      bestScore = this.getScore(items_store);
      //console.log("Calculated best score for this branch.");
    } else {

      for (dir in nextMoves) {
        let move = nextMoves[dir];
        // let pos = JSON.parse(JSON.stringify(position));  // Create a copy so that it can be modified
        // let items = JSON.parse(JSON.stringify(items_store));
        // let board = JSON.parse(JSON.stringify(board_store));

        let pos = clone(position);
        let items = clone(items_store);
        let board = clone(board_store);

        // pos = JSON.parse(JSON.stringify(position));
        // items = JSON.parse(JSON.stringify(items_store));
        // board = JSON.parse(JSON.stringify(board_store));
        
        // let items_pl = [...items_store[0]];
        // let items_op = [...items_store[1]];
        // let items_tot = [...items_store[2]];
        // let items = [items_tot, items_pl, items_op];

        // let pos = [...position];
        // var pos_player = (player === 0) ? pos.slice(0,2) : pos.slice(2,4);

        //console.log("Checking move: " + move + " at depth: " + depth + " for Player: " + player);
        if (move == NORTH) {
          pos[player][1] --;
          // pos_player[1] --;
        } else if (move == SOUTH) {
          pos[player][1] ++;
          // pos_player[1] ++;
        } else if (move == EAST) {
          pos[player][0] ++;
          // pos_player[0] ++;
        } else if (move == WEST) {
          pos[player][0] --;
          // pos_player[0] --;
        } else if ((move == TAKE) && (board[pos[player][0]][pos[player][1]] != 0)) {
          // Account for both bots trying to take the same fruit on the same turn
          if (player === 0) {
            items[1][board[pos[player][0]][pos[player][1]]-1]++;
            board[pos[player][0]][pos[player][1]] = board[pos[player][0]][pos[player][1]] * -1;  // Mark that the player took this fruit
          } else {
            if (board[pos[player][0]][pos[player][1]] < 0) {
              items[2][(-1 * board[pos[player][0]][pos[player][1]])-1] = items[2][(-1 * board[pos[player][0]][pos[player][1]])-1] + 0.5;
              items[1][(-1 * board[pos[player][0]][pos[player][1]])-1] = items[1][(-1 * board[pos[player][0]][pos[player][1]])-1] - 0.5;  // Adjust the player's score since the opponent bot also picked this up
              board[pos[player][0]][pos[player][1]] = 0;
            } else {
              items[2][board[pos[player][0]][pos[player][1]]-1]++;
              board[pos[player][0]][pos[player][1]] = 0;
            }
          }
        }
      // } else if ((move == TAKE) && (board[pos_player[0]][pos_player[1]] != 0)) {
      //   // Account for both bots trying to take the same fruit on the same turn
      //   if (player === 0) {
      //     items[1][board[pos_player[0]][pos_player[1]]-1]++;
      //     board[pos_player[0]][pos_player[1]] = board[pos_player[0]][pos_player[1]] * -1;  // Mark that the player took this fruit
      //   } else {
      //     if (board[pos_player[0]][pos_player[1]] < 0) {
      //       items[2][(-1 * board[pos_player[0]][pos_player[1]])-1] = items[2][(-1 * board[pos_player[0]][pos_player[1]])-1] + 0.5;
      //       items[1][(-1 * board[pos_player[0]][pos_player[1]])-1] = items[1][(-1 * board[pos_player[0]][pos_player[1]])-1] - 0.5;  // Adjust the player's score since the opponent bot also picked this up
      //       board[pos_player[0]][pos_player[1]] = 0;
      //     } else {
      //       items[2][board[pos_player[0]][pos_player[1]]-1]++;
      //       board[pos_player[0]][pos_player[1]] = 0;
      //     }
      //   }
      // }
        // Clear all negative values from board after a round completes
        if (player === 1) {
          for (var i=0; i<WIDTH; i++) {
            for (var j=0; j<HEIGHT; j++) {
              if (board[i][j] < 0) {
                board[i][j] = 0;
              }
            }
          }
        }


        currentScore = this.expectiminimax(depth - 1, opponent, pos, items, board)["bestScore"];

        if (player === 0) {
          // player 0 is maximizing
          if (currentScore > bestScore) {
            bestScore = currentScore;
            bestMove = move;
          }
        } else {
          // player 1 is minimizing
          if (currentScore < bestScore) {
            bestScore = currentScore;
            bestMove = move;
          }
        }

        // if (depth == max_depth) {
        //   move_stuff = {
        //     "move": move,
        //     "depth": depth,
        //     "score": currentScore,
        //   };
        //   console.log(move_stuff);
        // }
      }
    }

    stuff = {
      "bestMove": bestMove,
      "bestScore": bestScore,
    };

    //console.log(stuff);
    return stuff;
  },

  getScore: function(items) {

    /* Score Calculation Notes - DIDN'T USE!!!
    Score has two components:
    Item Type score
    Individual items scores

    Highest value fruit: secures a win for an item type
    Lowest value fruit: fruit that for an item type that is already decided

    Need "decided" calculation
    Metric for 'how far from decided' - if very close to decided, then each item has a high value
    Metric for 'deciding in my favor' - if helps to decide in your favor ()
    Each item value is 'deciding in my favor' / 'how far from decided' - if very close to deciding in my favor, then each item has a high value
    */

    // var items = [Board.totalItems, Board.myBotCollected, Board.simpleBotCollected]

    var item_type_score_max = 0;  // Player's maximum score for item type wins (Possible range: -3 to +3, although game will end at -2/+2)
    var item_type_score_min = 0;  // Player's minimum score for item type wins
    var item_type_score_winning = 0;  // Sum of Player's score within undecided item types
    var item_types_left = Board.numberOfItemTypes;
    for (var i=0; i < Board.numberOfItemTypes; i++) {

      // Determine who should be considered the "player" in this score calculation
      //if (player === 0) {
        var diff = items[1][i] - items[2][i];
      //} else {
      //  var diff = items[2][i] - items[1][i];
      //}
      
      var numleft = items[0][i] - items[1][i] - items[2][i];
      var item_score_max = diff + numleft;  // Player's maximum score for this item type (if <0, then can't win this item type)
      var item_score_min = diff - numleft;  // Player's miniumum score for this item type (if >0, then always wins this item type)
      if (item_score_min == 0 && item_score_max == 0) {  // tie
        item_types_left --;
      } else if (item_score_min >= 0) {
        item_type_score_max ++;  // player 1 could win or tie
        if (item_score_min > 0) {
          item_type_score_min ++;  // player 1 wins for this type of fruit
          item_types_left --;
        } else {
          item_type_score_winning += diff / items[0][i];  // Player's current score for this item type
        }
      } else if (item_score_max <= 0) {
        item_type_score_min --;  // player 2 could win or tie
        if (item_score_max < 0) {
          item_type_score_max --;  // player 2 wins
          item_types_left --;
        } else {
          item_type_score_winning += diff / items[0][i];  // Player's current score for this item type
        }
      } else if(numleft != 0) {  // still up in the air
        item_type_score_min --;
        item_type_score_max ++;
        item_type_score_winning += diff / items[0][i];  // Player's current score for this item type
      }
    }

    // item_type_score_max + opp_item_type_score_min = 0
    // item_type_score_min + opp_item_type_score_max = 0
    var opp_item_type_score_max = -1 * item_type_score_min;  // Opponent's maximum score for item type wins (Possible range: -3 to +3, although game will end at -2/+2)
    var opp_item_type_score_min = -1 * item_type_score_max;  // Opponent's minimum score for item type wins

    // want to maximize own score and minimize opponent's score
    //return p0score + (-p1score);
    var score = item_type_score_max + item_type_score_min + item_type_score_winning;
    //console.log('Calculated score of: ' + score);
    return score;

  },
}


// Optionally include this function if you'd like to always reset to a 
// certain board number/layout. This is useful for repeatedly testing your
// bot(s) against known positions.
//
//function default_board_number() {
//    return 610600;
//}
