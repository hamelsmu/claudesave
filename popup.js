document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save');
    const statusDiv = document.getElementById('status');
    pat.value = chrome.storage.sync.get('pat') ?? '';

    saveButton.addEventListener('click', function() {
        const pat = document.getElementById('pat');
        chrome.storage.sync.set({'pat': `${pat.value}`});
    });

    // Function to update the logs
    function updateLogs() {
        chrome.storage.local.get(['log_url', 'log_status', 'log_message'], function(result) {
            if (result.log_status === 'success') {
                statusDiv.innerHTML = `Gist Created: <a href="${result.log_url}" target="_blank">link to gist</a>`;
                statusDiv.style.color = '#4CAF50';
                statusDiv.style.fontWeight = 'bold';
            } else if (result.log_status === 'error') {
                statusDiv.textContent = `Error: ${result.log_message}`;
                statusDiv.style.color = '#F44336';
                statusDiv.style.fontWeight = 'bold';
            } else {
                statusDiv.textContent = 'No recent logs.';
                statusDiv.style.color = '';
                statusDiv.style.fontWeight = 'normal';
            }
        });
    }

    // Update logs when popup opens
    updateLogs();

    // Listen for changes in chrome.storage.local
    chrome.storage.onChanged.addListener(function(changes, namespace) {
        if (namespace === 'local' && (changes.log_url || changes.log_status || changes.log_message)) {
            updateLogs();
        }
    });
});