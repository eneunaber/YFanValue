// Default API URLs
const DEFAULT_DRAFT_URL = "https://prod-elneunie-fantasybaseballleaguestats.s3.us-east-2.amazonaws.com/CPL-current.json";
const DEFAULT_CURRENT_URL = "https://prod-elneunie-fantasybaseballleaguestats.s3.us-east-2.amazonaws.com/CPL-current.json";
let draftValueUrl = DEFAULT_DRAFT_URL;
let currentValueUrl = DEFAULT_CURRENT_URL;

// Initialize: Load API URLs from storage first
chrome.storage.sync.get(['draftValueUrl', 'currentValueUrl'], (result) => {
    if (chrome.runtime.lastError) {
        console.error('Error loading API URLs from storage:', chrome.runtime.lastError);
        draftValueUrl = DEFAULT_DRAFT_URL;
        currentValueUrl = DEFAULT_CURRENT_URL;
    } else {
        draftValueUrl = result.draftValueUrl || DEFAULT_DRAFT_URL;
        currentValueUrl = result.currentValueUrl || DEFAULT_CURRENT_URL;
        console.log('API URLs loaded:', draftValueUrl, currentValueUrl);
    }
    console.log('<<< Extension initialized >>>');
});

// Setup message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.data) {
        case 'fetchPlayerData':
            console.log('Fetching player data from:', draftValueUrl, currentValueUrl);
            
            // Fetch both draft and current values
            Promise.all([
                fetch(draftValueUrl).then(response => {
                    if (!response.ok) {
                        throw new Error(`Draft URL HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                }),
                fetch(currentValueUrl).then(response => {
                    if (!response.ok) {
                        throw new Error(`Current URL HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
            ])
            .then(([draftPlayers, currentPlayers]) => {
                const draftMap = buildPlayersHash(draftPlayers, 'draft');
                const currentMap = buildPlayersHash(currentPlayers, 'current');
                return SavePlayerData(draftMap, currentMap);
            })
            .then(savedPlayerValues => sendResponse(savedPlayerValues))
            .catch(error => {
                console.error('<<< Error fetching/processing player data >>>', error);
                sendResponse({ error: error.message });
            })
            return true
    }
});

function buildPlayersHash(players, type) {
    console.log('<<< begin buildPlayersHash for', type, '>>>')
    
    // Validate input
    if (!Array.isArray(players)) {
        throw new Error(`Expected ${type} players to be an array`);
    }
    
    if (players.length === 0) {
        console.warn(`${type} player data is empty`);
    }
    
    var playerMap = {};
    players.forEach(function (player) {
        // Validate player has required fields
        if (!player.YAHOOID || player.Dollars === undefined || player.Dollars === null) {
            console.warn(`Skipping ${type} player with missing YAHOOID or Dollars value:`, player);
            return;
        }
        
        let dollarValue = 0;
        const dollars = Number(player.Dollars);
        
        if (isNaN(dollars)) {
            console.warn(`Invalid Dollars value for ${type} player:`, player.YAHOOID, player.Dollars);
            return;
        }

        if (dollars > 0) {
            dollarValue = "$" + dollars.toFixed(0);
        } else if (dollars < 0) {
            dollarValue = "-$" + Math.abs(dollars).toFixed(0);
        } else {
            dollarValue = "$0";
        }
        
        playerMap[player.YAHOOID] = dollarValue;
    });

    console.log('<<< end buildPlayersHash for', type, '- Processed', Object.keys(playerMap).length, 'players >>>')
    return playerMap
}


function SavePlayerData(draftMap, currentMap) {
    console.log('<<< begin SavePlayerData >>>')
    console.log('saving ' + Object.keys(draftMap).length + ' draft records and ' + Object.keys(currentMap).length + ' current records')
    let playerValuesTemplate = { 
        DraftValues: JSON.stringify(draftMap),
        CurrentValues: JSON.stringify(currentMap)
    }
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

