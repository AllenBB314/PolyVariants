// For drawing and managing boards

import { initEngine } from './fairy-stockfish.js';

async function setupAnalysisBoard() {
    // Initialize the engine when the analysis page loads
    try {
        await initEngine();
        console.log("Fairy-Stockfish is ready to use");
    } catch (e) {
        console.error("Engine initialization failed.");
    }
}

import { loadRules, triggerEvent, initRuleContext, getRuleContext } from './rule-engine.js';
import { sendMove } from './online.js';

// Automatically trigger setup when this file runs
setupAnalysisBoard();

let boardState = null;
let cols = null;
let rows = null;
let rbyg = true;
let enPassantSquares = [];
const svgCache = {};
const moves = [];
let currentTurnNumber = 1;
let currentRoundMoves = { r: "", b: "", y: "", g: "" };

let lastTargetSquare = null;
let lastTargets = null;

const PIECE_PALETTE = {
    'white':  '#f8f8f8',
    'black':  '#4e4c4b',
    'dead':   '#8c8a88',
    'red':    '#bf3b43',
    'blue':   '#4185bf',
    'yellow': '#c09526',
    'green':  '#4e9161'
};

// For reading text tags from PGN
function parsePgnTag(pgn, tagName) {
    if (!pgn) return null;
    const regex = new RegExp(`\\[${tagName}\\s+"([^"]+)"\\]`);
    const match = pgn.match(regex);
    return match ? match[1] : null;
}

// Parses nested settings like 'dim=8x8' or 'a=3' out of a single PGN tag line
function parsePgnDetails(pgn, tagName) {
    const rawTagValue = parsePgnTag(pgn, tagName);
    if (!rawTagValue) return {};

    const attributes = {};
    const cleanStr = rawTagValue.replace(/['"]/g, '');
    const parts = cleanStr.split(';');

    parts.forEach(part => {
        if (part.includes('=')) {
            const side = part.split('=');
            const key = side[0].trim();
            const value = side[1].trim();
            attributes[key] = value;
            
        } else if (part.includes(':')) {
            const side = part.split(':');
            const key = side[0].trim();
            const value = side[1].trim();
            attributes[key] = value;
            
        } else if (part.trim().startsWith('dim=')) {
            const value = part.replace('dim=', '').trim();
            attributes['dim'] = value;
            
        } else if (part.trim().match(/^\d+x\d+$/)) {
            attributes['dim'] = part.trim();
        }
    });

    if (!attributes['dim'] && cleanStr.includes('dim=')) {
        const directMatch = cleanStr.match(/dim=([^ ]+)/);
        if (directMatch) attributes['dim'] = directMatch[1];
    }
    if (!attributes['dim'] && cleanStr.match(/\d+x\d+/)) {
        const directMatch = cleanStr.match(/\d+x\d+/);
        if (directMatch) attributes['dim'] = directMatch[0];
    }

    return attributes;
}

function generatePgnFromBoard() {
    const rowsStr = boardState.map(row => row.join(',')).join('/');
    const epStr = enPassantSquares.join(',');
    const details = `'dim=${cols}x${rows}';'rbyg=${rbyg}';'enPassantSquares=${epStr}'`;
    return `[Position "${rowsStr}"]\n[PositionDetails "${details}"]`;
}

// Piece Movement format:
// {Piece name/ID}={Movement tag 1}:{Relative coordinate 1};{Movement tag 2}:{Relative coordinate 2};...
// Movement tags:
// - O (ordinary): Can move to and capture
// - M (move): Can only move to
// - C (capture): Can only capture
// - P{p} (piece): Movement of the piece 'p' (single letter)
// - + : Continue infinitely
// - +[n] : Continue n times
// - +{n} : Can only be legal at exactly n times
// - B (block): Will be blocked by coordinate (after all other coordinates) / by non-air when repeating (after + / +[n])
// - J[n] : Can jump over at most n non-air when repeating (after + / +[n])
// - J{n} : Can only be legal at exactly n jumps
// - R1 (rotate): In the color's natural direction
// - R2 (rotate): In the color's natural direction and its opposite
// - R4 (rotate): In every 4 directions
// - R8 (rotate): In every 8 directions (like a knight)
// - #[n] : On the first n moves
// - #{n} : On the nth move
// - #r[n] : On the first n ranks (of color)
// - #r{n} : On the nth rank (of color)
// - E (en passant) : Can en passant
// - e[coords] (en passant) : Can be en passant-ed at coords

// Order: [ optional ] { must }
// [ #[n]/#{n}/#r[n]/#r{n} ]{ O/M/C }[ R1/R2/R4/R8 ][ E/e[coords] ]:{ coordinate(s) [ B {coordinate(s) } ][ +/+[n] [ B [ J[n]/J{n} ] ] ]/P:{p} [ B {coordinate(s) } ][ +/+[n] ][ B ][ J[n]/J{n} ] }
// Can use B and J[n]/J{n} directly without restriction if referencing piece
// or maybe referring a piece makes everything else optional idk
// /(#r?(?:(?:\[\d+\])|(?:{\d+})))?([OMC])(R[1248])?:((?:\(-?\d+,-?\d+\))+|(?:P:[A-Z]))(B(\(-?\d+,-?\d+\)+)?)?(\+(?:\[\d+\])?(B(J\[\d+\])?)?)?/g

// Note: Extra rules always override the referenced piece's rules

const PIECE_MOVEMENT_CODES = {
    A: "A=P{Q};P{N}",
    B: "B=P{F}+B",
    C: "C=OR8:(1,3)",
    D: "D=P{Q}",
    E: "E=P{R};P{N}",
    F: "F=OR4:(1,1)",
    G: "G=P{Q}J{1}",
    H: "H=P{B};P{N}",
    I: "I=OR4:(2,2)",
    J: "J=P{I}+B",
    K: "K=P{W};P{F}",
    L: "L=P{C}+B",
    M: "M=P{K};P{N}",
    N: "N=OR8:(1,2)",
    O: "O=P{N}+B",
    P: "P=#r{2}MR1e[(0,1)]:(0,2)B(0,1);MR1:(0,1);CR1E:(-1,1)(1,1)",
    Q: "Q=P{R};P{B}",
    R: "R=P{W}+B",
    S: "S=OR4:(2,0)",
    T: "T=P{S}+B",
    U: "U=P{N}B(0,1)",
    V: "V=P{N};P{C}",
    W: "W=OR4:(0,1)",
    X: "X=P{U}+",
    Y: "Y=P{S};P{I}",
    Z: "Z=P{T};P{J}",
    1: "1=#r{2}MR1e[(-1,1)]:(-2,2)B(-1,1);#r{2}MR1e[(1,1)]:(2,2)B(1,1);MR1:(-1,1)(1,1);CR1E:(0,1)",
    2: "2=#r{2}MR1e[(0,1)]:(0,2)B(0,1);OR1E:(0,1)",
    3: "3=#r{2}MR1e[(-1,1)]:(-2,2)B(-1,1);#r{2}MR1e[(1,1)]:(2,2)B(1,1);OR1E:(-1,1)(1,1)",
    4: "4=P{2};P{3}",
    5: "5=P{B};P{U}",
    6: "6=P{R};P{U}",
    7: "7=P{Q};P{U}",
    8: "8=OR8:(2,3)",
    9: "9=P{8}+",
    // α: "α=#r{2}MR1e[(-1,1)]:(-2,2)B(-1,1);#r{2}MR1e[(1,1)]:(2,2)B(1,1);MR1:(-1,1)(1,1);CR1E:(0,1)",
    // β: "β=#r{2}MR1e[(0,1)]:(0,2)B(0,1);OR1E:(0,1)",
    // γ: "γ=#r{2}MR1e[(-1,1)]:(-2,2)B(-1,1);#r{2}MR1e[(1,1)]:(2,2)B(1,1);OR1E:(-1,1)(1,1)",
    // δ: "δ=P{β};P{γ}",
    // Δ: "Δ=P{B};P{U}"
};

const BRICKS = ["0"];

function squareName(col, row) {
    const label = `c${col}r${row}`;
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
        const file = 'abcdefghijklmnopqrstuvwxyz'[col] || '?';
        const rank = rows - row;
        const name = `${file}${rank}`
        return {label, name};
    }
    return {label};
}

function parseSquareName(squareName) {
    const match = squareName.match(/^([a-zA-Z]+)(\d+)$/);
    
    if (!match) return null;

    const colStr = match[1].toLowerCase();
    const rowStr = match[2];

    const col = colStr.charCodeAt(0) - 97;
    const row = rows - Number(rowStr);

    return { col, row };
}

function getSquareInformation (squareName, currentBoardState) {
    const square = parseSquareName(squareName);
    const piece = currentBoardState ? currentBoardState[square.row][square.col] : boardState[square.row][square.col];
    const pieceCol = parsePieceToken(piece).color;
    return { squareName , square , piece , pieceCol };
} // { squareName , square , piece , pieceCol }

// Return the piece's letter name and color
function parsePieceToken(pieceToken) {
    if (!pieceToken || BRICKS.includes(pieceToken)) return { letter: '', color: '' };

    if (pieceToken.includes(':')) {
        const [prefix, letter] = pieceToken.split(':');
        let color = '';
        if (prefix === 'r') color = 'r';
        if (prefix === 'b') color = 'b';
        if (prefix === 'y') color = 'y';
        if (prefix === 'g') color = 'g';
        if (prefix === 'd') color = 'd';

        return { letter, color };
    }

    return { letter: pieceToken, color: 'd' };
}

// Return the movement-rule string for a piece letter.
function getPieceMovementCode(pieceLetter) {
    return PIECE_MOVEMENT_CODES[pieceLetter] || '';
}

// Parse one movement rule string into a structured object.
function parseMovementDefinitions(code) {                          // if code = "P=#r{2}MR1e[(0,1)]:(0,2)B(0,1);MR1:(0,1);CR1E:(-1,1)(1,1)"
    if (!code) return [];
    return code.split(';').map(def => {                            // def = ["P=#r{2}MR1e[(0,1)]:(0,2)B(0,1)" , "MR1:(0,1)" , "CR1E:(-1,1),(1,1)"]
        let trimmed = def.trim();                                  // trimmed = ["P=#r{2}MR1e[(0,1)]:(0,2)B(0,1)" , "MR1:(0,1)" , "CR1E:(-1,1),(1,1)"]
        if (!trimmed) return null;
        if (trimmed.includes('=')) trimmed = trimmed.split('=')[1];
        if (!trimmed.includes(':')) trimmed = ":" + trimmed;

        const [tagPart = '', coordPart = ''] = trimmed.split(':'); // tagPart = ["#r{2}MR1e[(0,1)]" , "MR1" , "CR1E"] ; coordPart = ["(0,2)B(0,1)" , "(0,1)" , "(-1,1),(1,1)"]

        const parseTags = (input) => {
            const patterns = [
                /^R8/, /^R4/, /^R2/, /^R1/,
                /^#r\{\d+\}/, /^#r\[\d+\]/, /^#\{\d+\}/, /^#\[\d+\]/,
                /^O/, /^M/, /^C/, /^B/, /^J\[\d+\]/, /^J\{\d+\}/,
                /^E/, /^e\[.+\]/
            ];
            const tags = [];
            let remaining = input;

            while (remaining.length) {
                let matched = false;
                for (const pattern of patterns) {
                    const match = remaining.match(pattern);
                    if (match) {
                        tags.push(match[0]);
                        remaining = remaining.slice(match[0].length);
                        matched = true;
                        break;
                    }
                }
                if (!matched) break;
            }
            return tags;
        };

        const parsePieceRef = (input) => {
            const ref = [];
            const match = input.match(/P\{(.)\}/);
            if (!match) return ref;
            ref.push(match[1]);
            return ref;
        };

        function mapCoords(str, regex) {
            return [...str.matchAll(regex)].map(m => ({ dx: Number(m[1]), dy: Number(m[2]) }));
        }

        const tags = parseTags(tagPart);                                                                                  // tags = ["#r{2}", "M", "R1","e[(0,1)]"] , ["M", "R1"] , ["C", "R1","E"]
        const movePhaseTags = tags.filter(tag => /^#/.test(tag));                                                         // movePhaseTags = ["#r{2}"] , [] , []
        const moveModeTag = tags.filter(tag => /^(O|M|C)$/.test(tag));                                                    // moveModeTag = ["M"] , ["M"] , ["C"]
        const rotationTag = tags.filter(tag => /^R/.test(tag));                                                           // rotationTag = ["R1"] , ["R1"] , ["R1"]
        const pieceRef = parsePieceRef(coordPart);                                                                        // pieceRef = [] , [] , []
        const mainCoordPart = coordPart.split(/B\(/)[0] || '';                                                            // mainCoordPart = "(0,2)" , "(0,1)" , "(-1,1)(1,1)"
        const coords = mapCoords(mainCoordPart , /\((-?\d+),(-?\d+)\)/g);                                                 // coords = [{dx:0, dy:2}] , [{dx:0, dy:1}] , [{dx:-1, dy:1}, {dx:1, dy:1}]
        const blockCoords = mapCoords(coordPart , /B\((-?\d+),(-?\d+)\)/g);                                               // blockCoords = [(0,1)] , [] , []
        const repeatMatch = trimmed.match(/\+\[?(\d+)?\]?/);                                                              // repeatMatch = null , null , null
        const repeatMode = trimmed.includes('+{') ? 'exact' : (trimmed.includes('+[') ? 'at-most' : 'none');              // repeatMode = 'none' , 'none' , 'none'
        const repeatUnlimited = trimmed.includes('+') && !repeatMatch?.[1];                                               // repeatUnlimited = false , false , false
        const repeatCount = repeatMatch ? Number(repeatMatch[1]) || 0 : 1;                                                // repeatCount = 1 , 1 , 1
        const isBlocking = /B/.test(trimmed);                                                                             // isBlocking = true , false , false
        const jumpMatch = trimmed.match(/J\[(\d+)\]/) || trimmed.match(/J\{(\d+)\}/);                                     // jumpMatch = null , null , null
        const jumpMode = trimmed.includes('J{') ? 'exact' : (trimmed.includes('J[') ? 'at-most' : 'none');                // jumpMode = "none" , "none" , "none"
        const jumpCount = jumpMatch ? Number(jumpMatch[1]) : 0;                                                           // jumpCount = 0 , 0 , 0
        const rawEnPassant = tags.filter(tag => /^(E|e\[.+\])$/.test(tag))[0];                                            // rawEnPassant = "e[(0,1)]" , undefined , "E"
        const enPassant = rawEnPassant == undefined ? "" : rawEnPassant;                                                  // enPassant = "e[(0,1)]" , "" , "E"
        const enPassantCoords = enPassant == "E" || enPassant == "" ? [] : mapCoords(enPassant , /\((-?\d+),(-?\d+)\)/g); // enPassantCoords = [{dx:0, dy:1}] , [] , []
        
        return { tags, movePhaseTags, moveModeTag, rotationTag, pieceRef, coords, blockCoords, repeatMode, repeatUnlimited, repeatCount, isBlocking, jumpCount, jumpMode, enPassant, enPassantCoords, raw: trimmed };
    }).filter(Boolean);
} // { tags, movePhaseTags, moveModeTag, rotationTag, pieceRef, coords, blockCoords, repeatMode, repeatUnlimited, repeatCount, isBlocking, jumpCount, jumpMode, enPassant, enPassantCoords, raw: trimmed }

// Find number of 90-degree turns needed to rotate a piece's movement into its natural direction from color
function getTurnCountForColor(color) {
    switch (color) {
        case 'r': return 0;
        case 'b': return 1;
        case 'y': return 2;
        case 'g': return 3;
        default: return 0;
    }
}

// Rotate a movement vector into the natural direction for the piece's color.
function rotateVectorForColor(dx, dy, color) {
    let x = dx;
    let y = dy;
    const turnCount = getTurnCountForColor(color);
    for (let i = 0; i < turnCount; i++) {
        [x, y] = [y, -x];
    }
    return { dx: x, dy: y };
}

// Expand a movement rule into concrete vectors for the board.
function expandRuleVectors(rule, pieceInfo) {
    const colorKey = pieceInfo.color;
    const vectors = [];
    const baseBlockCoords = Array.isArray(rule.blockCoords) ? rule.blockCoords : [];
    const baseEpCoords = Array.isArray(rule.enPassantCoords) ? rule.enPassantCoords : [];

    // Add a vector with optional block coordinates
    const addVector = (dx, dy, blockCoords = baseBlockCoords, epCoords = baseEpCoords) => {
        vectors.push({
            dx,
            dy,
            blockCoords: (Array.isArray(blockCoords) ? blockCoords : []).map(block => ({ dx: block.dx, dy: block.dy })),
            enPassantCoords: (Array.isArray(epCoords) ? epCoords : []).map(ep => ({ dx: ep.dx, dy: ep.dy }))
        });
    };

    // Transform block coordinates based on a given transformation function
    const transformCoords = (coords, transform) =>
        coords.map(c => {
            const transformed = transform(c.dx, c.dy);
            return { dx: transformed.dx, dy: transformed.dy };
        });

    if (rule.tags.some(tag => /R8/.test(tag))) {
        rule.coords.forEach(coord => {
            const dx = coord.dx;
            const dy = coord.dy;
            const transforms = [
                (x, y) => ({ dx: x, dy: y }),
                (x, y) => ({ dx: -x, dy: y }),
                (x, y) => ({ dx: x, dy: -y }),
                (x, y) => ({ dx: -x, dy: -y }),
                (x, y) => ({ dx: y, dy: x }),
                (x, y) => ({ dx: -y, dy: x }),
                (x, y) => ({ dx: y, dy: -x }),
                (x, y) => ({ dx: -y, dy: -x })
            ];
            transforms.forEach(transform => {
                const transformed = transform(dx, dy);
                addVector(transformed.dx, transformed.dy, transformCoords(baseBlockCoords, transform), transformCoords(baseEpCoords, transform));
            });
        });
        return vectors;
    }

    if (rule.tags.some(tag => /R4/.test(tag))) {
        rule.coords.forEach(coord => {
            const dx = coord.dx;
            const dy = coord.dy;
            const transforms = [
                (x, y) => ({ dx: x, dy: y }),
                (x, y) => ({ dx: -y, dy: x }),
                (x, y) => ({ dx: -x, dy: -y }),
                (x, y) => ({ dx: y, dy: -x })
            ];
            transforms.forEach(transform => {
                const transformed = transform(dx, dy);
                addVector(transformed.dx, transformed.dy, transformCoords(baseBlockCoords, transform), transformCoords(baseEpCoords, transform));
            });
        });
        return vectors;
    }

    const transform1 = (x, y) => rotateVectorForColor(x, y, colorKey);
    const transform2 = (x, y) => ({ dx: -rotateVectorForColor(x, y, colorKey).dx, dy: -rotateVectorForColor(x, y, colorKey).dy });

    if (rule.tags.some(tag => /R2/.test(tag))) {
        rule.coords.forEach(coord => {
            const rotated = rotateVectorForColor(coord.dx, coord.dy, colorKey);
            addVector(rotated.dx, rotated.dy, transformCoords(baseBlockCoords, transform1), transformCoords(baseEpCoords, transform1));
            addVector(-rotated.dx, -rotated.dy, transformCoords(baseBlockCoords, transform2), transformCoords(baseEpCoords, transform2));
        });
        return vectors;
    }

    if (rule.tags.some(tag => /R1/.test(tag))) {
        rule.coords.forEach(coord => {
            const rotated = rotateVectorForColor(coord.dx, coord.dy, colorKey);
            addVector(rotated.dx, rotated.dy, transformCoords(baseBlockCoords, transform1), transformCoords(baseEpCoords, transform1));
        });
        return vectors;
    }

    return rule.coords.map(coord => ({ dx: coord.dx, dy: coord.dy, blockCoords: baseBlockCoords.map(c => ({ dx: c.dx, dy: c.dy })), enPassantCoords: baseEpCoords.map(c => ({ dx: c.dx, dy: c.dy })) }));
}

// Find all legal targets for a piece using the movement-rule strings.
function getLegalMoveTargets(pieceToken, fromCol, fromRow, boardState, cols, rows) {
    // pieceToken = "r:P" , 
    // fromCol = 0 , fromRow = 6 , (a2)
    // boardState = [ ["y:R","y:N","y:B","y:Q","y:K","y:B","y:N","y:R"], ["y:P","y:P","y:P","y:P","y:P","y:P","y:P","y:P"], ["","","","","","","",""], ["","","","","","","",""], ["","","","","","","",""], ["","","","","","","",""], ["r:P","r:P","r:P","r:P","r:P","r:P","r:P","r:P"], ["r:R","r:N","r:B","r:Q","r:K","r:B","r:N","r:R"] ] , 
    // cols = 8 , rows = 8
    const pieceInfo = parsePieceToken(pieceToken); // pieceInfo = { letter: "P", color: "r" }
    if (!pieceInfo.letter || pieceInfo.color === 'd') return [];

    const code = getPieceMovementCode(pieceInfo.letter); // code = "P=#r{2}MR1:(0,2)B(0,1);MR1:(0,1);CR1:(-1,1)(1,1)"

    const rules = parseMovementDefinitions(code);        
    // rules = [ { tags: ["#r{2}","M","R1","e[(0,1)]"], 
    //             movePhaseTags: ["#r{2}"],
    //             moveModeTag: ["M"],
    //             rotationTag: ["R1"],
    //             pieceRef: [], 
    //             coords: [{dx:0,dy:2}], 
    //             blockCoords: [{dx:0,dy:1}],
    //             repeatMode: 'none',
    //             repeatUnlimited: false, 
    //             repeatCount: 1, 
    //             isBlocking: true, 
    //             jumpCount: 0, 
    //             jumpMode: "none",
    //             enPassant: "e[(0,1)]",
    //             enPassantCoords: [{dx:0,dy:1}],
    //             raw: "#r{2}MR1e[(0,1)]:(0,2)B(0,1)" }, 

    //           { tags: ["M","R1"], 
    //             movePhaseTags: [],
    //             moveModeTag: ["M"],
    //             rotationTag: ["R1"],
    //             pieceRef: [], 
    //             coords: [{dx:0,dy:1}], 
    //             blockCoords: [],
    //             repeatMode: 'none',
    //             repeatUnlimited: false, 
    //             repeatCount: 1, 
    //             isBlocking: false, 
    //             jumpCount: 0, 
    //             jumpMode: "none",
    //             enPassant: "",
    //             enPassantCoords: [],
    //             raw: "MR1:(0,1)" },

    //           { tags: ["C","R1","E"], 
    //             movePhaseTags: [],
    //             moveModeTag: ["C"],
    //             rotationTag: ["R1"],
    //             pieceRef: [], 
    //             coords: [{dx:-1,dy:1},{dx:1,dy:1}], 
    //             blockCoords: [],
    //             repeatMode: 'none',
    //             repeatUnlimited: false, 
    //             repeatCount: 1, 
    //             isBlocking: false, 
    //             jumpCount: 0, 
    //             jumpMode: "none",
    //             enPassant: "E",
    //             enPassantCoords: [],
    //             raw: "CR1E:(-1,1)(1,1)" } ]

    const targets = [];

    function isEnemy(targetToken) {
        if (!targetToken || BRICKS.includes(targetToken)) return false;
        const targetInfo = parsePieceToken(targetToken);
        return targetInfo.color && targetInfo.color !== pieceInfo.color;
    }

    function isFriendly(targetToken) {
        if (!targetToken || BRICKS.includes(targetToken)) return false;
        const targetInfo = parsePieceToken(targetToken);
        return targetInfo.color && targetInfo.color === pieceInfo.color;
    }

    function canEnPassant(col, row) {
        const squares = [];
        enPassantSquares.forEach(sq => squares.push(sq.split(':')[0]));
        const targetSquareName = squareName(col, row).name;
        return squares.some(sq => sq == targetSquareName);
    }

    function isEnemyEnPassant(col, row) {
        let targetToken = '';
        const targetSquareName = squareName(col, row).name;
        enPassantSquares.forEach(sq => {
            if (sq.split(':')[0] == targetSquareName) {
                const name = parseSquareName(sq.split(':')[1]);
                targetToken = boardState[name.row][name.col];
            }
        });
        if (targetToken) return isEnemy(targetToken);
    }

    function findResolvedRules(rules) {
        const resolvedRules = [];
        rules.forEach(rule => {
            if (rule.pieceRef.length) { 
                const refCode = getPieceMovementCode(rule.pieceRef);
                const refRules = parseMovementDefinitions(refCode);

                // Override (each of) referenced piece's rules
                refRules.forEach(refRule => {
                    const trimmed = refRule.raw;
                    const movePhaseTags = rule.movePhaseTags.length === 0 ? refRule.movePhaseTags : rule.movePhaseTags;
                    const moveModeTag = rule.moveModeTag.length === 0 ? refRule.moveModeTag : rule.moveModeTag;
                    const rotationTag = rule.rotationTag.length === 0 ? refRule.rotationTag : rule.rotationTag;
                    const pieceRef = refRule.pieceRef;
                    const coords = rule.coords.length === 0 ? refRule.coords : rule.coords;
                    const blockCoords = rule.blockCoords.length === 0 ? refRule.blockCoords : rule.blockCoords;
                    const repeatMode = refRule.repeatMode !== "none" ? refRule.repeatMode : rule.repeatMode;
                    const repeatUnlimited = refRule.repeatUnlimited || rule.repeatUnlimited;
                    const repeatCount = rule.repeatMode == 'none' && !rule.repeatUnlimited ? refRule.repeatCount : rule.repeatCount;
                    const isBlocking = refRule.isBlocking ^ rule.isBlocking ? refRule.isBlocking : rule.isBlocking; // If ref. piece is blockable, add a B make it unblockable (e.g. A=O:(0,1)+[3]B ; B=P{A}B => B=O:(0,1)+[3])
                    const jumpCount = rule.jumpMode == 'none' ? refRule.jumpCount : rule.jumpCount;
                    const jumpMode = refRule.jumpMode !== "none" ? refRule.jumpMode : rule.jumpMode;
                    const enPassant = refRule.enPassant !== undefined ? refRule.enPassant : rule.enPassant;
                    const enPassantCoords = rule.enPassantCoords.length === 0 ? refRule.enPassantCoords : rule.enPassantCoords;
                    const tags = [...movePhaseTags, ...moveModeTag, ...rotationTag];
                    resolvedRules.push({ tags, movePhaseTags, moveModeTag, rotationTag, pieceRef, coords, blockCoords, repeatMode, repeatUnlimited, repeatCount, isBlocking, jumpCount, jumpMode, enPassant, enPassantCoords, raw: trimmed });
                });
            
            } else {
                resolvedRules.push(rule);
            }
        });
        return(resolvedRules)
    }

    // Repeat until there are no more referenced piece
    let resolvedRules = rules;
    do {
        resolvedRules = findResolvedRules(resolvedRules);
    } while (resolvedRules.some(rule => rule.pieceRef.length > 0))

    // console.log("Piece Rules",resolvedRules);

    resolvedRules.forEach(rule => { 
        // resolvedRules = [ { tags: ["#r{2}","M","R1","e[(0,1)]"], 
        //                     movePhaseTags: ["#r{2}"],
        //                     moveModeTag: ["M"],
        //                     rotationTag: ["R1"],
        //                     pieceRef: [], 
        //                     coords: [{dx:0,dy:2}], 
        //                     blockCoords: [{dx:0,dy:1}],
        //                     repeatMode: 'none',
        //                     repeatUnlimited: false, 
        //                     repeatCount: 1, 
        //                     isBlocking: true, 
        //                     jumpCount: 0, 
        //                     jumpMode: "none",
        //                     enPassant: "e[(0,1)]",
        //                     enPassantCoords: [{dx:0,dy:1}],
        //                     raw: "#r{2}MR1e:(0,2)B(0,1)" },
        
        //                   { tags: ["M","R1"], 
        //                     movePhaseTags: [],
        //                     moveModeTag: ["M"],
        //                     rotationTag: ["R1"],
        //                     pieceRef: [],
        //                     coords: [{dx:0,dy:1}],
        //                     blockCoords: [],
        //                     repeatMode: 'none',
        //                     repeatUnlimited: false,
        //                     repeatCount: 1,
        //                     isBlocking: false,
        //                     jumpCount: 0,
        //                     jumpMode: "none",
        //                     enPassant: "",
        //                     enPassantCoords: [],
        //                     raw: "MR1:(0,1)" },

        //                   { tags: ["C","R1","E"], 
        //                     movePhaseTags: [],
        //                     moveModeTag: ["C"],
        //                     rotationTag: ["R1"],
        //                     pieceRef: [], 
        //                     coords: [{dx:-1,dy:1},{dx:1,dy:1}], 
        //                     blockCoords: [],
        //                     repeatMode: 'none',
        //                     repeatUnlimited: false, 
        //                     repeatCount: 1, 
        //                     isBlocking: false, 
        //                     jumpCount: 0, 
        //                     jumpMode: "none",
        //                     enPassant: "E",
        //                     enPassantCoords: [],
        //                     raw: "CR1E:(-1,1)(1,1)" } ]

        const hashAllow = rule.movePhaseTags.some(tag => {
            const match = tag.match(/#r?(?:\{(\d+)\}|\[(\d+)\])/);
            if (!match) return true;

            const n = Number(match[1]); // n = 2 , undefined

            let rank = -1;
            if (pieceToken.startsWith('r')) {
                rank = rows - fromRow;
            } else if (pieceToken.startsWith('b')) {
                rank = fromCol + 1;
            } else if (pieceToken.startsWith('y')) {
                rank = fromRow + 1;
            } else if (pieceToken.startsWith('g')) {
                rank = cols - fromCol;
            }

            if (tag.startsWith('#r{')) {
                return rank === n;
            } else if (tag.startsWith('#r[')) {
                return rank <= n;
            } else if (tag.startsWith('#{')) {
                // Implement later: Piece's move n
            } else if (tag.startsWith('#[')) {
                // Implement later: Piece's move before or on n
            }
        });

        if (rule.movePhaseTags.length === 0 || hashAllow) {
            const allowMove = rule.tags.some(tag => tag.startsWith('O') || tag.startsWith('M'));
            const allowCapture = rule.tags.some(tag => tag.startsWith('O') || tag.startsWith('C'));
            const repeatCount = rule.repeatUnlimited ? Infinity : (rule.repeatCount || 1);
            const vectors = expandRuleVectors(rule, pieceInfo);
            const normalizedVectors = (Array.isArray(vectors) ? vectors : []).filter(vector => vector && typeof vector.dx === 'number' && typeof vector.dy === 'number');
        
            normalizedVectors.forEach(vector => {
                let jumped = 0;
                const blockCoords = Array.isArray(vector.blockCoords) ? vector.blockCoords : [];
                const enPassantCoords = Array.isArray(vector.enPassantCoords) ? vector.enPassantCoords : [];
                for (let step = 1; step <= repeatCount; step++) {
                    const targetCol = fromCol + vector.dx * step;
                    const targetRow = fromRow - vector.dy * step;

                    if (targetCol < 0 || targetCol >= cols || targetRow < 0 || targetRow >= rows) break; // Out of the board

                    // Check if blocked
                    if (blockCoords.length > 0) {
                        const blocked = blockCoords.some(block => {
                            const checkCol = fromCol + vector.dx * (step - 1) + block.dx;
                            const checkRow = fromRow - vector.dy * (step - 1) - block.dy;
                            const inBoard = checkCol >= 0 && checkCol < cols && checkRow >= 0 && checkRow < rows;
                            const emptySquare = boardState[checkRow][checkCol] == '';
                            return inBoard && !emptySquare;
                        });
                        if (blocked) break;
                    }

                    const targetToken = boardState[targetRow][targetCol];
                    const empty = !targetToken;
                    const brick = BRICKS.includes(targetToken);
                    const enemy = isEnemy(targetToken);
                    const friendly = isFriendly(targetToken);
                    const enPassant = canEnPassant(targetCol, targetRow);
                    const enemyEnPassant = isEnemyEnPassant(targetCol, targetRow);
                    const enPassantMove = rule.enPassant.charAt(0) == 'E';
                    const epCoords = []
                    enPassantCoords.forEach(c => {
                        epCoords.push({col: fromCol + c.dx, row: fromRow - c.dy});
                    });

                    const repeatMode = rule.repeatMode == 'at-most' || rule.repeatMode == 'none' || rule.repeatUnlimited ? 'at-most' : 'exact';
                    const repeatAtMost = repeatMode == 'at-most' && step <= repeatCount;
                    const repeatExact = repeatMode == 'exact' && step == repeatCount;
                    const jumpNone = rule.jumpMode == 'none';
                    const jumpAtMost = rule.jumpMode == 'at-most' && jumped <= rule.jumpCount;
                    const jumpExact = rule.jumpMode == 'exact' && jumped == rule.jumpCount;
                    
                    if ((repeatAtMost || repeatExact) && (jumpNone || jumpAtMost || jumpExact)) {
                        if (brick) break;
                        if (friendly) break; // Can't move onto a friendly piece, unless 'Capture Anything' is on / Future rules
                        if (empty && allowMove) { // Can move to empty squares
                            targets.push({ col: targetCol, row: targetRow, type: 'move', enPassantMove, epCoords });
                        }
                        if (enemy && allowCapture) { // Can (only) capture enemy pieces
                            targets.push({ col: targetCol, row: targetRow, type: 'capture', enPassantMove, epCoords });
                            break;
                        }
                        if (enPassant && enemyEnPassant && allowCapture && rule.enPassant == 'E'){
                            targets.push({ col: targetCol, row: targetRow, type: 'enpassant', enPassantMove, epCoords });
                            break;
                        }
                    }
                    if (!empty) { // Blocked by a non-empty square
                        jumped += 1;
                    }
                    if (jumped > rule.jumpCount) break;
                }
            });
        }
    });

    return targets;
} // { col, row, type, enPassantMove, epCoords }

function addMove(c1, r1, c2, r2, pieceToken, moveType) {
    const sq1 = squareName(c1, r1).name;
    const sq2 = squareName(c2, r2).name;
    const type = moveType == 'capture' ? 'x' : '';

    const col = parsePieceToken(pieceToken).color;
    const piece = parsePieceToken(pieceToken).letter;
    
    const string = `${piece}${sq1}${type}${sq2}`;

    if (['r','b','y','g'].includes(col)) {
        moves.push({c1, r1, c2, r2, sq1, sq2, pieceToken, col, piece, moveType, string});
    };
    // console.log(moves);

    addMoveLog(col, string);
}

function addMoveLog(playerColor, moveNotation) {
    const logBody = document.querySelector(".move-log-body");
    if (!logBody) return;

    const colorOrder = { 'r': 0, 'b': 1, 'y': 2, 'g': 3 };
    const currentWeight = colorOrder[playerColor] ?? 0;

    const rows = logBody.querySelectorAll(".move-turn");
    let targetRow = rows[rows.length - 1];
    let turnNumber = rows.length;

    let createNewRow = false;

    if (!targetRow) {
        createNewRow = true;
        turnNumber = 1;
    } else {
        const occupiedCells = Array.from(targetRow.querySelectorAll(".move-notation:not(.empty-move)"));
        
        if (occupiedCells.length > 0) {
            const lastCell = occupiedCells[occupiedCells.length - 1];
            const lastColor = lastCell.getAttribute("data-color");
            const lastWeight = colorOrder[lastColor] ?? 0;

            if (currentWeight <= lastWeight) {
                createNewRow = true;
                turnNumber++;
            }
        }
    }

    if (createNewRow) {
        targetRow = document.createElement("div");
        targetRow.className = "move-turn";
        targetRow.id = `turn-row-${turnNumber}`;

        // Column 1: Turn Number Label
        const numSpan = document.createElement("span");
        numSpan.className = "move-number";
        numSpan.textContent = `${turnNumber}.`;
        targetRow.appendChild(numSpan);

        const colors = ['r', 'b', 'y', 'g'];
        colors.forEach(colorKey => {
            const moveSpan = document.createElement("span");
            moveSpan.className = "move-notation empty-move";
            moveSpan.setAttribute("data-color", colorKey);
            moveSpan.textContent = ""; 
            targetRow.appendChild(moveSpan);
        });

        logBody.appendChild(targetRow);
    }

    const targetCell = targetRow.querySelector(`.move-notation[data-color="${playerColor}"]`);
    if (targetCell && moveNotation) {
        targetCell.textContent = moveNotation;
        targetCell.classList.remove("empty-move");

        targetCell.addEventListener("click", () => {
            document.querySelectorAll(".move-notation").forEach(el => el.classList.remove("active-move"));
            targetCell.classList.add("active-move");
            console.log(`Navigating to Turn ${turnNumber}, Player ${playerColor}: ${moveNotation}`);
        });
    }

    logBody.scrollTop = logBody.scrollHeight;
}

function movePieceTo(oldCol, oldRow, newCol, newRow, boardState, type, isEnPassant) {
    const oldSquareName = squareName(oldCol, oldRow).name;
    const newSquareName = squareName(newCol, newRow).name;
    const oldSquareInformation = getSquareInformation(oldSquareName, boardState);
    const newSquareInformation = getSquareInformation(newSquareName, boardState);
    const oldPiece = oldSquareInformation.piece;
    const newPiece = newSquareInformation.piece;
    const oldPieceCol = oldSquareInformation.pieceCol;
    
    boardState[oldRow][oldCol] = '';
    boardState[newRow][newCol] = oldPiece;

    // Check can be En Passanted piece
    enPassantSquares = enPassantSquares.filter(sq => !(sq.split(':')[1] == oldSquareName || (sq.split(':')[1] == newSquareName && type == 'capture'))); // Remove if the piece moved or has been captured

    // En Passant
    if (isEnPassant) {
        const enPassantCaptured = enPassantSquares.filter(sq => sq.split(':')[0] == newSquareName);
        enPassantCaptured.forEach(c => {
            const squareInformation = getSquareInformation(c.split(':')[1], boardState);
            const enPassantPieceCol = squareInformation.pieceCol;

            if (enPassantPieceCol) {
                if (enPassantPieceCol !== oldPieceCol) {
                    boardState[squareInformation.square.row][squareInformation.square.col] = '';
                }
            }
        });

        enPassantSquares = enPassantSquares.filter(sq => {
            const epSquareInformation = getSquareInformation(sq.split(':')[0], boardState);
            const pieceSquareInformation = getSquareInformation(sq.split(':')[1], boardState);
            const captured = epSquareInformation.squareName == newSquareName;
            const sameCol = pieceSquareInformation.pieceCol == oldPieceCol;
            return !captured || sameCol ;
        });
    }
    // console.log(enPassantSquares);
    return boardState;
}

function clearMoveMarkers() {
    const markers = document.querySelectorAll('.move-target-dot, .move-target-capture, .move-target-remove');
    
    for (let i = 0; i < markers.length; i++) {
        markers[i].classList.remove('move-target-dot', 'move-target-capture', 'move-target-remove');
    }
}

function updateMoveOutput(moves, pieceToken, fromCol, fromRow, cols, rows) {
    const container = document.querySelector('.moves-list');
    const title = `Piece ${pieceToken} at ${squareName(fromCol, fromRow).name}`;
    const lines = moves.map(move => `${move.type.toUpperCase()}: ${squareName(move.col, move.row).name}`);
    const html = `<div><strong>${title}</strong></div><div>${lines.join('<br>')}</div>`;

    if (container) {
        // container.innerHTML = html;
    } else {
        console.log(title);
        lines.forEach(line => console.log(line));
    }
}

function animatePieceMovement(oldCol, oldRow, newCol, newRow, pgn, container, options, callback) {
    const oldSquare = document.getElementById(`c${oldCol}r${oldRow}`);
    const newSquare = document.getElementById(`c${newCol}r${newRow}`);

    if (!oldSquare || !newSquare) {
        return callback();
    }

    const piece = oldSquare.querySelector('.chess-piece');
    if (!piece) {
        return callback();
    }

    const oldRect = oldSquare.getBoundingClientRect();
    const newRect = newSquare.getBoundingClientRect();
    const deltaX = newRect.left - oldRect.left;
    const deltaY = newRect.top - oldRect.top;

    const originalTransform = piece.style.transform || '';

    const duration = 150;
    let startTime = null;

    oldSquare.style.position = 'relative';
    piece.style.zIndex = '9999';
    piece.style.willChange = 'transform';
    piece.style.backfaceVisibility = 'hidden';

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const ease = Math.sin(progress * Math.PI / 2);

        const currentX = deltaX * ease;
        const currentY = deltaY * ease;

        piece.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            piece.style.transform = `translate3d(${Math.round(deltaX)}px, ${Math.round(deltaY)}px, 0)`;

            piece.style.zIndex = '';
            piece.style.willChange = '';
            piece.style.backfaceVisibility = '';
            oldSquare.style.position = '';
            callback();
        }
    }

    requestAnimationFrame(step);
}

// Draws custom chess board grid based on PGN
function drawBoard(pgn, container, options = {}) {
    container.innerHTML = "";

    const boardGrid = document.createElement("div");
    const containerRect = container.getBoundingClientRect();
    const containerSize = Math.min(containerRect.width, containerRect.height);
    const safeSize = containerSize > 10 ? containerSize : 400;
    const cellSize = Math.floor(safeSize / Math.max(cols, rows));

    boardGrid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
    boardGrid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    boardGrid.style.width = (cellSize * cols) + 'px';
    boardGrid.style.height = (cellSize * rows) + 'px';
    boardGrid.style.gap = '0';
    boardGrid.style.margin = 'auto';

    boardGrid.className = "chess-grid";
    boardGrid.style.setProperty('--cols', cols);
    boardGrid.style.setProperty('--rows', rows);
    boardGrid.style.border = "2px dashed #f96800";
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const square = document.createElement("div");
            square.dataset.row = r;
            square.dataset.col = c;
            square.style.width = cellSize + 'px';
            square.style.height = cellSize + 'px';
            square.id = `c${c}r${r}`;

            const isLight = (r + c) % 2 === 0;
            const gridColor = isLight ? "light-square" : "dark-square";
            square.className = rbyg ? `board-square rbyg-${gridColor}` : `board-square ${gridColor}`;

            square.addEventListener("click", (event) => {
                const ctx = getRuleContext();
                if (ctx && ctx.gameOver) {
                    console.log('Game is over, ignoring click');
                    return;
                }

                const targetSquare = event.target.closest(".board-square");
                if (!targetSquare) return;

                if (lastTargetSquare) {
                    // console.log("The last clicked square:", lastTargetSquare.id);
                }

                const currentCol = Number(targetSquare.dataset.col);
                const currentRow = Number(targetSquare.dataset.row);
                const clickedPiece = boardState[currentRow][currentCol];
                
                if (lastTargetSquare && lastTargets) {
                    const oldCol = Number(lastTargetSquare.dataset.col);
                    const oldRow = Number(lastTargetSquare.dataset.row);
                    const oldPieceToken = boardState[oldRow][oldCol];
                    const inTargets = lastTargets.some(target => currentCol === target.col && currentRow === target.row);
                    if (oldPieceToken !== '' && inTargets) {
                        const targetMoves = lastTargets.filter(t => t.col == currentCol && t.row == currentRow);

                        // Add moves
                        const allMoveTypes = [];
                        targetMoves.forEach(m => allMoveTypes.push(m.type));
                        const moveType = allMoveTypes.some(m => m == 'capture' || m == 'enpassant') ? 'capture' : 'move';
                        // console.log(moveType, allMoveTypes);
                        addMove(oldCol, oldRow, currentCol, currentRow, oldPieceToken, moveType);
                        
                        // En Passant squares
                        targetMoves.forEach(t => {
                            t.epCoords.forEach(c => {
                                const sq1 = squareName(c.col, c.row).name;
                                const sq2 = squareName(currentCol, currentRow).name;
                                enPassantSquares.push(`${sq1}:${sq2}`);
                            })
                        });
                        const isEnPassantMove = targetMoves.some(t => t.enPassantMove);

                        // Reset
                        document.querySelectorAll('.board-square.highlight').forEach(sq => sq.classList.remove('highlight'));
                        clearMoveMarkers();
                        lastTargetSquare = null;
                        lastTargets = null;

                        animatePieceMovement(oldCol, oldRow, currentCol, currentRow, pgn, container, options, () => {
                            if (ctx && ctx.gameOver) {
                                drawBoard(pgn, container, options);
                                return;
                            }

                            boardState = movePieceTo(oldCol, oldRow, currentCol, currentRow, boardState, moveType, isEnPassantMove);

                            const ctx2 = triggerEvent('~movedPiece', {
                                board: boardState,
                                moveNumber: moves.length,
                                movedCol: parsePieceToken(oldPieceToken).color,
                                movedPiece: parsePieceToken(oldPieceToken).letter,
                                pieceFrom: [oldCol, oldRow],
                                pieceTo: [currentCol, currentRow],
                                pieceAction: moveType
                            });

                            if (ctx2 && ctx2.board) {
                                boardState = ctx2.board;
                            }

                            console.log(`~turn event: moveNumber=${moves.length}, currentColor=${ctx2?.currentColor || 'r'}`);
                            const ctx3 = triggerEvent('~turn', {
                                board: boardState,
                                moveNumber: moves.length,
                                currentColor: ctx2?.currentColor || 'r'
                            });

                            if (ctx3 && ctx3.board) {
                                boardState = ctx3.board;
                            }

                            const freshPgn = generatePgnFromBoard();
                            sendMove(freshPgn);

                            drawBoard(pgn, container, options);
                        });

                        return;
                    }
                }
                
                const highlightedSquares = [...document.querySelectorAll('.board-square.highlight')];
                highlightedSquares.forEach(sq => sq.classList.remove('highlight'));
                clearMoveMarkers();

                if (!highlightedSquares.some(sq => sq.id == targetSquare.id)) {
                    targetSquare.classList.add('highlight');
                } else {
                    clearMoveMarkers();
                    lastTargetSquare = null;
                    lastTargets = null;
                    return;
                }
                const targets = getLegalMoveTargets(clickedPiece, currentCol, currentRow, boardState, cols, rows);
                // console.log(`Clicked on ${clickedPiece} at ${squareName(currentCol, currentRow)}. Found ${targets.length} legal targets.`);

                for (let i = 0; i < targets.length; i++) {
                    const target = targets[i];
                    const targetSquareDom = document.getElementById(`c${target.col}r${target.row}`);
                    if (!targetSquareDom) continue;
                    
                    if (target.type === 'move') {
                        targetSquareDom.classList.add('move-target-dot');
                    } else if (target.type === 'capture' || target.type === 'enpassant') {
                        targetSquareDom.classList.add('move-target-capture');
                    } else {
                        targetSquareDom.classList.add('move-target-remove');
                    }
                }
                updateMoveOutput(targets, clickedPiece, currentCol, currentRow, cols, rows);
                lastTargetSquare = targetSquare;
                lastTargets = targets;
                
            });
                    
            const currentPiece = boardState[r][c];

            if (currentPiece === "!") {
                square.classList.add("void-grid");
            } else if (currentPiece) {
                let pieceLetter = "";
                let pieceColor = "";

                // 1. Check if the piece has a color prefix (e.g., "g:R", "r:E")
                if (currentPiece.includes(":")) {
                    const parts = currentPiece.split(":");
                    const colorPrefix = parts[0];
                    pieceLetter = parts[1];

                    // Base 4-player color tracking
                    let rawColor = 'dead';
                    if (colorPrefix === 'r') rawColor = 'red';
                    if (colorPrefix === 'b') rawColor = 'blue';
                    if (colorPrefix === 'y') rawColor = 'yellow';
                    if (colorPrefix === 'g') rawColor = 'green';
                    if (colorPrefix === 'd') rawColor = 'dead';

                    // Apply the mapping rule based on the user's preferred color scheme
                    if (!rbyg) {
                        if (rawColor === 'red') {
                            pieceColor = 'white';
                        } else if (rawColor === 'yellow') {
                            pieceColor = 'black';
                        } else {
                            pieceColor = rawColor;
                        }
                    } else {
                        // 4pc: No color change
                        pieceColor = rawColor;
                    }
                } else {
                    // 2. If it is a brick/duck
                    pieceLetter = currentPiece;
                    pieceColor = 'dead';
                }
                
                // 3. Generate and append the piece element
                if (pieceLetter && pieceColor) {
                    const piece = document.createElement('div');
                    piece.className = 'chess-piece';
                    square.appendChild(piece);

                    const targetHex = PIECE_PALETTE[pieceColor] || '#f8f8f8';

                    // Determine correct filename case
                    let fileName = pieceLetter;
                    if (!currentPiece.includes(":")) {
                        fileName = pieceLetter;
                    }

                    const classId = `${pieceLetter}-c${c}r${r}`;

                    const injectSvg = (rawSvgText) => {
                        let updatedSvg = rawSvgText.replace(/#f96800/gi, targetHex);
                        updatedSvg = updatedSvg.replace(/custom/g, `custom-${classId}`);
                        piece.innerHTML = updatedSvg;
                    };

                    if (svgCache[fileName]) {
                        injectSvg(svgCache[fileName]);
                    } else {
                        // Fetch the SVG file directly from folder
                        fetch(`assets/images/pieces/simplicity/${fileName}.svg`)
                        .then(response => {
                            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                            return response.text();
                            })
                            .then(svgText => {
                                svgCache[fileName] = svgText;
                                injectSvg(svgText);
                            })
                        .catch(err => {});
                    }
                }
            }
            boardGrid.appendChild(square);
        }
    }
    container.appendChild(boardGrid);
}

// Draws board and checks logic
function boardLogic(pgn, container, options = {}) {
    const fullPosition = parsePgnTag(pgn, "Position");
    const positionRows = fullPosition ? fullPosition.split("/") : [];
  
    // Process Position Details
    const details = parsePgnDetails(pgn, "PositionDetails");
    const dim = details["dim"];
    rbyg = details["rbyg"] === "true";
    const rawEnPassantSquares = details["enPassantSquares"]; // Should be like e3:e4 (square = e3, that pawn = e4)
    enPassantSquares = rawEnPassantSquares == undefined ? [] : rawEnPassantSquares.split(',');

    if (dim) {
        const dimParts = dim.split("x");
        if (dimParts.length === 2) {
            cols = parseInt(dimParts[0], 10);
            rows = parseInt(dimParts[1], 10);
        }
    }

    if (!cols || !rows) {
        cols = 8;
        rows = 8;
    }

    boardState = [];
    for (let r = 0; r < rows; r++) {
        const pieceCodes = positionRows[r] ? positionRows[r].split(",") : [];
        const allPieces = [];
        pieceCodes.forEach(item => {
            const num = parseInt(item, 10);
            if (isNaN(num) || num == 0) {
                allPieces.push(item);
            } else {
                for (let i = 0; i < num; i++) {
                    allPieces.push(""); 
                }
            }
        });
        while (allPieces.length < cols) {
            allPieces.push("");
        }
        boardState.push(allPieces);
    }

    const rulesTag = parsePgnTag(pgn, 'GameRules');
    if (rulesTag) {
        loadRules(rulesTag);
        console.log('📜 Rules loaded:', rulesTag);
    }

    initRuleContext(boardState, cols, rows, ['r', 'b', 'y', 'g']);

    const ctx = triggerEvent('~start', {
        board: boardState,
        moveNumber: 0
    });

    if (ctx && ctx.board) {
        boardState = ctx.board;
    }

    drawBoard(pgn, container, options);
}

window.boardLogic = boardLogic;

const DEFAULT_PGN = `
[Position "y:R,y:N,y:B,y:Q,y:K,y:B,y:N,y:R/y:P,y:P,y:P,y:P,y:P,y:P,y:P,y:P/8/8/8/8/r:P,r:P,r:P,r:P,r:P,r:P,r:P,r:P/r:R,r:N,r:B,r:Q,r:K,r:B,r:N,r:R"]
[PositionDetails "'dim=8x8'"]
`;

window.currentVariantPGN = localStorage.getItem('selectedVariantPGN') || DEFAULT_PGN;

function initializeBoard(pgn) {
    if (pgn) {
        window.currentVariantPGN = pgn;
        localStorage.setItem('selectedVariantPGN', pgn);
    }
    
    const container = document.querySelector('.preview-board');
    if (!container) {
        console.warn("Target '.preview-board' container not found in DOM.");
        return;
    }
    boardLogic(window.currentVariantPGN, container);
}

window.initializeBoard = initializeBoard;