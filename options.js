// Default API URL
const DEFAULT_API_BASE = "https://prod-elneunie-fantasybaseballleaguestats.s3.us-east-2.amazonaws.com/CPL-current.json";

// DOM elements
const apiBaseInput = document.getElementById('apiBase');
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
    chrome.storage.sync.get(['apiBase'], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Error loading settings:', chrome.runtime.lastError);
            showStatus('Error loading settings', 'error');
            apiBaseInput.value = DEFAULT_API_BASE;
        } else {
            apiBaseInput.value = result.apiBase || DEFAULT_API_BASE;
            console.log('Settings loaded:', result.apiBase || DEFAULT_API_BASE);
        }
    });
}

function validateAndSaveSettings() {
    const apiBase = apiBaseInput.value.trim();

    if (!apiBase) {
        showStatus('Please enter a valid URL', 'error');
        return;
    }

    if (!isValidUrl(apiBase)) {
        showStatus('Please enter a valid URL (must start with http:// or https://)', 'error');
        return;
    }

    // Test the URL accessibility
    saveButton.disabled = true;
    saveButton.textContent = 'Testing URL...';
    
    fetch(apiBase, { method: 'HEAD' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return performSave(apiBase);
        })
        .catch(err => {
            // Try a GET request as fallback (HEAD might not be allowed)
            return fetch(apiBase)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return performSave(apiBase);
                })
                .catch(innerErr => {
                    console.error('Error validating URL:', innerErr);
                    showStatus(`URL is not accessible: ${innerErr.message}`, 'error');
                    saveButton.disabled = false;
                    saveButton.textContent = 'Save Settings';
                });
        });
}

function performSave(apiBase) {
    console.log('Saving settings:', apiBase);
    chrome.storage.sync.set({ apiBase: apiBase }, () => {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Settings';
        
        if (chrome.runtime.lastError) {
            console.error('Error saving settings:', chrome.runtime.lastError);
            showStatus('Error saving settings', 'error');
        } else {
            console.log('Settings saved successfully');
            showStatus('✓ Settings saved successfully! URL is accessible and will be used on next run.', 'success');
        }
    });
    return Promise.resolve();
}

function resetSettings() {
    console.log('Resetting to default settings');
    apiBaseInput.value = DEFAULT_API_BASE;
    chrome.storage.sync.set({ apiBase: DEFAULT_API_BASE }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error resetting settings:', chrome.runtime.lastError);
            showStatus('Error resetting settings', 'error');
        } else {
            console.log('Settings reset to default');
            showStatus('Settings reset to default: ' + DEFAULT_API_BASE, 'success');
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
