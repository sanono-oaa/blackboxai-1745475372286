const startRecordBtn = document.getElementById('startRecord');
const stopRecordBtn = document.getElementById('stopRecord');
const replayActionsBtn = document.getElementById('replayActions');
const statusDiv = document.getElementById('status');

startRecordBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'START_RECORDING' }, (response) => {
    if (response.status === 'recording_started') {
      statusDiv.textContent = 'Recording started...';
      startRecordBtn.disabled = true;
      stopRecordBtn.disabled = false;
    }
  });
});

stopRecordBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }, (response) => {
    if (response.status === 'recording_stopped') {
      statusDiv.textContent = `Recording stopped. ${response.actions.length} actions recorded.`;
      startRecordBtn.disabled = false;
      stopRecordBtn.disabled = true;
    }
  });
});

replayActionsBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'GET_RECORDED_ACTIONS' }, (response) => {
    if (response.actions && response.actions.length > 0) {
      statusDiv.textContent = 'Replaying actions...';
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'REPLAY_ACTIONS', actions: response.actions }, (res) => {
          if (res && res.status === 'replay_started') {
            statusDiv.textContent = 'Replay started.';
          }
        });
      });
    } else {
      statusDiv.textContent = 'No recorded actions to replay.';
    }
  });
});
