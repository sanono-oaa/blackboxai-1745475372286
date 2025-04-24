let isReplaying = false;
let currentDistribution = {
  wood: 25,
  wine: 25,
  marble: 25,
  crystal: 25
};

// Load saved distribution
chrome.storage.local.get(['resourceDistribution'], (result) => {
  if (result.resourceDistribution) {
    currentDistribution = result.resourceDistribution;
  }
});

function applyResourceDistribution() {
  // Find resource distribution inputs on the page
  const resourceInputs = document.querySelectorAll('input[type="number"]');
  const resourceSliders = Array.from(resourceInputs).filter(input => {
    // Filter for resource distribution inputs (you may need to adjust this selector based on the game's HTML)
    return input.closest('.resourceAssignment') || input.closest('.resourceSlider');
  });

  if (resourceSliders.length === 4) {
    // Set values based on current distribution
    resourceSliders[0].value = currentDistribution.wood;
    resourceSliders[1].value = currentDistribution.wine;
    resourceSliders[2].value = currentDistribution.marble;
    resourceSliders[3].value = currentDistribution.crystal;

    // Trigger input events to ensure the game recognizes the changes
    resourceSliders.forEach(slider => {
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Find and click the confirm/apply button if it exists
    const confirmButton = document.querySelector('.resourceAssignment button') || 
                         document.querySelector('.resourceDistribution button');
    if (confirmButton) {
      confirmButton.click();
    }
  }
}

function sendUserAction(action) {
  chrome.runtime.sendMessage({ type: 'USER_ACTION', action });
}

function recordClick(event) {
  if (event.target) {
    const action = {
      type: 'click',
      selector: getSelector(event.target),
      timestamp: Date.now()
    };
    sendUserAction(action);
  }
}

function recordInput(event) {
  if (event.target) {
    const action = {
      type: 'input',
      selector: getSelector(event.target),
      value: event.target.value,
      timestamp: Date.now()
    };
    sendUserAction(action);
  }
}

function getSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  if (element.className) {
    const classes = element.className.trim().split(/\s+/).join('.');
    return `${element.tagName.toLowerCase()}.${classes}`;
  }
  return element.tagName.toLowerCase();
}

function replayActions(actions) {
  if (isReplaying) return;
  isReplaying = true;

  let i = 0;

  function next() {
    if (i >= actions.length) {
      isReplaying = false;
      return;
    }
    const action = actions[i];
    const element = document.querySelector(action.selector);
    if (element) {
      if (action.type === 'click') {
        element.click();
      } else if (action.type === 'input') {
        element.value = action.value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    i++;
    setTimeout(next, 500);
  }

  next();
}

// Message listener for popup commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REPLAY_ACTIONS') {
    replayActions(message.actions);
    sendResponse({ status: 'replay_started' });
  } else if (message.type === 'UPDATE_RESOURCE_DISTRIBUTION') {
    currentDistribution = message.distribution;
    applyResourceDistribution();
    sendResponse({ status: 'distribution_updated' });
  }
  return true;
});

// Set up periodic check for resource distribution page
setInterval(() => {
  // Check if we're on a resource distribution page
  const isResourcePage = document.querySelector('.resourceAssignment') || 
                        document.querySelector('.resourceDistribution');
  if (isResourcePage) {
    applyResourceDistribution();
  }
}, 5000); // Check every 5 seconds

document.addEventListener('click', recordClick, true);
document.addEventListener('input', recordInput, true);

// Initial application of resource distribution
applyResourceDistribution();
