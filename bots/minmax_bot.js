/*
Functions for the game controller to call. 
new_game() is run once per game at the start of it. 
And make_move() is run on each move.
*/
function new_game(){
    boardStatus.moves_self = [];
    boardStatus.moves_opponent = [];
    boardStatus.taken_self = [];
    boardStatus.taken_opponent = [];
    boardStatus.past_moves_self = [];
}

function make_move(){
    var move = TimeKeeper.getMove(1000);
    trace("Computed Scores: "+String(comp));
    comp = 0;
    
    boardStatus.moves_self = [];
    boardStatus.moves_opponent = [];
    boardStatus.taken_self = [];
    boardStatus.taken_opponent = [];
    if (move == TAKE){ 
        boardStatus.past_moves_self = [];
    } else {
        boardStatus.past_moves_self.push(move);
    }
    for (var i = 0; i < boardStatus.past_moves_self.length; i++){
        boardStatus.moves_self.push(boardStatus.past_moves_self[i]);
        boardStatus.taken_self.push(0);
    }
    
    return move;
}

function default_board_number() {
    return 746;
}

/*
boardStatus keeps track of the state of the game as we progress towards the end.

After each move is played, we use the reset() function to get updated information about the game
use move() and unmove() to change the game state from there.

boardStatus.board[i][j] - same rules as get_board()

boardStatus.fruits[i] - triplet of [total_fruit, own_fruit, opp_fruit] 

boardStatus.moves_self, boardStatus.moves_opponent - list of hypothetical moves
boardStatus.taken_self, boardStatus.taken_opponent - correspond to moves, false if no 
fruit was taken on that turn, otherwise 1-indexed fruit (same as board)

*/

var boardStatus = {

    reset: function(){
        //this will be called every time a move is actually made
        //it will get info about fruit available/taken and bot locations
        boardStatus.own_position = [get_my_x(), get_my_y()];
        boardStatus.opp_position = [get_opponent_x(), get_opponent_y()];
        boardStatus.board = new Array(WIDTH);
        for (var i = 0; i < WIDTH; i++){
            boardStatus.board[i] = new Array(HEIGHT);
            for (var j = 0; j < HEIGHT; j++){
                var fruit = get_board()[i][j];
                if (get_total_item_count(fruit) >= 
                    2*Math.max(self_fruit_count(fruit), 
                               opponent_fruit_count(fruit))){
                    //skip the fruits which are already decided
                    boardStatus.board[i][j] = fruit;
                } else{
                    boardStatus.board[i][j] = 0;
                }
            }
        } 
        boardStatus.fruits = [];
        for (var i = 0; i < get_number_of_item_types(); i++){
            boardStatus.fruits.push([get_total_item_count(i+1), 
                                 self_fruit_count(i+1), 
                                 opponent_fruit_count(i+1)]);
        }
    },

    move: function(own_move, opp_move){
        boardStatus.geomove(own_move, boardStatus.own_position, true);
        boardStatus.geomove(opp_move, boardStatus.opp_position, true);
        var taken_self = false;
        var taken_opponent = false;
        var tie = own_move == TAKE && opp_move == TAKE && 
                  boardStatus.own_position[0] == boardStatus.opp_position[0] &&
                  boardStatus.own_position[1] == boardStatus.opp_position[1]
        if (own_move == TAKE){
            var i = boardStatus.own_position[0];
            var j = boardStatus.own_position[1];
            taken_self = boardStatus.board[i][j];
            boardStatus.fruits[taken_self - 1][1] = 
                boardStatus.fruits[taken_self - 1][1] + 1 - Number(tie)*0.5;
            boardStatus.board[i][j] = 0;
        }
        if (opp_move == TAKE){
            var i = boardStatus.opp_position[0];
            var j = boardStatus.opp_position[1];
            taken_opponent = boardStatus.board[i][j];
            if (tie) taken_opponent = taken_self;
            boardStatus.fruits[taken_opponent - 1][2] = 
                boardStatus.fruits[taken_opponent - 1][2] + 1 - Number(tie)*0.5;
            boardStatus.board[i][j] = 0;
        }
        boardStatus.moves_self.push(own_move);
        boardStatus.moves_opponent.push(opp_move);
        boardStatus.taken_self.push(taken_self);
        boardStatus.taken_opponent.push(taken_opponent);
    },

    geomove: function(move, object_moving, forward){
        var step = forward?1:-1;
        if (move == EAST) object_moving[0] = object_moving[0] + step;
        if (move == WEST) object_moving[0] = object_moving[0] - step;
        if (move == NORTH) object_moving[1] = object_moving[1] - step;
        if (move == SOUTH) object_moving[1] = object_moving[1] + step;
    },

    unmove: function(){
        var own_move = boardStatus.moves_self.pop();
        var opp_move = boardStatus.moves_opponent.pop();
        var taken_self = boardStatus.taken_self.pop();
        var taken_opponent = boardStatus.taken_opponent.pop();
        boardStatus.geomove(own_move, boardStatus.own_position, false);
        boardStatus.geomove(opp_move, boardStatus.opp_position, false);
        var tie = taken_self && taken_opponent && 
                  boardStatus.own_position[0] == boardStatus.opp_position[0] &&
                  boardStatus.own_position[1] == boardStatus.opp_position[1]
        if (taken_self){
            boardStatus.board[boardStatus.own_position[0]]
                           [boardStatus.own_position[1]] = taken_self;
            boardStatus.fruits[taken_self - 1][1] = 
                boardStatus.fruits[taken_self - 1][1] - 1 + Number(tie)*0.5;
        } 
        if (taken_opponent){
            boardStatus.board[boardStatus.opp_position[0]]
                           [boardStatus.opp_position[1]] = taken_opponent;
            boardStatus.fruits[taken_opponent - 1][2] = 
                boardStatus.fruits[taken_opponent - 1][2] - 1 + Number(tie)*0.5;
        }  
    }
}
/*
PossibleMoves.own_candidate_moves and PossibleMoves.opp_candidate_moves
are built based on boardStatus's positions and previous moves

PossbleMoves.reset() updates them based on boardStatus.  Right now the possible
moves are based on:
*No going off edges off board
*No going in two opposite directions without a TAKE move in between them
    -a PASS move in between, generated by some sort of bug, also resets this
*All east-west motion comes before north-south motion

In the future it will be helpful to add options here.  More restricted 
possible moves mean missing some cases but deeper search tree.

*/

var PossibleMoves = {
    geoReset: function(position, candidate_move_array, previous_move_array){
        //if previous move is empty/take, append north/south/east/west
        //if previous move is east/west, append that one and north/south
        //if previous move is north/south, append that one only
        last_move = false;
        if (previous_move_array.length > 0) {
            last_move = previous_move_array[previous_move_array.length-1]
            if (last_move == TAKE || last_move == PASS)
                //treat same as empty
                last_move = false;
        }
        if ((!last_move || last_move != SOUTH) && (position[1] > 0))
            candidate_move_array.push(NORTH);
        if ((!last_move || last_move != NORTH) && (position[1] < HEIGHT-1))
            candidate_move_array.push(SOUTH);
        if ((!last_move || (last_move != NORTH && last_move != SOUTH && 
                            last_move != WEST)) && position[0] < WIDTH -1)
            candidate_move_array.push(EAST);
        if ((!last_move || (last_move != NORTH && last_move != SOUTH &&
                            last_move != EAST)) && position[0] > 0)
            candidate_move_array.push(WEST);
    
    },
    
    reset: function(){
        
        PossibleMoves.own_candidate_moves = [];
        PossibleMoves.opp_candidate_moves = [];        

        if (boardStatus.board[boardStatus.own_position[0]]
                           [boardStatus.own_position[1]] > 0) {
            PossibleMoves.own_candidate_moves.push(TAKE);
        }
        if (boardStatus.board[boardStatus.opp_position[0]]
                           [boardStatus.opp_position[1]] > 0) {
            PossibleMoves.opp_candidate_moves.push(TAKE);
        }

        PossibleMoves.geoReset(boardStatus.opp_position, 
                               PossibleMoves.opp_candidate_moves,
                               boardStatus.moves_opponent);

        PossibleMoves.geoReset(boardStatus.own_position, 
                               PossibleMoves.own_candidate_moves,
                               boardStatus.moves_self);
    }
}
/*
getHeuristicScore() provides a too complicated and not thouroughly tested 
evaluation.

A beter optimised solution can be obtained for it, if rather than calculating the 
score every single time we instead store it for further use and 
change with move nad unmove. (Dynamic Programming)
*/

// comp variable keeps track of the total evealuations made; which we can
// then use for a marginally faster inference. 
var comp = 0;


var Scorer = {

    getHeuristicScore: function(){
        comp += 1;
        var score = 0;
        var wins_app = 0;
        var lose_app = 0;
        var fruit_importance = [];
        for (var i = 0; i < boardStatus.fruits.length; i++){
            fruit_importance.push(0);
            var this_fruit = boardStatus.fruits[i];
            var total_fruit = this_fruit[0];
            if (this_fruit[1]*2 > total_fruit){
                score += 1;
                wins_app += 1;
                continue;
            }
            if (this_fruit[2]*2 > total_fruit){
                score -= 1;
                lose_app += 1;
                continue;
            }
            if (this_fruit[1] == this_fruit[2])
                continue;
            score_adj = 0;
            remaining_fruit = total_fruit-this_fruit[1]-this_fruit[2];
            if (remaining_fruit == 0){
                wins_app += 0.5;
                lose_app += 0.5;
                continue;
            }
            score += (this_fruit[1]-this_fruit[2])/total_fruit;  
        }

        if ((wins_app*2) > boardStatus.fruits.length){
            return Number.POSITIVE_INFINITY;
        }
        if (wins_app*2 == boardStatus.fruits.length && 
            lose_app*2 == boardStatus.fruits.length)
            return 0;

        //we add distance logic if necessary, e.g. no forced win/tie yet
        for (var i = 0; i < WIDTH; i++){
            for (var j = 0; j < HEIGHT; j++){
                if (boardStatus.board[i][j] > 0){
                    this_fruit = boardStatus.fruits[boardStatus.board[i][j] -1];
                    total_fruit = this_fruit[0];
                    if (this_fruit[1]*2 <= total_fruit && 
                        this_fruit[2]*2 <= total_fruit){
                        var diff = Math.abs(this_fruit[1]-this_fruit[2]);
                        var to_win = (total_fruit+1)*0.5 - 
                                     Math.max(this_fruit[1], this_fruit[2]);
                        var own_x = boardStatus.own_position[0];
                        var own_y = boardStatus.own_position[1];
                        var opp_x = boardStatus.opp_position[0];
                        var opp_y = boardStatus.opp_position[1];
                        var own_dist = Math.abs(own_x - i)+Math.abs(own_y - j);
                        var opp_dist = Math.abs(opp_x - i)+Math.abs(opp_y - j);
                        score += 0.5*(1/(own_dist+1) - 1/(opp_dist+1)) *  
                                     1/(to_win + diff+2);
                    }
                }
            }
        }
        return score;
    }
}
/*
bestMove() returns the move for which the opponent's best reply is least
effective.

*/

var Player = {
    
    bestMove: function(depth, start_time, alotted_time) {
        if (new Date()-start_time >= alotted_time)
            return undefined;
        //an undefined return starts a chain of these, and exits minimaxplayer

        PossibleMoves.reset();
        //we need to explicitly copy possible moves because of recursion
        var moves_self = [];
        for (var i = 0; i < PossibleMoves.own_candidate_moves.length; i++){
            moves_self.push(PossibleMoves.own_candidate_moves[i]);
        }
        var moves_opponent = [];
        for (var i = 0; i < PossibleMoves.opp_candidate_moves.length; i++){
            moves_opponent.push(PossibleMoves.opp_candidate_moves[i]);
        }

        var best_score = Number.NEGATIVE_INFINITY;
        if (moves_self.length == 0)
            return [PASS, Number.NEGATIVE_INFINITY];
        var best_move = moves_self[0];
        for (var i = 0; i < moves_self.length; i++){
            var worst_score = Number.POSITIVE_INFINITY;
            if (moves_opponent.length == 0)
                moves_opponent.push(PASS);
            //TODO this is not really correct.  just because a bot has
            //0 legal moves based on its past because we heavily restricted
            //the "possible" moves does not mean we have a forced win
            var opp_best_move = moves_opponent[0];
            for (var j = 0; j < moves_opponent.length; j++){
                boardStatus.move(moves_self[i], moves_opponent[j])
                var this_score = undefined;
                
                if (depth > 1){
                    var bmbs = Player.bestMove(depth-1, 
                                                  start_time, alotted_time);
                    if (bmbs == undefined)
                        return undefined;
                    this_score = bmbs[1];
                    this_score += Math.pow(0.1, depth) *
                                  Scorer.getHeuristicScore()
                    //the score is a weighted sum of score at every depth
                    //the weights are highest at the deepest level and
                    //reduced by 90% for each level shallower
                }
                else{
                    this_score = Scorer.getHeuristicScore();
                }
                if (this_score < worst_score){
                     worst_score = this_score;
                     opp_best_move = moves_opponent[j];
                }


                boardStatus.unmove();

                if (worst_score <= best_score) break;
            }
            if (worst_score > best_score) {
                best_score = worst_score
                best_move = moves_self[i];
            }
        }
        return [best_move, best_score];
    },
    
}
/*
uses allocated time to control Player

*/

var TimeKeeper = {
    getMove: function(alotted_time){
        var start_time = new Date();
        depth = 5;
        bestResult = [PASS, 0];
        bmbs = [PASS, 0];
        while( bmbs != undefined && bmbs[1] != Number.POSITIVE_INFINITY
                                 && bmbs[1] != Number.NEGATIVE_INFINITY){
            boardStatus.reset();
            bmbs = Player.bestMove(depth, start_time, alotted_time);
            if (bmbs != undefined && bmbs[1] != Number.NEGATIVE_INFINITY
                && (bmbs[0] == PASS || bmbs[0] == TAKE || bmbs[0] == EAST ||
                    bmbs[0] == WEST || bmbs[0] == NORTH || bmbs[0] == SOUTH))
                //sort of overkill;  TODO make some test cases to reduce this
                bestResult = bmbs;         
            depth += 1;
        }
        trace("depth searched: "+String(depth-2));
        trace ("time used: "+String(new Date() - start_time));
        trace("evaluation: "+String(bestResult[1]));
        return bestResult[0];
    }
}
