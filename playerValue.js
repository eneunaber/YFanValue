var playersMap = {};


getPlayerValues().then(playerValues => {
    console.log("Finished retrieving player records")
    if (playerValues.error) {
        console.error('Failed to fetch player data:', playerValues.error);
        return;
    }
    try {
        playersMap = JSON.parse(playerValues.PlayerValues);
        console.log('loading ' + Object.keys(playersMap).length + ' records')
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
        var playersTable = document.getElementById("players-table-wrapper")
        if (playersTable) {
            let options = {
                childList: true,
            };
            observer = new MutationObserver(showValues);
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
        console.log('show player values')
        var playerMatch = /.*sports\.yahoo\.com\/mlb\/players\/(\d{4,5})$/
        var tags = document.getElementsByTagName("a")
        var matches = 0;
        for (var i = 0; i < tags.length; i++) {
            try {
                var isPlayer = tags[i].href.match(playerMatch)
                if (isPlayer) {
                    matches++;
                    let playerID = isPlayer[1]
                    console.log("playerID:" + playerID)
                    if (playersMap[playerID] != null) {
                        var dollarValue = playersMap[playerID];
                        if (tags[i].innerHTML.indexOf(dollarValue) < 0) {
                            console.log("playerID:" + playerID + "||" + dollarValue)
                            tags[i].innerHTML = tags[i].innerHTML + " [" + dollarValue + "]"
                        } else {
                            console.log("value exists for player:" + playerID);
                        }
                    } else {
                        console.log("playerID: " + playerID + " Not found")
                    }
                }
            } catch (err) {
                console.error('Error processing player link element:', err);
            }
        }
        console.log("player url matches found: " + matches)
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