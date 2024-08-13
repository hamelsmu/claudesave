// save a markdown file to a gist using a PAT
function saveToGist(markdown, pat, pageURL) {
    const apiUrl = 'https://api.github.com/gists';
    const personalAccessToken = pat; 
    const data = {
        description: 'Claude Conversation ' + `${pageURL}`,
        public: false,
        files: {
            'claude_conversation.md': {
                content: markdown
            }
        }
    };

    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `token ${personalAccessToken}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log('Gist created:', result.html_url);
        return { status: 'success', url: result.html_url };
    })
    .catch(error => {
        throw error;
    });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "saveToGistAPI") {
        console.log('message received in background.js');
        console.log(request.markdown);

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const pageURL = tabs[0]?.url || '';
                chrome.storage.sync.get(['pat'], (result) => {
                const pat = result.pat;
                if (!pat) {
                    chrome.storage.local.set({log_url: '', log_status: 'error', log_message: 'No PAT found'});
                    return true;
                }
                saveToGist(request.markdown, pat, pageURL)
                    .then(result => {
                        chrome.tabs.create({ url: result.url });
                        chrome.storage.local.set({log_url: result.url, log_status: 'success', log_message: 'Gist created'});
                    })
                    .catch(error => {
                        chrome.storage.local.set({log_url: '', log_status: 'error', log_message: error.message});
                });
            })
        })
        return true;
    }
});
