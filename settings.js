// Default settings
const DEFAULT_SETTINGS = {
    general: {
        checkInterval: 5,
        maxRetries: 3
    },
    resources: {
        autoManage: true,
        minLevel: 20
    },
    buildings: {
        autoUpgrade: true,
        priority: ['townHall', 'academy', 'warehouse']
    },
    military: {
        autoTrain: true,
        minSize: 100
    },
    research: {
        autoResearch: true,
        priority: ['economy', 'science']
    }
};

// DOM Elements
const elements = {
    // General
    checkInterval: document.getElementById('checkInterval'),
    maxRetries: document.getElementById('maxRetries'),
    
    // Resources
    autoManageResources: document.getElementById('autoManageResources'),
    minResourceLevel: document.getElementById('minResourceLevel'),
    
    // Buildings
    autoUpgradeBuildings: document.getElementById('autoUpgradeBuildings'),
    buildingPriority: document.getElementById('buildingPriority'),
    
    // Military
    autoTrainUnits: document.getElementById('autoTrainUnits'),
    minArmySize: document.getElementById('minArmySize'),
    
    // Research
    autoResearch: document.getElementById('autoResearch'),
    researchPriority: document.getElementById('researchPriority'),
    
    // Buttons
    saveBtn: document.getElementById('saveBtn'),
    resetBtn: document.getElementById('resetBtn')
};

// Load settings
async function loadSettings() {
    try {
        const result = await chrome.storage.local.get('botSettings');
        const settings = result.botSettings || DEFAULT_SETTINGS;
        
        // General
        elements.checkInterval.value = settings.general.checkInterval;
        elements.maxRetries.value = settings.general.maxRetries;
        
        // Resources
        elements.autoManageResources.checked = settings.resources.autoManage;
        elements.minResourceLevel.value = settings.resources.minLevel;
        
        // Buildings
        elements.autoUpgradeBuildings.checked = settings.buildings.autoUpgrade;
        setMultiSelectValues(elements.buildingPriority, settings.buildings.priority);
        
        // Military
        elements.autoTrainUnits.checked = settings.military.autoTrain;
        elements.minArmySize.value = settings.military.minSize;
        
        // Research
        elements.autoResearch.checked = settings.research.autoResearch;
        setMultiSelectValues(elements.researchPriority, settings.research.priority);
        
    } catch (error) {
        showNotification('Error loading settings: ' + error.message, 'error');
    }
}

// Save settings
async function saveSettings() {
    try {
        const settings = {
            general: {
                checkInterval: parseInt(elements.checkInterval.value),
                maxRetries: parseInt(elements.maxRetries.value)
            },
            resources: {
                autoManage: elements.autoManageResources.checked,
                minLevel: parseInt(elements.minResourceLevel.value)
            },
            buildings: {
                autoUpgrade: elements.autoUpgradeBuildings.checked,
                priority: getMultiSelectValues(elements.buildingPriority)
            },
            military: {
                autoTrain: elements.autoTrainUnits.checked,
                minSize: parseInt(elements.minArmySize.value)
            },
            research: {
                autoResearch: elements.autoResearch.checked,
                priority: getMultiSelectValues(elements.researchPriority)
            }
        };

        await chrome.storage.local.set({ botSettings: settings });
        
        // Notify background script of settings update
        await chrome.runtime.sendMessage({
            action: 'updateSettings',
            data: settings
        });

        showNotification('Settings saved successfully', 'success');
    } catch (error) {
        showNotification('Error saving settings: ' + error.message, 'error');
    }
}

// Reset settings
async function resetSettings() {
    try {
        await chrome.storage.local.remove('botSettings');
        loadSettings(); // Reload with defaults
        showNotification('Settings reset to defaults', 'success');
    } catch (error) {
        showNotification('Error resetting settings: ' + error.message, 'error');
    }
}

// Helper functions
function setMultiSelectValues(selectElement, values) {
    Array.from(selectElement.options).forEach(option => {
        option.selected = values.includes(option.value);
    });
}

function getMultiSelectValues(selectElement) {
    return Array.from(selectElement.selectedOptions).map(option => option.value);
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
    } text-white`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Form validation
function validateForm() {
    const validations = [
        {
            element: elements.checkInterval,
            validate: value => value >= 1 && value <= 3600,
            message: 'Check interval must be between 1 and 3600 seconds'
        },
        {
            element: elements.maxRetries,
            validate: value => value >= 1 && value <= 10,
            message: 'Max retries must be between 1 and 10'
        },
        {
            element: elements.minResourceLevel,
            validate: value => value >= 0 && value <= 100,
            message: 'Minimum resource level must be between 0 and 100'
        },
        {
            element: elements.minArmySize,
            validate: value => value >= 0,
            message: 'Minimum army size must be 0 or greater'
        }
    ];

    for (const validation of validations) {
        const value = parseInt(validation.element.value);
        if (!validation.validate(value)) {
            showNotification(validation.message, 'error');
            validation.element.focus();
            return false;
        }
    }

    return true;
}

// Event listeners
elements.saveBtn.addEventListener('click', () => {
    if (validateForm()) {
        saveSettings();
    }
});

elements.resetBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        resetSettings();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadSettings);

// Listen for settings updates from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'settingsUpdated') {
        loadSettings();
    }
});
