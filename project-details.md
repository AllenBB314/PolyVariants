# PolyVariants
By @AllenBB314  
Credits: chess.com (idea), Gemini (small amount of code + debug), VS Code, Copilot

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
    0.12: 2026/8/??: Fixed board square gap; Slightly changed ui; Added create pieec and varaint (not finished); Used Supabase, can start games (not finished)

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
  ```
  v: variable
  n: number
  s: string
  b: boolean
  a: array
  c: color (according to 'gcols')
  p: position ([col,row])
  d: direction (0/1/2/3, turn CW 90 deg starting from up)
  ```

  #### General
  ```
  - () : Input
  - [] : Array
  - {} : Code
  - ~  : Event
  - g  : Get
  - a  : Action
  - r  : Repeat
  - o  : Operator
  - l  : Logic
  - c  : Conditions
  - $  : Variables
  - @  : User
  ```

  #### Events
  ```
  - ~anyTime          : Any moment
  - ~start            : When the game starts
  - ~end              : When the game ends
  - ~clicked          : When any square is clicked
  - ~turn             : When it is any player's turn
  - ~turnEnded        : When any player's turn ends
  - ~movedPiece       : When a piece moves
  - ~capturedPiece    : When a piece captures
  - ~moveCapturePiece : When a piece moves or captures
  ```
  
  #### Get
  ```
  * Types: (Can stack, like ArrArrStr)
  * 1. Num : A number (like 4)
  * 2. Str : A string (like 'Q')
  * 3. Bln : A boolean (like true, false)
  * 4. Arr : An array (like ['H','I'])
  * 5. Col : Item # of 'gcols', 0 if none, is Num (like 2)
  * 6. Seq : Array of items according to 'gcols', is Arr
  * 7. Pos : Position of an object in the board, counted from the top left corner, col by row, starting from 0, is ArrNum (like [1,3])
  ```
  ```
  - gmove (Num)            : Move number (r -> y -> y -> [r] then it is move 4)
  - gboard (ArrArrStr)     : Current board (like [[y:P,y:B,y:P,y:N],['','','',''],['','','',''],[r:K,'',r:P,r:Q]])
  - gcol (Col)             : Color of the player that has to move
  - gcols (SeqStr)         : Order of colors (like ['r','y'])
  - gdead (SeqBln)         : If players are dead (like [false,false])
  - gtimeControl (Str)     : Time control
  - gtime (SeqNum)         : Time in milliseconds (like [900000,180000] , r has 15 mins , y has 3 mins)
  - gdim (ArrNum)          : Dimension, cols by rows (like [4,4])
  - gpieceNum (SeqNum)     : Number of pieces each player has (like [3,4] , r has 3 pieces , y has 4 pieces)
  - gpieceTypeNum (SeqNum) : Number of piece types each player has (like [3,3] , r has 3 types , y has 3 types)
  - gpieceNumAll (Num)     : Total number of pieces left (excluding dead pieces) (like 7)
  - gpieceTypeNumAll (Num) : Total number of piece types (like 5)
  - gpieces (SeqArrStr)    : Pieces each player has (like [['K','P','Q'],['P','B','P','N']])
  - gpieceTypes (SeqArrStr): Piece types each player has (like [['K','P','Q'],['P','B','N']])
  - gdeadPiecesNum (Num)   : Number of dead pieces on the board (non player pieces) (like 0)
  - gclicked (Pos)         : The clicked square (like [0,2])
  - gpieceFrom (Pos)       : The old square of the (last) moved piece, col and row (like [0,3])
  - gpieceTo (Pos)         : The new square of the (last) moved piece, col by row (like [1,3])
  - gmovedCol (Col)        : The color of the (last) moved piece (0 if none, 1 if red (first color of gcols))
  - gmovedPiece (Str)      : The piece name of the (last) moved piece ('' if none, or like 'Q')
  - gpieceDirs (SeqNum)    : The directions of the colors (like [0,2] , 0 is up , 1 is right , 2 is down , 3 is left)
  - gpieceAction (Str)     : The action type of the (last) moved piece (like 'm' or 'c' or 'o' or 'e', see piece movement code)
  - groyalPos (SeqPos)     : The position of the royals 
  - gplayerNames (SeqStr)  : Player names (like ['AllenBB314','sparrow'] , r is AllenBB314 , y is sparrow)
  - gplayerRatings (SeqNum): Player ratings (like [1000,4] , r is 1000 rating , y is 4 rating)
  - ginCheck (SeqBln)      : If players are in check, checkmate doesn't count (like [false,false])
  - ginCheckmate (SeqBln)  : If players are in checkmate (like [false,false])
  - ggameEnded (Bln)       : If the game ended (like false)
  - gdisconnected (SeqBln) : If players are disconnected (like [false,true])
  ```

  #### Actions
  ```
  - awin(c)              : Make 'c' win
  - alose(c)             : Make 'c' lose
  - aturn(c)             : Set current turn to 'c'
  - acode(s1,s2)         : Set the code of 's1' to 's2'
  - asetAt(p,s)          : Set the code of (only) the piece on 'p' to 's'
  - arevertCode(s)       : Change the code of 's' back to normal
  - aaddLegal(p1,p2)     : Add 'p1' as a legal move of piece on 'p2'
  - adelLegal(p1,p2)     : Delete (all) matching legal moves on 'p1' of piece on 'p2'
  - aclrLegal(p)         : Delete all legal moves of piece on 'p'
  - areplace(p,s)        : Replace the square 'p' with piece 's'
  - asetCol(p,c)         : Set the color of the piece on 'p' as 'c'
  - aswap(p1,p2)         : Swap 'p1' and 'p2'
  - adelete(p)           : Delete the piece on 'p', same as areplace(p,'')
  - ahide(p)             : Hide square 'p'
  - ahideAll             : Hide all squares
  - ashow(p)             : Show square 'p' if hidden
  - ashowAll             : SHow all hidden squares
  - aaddTime(n,c)        : Add 'n' milliseconds to 'c'
  - asetTime(n,c)        : Set time of 'c' as 'n'
  - aaddEnPassant(p1,p2) : Add 'p1' as the en passant square of piece on 'p2'
  - adelEnPassant(p1,p2) : Delete (all) matching en passant squares on 'p1' of piece on 'p2'
  - aclrEnPassant(p)     : Delete all en passant squares of piece on 'p'
  - asetDir(c,d)         : Set direction of color 'c' as 'd'
  - arevertDir(c)        : Change the direction of 'c' back to normal
  ```

  #### Operators
  ```
  - o+(n1,n2)    : Output 'n1' + 'n2'
  - o-(n1,n2)    : Output 'n1' - 'n2'
  - o*(n1,n2)    : Output 'n1' * 'n2'
  - o/(n1,n2)    : Output 'n1' / 'n2'
  - o^(n1,n2)    : Output 'n1' ^ 'n2'
  - o%(n1,n2)    : Output 'n1' % 'n2'  
  - olg(n1,n2)   : Output log of 'n2' with base 'n1'
  - oranI(n1,n2) : A random integer between 'n1' and 'n2'
  - oranD(n1,n1) : A random decimal number between 'n1' and 'n2'
  - oabs(n)      : Absolute value of 'n'
  - ornd(n1,n2)  : Round 'n1' to the nearest 'n2' (default n2 = 1 if not stated)
  - oflr(n1,n2)  : Floor of 'n1' with precision 'n2' (default n2 = 1 if not stated)
  - oceil(n1,n2) : Ceiling of 'n1' with precision 'n2' (default n2 = 1 if not stated)
  - osin(n)      : Output $\sin(n)$
  - ocos(n)      : Output $\cos(n)$
  - otan(n)      : Output $\tan(n)$
  - oasin(n)     : Output $\sin^{-1}(n)$
  - oacos(n)     : Output $\cos^{-1}(n)$
  - oatan(n)     : Output $\tan^{-1}(n)$
  ```

  #### Logic
  ```
  - l&(b1,b2)    : 'b1' and 'b2'
  - l|(b1,b2)    : 'b1' or 'b2'
  - l!(b)        : Not 'b'
  - l^(b1,b2)    : 'b1' xor 'b2'
  - l=(v1,v2)    : 'v1' equals 'v2' ?
  - l~(v1,v2)    : 'v1' equals 'v2' ? (case insensitive)
  - l>(n1,n2)    : 'n1' > 'n2' ?
  - l<(n1,n2)    : 'n1' < 'n2' ?
  - l>=(n1,n2)   : 'n1' >= 'n2' ?
  - l<=(n1,n2)   : 'n1' <= 'n2' ?
  ```

  #### Repeat
  ```
  - r(n){...} : Repeat ... 'n' times
  - rforever{...} : Repeat ... forever (until game ends)
  - runtil(b){...} : Repeat ... until 'b' is true
  - rwhile(b){...} : Repeat ... while 'b' is true
  - rforEach(a,v){...} : For each item in 'a', repeat once, with 'v' being the number of times repeated (1,2,...)
  ```

  #### Conditions
  ```
  - ci(b){...}  : If 'b' then ...
  - ce{...}     : Else ...
  - cei(b){...} : Else if 'b' then ... 
  ```
  
  #### Variables
  ```
  - $createVar(s) : Create a variable with name s
  - $varSet(s,v)  : Set variable with name s to v
  - $var(s)       : Get variable with name s, if does not exist, returns null
  ```

  #### User
  ```
  - @promptNew(s)        : Create a prompt with id s to be used any time (type = "text", content = "", visibility = "private") (types: "text","options","tip","note","warn","error")
  - @promptSet(s1,s2,s3) : Set property s2 of prompt with id s1 to s3
  - @prompt(s,c)         : Prompt color c with prompt with id s
  - @promptResp(s)       : Get prompt response with id s, if does not exist, returns null
  - @promptHide(s,c)     : Hide prompt with id s from color c
  - @promptHideAll(s)    : Hide prompt with id s from all users
  - @promptDel(s)        : Delete prompt with id s
  ```

### 4. Drag & Drop Editor code plan:
  1. Use `initWorkspace()` to add all the blocks to the panel.
  2. Use "trees" to track the block groups
  3. idk

## Random Math Question
$\left\lfloor\frac{\int_0^{16} 3^x+4xxxx \mathrm{d}x}{\sqrt[5]{088}}+16+3-450-8+8\right\rfloor$

Good luck :)
