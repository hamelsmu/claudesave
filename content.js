function createButton(icon, text, action) {
    let button = document.createElement('button');
    button.className = 'claude-button inline-flex items-center justify-center relative shrink-0 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none text-text-200 transition-all font-styrene active:bg-bg-400 hover:bg-bg-500/40 hover:text-text-100 rounded py-1 px-2 whitespace-nowrap text-ellipsis overflow-hidden outline-none gap-1 ml-2';
    
    let iconElement = document.createElement('i');
    iconElement.className = `fa fa-${icon}`;
    
    let textElement = document.createElement('div');
    textElement.className = 'font-tiempos truncate font-normal tracking-tight';
    textElement.textContent = text;
    
    button.appendChild(iconElement);
    button.appendChild(textElement);
    
    button.addEventListener('click', function() {
        chrome.runtime.sendMessage({action: action, uuid: extractUUID(window.location.href)}, function(response) {
            if (response && response.log_status === 'error') {
                createBanner(`Error: ${response.log_message}`);
            } else if (response && response.log_status === 'success' && action === 'SaveToClipboard') {
                navigator.clipboard.writeText(response.markdown);
                createBanner('Copied to clipboard!', 'success', 1000);
            }
        });
    });
    
    return button;
}

function addShareButtons() {
    let buttonContainer = document.querySelector('.flex.min-w-0.items-center.max-md\\:text-sm');
    
    if (buttonContainer && !buttonContainer.querySelector('.claude-button')) {
        let faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
        document.head.appendChild(faLink);

        let shareButton = createButton('github', 'Share', 'saveToGistAPI');
        let clipboardButton = createButton('clipboard', 'Copy', 'SaveToClipboard');

        buttonContainer.appendChild(shareButton);
        buttonContainer.appendChild(clipboardButton);
    }
}

function checkAndAddShareButtons() {
    if (window.location.href.startsWith('https://claude.ai/chat/')) {
        const maxAttempts = 15;
        let attempts = 0;

        function tryAddButtons() {
            if (attempts < maxAttempts) {
                addShareButtons();
                if (!document.querySelector('.claude-button')) {
                    attempts++;
                    setTimeout(tryAddButtons, 1000);
                }
            } else {
                console.log("Failed to add share buttons after maximum attempts");
            }
        }
        tryAddButtons();
    }
}

checkAndAddShareButtons();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "checkAndAddShareButton") {
        checkAndAddShareButtons();
    }
});

function extractUUID(url) {
    const urlParts = url.split('https://claude.ai/chat/');
    const lastPart = urlParts[1];
    return lastPart.split('?')[0];
}