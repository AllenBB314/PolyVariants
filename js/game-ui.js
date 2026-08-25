import { createGame, joinGame, listPublicGames, startListening } from './online.js';

let isPublicGame = true;

const TIME_PRESETS = [
    { label: '1+0',    initTime: 60,   type: 'increment', typeTime: 0 },
    { label: '3+0',    initTime: 180,  type: 'increment', typeTime: 0 },
    { label: '5+3',    initTime: 300,  type: 'increment', typeTime: 3 },
    { label: '10+0',   initTime: 600,  type: 'increment', typeTime: 0 },
    { label: '30+0',   initTime: 1800, type: 'increment', typeTime: 0 },
];

let isOpen = false;

function getTimeDisplay(initTime, type, typeTime) {
    const mins = Math.floor(initTime / 60);
    if (type === 'increment' && typeTime > 0) return `${mins}+${typeTime}`;
    if (type === 'delay' && typeTime > 0) return `${mins}|${typeTime}`;
    return `${mins}+0`;
}

function getTimeFromInputs() {
    const mins = parseInt(document.getElementById('custom-minutes')?.value) || 0;
    const secs = parseInt(document.getElementById('custom-seconds')?.value) || 0;
    const type = document.getElementById('time-type')?.value || 'increment';
    const bonus = parseInt(document.getElementById('custom-bonus')?.value) || 0;
    return { totalSeconds: (mins * 60) + secs, type, bonus };
}

function updateAll() {
    const type = document.getElementById('time-type').value;
    document.getElementById('bonus-label').textContent =
        type === 'increment' ? 'Inc' : type === 'delay' ? 'Delay' : 'Bonus';

    const { totalSeconds, type: t, bonus } = getTimeFromInputs();
    const display = getTimeDisplay(totalSeconds, t, bonus);
    document.getElementById('current-time-display').textContent = display;

    // Highlight matching preset
    document.querySelectorAll('.time-preset').forEach(btn => {
        const match = parseInt(btn.dataset.initTime) === totalSeconds &&
                      btn.dataset.type === t &&
                      parseInt(btn.dataset.typeTime) === bonus;
        btn.classList.toggle('active', match);
    });
}

function generateTimeControlUI() {
    const container = document.querySelector('.time-control');
    if (!container) return;
    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'time-header';
    header.id = 'time-header';

    const main = document.createElement('div');
    main.className = 'time-header-main';
    main.innerHTML = `
        <span class="current" id="current-time-display">3+0</span>
        <span class="arrow" id="time-arrow">▼</span>
    `;
    header.appendChild(main);

    const dropdown = document.createElement('div');
    dropdown.className = 'time-dropdown';
    dropdown.id = 'time-dropdown';

    // Presets
    const presetWrapper = document.createElement('div');
    presetWrapper.className = 'time-presets';
    TIME_PRESETS.forEach(preset => {
        const btn = document.createElement('button');
        btn.className = 'time-preset';
        btn.dataset.initTime = preset.initTime;
        btn.dataset.type = preset.type;
        btn.dataset.typeTime = preset.typeTime;
        btn.textContent = preset.label;
        presetWrapper.appendChild(btn);
    });
    dropdown.appendChild(presetWrapper);

    // Custom inputs
    const customWrapper = document.createElement('div');
    customWrapper.className = 'custom-time';
    customWrapper.innerHTML = `
        <div class="custom-time-row">
            <div class="custom-time-group">
                <label>Type</label>
                <select id="time-type">
                    <option value="increment">Increment</option>
                    <option value="delay">Delay</option>
                    <option value="none">None</option>
                </select>
            </div>
            <div class="custom-time-group">
                <label>Min</label>
                <input type="number" id="custom-minutes" value="3" min="0" step="1">
            </div>
            <div class="custom-time-group">
                <label>Sec</label>
                <input type="number" id="custom-seconds" value="0" min="0" step="1">
            </div>
            <div class="custom-time-group">
                <label id="bonus-label">Inc</label>
                <input type="number" id="custom-bonus" value="0" min="0" step="1">
            </div>
        </div>
    `;
    dropdown.appendChild(customWrapper);

    header.appendChild(dropdown);
    container.appendChild(header);

    header.addEventListener('click', (e) => {
        if (e.target.closest('.time-preset') || e.target.closest('select') || e.target.closest('input')) {
            return;
        }
        const isOpen = header.classList.toggle('open');
        document.getElementById('time-arrow').classList.toggle('open', isOpen);
    });

    document.querySelectorAll('.time-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('custom-minutes').value = Math.floor(parseInt(btn.dataset.initTime) / 60);
            document.getElementById('custom-seconds').value = parseInt(btn.dataset.initTime) % 60;
            document.getElementById('time-type').value = btn.dataset.type;
            document.getElementById('custom-bonus').value = btn.dataset.typeTime;
            updateAll();

            header.classList.remove('open');
            document.getElementById('time-arrow').classList.remove('open');
        });
    });

    document.getElementById('time-type').addEventListener('change', updateAll);
    ['custom-minutes', 'custom-seconds', 'custom-bonus'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateAll);
    });

    const defaultPreset = TIME_PRESETS.find(p => p.label === '3+0');
    if (defaultPreset) {
        document.getElementById('custom-minutes').value = Math.floor(defaultPreset.initTime / 60);
        document.getElementById('custom-seconds').value = defaultPreset.initTime % 60;
        document.getElementById('time-type').value = defaultPreset.type;
        document.getElementById('custom-bonus').value = defaultPreset.typeTime;
        updateAll();
        document.querySelectorAll('.time-preset').forEach(b => {
            if (parseInt(b.dataset.initTime) === defaultPreset.initTime) {
                b.classList.add('active');
            }
        });
    }
}

function getTimeControlString() {
    const { totalSeconds, type, bonus } = getTimeFromInputs();
    if (type === 'increment') return `${totalSeconds}+${bonus}`;
    if (type === 'delay') return `${totalSeconds}|${bonus}`;
    return `${totalSeconds}+0`;
}

// #region (Exported) Game Settings Functions
export function toggleVisibility() {
    isPublicGame = !isPublicGame;
    const btn = document.getElementById('toggle-visibility');
    btn.textContent = isPublicGame ? 'Public' : 'Private';
    btn.style.backgroundColor = isPublicGame ? '#f96800' : '#555555';
    btn.style.boxShadow = isPublicGame ? 'inset 0 -5px 0 0 #b74c00' : 'inset 0 -5px 0 0 #404040';
}

export async function startGame() {
    const pgn = window.currentVariantPGN;
    const timeControl = getTimeControlString();
    console.log(`⏱ Time control: ${timeControl}`);
    
    const gameId = await createGame(pgn, isPublicGame);
    
    if (gameId) {
        alert(`Game #${gameId} created`);
        startListening(gameId);
    }
}

export async function joinGameByNumber() {
    const gameId = prompt("Enter the Game Number:");
    if (gameId) {
        await joinGame(gameId);
    }
}

export async function showLobby() {
    const games = await listPublicGames();
    
    if (games.length === 0) {
        alert("No public games available");
        return;
    }
    
    let message = "Public Games:\n\n";
    games.forEach((game, index) => {
        message += `${index + 1}. Game #${game.id} (${game.status || 'playing'})\n`;
    });
    message += "\nEnter a game number to join:";
    
    const gameId = prompt(message);
    if (gameId) {
        await joinGame(gameId);
    }
}

export function setupGameUI() {
    document.getElementById('toggle-visibility').addEventListener('click', toggleVisibility);
    document.getElementById('start-game-btn').addEventListener('click', startGame);

    generateTimeControlUI();
}
// #endregion

document.addEventListener('DOMContentLoaded', setupGameUI);