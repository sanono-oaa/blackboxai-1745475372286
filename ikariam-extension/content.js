let isReplaying = false;

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REPLAY_ACTIONS') {
    replayActions(message.actions);
    sendResponse({ status: 'replay_started' });
  }
});

document.addEventListener('click', recordClick, true);
document.addEventListener('input', recordInput, true);
