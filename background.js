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
                    sendResponse({ status: 'error', message: 'No PAT found', url: '' });
                    return true;
                }
                saveToGist(request.markdown, pat, pageURL)
                    .then(result => {
                        chrome.tabs.create({ url: result.url });
                        sendResponse({status: result.status, url: result.url });
                    })
                    .catch(error => {
                        sendResponse({ status: 'error', message: error.message, url: '' });
                });
            })
        })
        return true;
    }
});
