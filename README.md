# ColorSudoku
A Javascript based sudoku solver using d3.js

-I would like to make this solver more moduler such that more complex rules can be implemented.  Right now, I am using only process of elimination from row/column/box to determine color placement.

-Using d3.js, I am able to allow the user to select a color for a given cell.  The solver then proceeds with that choice.  

-The solver recognizes when all possible colors are eliminated from a cell and will alert that the puzzle has failed and place an X over the offending cells


Things TODO:
Add colored circular nodes to move between squares
Fail more gracefully when a puzzle breaks the rules
Fail when two cells in the same row or coloumn require the same color

Things I want:
Use d3.js forces to move colored circular nodes to new homes
Backtrack to last move

## These are examples of the code as it works now

### Working Example
![Sudoku Solver GIF](./images/sudokuSolver.gif)

### Working Example with color choice
![Good Solution](./images/GoodSolve.gif)

### Bad Working Example with color choice
![Bad Solution](./images/BadSolve.gif)

Notice there are two maroon in one row.  The solver does not catch that, but continues

## This is an older version

I have not included the code for the nodes to move because the logic is broken.  But this is the effect I would like to have

### Bad Working Example with color choice
![Old Solution](./images/OldSolveNotWorking.gif)
