// Debug System
const Debugger = {
    logs: [],
    
    // Log a normal system event
    log(message) {
        const entry = `[LOG] ${new Date().toLocaleTimeString()}: ${message}`;
        this.logs.push(entry);
        console.log(entry); // Still copies to standard console if available
    },
    
    // Log a critical error
    error(message, errorObject = null) {
        let details = message;
        if (errorObject) {
            details += ` | Error: ${errorObject.message} (Line: ${errorObject.line || 'Unknown'})`;
        }
        const entry = `[ERROR] ${new Date().toLocaleTimeString()}: ${details}`;
        this.logs.push(entry);
        console.error(entry);
    },
    
    // Output everything compiled so far as a single readable block
    getReport() {
        return this.logs.length > 0 
            ? this.logs.join("\n") 
            : "No debug logs recorded yet.";
    },

    // Trigger a popup view of the logs
    showReport() {
        alert("Debugger:\n\n" + this.getReport());
    }
};

// Catch any completely unhandled runtime errors automatically
window.onerror = function(message, source, lineno, colno, error) {
    Debugger.error(`Unhandled Global Error: ${message} at ${source}:${lineno}:${colno}`);
    return false; // Let the browser handle it as normal too
};

// Attach it to the window frame so all files can access it instantly
window.Debugger = Debugger;

// Show debug when hitting PV in morse code
const PV_SECRET_PATTERN = ["s", "l", "l", "s", "s", "s", "s", "l"]; // P (·--·) and V (···-)
let userTapSequence = [];
let lastTapTime = 0;
let tapTimeoutToken = null;

document.body.addEventListener("touchstart", (e) => {
    // Record the time when the user clicks
    lastTapTime = Date.now();
});

document.body.addEventListener("touchend", (e) => {
    const holdDuration = Date.now() - lastTapTime;
    
    // Short/Long (>220ms)?
    const currentInput = holdDuration > 220 ? "l" : "s";
    userTapSequence.push(currentInput);
    
    // Reset if user stops for 2.5s
    clearTimeout(tapTimeoutToken);
    tapTimeoutToken = setTimeout(() => {
        userTapSequence = [];
    }, 2500);
    
    // Check if the inputs match the pattern length
    if (userTapSequence.length > PV_SECRET_PATTERN.length) {
        userTapSequence.shift(); // Keep moving window matching active sequence
    }
    
    // Check if input array matches code exactly
    const codeMatches = userTapSequence.every((val, index) => val === PV_SECRET_PATTERN[index]);
    
    if (userTapSequence.length === PV_SECRET_PATTERN.length && codeMatches) {
        userTapSequence = []; // Clear
        if (window.Debugger) {
            window.Debugger.showReport();
        }
    }
}, { passive: true });