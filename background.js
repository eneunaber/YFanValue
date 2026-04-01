(async () => {
    console.log('<<< Do ITTTT >>>');
    var apiBase = "https://prod-elneunie-fantasybaseballleaguestats.s3.us-east-2.amazonaws.com/CPL-current.json";

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.data) {
            case 'fetchPlayerData':
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
    })
})()

function buildPlayersHash(players) {
    console.log('<<< begin buildPlayersHash >>>')
    var playerMap = {};
    players.forEach(function (player, i) {
        let dollarValue = 0;

        if (player.Adjusted > 0) {
            dollarValue = "$" + Number(player.Adjusted).toFixed(0)
        } else {
            dollarValue = "-$" + Math.abs(Number(player.Adjusted).toFixed(0))
        }
        playerMap[player.YAHOOID] = dollarValue
        // console.log('player:' + player.YAHOOID + " || " + dollarValue)
    });

    console.log('<<< end buildPlayersHash >>>')
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

