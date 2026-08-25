function tokenize(code) {
    const tokens = [];
    let i = 0;
    while (i < code.length) {
        const ch = code[i];
        if (ch === ' ' || ch === '\n' || ch === '\t' || ch === ';') {
            i++;
            continue;
        }
        if (ch === ',') {
            tokens.push(',');
            i++;
            continue;
        }
        if ('(){}'.includes(ch)) {
            tokens.push(ch);
            i++;
            continue;
        }
        if (ch === "'" || ch === '"') {
            let str = '';
            i++;
            while (i < code.length && code[i] !== ch) {
                str += code[i];
                i++;
            }
            i++;
            tokens.push(`'${str}'`);
            continue;
        }
        let word = '';
        while (i < code.length && !'(){} \n\t,'.includes(code[i])) {
            word += code[i];
            i++;
        }
        if (word) tokens.push(word);
    }
    return tokens;
}

function parse(tokens) {
    let pos = 0;
    
    function parseExpr() {
        const tok = tokens[pos];
        if (!tok) return null;
        
        // Events (~)
        if (tok.startsWith('~')) {
            pos++;
            const name = tok;
            const body = parseBlock();
            return { type: 'event', name, body };
        }
        
        // Get (g)
        if (tok.startsWith('g')) {
            pos++;
            const name = tok;
            // Check if it has args (e.g., gvar('name'))
            if (tokens[pos] === '(') {
                const args = parseParens();
                return { type: 'get', name, args };
            }
            return { type: 'get', name, args: [] };
        }
        
        // Action (a)
        if (tok.startsWith('a')) {
            pos++;
            const name = tok;
            const args = parseParens();
            return { type: 'action', name, args };
        }

        // Repeat: (r)
        if (tok === 'r') {
            pos++;
            const count = parseParens()[0];
            const body = parseBlock();
            return { type: 'repeat', count, body };
        }
        
        // Forever (rforever{...})
        if (tok === 'rforever') {
            pos++;
            const body = parseBlock();
            return { type: 'repeat', count: Infinity, body };
        }
        
        // Operators (o)
        if (tok.startsWith('o')) {
            pos++;
            const name = tok;
            const args = parseParens();
            return { type: 'operator', name, args };
        }

        // Logic (l)
        if (tok.startsWith('l')) {
            pos++;
            const name = tok;
            const args = parseParens();
            return { type: 'logic', name, args };
        }
        
        // Condition (c)
        if (tok === 'ci') {
            pos++;
            const condition = parseParens()[0];
            const body = parseBlock();
            let elseBody = null;
            // Check for 'ce' (else) or 'cei' (else if)
            if (tokens[pos] === 'ce') {
                pos++;
                if (tokens[pos] === 'i') { // cei
                    pos++;
                    const elseifCondition = parseParens()[0];
                    const elseifBody = parseBlock();
                    elseBody = { type: 'elseif', condition: elseifCondition, body: elseifBody };
                } else {
                    elseBody = parseBlock();
                }
            }
            return { type: 'if', condition, body, else: elseBody };
        }
        
        // Variables ($)
        if (tok.startsWith('$')) {
            pos++;
            const name = tok;
            const args = parseParens();
            return { type: 'var', name, args };
        }

        // User (@)
        if (tok.startsWith('@')) {
            pos++;
            const name = tok;
            const args = parseParens();
            return { type: 'user', name, args };
        }
        
        // String
        if (tok.startsWith("'")) {
            pos++;
            return { type: 'str', value: tok.slice(1, -1) };
        }
        
        // Number
        if (!isNaN(tok)) {
            pos++;
            return { type: 'num', value: parseFloat(tok) };
        }

        // Block {...}
        if (tok === '{') {
            return parseBlock();
        }
        
        throw new Error(`Unknown token: ${tok} at position ${pos}`);
    }
    
    function parseParens() {
        if (tokens[pos] !== '(') throw new Error(`Expected '(' at position ${pos}`);
        pos++;
        const args = [];
        let argTokens = [];
        let depth = 0;
        while (pos < tokens.length) {
            if (tokens[pos] === '(') depth++;
            if (tokens[pos] === ')') {
                if (depth === 0) {
                    pos++;
                    if (argTokens.length) {
                        const subParser = parse([...argTokens]);
                        args.push(subParser);
                    }
                    return args;
                }
                depth--;
            }
            if (tokens[pos] === ',' && depth === 0) {
                if (argTokens.length) {
                    const subParser = parse([...argTokens]);
                    args.push(subParser);
                    argTokens = [];
                }
                pos++;
                continue;
            }
            argTokens.push(tokens[pos]);
            pos++;
        }
        return args;
    }
    
    function parseBlock() {
        if (tokens[pos] !== '{') throw new Error(`Expected '{' at position ${pos}`);
        pos++;
        const stmts = [];
        while (pos < tokens.length && tokens[pos] !== '}') {
            const stmt = parseExpr();
            if (stmt) stmts.push(stmt);
        }
        pos++;
        return { type: 'block', stmts };
    }
    
    return parseExpr();
}

function createContext() {
    return {
        // Board state
        board: null,
        cols: 8,
        rows: 8,
        colors: ['r', 'b', 'y', 'g'],
        currentColor: 'r',
        moveNumber: 0,
        gameOver: false,
        winner: null,
        
        // Last move context
        movedCol: null,
        movedPiece: null,
        pieceFrom: null,
        pieceTo: null,
        pieceAction: null,
        
        // Variables
        variables: {},
        
        // User
        prompts: {},
        result: null,
        
        // Loop state
        loopIndex: 0
    };
}

function execute(node, ctx) {
    if (!node) return null;
    
    switch (node.type) {
        case 'event':
            return null;
        
        case 'get': {
            const name = node.name;
            const args = node.args || [];
            
            switch (name) {
                // ---- Basic State ----
                case 'gmove': return ctx.moveNumber;
                case 'gboard': return ctx.board;
                case 'gcol': return ctx.currentColor;
                case 'gcols': return ctx.colors;
                case 'gdim': return [ctx.cols, ctx.rows];
                case 'ggameEnded': return ctx.gameOver;
                
                // ---- Last Move ----
                case 'gmovedCol': return ctx.movedCol;
                case 'gmovedPiece': return ctx.movedPiece;
                case 'gpieceFrom': return ctx.pieceFrom;
                case 'gpieceTo': return ctx.pieceTo;
                case 'gpieceAction': return ctx.pieceAction;
                
                // ---- Advanced Gets ----
                case 'gvar': {
                    const key = execute(args[0], ctx);
                    return ctx.variables[key] || null;
                }
                case 'gpieceNum': {
                    const color = execute(args[0], ctx);
                    if (!color || !ctx.board) return 0;
                    let count = 0;
                    for (let r = 0; r < ctx.board.length; r++) {
                        for (let c = 0; c < ctx.board[r].length; c++) {
                            const piece = ctx.board[r][c];
                            if (piece && piece.startsWith(color)) count++;
                        }
                    }
                    return count;
                }
                case 'gpieceNumAll': {
                    if (!ctx.board) return 0;
                    let count = 0;
                    for (let r = 0; r < ctx.board.length; r++) {
                        for (let c = 0; c < ctx.board[r].length; c++) {
                            if (ctx.board[r][c] && ctx.board[r][c] !== '!') count++;
                        }
                    }
                    return count;
                }
                case 'gpieces': {
                    const color = execute(args[0], ctx);
                    if (!color || !ctx.board) return [];
                    const pieces = [];
                    for (let r = 0; r < ctx.board.length; r++) {
                        for (let c = 0; c < ctx.board[r].length; c++) {
                            const piece = ctx.board[r][c];
                            if (piece && piece.startsWith(color)) {
                                const letter = piece.split(':')[1] || piece;
                                pieces.push(letter);
                            }
                        }
                    }
                    return pieces;
                }
                
                default:
                    console.warn(`Unknown get: ${name}`);
                    return null;
            }
        }
        
        case 'action': {
            const args = node.args.map(a => execute(a, ctx));
            const name = node.name;
            
            switch (name) {
                // ---- Game Flow ----
                case 'awin': {
                    console.log(`🔍 awin called with: ${args[0]}`);
                    ctx.gameOver = true;
                    ctx.winner = args[0];
                    alert(`🏆 ${args[0]} wins!`);
                    return null;
                }
                case 'alose': {
                    ctx.gameOver = true;
                    alert(`💀 ${args[0]} loses!`);
                    return null;
                }
                case 'adraw': {
                    ctx.gameOver = true;
                    alert(`🤝 Draw!`);
                    return null;
                }
                case 'aturn': {
                    ctx.currentColor = args[0];
                    return null;
                }
                
                // ---- Board Manipulation ----
                case 'areplace': {
                    const [pos, piece] = args;
                    if (pos && pos[0] !== undefined && pos[1] !== undefined && ctx.board) {
                        if (ctx.board[pos[1]] && ctx.board[pos[1]][pos[0]] !== undefined) {
                            ctx.board[pos[1]][pos[0]] = piece;
                        }
                    }
                    return null;
                }
                case 'adelete': {
                    const [pos] = args;
                    if (pos && pos[0] !== undefined && pos[1] !== undefined && ctx.board) {
                        if (ctx.board[pos[1]] && ctx.board[pos[1]][pos[0]] !== undefined) {
                            ctx.board[pos[1]][pos[0]] = '';
                        }
                    }
                    return null;
                }
                case 'aswap': {
                    const [p1, p2] = args;
                    if (p1 && p2 && ctx.board) {
                        const temp = ctx.board[p1[1]][p1[0]];
                        ctx.board[p1[1]][p1[0]] = ctx.board[p2[1]][p2[0]];
                        ctx.board[p2[1]][p2[0]] = temp;
                    }
                    return null;
                }
                case 'asetCol': {
                    const [pos, color] = args;
                    if (pos && color && ctx.board) {
                        const piece = ctx.board[pos[1]][pos[0]];
                        if (piece) {
                            const letter = piece.split(':')[1] || piece;
                            ctx.board[pos[1]][pos[0]] = `${color}:${letter}`;
                        }
                    }
                    return null;
                }
                case 'ahide': {
                    const [pos] = args;
                    if (pos && ctx.board) {
                        // Mark as hidden by setting to '!'
                        ctx.board[pos[1]][pos[0]] = '!';
                    }
                    return null;
                }
                case 'ashow': {
                    const [pos] = args;
                    if (pos && ctx.board) {
                        if (ctx.board[pos[1]][pos[0]] === '!') {
                            ctx.board[pos[1]][pos[0]] = '';
                        }
                    }
                    return null;
                }
                
                // ---- Variables ----
                case 'aset': {
                    const [name, value] = args;
                    ctx.variables[name] = value;
                    return null;
                }
                
                // ---- Code Manipulation (Advanced) ----
                case 'acode': {
                    const [piece, code] = args;
                    // Store in a global piece code map
                    window._customPieceCodes = window._customPieceCodes || {};
                    window._customPieceCodes[piece] = code;
                    return null;
                }
                case 'arevertCode': {
                    const [piece] = args;
                    if (window._customPieceCodes) {
                        delete window._customPieceCodes[piece];
                    }
                    return null;
                }
                
                default:
                    console.warn(`Unknown action: ${name}`);
                    return null;
            }
        }
   
        case 'repeat': {
            const count = node.count === Infinity ? Infinity : execute(node.count, ctx);
            let last = null;
            if (count === Infinity) {
                let iter = 0;
                while (!ctx.gameOver) {
                    ctx.loopIndex = iter;
                    last = execute(node.body, ctx);
                    iter++;
                    if (iter > 1000000) { console.warn('Infinite loop protection'); break; }
                }
                return last;
            }
            for (let i = 0; i < count; i++) {
                if (ctx.gameOver) break;
                ctx.loopIndex = i;
                last = execute(node.body, ctx);
            }
            return last;
        }
        
        case 'operator': {
            const args = node.args.map(a => execute(a, ctx));
            const name = node.name;
            
            switch (name) {
                case 'o+': return args[0] + args[1];
                case 'o-': return args[0] - args[1];
                case 'o*': return args[0] * args[1];
                case 'o/': return args[1] !== 0 ? args[0] / args[1] : 0;
                case 'o%': return args[0] % args[1];
                case 'o^': return Math.pow(args[0], args[1]);
                case 'oabs': return Math.abs(args[0]);
                case 'oranI': return Math.floor(Math.random() * (args[1] - args[0] + 1)) + args[0];
                case 'oranD': return Math.random() * (args[1] - args[0]) + args[0];
                default:
                    console.warn(`Unknown operator: ${name}`);
                    return null;
            }
        }
        
        case 'logic': {
            const args = node.args.map(a => execute(a, ctx));
            const name = node.name;
            
            switch (name) {
                case 'l&': return args[0] && args[1];
                case 'l|': return args[0] || args[1];
                case 'l!': return !args[0];
                case 'l^': return args[0] !== args[1];
                case 'l=': {
                    const result = args[0] === args[1];
                    console.log(`🔍 l=: ${args[0]} === ${args[1]} → ${result}`);
                    return result;
                }
                case 'l~': return String(args[0]).toLowerCase() === String(args[1]).toLowerCase();
                case 'l>': return args[0] > args[1];
                case 'l<': return args[0] < args[1];
                case 'l>=': return args[0] >= args[1];
                case 'l<=': return args[0] <= args[1];
                default:
                    console.warn(`Unknown logic: ${name}`);
                    return null;
            }
        }
        
        case 'if': {
            const condition = execute(node.condition, ctx);
            console.log(`🔍 If condition: ${condition}`);
            if (condition) {
                console.log('🔍 Executing if body');
                return execute(node.body, ctx);
            } else if (node.else) {
                if (node.else.type === 'elseif') {
                    const elseCond = execute(node.else.condition, ctx);
                    if (elseCond) {
                        return execute(node.else.body, ctx);
                    }
                    return null;
                }
                return execute(node.else, ctx);
            }
            return null;
        }
        
        case 'var': {
            const name = node.name;
            const args = node.args || [];
            
            switch (name) {
                case '$createVar': {
                    const key = execute(args[0], ctx);
                    if (key && !ctx.variables[key]) {
                        ctx.variables[key] = null;
                    }
                    return null;
                }
                case '$varSet': {
                    const key = execute(args[0], ctx);
                    const value = execute(args[1], ctx);
                    if (key !== undefined) {
                        ctx.variables[key] = value;
                    }
                    return null;
                }
                case '$var': {
                    const key = execute(args[0], ctx);
                    return ctx.variables[key] ?? null;
                }
                case '$result': {
                    return ctx.result;
                }
                default:
                    console.warn(`Unknown variable operation: ${name}`);
                    return null;
            }
        }

        case 'user': {
            const args = node.args.map(a => execute(a, ctx));
            const name = node.name;
            
            switch (name) {
                // ---- Prompt Management ----
                case '@promptNew': {
                    const id = execute(args[0], ctx);
                    const type = execute(args[1], ctx) || 'text';
                    const content = execute(args[2], ctx) || '';
                    const visibility = execute(args[3], ctx) || 'private';
                    
                    if (!id) return null;
                    
                    ctx.prompts = ctx.prompts || {};
                    ctx.prompts[id] = {
                        type: type,
                        content: content,
                        visibility: visibility,
                        responses: {},
                        hiddenFor: []
                    };
                    return null;
                }
                
                case '@promptSet': {
                    const id = execute(args[0], ctx);
                    const property = execute(args[1], ctx);
                    const value = execute(args[2], ctx);
                    
                    if (!id || !property) return null;
                    if (!ctx.prompts) ctx.prompts = {};
                    if (!ctx.prompts[id]) ctx.prompts[id] = {};
                    
                    ctx.prompts[id][property] = value;
                    return null;
                }
                
                case '@prompt': {
                    const id = execute(args[0], ctx);
                    const color = execute(args[1], ctx);
                    
                    if (!id || !color) return null;
                    if (!ctx.prompts) ctx.prompts = {};
                    if (!ctx.prompts[id]) return null;
                    
                    const prompt = ctx.prompts[id];
                    
                    // Check if hidden for this color
                    if (prompt.hiddenFor && prompt.hiddenFor.includes(color)) {
                        return null;
                    }
                    
                    // Show the prompt based on type
                    switch (prompt.type) {
                        case 'text':
                            const answer = prompt(prompt.content);
                            prompt.responses[color] = answer;
                            break;
                        case 'options':
                            const options = prompt.content.split(',');
                            const optionsStr = options.map((o, i) => `${i+1}:${o}`).join(' ');
                            const choice = prompt(`Choose: ${optionsStr}`);
                            prompt.responses[color] = choice;
                            break;
                        case 'tip':
                        case 'note':
                            // Just display a notification
                            console.log(`📌 ${prompt.content}`);
                            prompt.responses[color] = true;
                            break;
                        case 'warn':
                            console.warn(`⚠️ ${prompt.content}`);
                            prompt.responses[color] = true;
                            break;
                        case 'error':
                            console.error(`❌ ${prompt.content}`);
                            prompt.responses[color] = true;
                            break;
                        default:
                            console.warn(`Unknown prompt type: ${prompt.type}`);
                    }
                    
                    // Trigger userResponse event
                    triggerEvent('~userResponse', ctx);
                    return null;
                }
                
                case '@promptResp': {
                    const id = execute(args[0], ctx);
                    const color = execute(args[1], ctx);
                    
                    if (!id || !color) return null;
                    if (!ctx.prompts || !ctx.prompts[id]) return null;
                    
                    return ctx.prompts[id].responses?.[color] || null;
                }
                
                case '@promptHide': {
                    const id = execute(args[0], ctx);
                    const color = execute(args[1], ctx);
                    
                    if (!id || !color) return null;
                    if (!ctx.prompts) ctx.prompts = {};
                    if (!ctx.prompts[id]) ctx.prompts[id] = { hiddenFor: [] };
                    
                    if (!ctx.prompts[id].hiddenFor) ctx.prompts[id].hiddenFor = [];
                    if (!ctx.prompts[id].hiddenFor.includes(color)) {
                        ctx.prompts[id].hiddenFor.push(color);
                    }
                    return null;
                }
                
                case '@promptHideAll': {
                    const id = execute(args[0], ctx);
                    
                    if (!id) return null;
                    if (!ctx.prompts) ctx.prompts = {};
                    if (!ctx.prompts[id]) ctx.prompts[id] = { hiddenFor: [] };
                    
                    ctx.prompts[id].hiddenFor = ctx.colors || ['r', 'b', 'y', 'g'];
                    return null;
                }
                
                case '@promptDel': {
                    const id = execute(args[0], ctx);
                    
                    if (!id) return null;
                    if (ctx.prompts) {
                        delete ctx.prompts[id];
                    }
                    return null;
                }
                
                default:
                    console.warn(`Unknown user command: ${name}`);
                    return null;
            }
        }
        
        case 'str':
            return node.value;
        case 'num':
            return node.value;

        case 'block': {
            let last = null;
            for (const stmt of node.stmts) {
                if (ctx.gameOver) break;
                last = execute(stmt, ctx);
            }
            return last;
        }
            
        default:
            console.warn(`Unknown AST node: ${node.type}`);
            return null;
    }
}

let ruleAsts = [];
let currentContext = null;

export function loadRules(rulesString) {
    if (!rulesString || !rulesString.trim()) {
        ruleAsts = [];
        return;
    }
    
    // Split by semicolon, but respect braces
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of rulesString) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        if (ch === ';' && depth === 0) {
            if (current.trim()) parts.push(current.trim());
            current = '';
            continue;
        }
        current += ch;
    }
    if (current.trim()) parts.push(current.trim());
    
    ruleAsts = parts.map(rule => {
        try {
            const tokens = tokenize(rule);
            return parse(tokens);
        } catch (e) {
            console.warn(`Failed to parse rule: ${rule}`, e);
            return null;
        }
    }).filter(Boolean);
    
    console.log(`📜 Loaded ${ruleAsts.length} rules`);
}

export function triggerEvent(eventName, context) {
    if (!currentContext) {
        currentContext = createContext();
    }
    
    // Merge context
    Object.assign(currentContext, context);
    
    const matching = ruleAsts.filter(ast => 
        ast.type === 'event' && ast.name === eventName
    );
    
    if (matching.length === 0) return currentContext;
    
    // Make a copy of the board reference
    const boardRef = currentContext.board;
    
    matching.forEach(ast => {
        if (!currentContext.gameOver) {
            try {
                execute(ast.body, currentContext);
            } catch (e) {
                console.warn(`Error executing event ${eventName}:`, e);
            }
        }
    });
    
    // If the board was modified, update the reference
    if (currentContext.board !== boardRef) {
        // Board was replaced; keep the reference
    }
    
    return currentContext;
}

export function initRuleContext(board, cols, rows, colors = ['r', 'b', 'y', 'g']) {
    currentContext = createContext();
    currentContext.board = board;
    currentContext.cols = cols;
    currentContext.rows = rows;
    currentContext.colors = colors;
    currentContext.currentColor = colors[0] || 'r';
    return currentContext;
}

export function getRuleContext() {
    return currentContext;
}

export function resetRuleEngine() {
    ruleAsts = [];
    currentContext = null;
}

window.ruleEngine = {
    loadRules,
    triggerEvent,
    initRuleContext,
    getRuleContext,
    resetRuleEngine,
    parse: (code) => {
        const tokens = tokenize(code);
        return parse(tokens);
    },
    tokenize: tokenize
};

console.log('Rule Engine loaded');