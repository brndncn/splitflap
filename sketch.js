let width = 1400;
let height = 600;

let characters = [
  ' '
, 'A'
, 'B'
, 'C'
, 'D'
, 'E'
, 'F'
, 'G'
, 'H'
, 'I'
, 'J'
, 'K'
, 'L'
, 'M'
, 'N'
, 'O'
, 'P'
, 'Q'
, 'R'
, 'S'
, 'T'
, 'U'
, 'V'
, 'W'
, 'X'
, 'Y'
, 'Z'
, '1'
, '2'
, '3'
, '4'
, '5'
, '6'
, '7'
, '8'
, '9'
, '0'
, '!'
, '.'
, ','
, '#'
];


let simulation_running = false;
let simulation_speed = 100;
let simulation_interval_id;

// invariant outside of setup_grid: delta and state have same dims
let delta = [], state = [];

let remaining_solution = [];

let cols_input, row_input;
let style_input, algorithm_input;

let scramble_deltas_button;
let scramble_state_button;
let set_deltas_button;
let run_or_pause_solution_button;
let calculate_and_run_button;
let calculate_button;

let textarea_input;
let textarea_problem_output;
let textarea_solution_input;
let textarea_last_solution_output;

let cols, rows;
let style;

function setup() {
  createCanvas(width, height);
  cols_input = createInput("16", "number");
  cols_input.elt.before("cols");
  cols_input.changed(setup_grid);

  rows_input = createInput("5", "number");
  rows_input.elt.before("rows");
  rows_input.changed(setup_grid);

  style_input = createRadio("style_input");
  style_input.option("display");
  style_input.option("grid");
  style_input.selected("grid");
  style_input.changed(setup_grid);

  textarea_input = createElement("textarea");
  textarea_input.size(500,120);
  createElement("br");
  set_deltas_button = createButton("set deltas");
  set_deltas_button.mouseClicked(set_deltas_from_text);

  createElement("br");

  scramble_deltas_button = createButton("scramble deltas");
  scramble_deltas_button.mouseClicked(scramble_deltas);

  scramble_state_button = createButton("scramble state");
  scramble_state_button.mouseClicked(scramble_state);

  let output_div = createDiv();
  textarea_problem_output = createElement("textarea");
  textarea_problem_output.size(500,120);
  output_div.elt.innerText = "problem";
  output_div.elt.appendChild(createElement("br").elt);
  output_div.elt.appendChild(textarea_problem_output.elt);

  let solution_div = createDiv();
  textarea_solution_input = createElement("textarea");
  textarea_solution_input.size(570,220);
  textarea_solution_input.changed(input_solution);
  run_or_pause_solution_button = createButton("run");
  run_or_pause_solution_button.mouseClicked(run_or_pause);
  solution_div.elt.innerText = "paste custom solution here";
  solution_div.elt.appendChild(createElement("br").elt);
  solution_div.elt.appendChild(textarea_solution_input.elt);
  solution_div.elt.appendChild(createElement("br").elt);
  solution_div.elt.appendChild(run_or_pause_solution_button.elt);

  algorithm_input = createRadio("algorithm_input");
  algorithm_input.option("horrible", "Brandon's horrible 1-by-1");
  algorithm_input.option("columns", "Brandon's trivial columns");
  algorithm_input.selected("horrible");

  calculate_and_run_button = createButton("calculate and run");
  calculate_and_run_button.mouseClicked(calculate_and_run);
  calculate_button = createButton("calculate");
  calculate_button.mouseClicked(calculate);

  createElement("br");
  textarea_last_solution_output = createElement("textarea");
  textarea_last_solution_output.size(570,220);

  setup_grid();
  output_solution();

  simulation_interval_id = setInterval(simulation_tick, simulation_speed);
}

function copy_array(array) {
  let copy = [];
  for (let i = 0; i < array.length; i++) {
    copy.push(array[i]);
  }
  return copy;
}

function modulo(a,b) {
  return ((a % b) + b) % b;
}

function one_hot_encode(i, n) {
  let vec = [];
  for (let j = 0; j < n; j++) {
    vec.push(i == j ? 1 : 0);
  }
  return vec;
}

function setup_grid() {
  style = style_input.value();
  cols = parseInt(cols_input.value());
  rows = parseInt(rows_input.value());

  let existing_cols = 0;
  if (delta.length > 0) existing_cols = delta[0].length;

  let new_rows = rows - delta.length;
  let new_cols = cols - existing_cols;

  for (let r = 0; r < delta.length; r++) {
    for (let c = 0; c < new_cols; c++) {
      delta[r].push(0);
      state[r].push(0);
    }
    for (let c = 0; c < -new_cols; c++) {
      delta[r].pop();
      state[r].pop();
    }
  }

  for (let r = 0; r < new_rows; r++) {
    let new_row = [];
    for (let c = 0; c < cols; c++) {
      new_row.push(0);
    }
    delta.push(copy_array(new_row));
    state.push(copy_array(new_row));
  }

  for (let r = 0; r < -new_rows; r++) {
    delta.pop();
    state.pop();
  }

  output_problem();
}

function scramble_deltas() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      delta[r][c] = Math.floor(Math.random() * characters.length)
    }
  }

  output_problem();
}

function scramble_state() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      state[r][c] = Math.floor(Math.random() * characters.length)
    }
  }

  output_problem();
}

function set_deltas_from_text() {
  let lines = textarea_input.value().split("\n");
  while (rows - lines.length >= 2) {
    lines.unshift("");
    lines.push("");
  }
  // this should only be called once, could be an if, but whatever
  while (lines.length < rows) {
    if (Math.random() > 0.5) lines.unshift(""); else lines.push("");
  }
  
  while (lines.length > rows) {
    lines.pop();
  }

  for (let i = 0; i < lines.length; i++) {
    while (cols - lines[i].length >= 2) {
      lines[i] = characters[0] + lines[i] + characters[0];
    }
    // this should only be called once, could be an if, but whatever
    while (lines[i].length < cols) {
      lines[i] += characters[0];
    }

    lines[i] = lines[i].substring(0, cols);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let character = lines[r].at(c);
      let target_character = characters.indexOf(character);
      if (target_character === -1) target_character = characters.indexOf(character.toUpperCase());
      if (target_character === -1) target_character = characters.indexOf(character.toLowerCase());
      if (target_character === -1) target_character = 0;
      delta[r][c] = modulo((target_character - state[r][c]), characters.length);
    }
  }

  output_problem();
}

function calculate() {
  switch (algorithm_input.value()) {
    case "horrible":
      remaining_solution = calculate_horrible();
      break;
    case "columns":
      remaining_solution = calculate_columns();
      break;
  }

  output_last_solution();
  output_solution();
}

function calculate_and_run() {
  calculate();
  run();
}

function input_solution() {
  remaining_solution = JSON.parse(textarea_solution_input.value());
  textarea_solution_input.value("");
  console.log(remaining_solution);
  output_solution();
  output_last_solution();
}

function output_problem() {
  textarea_problem_output.value(JSON.stringify(delta));
}

function output_solution() {
  textarea_solution_input.elt.placeholder = JSON.stringify(remaining_solution).replaceAll('},{', '},\n{');
}

function output_last_solution() {
  textarea_last_solution_output.value(JSON.stringify(remaining_solution).replaceAll('},{', '},\n{'));
}

function calculate_horrible() {
  let solution = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let k = delta[r][c];
      if (k != 0) solution.push({k, rows:one_hot_encode(r, rows), cols:one_hot_encode(c, cols)});
    }
  }

  return solution;
}

function calculate_columns() {
  let solution = [];
  for (let c = 0; c < cols; c++) {
    let col = [];
    for (let r = 0; r < rows; r++) {
      col.push(delta[r][c]);
    }

    let colticks = 0;
    let max = Math.max.apply(Math, col);
    while (colticks < max) {
      let min = Math.min.apply(Math, col.filter(x => x > colticks));
      let k = min - colticks;
      let rowout = [];
      for (let r = 0; r < rows; r++) {
        rowout.push(col[r] > colticks ? 1 : 0);
      }
      solution.push({k, cols:one_hot_encode(c, cols), rows:rowout});
      colticks += k
    }

  }
  return solution;
}

function run_or_pause() {
  if (simulation_running) pause(); else run();
}

function run() {
  simulation_running = true;
  run_or_pause_solution_button.elt.textContent = "pause"; 
}

function pause() {
  simulation_running = false;
  run_or_pause_solution_button.elt.textContent = "run"; 
}

function simulation_tick() {
  if (simulation_running) {
    if (remaining_solution.length === 0) {
      pause();
      return;
    }

    let frame = remaining_solution[0];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (frame.rows[r] === 1 && frame.cols[c] === 1) {
          state[r][c] = modulo(state[r][c] + 1, characters.length);
          delta[r][c] = modulo(delta[r][c] - 1, characters.length);
        }
      }
    }

    remaining_solution[0].k -= 1;
    if (remaining_solution[0].k <= 0) {
      remaining_solution.shift();
    }

    output_solution();
    output_problem();
  }
}

let flap_height = 90;
let flap_width = 65;
let flap_radius = 10;
let flap_joint_stroke_weight = 2;
let display_text_size = 72;
let display_text_y_offset = 70;
let display_text_font = 'Helvetica';
let padding_x = 10;
let padding_y = padding_x;

function draw() {
  clear();
  let display_width = flap_width * cols + padding_x * (cols - 1);
  let display_height = flap_height * rows + padding_y * (rows - 1);
  translate((width - display_width) / 2, (height - display_height) / 2);
  if (style === 'display') draw_display(display_width, display_height);
  if (style === 'grid') draw_grid(display_width, display_height);
}

function draw_display() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let top_left_x = (padding_x + flap_width) * c;
      let top_left_y = (padding_y + flap_height) * r;
      let center_x = top_left_x + flap_width / 2;
      let center_y = top_left_y + flap_height / 2;
      let i = r * cols + c;

      fill('black');
      strokeWeight(0);
      rect(top_left_x, top_left_y, flap_width, flap_height, flap_radius);

      stroke('white');
      strokeWeight(flap_joint_stroke_weight);
      line(top_left_x, center_y, top_left_x + flap_width, center_y);

      fill('white');
      strokeWeight(0);
      textFont(display_text_font);
      textAlign('center');
      textSize(display_text_size);
      text(characters[state[r][c]], center_x, top_left_y + display_text_y_offset);
    }
  }
}

let bracket_padding_x = 30;
let bracket_padding_y = 16;
let bracket_stroke_weight = 6;
let grid_text_font = 'Monaco';
let grid_text_size = [60, 45];
let grid_text_y_offset = [67, 63];
let grid_text_colors = ['277da1', '577590', '4d908e', '43aa8b', '90be6d', 'f9c74f', 'f9844a', 'f8961e', 'f3722c', 'f94144'];

function draw_grid(display_width, display_height) {
  strokeWeight(bracket_stroke_weight);

  let center_row = Math.floor((rows - 1) / 2);
  let lc = delta[0].length >= 6 ? 2 : 0;
  let rc = delta[0].length >= 6 ? delta[0].length - 3 : delta[0].length - 1;

  stroke('#' + grid_text_colors[modulo(delta[center_row][lc], grid_text_colors.length)]);
  line(0, -bracket_padding_y, -bracket_padding_x, -bracket_padding_y);
  line(-bracket_padding_x, -bracket_padding_y, -bracket_padding_x, display_height + bracket_padding_y);
  line(-bracket_padding_x, display_height + bracket_padding_y, 0, display_height + bracket_padding_y);

  stroke('#' + grid_text_colors[modulo(delta[center_row][rc], grid_text_colors.length)]);
  line(display_width, -bracket_padding_y, display_width + bracket_padding_x, -bracket_padding_y);
  line(display_width + bracket_padding_x, -bracket_padding_y, display_width + bracket_padding_x, display_height + bracket_padding_y);
  line(display_width + bracket_padding_x, display_height + bracket_padding_y, display_width, display_height + bracket_padding_y);
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let top_left_x = (padding_x + flap_width) * c;
      let top_left_y = (padding_y + flap_height) * r;
      let center_x = top_left_x + flap_width / 2;
      let center_y = top_left_y + flap_height / 2;
      let i = r * cols + c;
      let tpi = delta[r][c] >= 10 ? 1 : 0;

      fill('#' + grid_text_colors[modulo(delta[r][c], grid_text_colors.length)]);
      strokeWeight(0);
      textFont('Monaco');
      textAlign('center');
      textSize(grid_text_size[tpi]);
      textSize(grid_text_size[tpi]);
      text(delta[r][c], center_x, top_left_y + grid_text_y_offset[tpi]);
    }
  }

}
