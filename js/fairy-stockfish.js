import Module from '../libs/ffish/ffish.js';

let ffishInstance = null;

export async function initEngine() {
    if (ffishInstance) return ffishInstance;
    
    try {
        const loadedModule = await Module({
            locateFile: (path) => {
                if (path.endsWith('.wasm')) {
                    return './libs/ffish/ffish.wasm';
                }
                return path;
            }
        });
        
        ffishInstance = loadedModule;
        console.log("Fairy Stockfish WASM Engine loaded successfully");
        return ffishInstance;
    } catch (error) {
        console.error("Failed to load Fairy Stockfish:", error);
        throw error;
    }
}