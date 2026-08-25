const SUPABASE_URL = "https://ghlvnloxqiocndjhvdfz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobHZubG94cWlvY25kamh2ZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDg2ODYsImV4cCI6MjA5OTUyNDY4Nn0.zNCZRASkd5dzSGnt9J4E_iJf2oF8tpXWbAnMnFPSRjk";

const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
};

let currentGameId = null;

// 1. CREATE a new game
export async function createGame(initialPgn, isPublic = true) {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/games?select=*`,
        {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                pgn: initialPgn,
                is_public: isPublic,
                status: 'playing'  // ✅ Set status so it shows in list
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        alert(`Create error: ${response.status} - ${errorText}`);
        return null;
    }

    const text = await response.text();
    if (!text) {
        alert('Create error: Empty response');
        return null;
    }

    try {
        const data = JSON.parse(text);
        const game = data[0];
        if (game && game.id) {
            currentGameId = game.id;
            alert(`✅ Game #${game.id} created!`);
            return game.id;
        }
        alert('Create error: No game data returned');
        return null;
    } catch {
        alert('Create error: Invalid response');
        return null;
    }
}

// 2. JOIN an existing game
export async function joinGame(gameId) {
    const numId = Number(gameId);
    if (isNaN(numId)) {
        alert("Enter a valid game number.");
        return;
    }

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/games?id=eq.${numId}&select=pgn,is_public`,
        {
            headers: headers
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        alert(`Join error: ${response.status} - ${errorText}`);
        return;
    }

    const data = await response.json();
    if (!data || data.length === 0) {
        alert(`❌ Game #${numId} not found`);
        return;
    }

    const game = data[0];

    if (!game.is_public) {
        if (!confirm(`🔒 This is a PRIVATE game. Do you have permission to join?`)) {
            return;
        }
    }

    currentGameId = numId;
    alert(`✅ Joined Game #${numId}`);
    window.initializeBoard(game.pgn);
}

// 3. LIST public games
export async function listPublicGames() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/games?is_public=eq.true&status=eq.playing&select=id&order=id.desc&limit=20`,
            { headers: headers }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`List error: ${response.status} - ${errorText}`);
            return [];
        }

        const text = await response.text();
        if (!text) {
            console.log('📭 No public games found (empty response)');
            return [];
        }

        const data = JSON.parse(text);
        return data || [];
    } catch (err) {
        console.error('List error:', err);
        return [];
    }
}

// 4. SEND a move
export async function sendMove(newPgn) {
    if (!currentGameId) {
        console.warn("No active game to send move to.");
        return;
    }

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/games?id=eq.${currentGameId}`,
        {
            method: 'PATCH',
            headers: headers,
            body: JSON.stringify({ pgn: newPgn })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Send move error: ${response.status} - ${errorText}`);
    }
}

// 5. POLL for moves (simple real-time fallback)
let pollInterval = null;

function startPolling(gameId) {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    
    let lastPgn = '';

    pollInterval = setInterval(async () => {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/games?id=eq.${gameId}&select=pgn`,
                { headers: headers }
            );

            if (!response.ok) return;

            const data = await response.json();
            if (!data || data.length === 0) return;

            const currentPgn = data[0].pgn;
            if (currentPgn !== lastPgn && currentPgn) {
                lastPgn = currentPgn;
                console.log(`📡 Move received in Game #${gameId}`);
                window.initializeBoard(currentPgn);
            }
        } catch (err) {
            // silent fail for polling
        }
    }, 1500); // Check every 1.5 seconds
}

// Export a function to start polling when joining/creating
export function startListening(gameId) {
    currentGameId = gameId;
    startPolling(gameId);
}

// Optionally, stop polling
export function stopListening() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
}