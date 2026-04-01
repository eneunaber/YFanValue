// Default API URL
const DEFAULT_API_BASE = "https://prod-elneunie-fantasybaseballleaguestats.s3.us-east-2.amazonaws.com/CPL-current.json";
let apiBase = DEFAULT_API_BASE;

// Initialize: Load API URL from storage first
chrome.storage.sync.get(['apiBase'], (result) => {
    if (chrome.runtime.lastError) {
        console.error('Error loading API URL from storage:', chrome.runtime.lastError);
        apiBase = DEFAULT_API_BASE;
    } else {
        apiBase = result.apiBase || DEFAULT_API_BASE;
        console.log('API Base URL loaded:', apiBase);
    }
    console.log('<<< Extension initialized >>>');
});

// Setup message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.data) {
        case 'fetchPlayerData':
            console.log('Fetching player data from:', apiBase);
            fetch(apiBase)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(players => buildPlayersHash(players))
                .then(playerMap => SavePlayerData(playerMap))
                .then(savedPlayerValues => sendResponse(savedPlayerValues))
                .catch(error => {
                    console.error('<<< Error fetching/processing player data >>>', error);
                    sendResponse({ error: error.message });
                })
            return true
    }
});

function buildPlayersHash(players) {
    console.log('<<< begin buildPlayersHash >>>')
    
    // Validate input
    if (!Array.isArray(players)) {
        throw new Error('Expected players to be an array');
    }
    
    if (players.length === 0) {
        console.warn('Player data is empty');
    }
    
    var playerMap = {};
    players.forEach(function (player) {
        // Validate player has required fields
        if (!player.YAHOOID || player.Adjusted === undefined || player.Adjusted === null) {
            console.warn('Skipping player with missing YAHOOID or Adjusted value:', player);
            return;
        }
        
        let dollarValue = 0;
        const adjusted = Number(player.Adjusted);
        
        if (isNaN(adjusted)) {
            console.warn('Invalid Adjusted value for player:', player.YAHOOID, player.Adjusted);
            return;
        }

        if (adjusted > 0) {
            dollarValue = "$" + adjusted.toFixed(0);
        } else if (adjusted < 0) {
            dollarValue = "-$" + Math.abs(adjusted).toFixed(0);
        } else {
            dollarValue = "$0";
        }
        
        playerMap[player.YAHOOID] = dollarValue;
    });

    console.log('<<< end buildPlayersHash - Processed', Object.keys(playerMap).length, 'players >>>')
    return playerMap
}


function SavePlayerData(playerMap) {
    console.log('<<< begin SavePlayerData >>>')
    console.log('saving ' + Object.keys(playerMap).length + ' records')
    let playerValuesTemplate = { PlayerValues: JSON.stringify(playerMap) }
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(playerValuesTemplate, function () {
            if (chrome.runtime.lastError) {
                console.error('<<< Error saving player data >>>', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            } else {
                console.log('Player Data was saved!')
                console.log('<<< end SavePlayerData >>>')
                resolve(playerValuesTemplate);
            }
        });
    })
}

