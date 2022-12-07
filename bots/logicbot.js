var prev_pos;

function new_game() {
    //Recording the previous positions for the bot
    prev_pos = [get_my_x(), get_my_y()];
}

function make_move() {
    var board = get_board();

    var ignore_max_fruit = get_max_fruit_count();

    //If we found a fruit item, either take it or if useless then leave it
    var curr_pos = board[get_my_x()][get_my_y()];
    if (curr_pos > 0 && !useless_item_currpos(curr_pos) && curr_pos != ignore_max_fruit) {
        prev_pos = [9999, 9999];
        return TAKE;

    }

    var move_north = 0;
    var move_east = 0;
    var move_west = 0;
    var move_south = 0;

    for (y = 0; y < HEIGHT; y++) {
        for (x = 0; x < WIDTH; x++) {
            if (x == prev_pos[0] && y == prev_pos[1]) {
                if (x > get_my_x()) {
                    move_east -= 2;
                }
                else if (x < get_my_x()) {
                    move_west -= 2;
                }
                else if (y > get_my_y()) {
                    move_south -= 2;
                }
                else if (y < get_my_y()) {
                    move_north -= 2;
                }
            }

            //If we do not find any rare fruit or a blank, then we just leave
            if (board[x][y] == 0 || useless_item_currpos(board[x][y]) || board[x][y] == ignore_max_fruit) {
                continue;
            }

            var fruit = 1
            //Calculating fruit value based on closest and rarest
            fruit += closest_fruit(x, y) * rare_fruit(board[x][y]);

            //Comparing distance with opponent
            if (cell_my_distance(x, y) < cell_opponent_distance(x, y)) {
                fruit += Math.min(3, (rare_fruit(board[x][y]) / 4));

                if (Math.min(get_my_x(), get_opponent_x()) <= x && x <= Math.max(get_my_x(), get_opponent_x()) && 
                Math.min(get_my_y(), get_opponent_y()) <= y && y <= Math.max(get_my_y(), get_opponent_y())) {
                    fruit += Math.min(3, (rare_fruit(board[x][y]) / 2));
                }
            }

            if (x > get_my_x()) {
                move_east += fruit;
            }
            else if ((x < get_my_x())) {
                move_west += fruit;
            }

            if (y > get_my_y()) {
                move_south += fruit;
            }
            else if (y < get_my_y()) {
                move_north += fruit;
            }
        }
    }

    //Not going beyond the borders
    if (get_my_x() == 0) {
        move_west = -999;
    }

    if (get_my_x() == (WIDTH - 1)) {
        move_east = -999;
    }

    if (get_my_y() == 0) {
        move_north = -999;
    }

    if (get_my_y() == (HEIGHT - 1)) {
        move_south = -999;
    }

    var decision = NORTH; 
    var max = move_north;
    if (move_west > max) {
        decision = WEST;
        max = move_west;
    }
    if (move_east > max) {
        decision = EAST;
        max = move_east;
    }
    if (move_south > max) {
        decision = SOUTH;
        max = move_south;
    }

    prev_pos = [get_my_x(), get_my_y()];

    return decision;
}

function get_max_fruit_count() {
    //Getting the maximum fruit counts for all the types of fruits
    if (get_number_of_item_types() <= 3) {
        return 0;
    }

    var res = 1;
    var max_fruit = get_total_item_count(1);

    for (i = 2; i <= get_number_of_item_types(); i++) {
        if (get_total_item_count(i) > max_fruit) {
            res = i;
            max_fruit = get_total_item_count(i);
        }
    }
    return res;
}

function cell_my_distance(x, y) {
    return (Math.abs(y - get_my_y()) + Math.abs(x - get_my_x()));
}

function cell_opponent_distance(x, y) {
    return (Math.abs(y - get_opponent_y()) + Math.abs(x - get_opponent_x()));
}

function closest_fruit(x, y) {
    //Getting the closest fruit to the bot based on the current position
    return (Math.round((Math.max(WIDTH, HEIGHT) - 2) / cell_my_distance(x, y) * Math.pow(110, 1)) / Math.pow(10, 1));
}

function rare_fruit(fruit) {
    var rare = Math.round(total_available_fruits() / (get_total_item_count(fruit) - get_my_item_count(fruit) - get_opponent_item_count(fruit)));

    if (rare > (total_available_fruits() / 2)) {
        rare = total_available_fruits() / 2;
    }

    if (get_my_item_count(fruit) <= get_opponent_item_count(fruit) && (get_my_item_count(fruit) + 1) > get_opponent_item_count(fruit)) {
        rare += 0.5;
    }

    //If it is the last fruit of it's type (when above)
    if ((get_total_item_count(fruit) - get_my_item_count(fruit) - get_opponent_item_count(fruit) == 1) && 
    ((get_my_item_count(fruit) < get_opponent_item_count(fruit) && (get_my_item_count(fruit) + 1) >= get_opponent_item_count(fruit)) || 
    (get_my_item_count(fruit) <= get_opponent_item_count(fruit) && (get_my_item_count(fruit) + 1) > get_opponent_item_count(fruit)))) {
        rare += 2
    }
    else {
        //if the count is much more than the fruit count
        if ((get_total_item_count(fruit) - get_my_item_count(fruit) - get_opponent_item_count(fruit) == 1) && 
        ((get_opponent_item_count(fruit) < get_my_item_count(fruit) && (get_opponent_item_count(fruit) + 1) >= get_my_item_count(fruit)) || 
        (get_opponent_item_count(fruit) <= get_my_item_count(fruit) && (get_opponent_item_count(fruit) + 1) > get_my_item_count(fruit)))) {
            rare += 2;
        }
    }
    return rare;
}

function useless_item_currpos(type_of_fruit) {
    //If the opponent or our bot has the fruit type more than half the count
    return (get_opponent_item_count(type_of_fruit) > (get_total_item_count(type_of_fruit) / 2) || 
    get_my_item_count(type_of_fruit) > (get_total_item_count(type_of_fruit) / 2));
}

function total_available_fruits() {
    var total = 0;
    for (i = 1; i <= get_number_of_item_types(); i++) {
        total += (get_total_item_count(i) - get_opponent_item_count(i) - get_my_item_count(i));
    }
    return total;
}

