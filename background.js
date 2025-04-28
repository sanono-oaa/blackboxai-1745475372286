// State management
let botState = {
    isRunning: false,
    isLoggedIn: false,
    currentUser: null,
    settings: null
};

// Load stored state
chrome.storage.local.get(['botState'], (result) => {
    if (result.botState) {
        botState = { ...botState, ...result.botState };
    }
});

// Save state helper
const saveState = () => {
    chrome.storage.local.set({ botState });
};

// Message handling from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'login':
            handleLogin(message.data, sendResponse);
            return true; // Keep channel open for async response

        case 'startBot':
            handleBotStart(sendResponse);
            return true;

        case 'stopBot':
            handleBotStop(sendResponse);
            return true;

        case 'getStatus':
            sendResponse({
                isRunning: botState.isRunning,
                isLoggedIn: botState.isLoggedIn
            });
            return false;

        case 'openSettings':
            handleOpenSettings(sendResponse);
            return false;

        case 'updateSettings':
            handleUpdateSettings(message.data, sendResponse);
            return true;
    }
});

// Login handler
async function handleLogin(credentials, sendResponse) {
    try {
        // Validate credentials
        if (!credentials.username || !credentials.password) {
            throw new Error('Invalid credentials');
        }

        // Store credentials securely
        await chrome.storage.local.set({
            credentials: {
                username: credentials.username,
                // In a production environment, implement proper encryption
                password: btoa(credentials.password)
            }
        });

        botState.isLoggedIn = true;
        botState.currentUser = credentials.username;
        saveState();

        sendResponse({ success: true });

        // Notify all tabs
        broadcastStatus('Login successful', 'success');
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// Bot start handler
async function handleBotStart(sendResponse) {
    try {
        if (!botState.isLoggedIn) {
            throw new Error('Not logged in');
        }

        // Get active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            throw new Error('No active tab found');
        }

        // Inject content script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        botState.isRunning = true;
        saveState();

        sendResponse({ success: true });
        broadcastStatus('Bot started successfully', 'success');
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// Bot stop handler
async function handleBotStop(sendResponse) {
    try {
        botState.isRunning = false;
        saveState();

        // Notify content scripts to stop operations
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            await chrome.tabs.sendMessage(tab.id, { action: 'stopBot' });
        }

        sendResponse({ success: true });
        broadcastStatus('Bot stopped', 'info');
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// Settings handlers
function handleOpenSettings(sendResponse) {
    chrome.tabs.create({
        url: 'settings.html'
    });
    sendResponse({ success: true });
}

async function handleUpdateSettings(settings, sendResponse) {
    try {
        botState.settings = settings;
        saveState();
        sendResponse({ success: true });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// Helper function to broadcast status to all extension views
async function broadcastStatus(message, status = 'info') {
    const msg = {
        type: 'statusUpdate',
        message,
        status
    };

    // Send to popup if open
    chrome.runtime.sendMessage(msg).catch(() => {
        // Popup might be closed, ignore error
    });

    // Send to all content scripts
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {
            // Content script might not be injected, ignore error
        });
    });
}

// Listen for tab updates to inject content script when necessary
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && botState.isRunning) {
        chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
        }).catch(() => {
            // Ignore injection errors (e.g., chrome:// URLs)
        });
    }
});
