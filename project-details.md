# PolyVariants
By @AllenBB314  
Credits: chess.com (idea), Gemini (small amount of code + debug), VS Code, Copilot, DeepSeek

  #### Goals:
  - To create a website for variant lovers to play
  - Highly customizable
  - For clubs to test (optional)


  #### Theme:
  - **Orange**: `#f96800`
  - **Polygons**: Triangle to Octagon + Circle

  #### To Do:
  1. Fairy Stockfish
  2. Rule Coding (similar to Scratch)
  3. SVG editor (for custom pieces)
  4. Currency

## Major/Minor Updates: (In my timezone)
    0.00: 2026/5/23: Start of project
    0.01: 2026/5/25: Completed "Play" page UI
    0.02: 2026/5/26: Added Debug feture (with Easter egg)
    0.03: 2026/5/28: Completed board feature (Given PGN)
    0.04: 2026/7/4 : Can now find legal moves of any piece based on the movement code
    0.05: 2026/7/5 : Can now move pieces and with animations
    0.06: 2026/7/8 : Can now define and perform en passant
    0.07: 2026/7/10: Can now log moves in analysis mode + Adjust panel sizes, with bug fixes
    0.08: 2026/7/28: New piece svgs (simplicity, in use as qilp did not allow neo set to be used), new notations for some pieces, fixed jump and added +{...} tag in piece codes
    0.09: 2026/8/9 : New "Create Page", with rule editor ui
    0.10: 2026/8/10: Added some blocks to Create Rule page (uses JSON)
    0.11: 2026/8/12: Added some blocks, more block types, fixed viewBox crop, can drag and drop
    0.12: 2026/8/26: Slightly changed ui; Can use Game Settings; Can use custom rules (not finished); Added create piece and varaint (not finished); Used Supabase, can start games (not finished)
    0.13: 2026/8/26: Fixed some ui bugs, and especially board gaps; Planned rule commands as well

## Notes:
### 1. PGN format:
  [Position "{position}"]  
  [PositionDetails "{position details}"]  
  [GameType "{FFA/Teams}"]  
  [GameRules "{game rules}"]  
  [TimeControl "{time control}"]

```
{position}:  
  {piece 1,1},{piece 2,1},...,{piece x,1}/
  {piece 1,2},{piece 2,2},...,{piece x,2}/
  ...
  {piece 1,y},{piece 2,y},...,{piece x,y}

{piece ...}:
  {r/b/y/g}:{{piece letter} or {username}.{custom piece id}}
```

### 2. Piece Movement format:
  `{Piece name/ID}={Movement tag 1}:{Relative coordinate 1};{Movement tag 2}:{Relative coordinate 2};...`

  #### Movement tags:
  ```
  - O (ordinary)           : Can move to and capture
  - M (move)               : Can only move to
  - C (capture)            : Can only capture
  - P{p} (piece)           : Movement of the piece 'p' (single letter)
  - +                      : Continue infinitely
  - +[n]                   : Continue n times
  - +{n}                   : Can only be legal at exactly n times
  - B (block)              : Will be blocked by coordinate (after all other coordinates) / by non-air when repeating (after + / +[n])
  - J[n]                   : Can jump over at most n non-air when repeating (after + / +[n])
  - J{n}                   : Can only be legal at exactly n jumps
  - R1 (rotate)            : In the color's natural direction
  - R2 (rotate)            : In the color's natural direction and its opposite
  - R4 (rotate)            : In every 4 directions
  - R8 (rotate)            : In every 8 directions (like a knight)
  - #[n]                   : On the first n moves
  - #{n}                   : On the nth move
  - #r[n]                  : On the first n ranks (of color)
  - #r{n}                  : On the nth rank (of color)
  - E (en passant)         : Can en passant
  - e[coords] (en passant) : Can be en passant-ed at coords
  ```

  Order: [ optional ] { must }
  ```
  [ #[n]/#{n}/#r[n]/#r{n} ]{ O/M/C }[ R1/R2/R4/R8 ][ E/e[coords] ]:{ coordinate(s) [ B {coordinate(s) } ][ +/+[n] [ B [ J[n]/J{n} ] ] ]/P:{p} [ B {coordinate(s) } ][ +/+[n] ][ B ][ J[n]/J{n} ] }
  ```
  Can use B and J[n]/J{n} directly without restriction if referencing piece
  or maybe referring a piece makes everything else optional idk
  
  Note: Extra rules always override the referenced piece's rules

  #### For example:
  - P=#r{2}MR1e[(0,1)]:(0,2)B(0,1);MR1:(0,1);CR1E:(-1,1)(1,1)
  
  // On the 2nd rank, according to color's natural direction, MOVE 2 squares but can be blocked by 1 square that direction, can get en passanted 1 square that direction; according to color's natrual direction, MOVE 1 square; according to color's natural direction, CAPTURE or EN PASSANT CAPTURE diagonally left/right

  - R=OR4:(0,1)+B
  
  // In all 4 directions, MOVE and CAPTURE infinite squares in front but can be blocked

  - U=OR8:(1,2)B(0,1)
  
  // In all 8 directions, MOVE and CAPTURE 2 square up and 1 square right, but can be blocked by something 1 square in front

  - υ=OR8:(1,2)B(0,1)+B

  // In all 8 directions, MOVE and CAPTURE 2 square up and 1 square right, but can be blocked by something 1 square in front, infinitely many times, but can be blocked

### 3. Rule format:
  #### 3.1 Data Types

  | Type | Description | Example |
  | :--- | :--- | :--- |
  | **`Num`** | Number | `5`, `3.14` |
  | **`Str`** | String (always in single quotes) | `'r'`, `'P'` |
  | **`Bln`** | Boolean | `true`, `false` |
  | **`Pos`** | Position = `[col, row]` (0-indexed) | `[0, 0]` (top-left) |
  | **`Arr`** | List of anything | `['a1','b2']` |

  ---

  #### 3.2 Events (`~`)

  | Event | Trigger | Available Getters |
  | :--- | :--- | :--- |
  | **`~Start`** | Board is loaded (game begins) | `gBoard`, `gDim`, `gCols` |
  | **`~Turn`** | It becomes a player's turn | `gCol`, `gColIdx`, `gMove` |
  | **`~Clicked`** | A user clicks a square | `gClicked` (Pos) |
  | **`~MovedPiece`** | After `aMove` executes | `gMovedPiece`, `gPieceFrom`, `gPieceTo`, `gPieceAction` |

  ---

  #### 3.3 Get (`g`)

  | Command | Inputs | Output | Description |
  | :--- | :--- | :--- | :--- |
  | `gBoard` | None | `ArrArrStr` | 2D board array |
  | `gDim` | None | `[cols, rows]` | Board dimensions |
  | `gMove` | None | `Num` | Current turn number |
  | **`gCol`** | None | `Str` | Whose turn it is (`'r'`, `'b'`, etc.) |
  | **`gColIdx`** | None | `Num` | Numeric index of current color (0, 1, 2, 3) |
  | `gCols` | None | `ArrStr` | Order of colors (e.g., `['r','b']`) |
  | `gPieceAt(Pos)` | `Pos` | `Str` or `null` | Raw piece string (e.g., `"r:P"`) |
  | `gPieceColor(Pos)` | `Pos` | `Str` or `null` | Color of piece at `Pos` |
  | `gPieceLetter(Pos)` | `Pos` | `Str` or `null` | Letter of piece at `Pos` |
  | **`gMoves(Pos)`** | `Pos` | `ArrPos` | **Raw legal destinations** (uses movement codes, NO turn/check filtering) |
  | **`gAttackers(Pos, Color)`** | `Pos`, `Str` | `ArrPos` | Positions of `Color` pieces attacking `Pos` |
  | `gFindPieces(Letter, Color)` | `Str`, `Str` | `ArrPos` | Find all positions of a piece type |
  | `gConfig(Key)` | `Str` | `Any` | Read from `[RuleConfig ...]` |
  | `gVar(Key)` | `Str` | `Any` | Read from `[Variables ...]` |
  | `gMovedPiece` | None | `Str` | Letter of last moved piece |
  | `gPieceFrom` | None | `Pos` | Where the piece moved from |
  | `gPieceTo` | None | `Pos` | Where the piece moved to |
  | `gPieceAction` | None | `Str` | `'move'`, `'capture'`, or `'enpassant'` |
  | `gCol(Pos)` / `gRow(Pos)` | `Pos` | `Num` | Extracts the column or row number from a `Pos` |

  ---

  #### 3.4 Actions (`a`)

  | Command | Inputs | Description |
  | :--- | :--- | :--- |
  | **`aMove(From, To)`** | `Pos`, `Pos` | Move piece (triggers `~MovedPiece` automatically) |
  | `aReplace(Pos, PieceStr)` | `Pos`, `Str` | Set square to a piece (e.g., `'r:Q'`) |
  | `aDelete(Pos)` | `Pos` | Remove piece at `Pos` |
  | `aWin(Color)` | `Str` | End game with `Color` as winner |
  | `aLose(Color)` | `Str` | End game with `Color` as loser |
  | `aDraw()` | None | End game in a draw |
  | `aTurn(Color)` | `Str` | Explicitly set whose turn it is |
  | `aTurnIdx(Num)` | `Num` | Explicitly set turn by index (e.g., `0` = first color in `gCols`) |
  | `$varSet(Key, Value)` | `Str`, `Any` | Save to `[Variables ...]` (persists in PGN) |

  ---

  #### 3.5 Logic (`l`) & Operators (`o`)

  | Category | Command | Inputs | Output | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | **Logic** | `lAnd(b1,b2)` | `Bln`, `Bln` | `Bln` | AND |
  | | `lOr(b1,b2)` | `Bln`, `Bln` | `Bln` | OR |
  | | `lNot(b)` | `Bln` | `Bln` | NOT |
  | | `lEq(v1,v2)` | `Any`, `Any` | `Bln` | Equal? |
  | | `lGt(n1,n2)` | `Num`, `Num` | `Bln` | Greater than? |
  | | `lLt(n1,n2)` | `Num`, `Num` | `Bln` | Less than? |
  | **Operators** | `oAdd(n1,n2)` | `Num`, `Num` | `Num` | Addition |
  | | `oSub(n1,n2)` | `Num`, `Num` | `Num` | Subtraction |
  | | `oMul(n1,n2)` | `Num`, `Num` | `Num` | Multiplication |
  | | `oDiv(n1,n2)` | `Num`, `Num` | `Num` | Division |
  | | `oRandI(n1,n2)` | `Num`, `Num` | `Num` | Random integer between n1 and n2 |

  ---

  #### 3.6 Conditions

  | Command | Syntax | Description |
  | :--- | :--- | :--- |
  | **Condition** | `ci(condition){ ... }` | If condition is true, run block |
  | | `ce{ ... }` | Else block (must follow `ci` or `cei`) |
  | | `cei(condition){ ... }` | Else-if block |
  | **Repeat** | `r(n){ ... }` | Repeat block `n` times |

  ---

  #### For Example:

  ```
  ~Start {

  }
  ```


### 4. Drag & Drop Editor code plan:
  1. Use `initWorkspace()` to add all the blocks to the panel.
  2. Use "trees" to track the block groups
  3. idk

## Random Math Question
$\left\lfloor\frac{\int_0^{16} 3^x+4xxxx \mathrm{d}x}{\sqrt[5]{088}}+16+3-450-8+8\right\rfloor$

Good luck :)
