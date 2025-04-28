// Bot operation state
let isActive = false;
let currentTask = null;
let intervalIds = [];

// Configuration
const CONFIG = {
    checkInterval: 1000, // Time between checks in milliseconds
    maxRetries: 3,      // Maximum number of retries for actions
    resourceTypes: ['wood', 'wine', 'marble', 'crystal', 'sulfur'],
    buildingTypes: ['townHall', 'academy', 'warehouse', 'tavern', 'palace', 'tradingPort', 'barracks', 'shipyard'],
    unitTypes: ['hoplite', 'steamGiant', 'spearman', 'swordsman', 'slinger', 'archer', 'ram', 'catapult', 'mortar', 'gyrocopter', 'balloonBombardier', 'cook', 'doctor'],
    shipTypes: ['ramship', 'flamethrower', 'steamram', 'rocketship', 'ballista', 'catapult', 'mortar', 'submarine'],
    // Resource management
    minResourceLevel: 1000,  // Minimum resource amount before warning
    maxResourceLevel: 25000, // Maximum resource amount before selling
    targetResourceLevel: 15000, // Target resource amount after buying/selling
    // Military management
    minUnitCount: 100,      // Minimum number of each unit type
    // Wine management
    minWineTime: 2,         // Minimum hours of wine supply before warning
    // Construction
    maxConstructionQueue: 2  // Maximum number of buildings in construction queue
};

// Selectors for game elements
const SELECTORS = {
    resources: {
        wood: '#js_GlobalMenu_wood',
        wine: '#js_GlobalMenu_wine',
        marble: '#js_GlobalMenu_marble',
        crystal: '#js_GlobalMenu_crystal',
        sulfur: '#js_GlobalMenu_sulfur'
    },
    buildings: {
        constructionList: '.constructionList',
        buildingSpots: '.buildingSpot',
        upgradeButton: '.upgradeButton'
    },
    military: {
        unitTraining: '.unitTraining',
        barracks: '#barracks',
        shipyard: '#shipyard'
    },
    marketplace: {
        buyTab: '#buyTab',
        sellTab: '#sellTab',
        offerList: '.offerList'
    }
};

// Main bot controller
class BotController {
    constructor() {
        this.setupMessageListeners();
        this.resources = {};
        this.buildings = {};
        this.military = {};
        this.tasks = [];
    }

    // Message handling
    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'stopBot':
                    this.stop();
                    sendResponse({ success: true });
                    break;
                case 'constructionList':
                    this.getConstructionList().then(list => sendResponse({ success: true, data: list }));
                    break;
                case 'sendResources':
                    this.sendResources(message.data).then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'distributeResources':
                    this.distributeResources(message.data).then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'getStatus':
                    this.getStatus().then(status => sendResponse({ success: true, data: status }));
                    break;
                case 'activateShrine':
                    this.activateShrine().then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'loginDaily':
                    this.loginDaily().then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'checkAttacks':
                    this.checkAttacks().then(attacks => sendResponse({ success: true, data: attacks }));
                    break;
                case 'checkWine':
                    this.checkWineStatus().then(status => sendResponse({ success: true, data: status }));
                    break;
                case 'marketplaceBuy':
                    this.buyResources(message.data).then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'marketplaceSell':
                    this.sellResources(message.data).then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'donate':
                    this.donate(message.data).then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'trainArmy':
                    this.trainArmy(message.data).then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'stationArmy':
                    this.stationArmy(message.data).then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'shipMovements':
                    this.getShipMovements().then(movements => sendResponse({ success: true, data: movements }));
                    break;
                case 'constructBuilding':
                    this.constructBuilding(message.data).then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'autoPirate':
                    this.autoPirate(message.data).then(result => sendResponse({ success: true, data: result }));
                    break;
                case 'attackBarbarians':
                    this.attackBarbarians(message.data).then(result => sendResponse({ success: true, data: result }));
                    break;
            }
            return true;
        });
    }

    // Bot control methods
    async start() {
        if (isActive) return;
        isActive = true;
        
        try {
            await this.initializeBot();
            this.startMainLoop();
            
            // Start monitoring systems
            this.startResourceMonitoring();
            this.startAttackMonitoring();
            this.startWineMonitoring();
            
            chrome.runtime.sendMessage({
                type: 'statusUpdate',
                message: 'Bot started successfully',
                status: 'success'
            });
        } catch (error) {
            console.error('Bot initialization failed:', error);
            this.stop();
            chrome.runtime.sendMessage({
                type: 'statusUpdate',
                message: 'Bot initialization failed: ' + error.message,
                status: 'error'
            });
        }
    }

    stop() {
        isActive = false;
        intervalIds.forEach(id => clearInterval(id));
        intervalIds = [];
        currentTask = null;
    }

    // Core functionality methods
    startMainLoop() {
        const mainLoopId = setInterval(async () => {
            if (!isActive) {
                clearInterval(mainLoopId);
                return;
            }
            await this.performTasks();
        }, CONFIG.checkInterval);
        intervalIds.push(mainLoopId);
    }

    async performTasks() {
        if (currentTask) return;

        try {
            const constructionList = await this.getConstructionList();
            if (constructionList.length < CONFIG.maxConstructionQueue) {
                await this.findAndStartConstruction();
            }

            const military = await this.getMilitaryStatus();
            if (this.shouldTrainUnits(military)) {
                await this.trainArmy({ units: this.calculateNeededUnits(military) });
            }

            if (this.shouldTradeResources()) {
                await this.handleMarketplace();
            }
        } catch (error) {
            console.error('Task error:', error);
            this.reportError(error);
        }
    }

    // Helper methods
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reportError(error) {
        chrome.runtime.sendMessage({
            type: 'statusUpdate',
            message: `Error: ${error.message}`,
            status: 'error'
        });
    }

    async waitForElement(selector, timeout = 5000) {
        const element = document.querySelector(selector);
        if (element) return element;

        return new Promise((resolve, reject) => {
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found`));
            }, timeout);
        });
    }

    async clickElement(selector) {
        const element = await this.waitForElement(selector);
        element.click();
        return true;
    }

    async initializeBot() {
        if (!this.isValidPage()) {
            throw new Error('Invalid page for bot operation');
        }
    }

    isValidPage() {
        return true; // Implementation needed
    }
}

// Initialize bot controller
const botController = new BotController();

// Start bot if it should be running
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response && response.isRunning) {
        botController.start();
    }
});
