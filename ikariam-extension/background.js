let recordedActions = [];
let isRecording = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_RECORDING') {
    recordedActions = [];
    isRecording = true;
    sendResponse({ status: 'recording_started' });
  } else if (message.type === 'STOP_RECORDING') {
    isRecording = false;
    chrome.storage.local.set({ recordedActions });
    sendResponse({ status: 'recording_stopped', actions: recordedActions });
  } else if (message.type === 'GET_RECORDED_ACTIONS') {
    chrome.storage.local.get('recordedActions', (data) => {
      sendResponse({ actions: data.recordedActions || [] });
    });
    return true; // Will respond asynchronously
  } else if (message.type === 'SAVE_RECORDED_ACTIONS') {
    recordedActions = message.actions;
    chrome.storage.local.set({ recordedActions });
    sendResponse({ status: 'actions_saved' });
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'content-script') {
    port.onMessage.addListener((msg) => {
      if (isRecording && msg.type === 'USER_ACTION') {
        recordedActions.push(msg.action);
      }
    });
  }
});
