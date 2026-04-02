// Default API URLs
const DEFAULT_DRAFT_URL = "https://prod-elneunie-fantasybaseballleaguestats.s3.us-east-2.amazonaws.com/CPL-current.json";
const DEFAULT_CURRENT_URL = "https://prod-elneunie-fantasybaseballleaguestats.s3.us-east-2.amazonaws.com/CPL-current.json";

// DOM elements
const draftValueInput = document.getElementById('draftValueUrl');
const currentValueInput = document.getElementById('currentValueUrl');
const saveButton = document.getElementById('save');
const resetButton = document.getElementById('reset');
const statusDiv = document.getElementById('status');

// Load settings when page loads
document.addEventListener('DOMContentLoaded', loadSettings);

// Save button click handler
saveButton.addEventListener('click', validateAndSaveSettings);

// Reset button click handler
resetButton.addEventListener('click', resetSettings);

function loadSettings() {
    console.log('Loading settings...');
    
    // Validate that defaults are not empty
    if (!DEFAULT_DRAFT_URL || !DEFAULT_CURRENT_URL) {
        console.error('Error: Default URLs are empty!');
        showStatus('Error: Default configuration is missing. Please check the extension code.', 'error');
        return;
    }
    
    chrome.storage.sync.get(['draftValueUrl', 'currentValueUrl'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error loading settings:', chrome.runtime.lastError);
            showStatus('Error loading settings', 'error');
            draftValueInput.value = DEFAULT_DRAFT_URL;
            currentValueInput.value = DEFAULT_CURRENT_URL;
        } else {
            const draftUrl = result.draftValueUrl || DEFAULT_DRAFT_URL;
            const currentUrl = result.currentValueUrl || DEFAULT_CURRENT_URL;
            
            // Validate loaded settings are not empty
            if (!draftUrl || !currentUrl) {
                console.warn('Loaded settings are empty, using defaults');
                draftValueInput.value = DEFAULT_DRAFT_URL;
                currentValueInput.value = DEFAULT_CURRENT_URL;
            } else {
                draftValueInput.value = draftUrl;
                currentValueInput.value = currentUrl;
                console.log('Settings loaded successfully:', draftUrl, currentUrl);
            }
        }
    });
}

function validateAndSaveSettings() {
    const draftUrl = draftValueInput.value.trim();
    const currentUrl = currentValueInput.value.trim();

    if (!draftUrl || !currentUrl) {
        showStatus('Please enter valid URLs for both draft and current values', 'error');
        return;
    }

    if (!isValidUrl(draftUrl) || !isValidUrl(currentUrl)) {
        showStatus('Please enter valid URLs (must start with http:// or https://)', 'error');
        return;
    }

    // Test both URLs accessibility
    saveButton.disabled = true;
    saveButton.textContent = 'Testing URLs...';
    
    Promise.all([
        testUrl(draftUrl),
        testUrl(currentUrl)
    ]).then(() => {
        performSave(draftUrl, currentUrl);
    }).catch(err => {
        console.error('Error validating URLs:', err);
        showStatus(`URL validation failed: ${err.message}`, 'error');
        saveButton.disabled = false;
        saveButton.textContent = 'Save Settings';
    });
}

function testUrl(url) {
    return fetch(url, { method: 'HEAD' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} for ${url}`);
            }
            return response;
        })
        .catch(err => {
            // Try GET request as fallback
            return fetch(url).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} for ${url}`);
                }
                return response;
            });
        });
}

function performSave(draftUrl, currentUrl) {
    console.log('Saving settings:', draftUrl, currentUrl);
    chrome.storage.sync.set({ 
        draftValueUrl: draftUrl,
        currentValueUrl: currentUrl 
    }, () => {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Settings';
        
        if (chrome.runtime.lastError) {
            console.error('Error saving settings:', chrome.runtime.lastError);
            showStatus('Error saving settings', 'error');
        } else {
            console.log('Settings saved successfully');
            showStatus('✓ Settings saved successfully! URLs are accessible and will be used on next run.', 'success');
        }
    });
}

function resetSettings() {
    console.log('Resetting to default settings');
    draftValueInput.value = DEFAULT_DRAFT_URL;
    currentValueInput.value = DEFAULT_CURRENT_URL;
    chrome.storage.sync.set({ 
        draftValueUrl: DEFAULT_DRAFT_URL,
        currentValueUrl: DEFAULT_CURRENT_URL 
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error resetting settings:', chrome.runtime.lastError);
            showStatus('Error resetting settings', 'error');
        } else {
            console.log('Settings reset to default');
            showStatus('Settings reset to default: ' + DEFAULT_DRAFT_URL + ' and ' + DEFAULT_CURRENT_URL, 'success');
        }
    });
}

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusDiv.className = 'status';
        }, 3000);
    }
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}
