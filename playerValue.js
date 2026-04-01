var playersMap = {};
var observer = null;
let debounceTimer = null;
const DEBOUNCE_DELAY = 500; // milliseconds

getPlayerValues().then(playerValues => {
    console.log("Finished retrieving player records")
    if (playerValues.error) {
        console.error('Failed to fetch player data:', playerValues.error);
        return;
    }
    try {
        playersMap = JSON.parse(playerValues.PlayerValues);
        const recordCount = Object.keys(playersMap).length;
        if (recordCount === 0) {
            console.warn('No player data loaded - player map is empty');
        } else {
            console.log('Loaded ' + recordCount + ' player records');
        }
        attachPagingEvents()
        showValues()
    } catch (err) {
        console.error('Error parsing player data:', err);
    }
}).catch(error => {
    console.error('Failed to retrieve player values:', error);
})

function attachPagingEvents() {
    try {
        // Clean up existing observer if any
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        
        var playersTable = document.getElementById("players-table-wrapper")
        if (playersTable) {
            let options = {
                childList: true,
                subtree: true,
            };
            // Debounce showValues to avoid too many rapid calls
            observer = new MutationObserver(() => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(showValues, DEBOUNCE_DELAY);
            });
            observer.observe(playersTable, options);
            console.log('Paging events attached successfully');
        } else {
            console.warn('Players table wrapper not found on page');
        }
    } catch (err) {
        console.error('Error attaching paging events:', err);
    }
}

function showValues() {
    try {
        // Skip if player data not loaded
        if (Object.keys(playersMap).length === 0) {
            console.debug('Skipping showValues - no player data loaded');
            return;
        }
        
        var playerMatch = /.*sports\.yahoo\.com\/mlb\/players\/(\d{4,5})$/
        var tags = document.getElementsByTagName("a")
        var matches = 0;
        var updated = 0;
        
        for (var i = 0; i < tags.length; i++) {
            try {
                var isPlayer = tags[i].href.match(playerMatch)
                if (isPlayer) {
                    matches++;
                    let playerID = isPlayer[1]
                    
                    if (playersMap[playerID] != null) {
                        var dollarValue = playersMap[playerID];
                        // Use textContent for safety, check if value already exists
                        if (!tags[i].textContent.includes(dollarValue)) {
                            // Append the value using safer DOM method
                            const spanElem = document.createElement('span');
                            spanElem.textContent = ` [${dollarValue}]`;
                            spanElem.className = 'player-value';
                            tags[i].appendChild(spanElem);
                            updated++;
                        }
                    }
                }
            } catch (err) {
                console.error('Error processing player link element:', err);
            }
        }
        if (matches > 0) {
            console.debug(`Found ${matches} player links, updated ${updated}`);
        }
    } catch (err) {
        console.error('Error in showValues:', err);
    }
}

function getPlayerValues() {
    console.log("#### getPlayerValues...")
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ data: 'fetchPlayerData' }, response => {
            if (!chrome.runtime.lastError) {
                resolve(response)
            } else {
                console.error('Runtime error in getPlayerValues:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
            }
        })
    })
}


if (typeof module !== 'undefined') {
    module.exports = showValues;
}