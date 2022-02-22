//const challenge = challenges[chal];
var queryString = window.location.search;
  
queryString = queryString.substr(1,2)

var chal = parseInt(queryString) ? parseInt(queryString) - 1 : 3
const challenge = challenges[chal]

const QTY = parseInt(Math.sqrt(challenge[0].length));
const COUNT = QTY ** 2;
const CELL_SIZE = 100;
const BOARD_SIZE = CELL_SIZE * COUNT;

var moveTime = 250;
const RADIUS = CELL_SIZE / 5;

const COLOR_LIST = ["red", "orange", "yellow", "green", "blue", "purple", "maroon", "pink", "aqua",
    "Teal", "LawnGreen", "GoldenRod", "SlateBlue", "SpringGreen", "Sienna", "Plum", "PowderBlue",
    "MidnightBlue", "DeepPink", "FireBrick", "Fuchsia", "LavenderBlush", "Lime", "RosyBrown", "Olive"];

var COLORS_ARRAY = [];
for (var i = 0; i < COUNT; i++) {
    COLORS_ARRAY.push(COLOR_LIST[i]);
}

const COLORS = COLORS_ARRAY;

var svgSize = (function () {
    var dimension = COUNT * CELL_SIZE;
    return { width: dimension, height: dimension }
})()

class Board {
    forces = [];
    boxes = [];
    paths = [];
    errors = [];
    fail = false;

    constructor(qty, challenge) {
        for (let index = 0; index < qty ** 2; index++) {
            this.boxes.push(new Box(index, qty, challenge))
        }
        this.forces = getForces(this)
    }
}

class Box {
    index;
    boxRow;
    boxCol;
    nodes = [];
    cells = [];

    constructor(index, qty, challenge) {
        this.index = index;
        (this.boxRow = findBoxRow(index, qty));
        (this.boxCol = findBoxCol(index, qty));

        let parent = { index: index, qty: qty, boxCol: this.boxCol, boxRow: this.boxRow, size: CELL_SIZE };

        let contents = makeNodesAndCells(parent, challenge);

        this.nodes = contents.nodes;
        this.cells = contents.cells;
    }
}

class Cell {
    col; row;
    position = {};
    size;
    color;
    parentBox;

    constructor(parent, challenge) {
        this.parentBox = parent.index;
        this.row = parent.row;
        this.col = parent.col;

        this.position.x = this.col * parent.size;
        this.position.y = this.row * parent.size;

        this.position.cx = this.position.x + parent.size / 2
        this.position.cy = this.position.y + parent.size / 2

        let colorIndex = challenge[this.row][this.col];
        //console.log(colorIndex)
        if (colorIndex > 0) { this.color = COLORS[colorIndex - 1] }
        //console.log(this.color)

    }

}

class Node {
    parentBox;
    x; y;
    color;

    constructor(parent) {
        this.row = parent.row;
        this.col = parent.col;
        this.parentBox = parent.index;
        this.ok2move = true;
    }
}


// returns parentBox index
function boxWith(row, col) {
    var boxRow = (row - row % QTY) / QTY;
    var boxCol = (col - col % QTY) / QTY;

    var boxIndex = boxCol * QTY + boxRow;
    return boxIndex
}

function inverse(colorArray) {
    let retval = []
    COLORS.forEach(function (color) {
        if (colorArray.indexOf(color) === -1) {
            retval.push(color)
        }
    })
    return retval
}

function includeColor(color, colorArray) {
    if (colorArray.indexOf(color) === -1) {
        colorArray.push(color)
    }
    return colorArray
}

function withoutColor(color, colorArray) {
    let retval = []
    if (color === "") { return colorArray }
    colorArray.forEach(function (arrColor) {
        if (arrColor !== color) {
            retval.push(arrColor)
        }
    })
    return retval
}

function reduce(colorArray) {
    let retval = []
    colorArray.forEach(function (color) {
        if (retval.indexOf(color) === -1) {
            retval.push(color)
        }
    })
    return retval
}

// this only operates at the Box level
function makeNodesAndCells(parent, challenge) {
    let nodes = []
    let cells = []

    for (var col = 0; col < parent.qty; col++) {
        parent.col = (parent.boxCol * parent.qty) + col;
        for (var row = 0; row < parent.qty; row++) {
            parent.row = (parent.boxRow * parent.qty) + row;

            cells.push(new Cell(parent, challenge));
            nodes.push(new Node(parent));
        }
    }

    let colors = []
    colors = colors.concat(COLORS);

    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i];
        let node = nodes[i];

        node.x = cell.position.cx
        node.y = cell.position.cy

        if (cell.color) {
            node.color = cell.color;
            colors.splice(colors.indexOf(cell.color), 1);
        }
        nodes[i] = node
    }

    nodes.forEach(function (node) {
        if (!node.color) {
            node.color = colors.pop();
        }
    })

    return { nodes: nodes, cells: cells }
}


function findBoxRow(index, qty) {
    return index % qty
}

function findBoxCol(index, qty) {
    return (index - (index % qty)) / qty
}

function redrawBoard(board, svg) {

    if (!!!board.boardSVG) {
        board.boardSVG = svg.append("g").classed("board", true);
    }

    var t = d3.transition().duration(moveTime).ease(d3.easeLinear);

    board.boxes.forEach(function (box) {
        if (!!box.squareSVG) {
            box.squareSVG.transition(t)
                .attr("fill", function (d) {
                    if (d.parentBox === 0) {
                        //console.log(JSON.stringify(d));

                    }
                    if (d.color) { return d.color } else { return "white" }
                })

        } else {
            box.squareSVG = board.boardSVG.append("g").classed(`box${box.index}`, true);
            box.squareSVG = box.squareSVG.append("g").classed('squares', true);
            box.squareSVG = box.squareSVG.selectAll("rect").data(box.cells).enter()
                .append("rect").classed('square', true)
                .attr("x", function (d) { return d.x = d.position.x })
                .attr("y", function (d) { return d.y = d.position.y })
                .attr("width", CELL_SIZE)
                .attr("height", CELL_SIZE)
                .attr("fill", function (d) { if (d.color) { return d.color } else { return "white" } });
        }
    });
}

function getForces(board) {
    let forces = [];
    let cells = [];
    let rowForces = [];
    let colForces = [];
    let boxForces = [];
    board.boxes.forEach(function (box, boxIndex) {
        box.cells.forEach(function (cell) {
            if (!forces[cell.row]) {
                forces[cell.row] = [];
            }
            if (!boxForces[boxIndex]) {
                boxForces[boxIndex] = [];
            }

            if (!cells[cell.row]) {
                cells[cell.row] = [];
                rowForces[cell.row] = [];
            }

            if (!colForces[cell.col]) {
                colForces[cell.col] = [];
            }

            // place a holder to collect all the forces from row and col and box
            forces[cell.row][cell.col] = { attract: [], repel: [] };
            //console.log(`forces[${cell.row}][${cell.col}]`)

            if (cell.color) {
                // this will be a map of cell colors that are placed
                cells[cell.row][cell.col] = cell.color
                rowForces[cell.row] = includeColor(cell.color, rowForces[cell.row])
                colForces[cell.col] = includeColor(cell.color, colForces[cell.col])
                boxForces[boxIndex] = includeColor(cell.color, boxForces[boxIndex])
            } else {
                // keep a blank for unplaced cells
                cells[cell.row][cell.col] = ""
            }
        })
    })

    for (let row = 0; row < cells.length; row++) {
        for (let col = 0; col < cells.length; col++) {
            let boxIndex = boxWith(row, col);
            let allForces = rowForces[row].concat(colForces[col])
            allForces = allForces.concat(boxForces[boxIndex])
            allForces = reduce(allForces)
            forces[row][col].repel = withoutColor(cells[row][col], allForces)
            forces[row][col].attract = inverse(forces[row][col].repel)
        }
    }

    // now look for cells that are the only cells in a box looking for a force and set it
    board.boxes.forEach(function (box) {
        COLORS.forEach(function (color) {
            let forceCount = 0;
            let cellFound = {};
            box.cells.forEach(function (cell) {
                if (!cell.color) {
                    if (forces[cell.row][cell.col].attract.indexOf(color) !== -1) {
                        forceCount++
                        cellFound = { row: cell.row, col: cell.col }
                    }
                }
            })
            if (forceCount === 1) {
                forces[cellFound.row][cellFound.col].attract = [color]
            }
        })
    })

    return forces
}

function updateForces(board) {
    board.boxes.forEach(function (box) {
        box.cells.forEach(function (cell) {
            if (board.forces[cell.row][cell.col].attract.length === 1) {
                cell.color = board.forces[cell.row][cell.col].attract[0];
            } else if (board.forces[cell.row][cell.col].attract.length === 0) {
                console.log(`need to draw X on cell ${cell.row}, ${cell.col}`)
                board.errors.push(makeX(cell))
                board.fail = true
            }
        })
    })
    if(board.fail){
        drawErrors(board)
    }
    board.forces = getForces(board);
    return board;
}

function updatePaths(board) {
    let paths = []
    board.boxes.forEach(function (box) {
        box.cells.forEach(function (cell) {
            if (!cell.color) {
                let attractedForces = board.forces[cell.row][cell.col].attract;
                let cellPaths = calculatePaths(cell, attractedForces)

                paths = paths.concat(cellPaths)
            }
        })
    })

    board.paths = paths
}

function redrawForces(board) {
    if (!!board.forceSVG) {
        board.forceSVG.selectAll('.forcePaths').remove()

        //board.forceSVG = board.forceSVG.append("g").classed("forcePaths", true)
        board.forceSVG.append("g").classed("forcePaths", true)
            .selectAll("paths").data(board.paths).enter()
            .append("path")
            .attr("d", function (d) { return d.path })
            .attr('fill', function (d) { return d.color })
            .on('click', function () {
                let d = d3.select(this).datum()
                console.log(JSON.stringify(d.row))
                board.forces[d.row][d.col].attract = [d.color];
                board.boxes[boxWith(d.row, d.col)].color = d.color
                updateForces(board)
                updatePaths(board)
            })


    } else {
        board.forceSVG = board.boardSVG.append("g").classed("forces", true);
        board.forceSVG.append("g").classed("forcePaths", true)
            .selectAll("paths").data(board.paths).enter()
            .append("path")
            .attr("d", function (d) { return d.path })
            .attr('fill', function (d) { return d.color })
            .on('click', function (event) {
                let d = d3.select(this).datum()

                console.log(JSON.stringify(d.row))
                board.forces[d.row][d.col].attract = [d.color];
                board.boxes[boxWith(d.row, d.col)].color = d.color
                updateForces(board)
                updatePaths(board)
            })
    }

}

function calculatePaths(cell, forces) {
    let paths = []
    let cx = cell.position.cx
    let cy = cell.position.cy
    let qty = forces.length
    forces.forEach(function (color, index) {
        var startAngle = 2 * Math.PI * (index / qty);
        var endAngle = 2 * Math.PI * ((index + 1) / qty);

        var path = d3.path();
        path.moveTo(cx, cy);
        path.lineTo(cx, cy);
        path.arc(cx, cy, (CELL_SIZE / 3), startAngle, endAngle)
        path.closePath();

        paths.push({ color: color, row: cell.row, col: cell.col, path: path.toString() })
    })
    return paths
}

function makeX(cell) {
    let x = cell.position.x
    let y = cell.position.y
    let cx = cell.position.cx
    let cy = cell.position.cy
    let offset = CELL_SIZE / 10
    var path = d3.path();
    path.moveTo(x + offset, y);
    path.lineTo(cx, cy - offset);
    path.lineTo(x + CELL_SIZE - offset, y);
    path.lineTo(x + CELL_SIZE, y + offset);
    path.lineTo(cx + offset, cy);
    path.lineTo(x + CELL_SIZE, y + CELL_SIZE - offset);
    path.lineTo(x + CELL_SIZE - offset, y + CELL_SIZE);
    path.lineTo(cx, cy + offset);
    path.lineTo(x + offset, y + CELL_SIZE);
    path.lineTo(x, y + CELL_SIZE - offset);
    path.lineTo(cx - offset, cy);
    path.lineTo(x, y + offset);
    path.closePath();

    return {path: path}
}
function drawErrors (board){   
    if (!!board.errorSVG){
        board.errorSVG.selectAll('path').data(board.errors).enter()
        .append('path')
        .attr('d', function (d) { return d.path })
        .attr('fill', "red")

    } else {
        board.errorSVG = board.boardSVG.append("g").classed("errors", true);
        board.errorSVG.selectAll('path').data(board.errors).enter()
        .append('path')
        .attr('d', function (d) { return d.path })
        .attr('fill', "red")
    }

}