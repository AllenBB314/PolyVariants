// ==========================================
// 1. CUSTOM ZELOS RENDERER & CONSTANT PROVIDER
// ==========================================
class CustomConstantProvider extends Blockly.zelos.ConstantProvider {
    constructor() {
        super();
        // Define sharp rectangular connector shape for Array inputs/outputs
        this.RECTANGULAR = {
            type: 'RECTANGULAR',
            width: 12,
            height: 16,
            connectionOffsetY: 0,
            connectionOffsetX: 0,
            pathUp: function(dir) {
                return `h ${-12 * dir} v ${dir * 16} h ${12 * dir}`;
            },
            pathDown: function(dir) {
                return `h ${-12 * dir} v ${dir * 16} h ${12 * dir}`;
            }
        };
    }

    /**
     * Intercepts connection checks using getCheck() instead of getAllCheck().
     * If the connection involves 'Array', it returns our sharp rectangular shape.
     */
    shapeFor(connection) {
        const checks = connection.getCheck();
        if (checks && checks.includes('Array')) {
            return this.RECTANGULAR;
        }
        return super.shapeFor(connection);
    }
}

class CustomZelosRenderer extends Blockly.zelos.Renderer {
    constructor(name) {
        super(name);
    }
    createConstants_() {
        return new CustomConstantProvider();
    }
}

// Register the custom renderer
Blockly.blockRendering.register('zelos_rect', CustomZelosRenderer);


// ==========================================
// 2. CUSTOM THEME CONFIGURATION
// ==========================================
const customTheme = Blockly.Theme.defineTheme('custom_theme', {
    'base': Blockly.Themes.Classic,
    'componentStyles': {
        'workspaceBackgroundColour': '#202020', // Main editor background
        'toolboxBackgroundColour': '#2b2b2b',   // Left sidebar background
        'toolboxForegroundColour': '#ffffff',   // Sidebar text color
        'flyoutBackgroundColour': '#242424',    // Pop-out drawer background
        'flyoutForegroundColour': '#ffffff',    // Pop-out drawer text color
        'scrollbarColour': '#555',
        'insertionMarkerColour': '#fff'
    }
});


// ==========================================
// 3. BLOCK DEFINITIONS
// ==========================================
const blocks = [
    // Events
    { "type": "event_any_time", "message0": "when any time", "nextStatement": null, "colour": "#ffbf00", "tooltip": "Any moment" },
    { "type": "event_start", "message0": "when game starts", "nextStatement": null, "colour": "#ffbf00", "tooltip": "When the game starts" },
    { "type": "event_clicked", "message0": "when square %1 clicked", "args0": [{ "type": "input_value", "name": "POS" }], "inputsInline": true, "nextStatement": null, "colour": "#ffbf00", "tooltip": "When any square is clicked" },
    { "type": "event_turn", "message0": "when turn begins", "nextStatement": null, "colour": "#ffbf00", "tooltip": "When it is any player's turn" },
    { "type": "event_turn_ended", "message0": "when turn ends", "nextStatement": null, "colour": "#ffbf00", "tooltip": "When any player's turn ends" },

    // Get
    { "type": "g_move", "message0": "get move #", "output": "Number", "colour": "#9966ff", "tooltip": "Get current move number" },
    { "type": "g_board", "message0": "get board state", "output": "Array", "colour": "#9966ff", "tooltip": "Get board state array" },
    { "type": "g_col", "message0": "get color order", "output": "Array", "colour": "#9966ff", "tooltip": "Get color order array" },
    { "type": "g_cols", "message0": "get columns", "output": "Number", "colour": "#9966ff", "tooltip": "Get total columns" },
    { "type": "g_dim", "message0": "get dimensions", "output": "Array", "colour": "#9966ff", "tooltip": "Get board dimensions array" },

    // Actions
    { "type": "a_win", "message0": "win %1", "args0": [{ "type": "input_value", "name": "COND", "check": "Boolean" }], "previousStatement": null, "nextStatement": null, "colour": "#ed4242", "tooltip": "Trigger win condition" },
    { "type": "a_lose", "message0": "lose %1", "args0": [{ "type": "input_value", "name": "COND", "check": "Boolean" }], "previousStatement": null, "nextStatement": null, "colour": "#ed4242", "tooltip": "Trigger lose condition" },
    { "type": "a_turn", "message0": "end turn", "previousStatement": null, "nextStatement": null, "colour": "#ed4242", "tooltip": "End the current turn" },
    { "type": "a_replace", "message0": "replace square %1 with piece %2", "args0": [{ "type": "input_value", "name": "POS" }, { "type": "input_value", "name": "PIECE" }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "colour": "#ed4242", "tooltip": "Replace a square with a piece" },
    { "type": "a_delete", "message0": "delete piece at %1", "args0": [{ "type": "input_value", "name": "POS" }], "inputsInline": true, "previousStatement": null, "nextStatement": null, "colour": "#ed4242", "tooltip": "Delete piece at square" },

    // Operators
    { "type": "o_add", "message0": "%1 + %2", "args0": [{ "type": "input_value", "name": "A", "check": "Number" }, { "type": "input_value", "name": "B", "check": "Number" }], "inputsInline": true, "output": "Number", "colour": "#59c059", "tooltip": "Addition" },
    { "type": "o_sub", "message0": "%1 - %2", "args0": [{ "type": "input_value", "name": "A", "check": "Number" }, { "type": "input_value", "name": "B", "check": "Number" }], "inputsInline": true, "output": "Number", "colour": "#59c059", "tooltip": "Subtraction" },
    { "type": "o_mul", "message0": "%1 * %2", "args0": [{ "type": "input_value", "name": "A", "check": "Number" }, { "type": "input_value", "name": "B", "check": "Number" }], "inputsInline": true, "output": "Number", "colour": "#59c059", "tooltip": "Multiplication" },
    { "type": "o_div", "message0": "%1 / %2", "args0": [{ "type": "input_value", "name": "A", "check": "Number" }, { "type": "input_value", "name": "B", "check": "Number" }], "inputsInline": true, "output": "Number", "colour": "#59c059", "tooltip": "Division" },
    { "type": "o_abs", "message0": "abs %1", "args0": [{ "type": "input_value", "name": "N", "check": "Number" }], "inputsInline": true, "output": "Number", "colour": "#59c059", "tooltip": "Absolute value" },

    // Arrays
    { "type": "array_create_1d", "message0": "create 1D array [ %1 ]", "args0": [{ "type": "input_value", "name": "ITEMS" }], "inputsInline": true, "output": "Array", "colour": "#059862", "tooltip": "Create 1D list" },
    { "type": "array_create_rectangular", "message0": "create rectangular array [ %1 ]", "args0": [{ "type": "input_value", "name": "ROWS", "check": "Array" }], "inputsInline": true, "output": "Array", "colour": "#059862", "tooltip": "Create 2D list" },
    { "type": "array_get", "message0": "get item %1 of list %2", "args0": [{ "type": "input_value", "name": "INDEX", "check": "Number" }, { "type": "input_value", "name": "LIST", "check": "Array" }], "inputsInline": true, "output": null, "colour": "#059862", "tooltip": "Get item from array" },

    // Logic
    { "type": "l_and", "message0": "%1 and %2", "args0": [{ "type": "input_value", "name": "A", "check": "Boolean" }, { "type": "input_value", "name": "B", "check": "Boolean" }], "inputsInline": true, "output": "Boolean", "colour": "#0fbd8c", "tooltip": "Logical AND" },
    { "type": "l_equals", "message0": "%1 = %2", "args0": [{ "type": "input_value", "name": "A" }, { "type": "input_value", "name": "B" }], "inputsInline": true, "output": "Boolean", "colour": "#0fbd8c", "tooltip": "Equality check" }
];

Blockly.defineBlocksWithJsonArray(blocks);


// ==========================================
// 4. JSON TOOLBOX CONFIGURATION
// ==========================================
const toolboxJson = {
    "kind": "categoryToolbox",
    "contents": [
        {
            "kind": "category",
            "name": "Events",
            "colour": "#ffbf00",
            "contents": [
                { "kind": "block", "type": "event_any_time" },
                { "kind": "block", "type": "event_start" },
                { "kind": "block", "type": "event_clicked" },
                { "kind": "block", "type": "event_turn" },
                { "kind": "block", "type": "event_turn_ended" }
            ]
        },
        {
            "kind": "category",
            "name": "Get",
            "colour": "#9966ff",
            "contents": [
                { "kind": "block", "type": "g_move" },
                { "kind": "block", "type": "g_board" },
                { "kind": "block", "type": "g_col" },
                { "kind": "block", "type": "g_cols" },
                { "kind": "block", "type": "g_dim" }
            ]
        },
        {
            "kind": "category",
            "name": "Actions",
            "colour": "#ed4242",
            "contents": [
                { "kind": "block", "type": "a_win" },
                { "kind": "block", "type": "a_lose" },
                { "kind": "block", "type": "a_turn" },
                { "kind": "block", "type": "a_replace" },
                { "kind": "block", "type": "a_delete" }
            ]
        },
        {
            "kind": "category",
            "name": "Operators",
            "colour": "#59c059",
            "contents": [
                { "kind": "block", "type": "o_add" },
                { "kind": "block", "type": "o_sub" },
                { "kind": "block", "type": "o_mul" },
                { "kind": "block", "type": "o_div" },
                { "kind": "block", "type": "o_abs" }
            ]
        },
        {
            "kind": "category",
            "name": "Arrays",
            "colour": "#059862",
            "contents": [
                { "kind": "block", "type": "array_create_1d" },
                { "kind": "block", "type": "array_create_rectangular" },
                { "kind": "block", "type": "array_get" }
            ]
        },
        {
            "kind": "category",
            "name": "Logic",
            "colour": "#0fbd8c",
            "contents": [
                { "kind": "block", "type": "l_and" },
                { "kind": "block", "type": "l_equals" }
            ]
        }
    ]
};


// ==========================================
// 5. WORKSPACE INITIALIZATION
// ==========================================
window.blocklyWorkspace = null;

window.initBlockly = function() {
    if (window.blocklyWorkspace) {
        Blockly.svgResize(window.blocklyWorkspace);
        return;
    }

    const blocklyDiv = document.getElementById('blocklyDiv');
    if (!blocklyDiv) return;

    window.blocklyWorkspace = Blockly.inject('blocklyDiv', {
        toolbox: toolboxJson,
        renderer: 'zelos_rect',
        theme: customTheme,
        grid: {
            spacing: 40,
            length: 3,
            colour: '#444',
            snap: true
        },
        zoom: {
            controls: true,
            wheel: true
        }
    });
};