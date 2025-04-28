// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const settingsBtn = document.getElementById('settingsBtn');
const statusElement = document.getElementById('status');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// State management
let isRunning = false;
let isLoggedIn = false;

// Update status display
function updateStatus(message, type = 'info') {
    const iconClass = {
        'info': 'text-gray-400',
        'success': 'text-green-500',
        'error': 'text-red-500',
        'warning': 'text-yellow-500'
    }[type];

    statusElement.innerHTML = `
        <p class="flex items-center">
            <i class="fas fa-circle ${iconClass} mr-2"></i>
            ${message}
        </p>
    `;
}

// Handle login
loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        updateStatus('Please enter both username and password', 'error');
        return;
    }

    try {
        // Send login credentials to background script
        const response = await chrome.runtime.sendMessage({
            action: 'login',
            data: { username, password }
        });

        if (response.success) {
            isLoggedIn = true;
            updateStatus('Successfully logged in', 'success');
            // Enable bot controls
            startBtn.disabled = false;
            startBtn.classList.remove('opacity-50');
        } else {
            updateStatus('Login failed: ' + response.error, 'error');
        }
    } catch (error) {
        updateStatus('Login error: ' + error.message, 'error');
    }
});

// Handle bot start
startBtn.addEventListener('click', async () => {
    if (!isLoggedIn) {
        updateStatus('Please login first', 'warning');
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'startBot'
        });

        if (response.success) {
            isRunning = true;
            updateStatus('Bot is now running', 'success');
            startBtn.classList.add('opacity-50');
            startBtn.disabled = true;
            stopBtn.classList.remove('opacity-50');
            stopBtn.disabled = false;
        } else {
            updateStatus('Failed to start bot: ' + response.error, 'error');
        }
    } catch (error) {
        updateStatus('Error starting bot: ' + error.message, 'error');
    }
});

// Handle bot stop
stopBtn.addEventListener('click', async () => {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'stopBot'
        });

        if (response.success) {
            isRunning = false;
            updateStatus('Bot has been stopped', 'info');
            stopBtn.classList.add('opacity-50');
            stopBtn.disabled = true;
            startBtn.classList.remove('opacity-50');
            startBtn.disabled = false;
        } else {
            updateStatus('Failed to stop bot: ' + response.error, 'error');
        }
    } catch (error) {
        updateStatus('Error stopping bot: ' + error.message, 'error');
    }
});

// Handle settings
settingsBtn.addEventListener('click', async () => {
    try {
        await chrome.runtime.sendMessage({
            action: 'openSettings'
        });
    } catch (error) {
        updateStatus('Error opening settings: ' + error.message, 'error');
    }
});

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    // Check initial bot status
    try {
        const status = await chrome.runtime.sendMessage({
            action: 'getStatus'
        });

        isRunning = status.isRunning;
        isLoggedIn = status.isLoggedIn;

        if (isLoggedIn) {
            updateStatus('Connected and ready', 'success');
            startBtn.disabled = false;
            startBtn.classList.remove('opacity-50');
        } else {
            updateStatus('Please login to start', 'info');
            startBtn.disabled = true;
            startBtn.classList.add('opacity-50');
        }

        if (isRunning) {
            startBtn.disabled = true;
            startBtn.classList.add('opacity-50');
            stopBtn.disabled = false;
            stopBtn.classList.remove('opacity-50');
        } else {
            stopBtn.disabled = true;
            stopBtn.classList.add('opacity-50');
        }
    } catch (error) {
        updateStatus('Error initializing: ' + error.message, 'error');
    }
});

// Listen for status updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'statusUpdate') {
        updateStatus(message.message, message.status);
    }
});
