// Resource Distribution Elements
const woodDistInput = document.getElementById('woodDist');
const wineDistInput = document.getElementById('wineDist');
const marbleDistInput = document.getElementById('marbleDist');
const crystalDistInput = document.getElementById('crystalDist');
const saveResourceDistBtn = document.getElementById('saveResourceDist');
const statusDiv = document.getElementById('status');

// Recording Elements
const startRecordBtn = document.getElementById('startRecord');
const stopRecordBtn = document.getElementById('stopRecord');
const replayActionsBtn = document.getElementById('replayActions');

// Load saved resource distribution
chrome.storage.local.get(['resourceDistribution'], (result) => {
  if (result.resourceDistribution) {
    woodDistInput.value = result.resourceDistribution.wood;
    wineDistInput.value = result.resourceDistribution.wine;
    marbleDistInput.value = result.resourceDistribution.marble;
    crystalDistInput.value = result.resourceDistribution.crystal;
  }
});

// Save resource distribution
saveResourceDistBtn.addEventListener('click', () => {
  const total = parseInt(woodDistInput.value) + 
                parseInt(wineDistInput.value) + 
                parseInt(marbleDistInput.value) + 
                parseInt(crystalDistInput.value);

  if (total !== 100) {
    statusDiv.textContent = 'Total distribution must equal 100%';
    return;
  }

  const distribution = {
    wood: parseInt(woodDistInput.value),
    wine: parseInt(wineDistInput.value),
    marble: parseInt(marbleDistInput.value),
    crystal: parseInt(crystalDistInput.value)
  };

  chrome.storage.local.set({ resourceDistribution: distribution }, () => {
    statusDiv.textContent = 'Resource distribution saved!';
    // Send message to content script to update distribution
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { 
        type: 'UPDATE_RESOURCE_DISTRIBUTION', 
        distribution 
      });
    });
  });
});

// Recording functionality
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
