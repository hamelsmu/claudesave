function extractMarkdownConversation() {
    function extractTextFromElement(element) {
        let textContent = '';
        element.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                textContent += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'STRONG' || node.tagName === 'B') {
                    textContent += `**${extractTextFromElement(node)}**`;
                } else if (node.tagName === 'EM' || node.tagName === 'I') {
                    textContent += `*${extractTextFromElement(node)}*`;
                } else if (node.tagName === 'A') {
                    textContent += `[${extractTextFromElement(node)}](${node.href})`;
                } else if (node.tagName === 'CODE' && node.parentNode.tagName !== 'PRE') {
                    textContent += `\`${extractTextFromElement(node)}\``;
                } else if (node.tagName === 'PRE') {
                    const codeElement = node.querySelector('code');
                    const languageClass = codeElement ? codeElement.className.match(/language-(\w+)/) : null;
                    const language = languageClass ? languageClass[1] : '';
                    textContent += `\n\`\`\`${language}\n${codeElement.textContent.trim()}\n\`\`\`\n`;
                } else if (node.tagName === 'BR') {
                    textContent += '\n';
                } else if (node.tagName === 'P') {
                    textContent += `${extractTextFromElement(node)}\n\n`;
                } else {
                    textContent += extractTextFromElement(node);
                }
            }
        });
        return textContent;
    }

    const messages = document.querySelectorAll('.font-user-message, .font-claude-message');
    let markdown = '';

    messages.forEach(message => {
        const isUser = message.classList.contains('font-user-message');
        const role = isUser ? '## Human\n' : '## AI\n';
        const content = extractTextFromElement(message).trim();
        markdown += `${role}${content}\n\n`;
    });

    return markdown;
};

function addShareButton() {
    let buttonContainer = document.querySelector('.flex.min-w-0.items-center.max-md\\:text-sm');
    
    if (buttonContainer && !buttonContainer.querySelector('.claude-save-share-button')) {
        let faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
        document.head.appendChild(faLink);

        let gitHubIcon = document.createElement('i');
        gitHubIcon.className = 'fa fa-github';

        let shareButton = document.createElement('button');
        shareButton.className = 'claude-save-share-button inline-flex items-center justify-center relative shrink-0 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none text-text-200 transition-all font-styrene active:bg-bg-400 hover:bg-bg-500/40 hover:text-text-100 rounded py-1 px-2 whitespace-nowrap text-ellipsis overflow-hidden outline-none gap-1';
        shareButton.innerHTML = '<div class="font-tiempos truncate font-normal tracking-tight">Share</div>';
        
        shareButton.prepend(gitHubIcon);
        shareButton.addEventListener('click', function() {
            const markdown = extractMarkdownConversation();
            chrome.runtime.sendMessage({action: "saveToGistAPI", markdown: markdown});
        });
        buttonContainer.appendChild(shareButton);
        console.log("Share button added");
    } else if (!buttonContainer) {
        console.log("Button container not found");
    } else {
        console.log("Share button already exists");
    }
}

function checkAndAddShareButton() {
    if (window.location.href.startsWith('https://claude.ai/chat/')) {
        const maxAttempts = 10;
        let attempts = 0;

        function tryAddButton() {
            if (attempts < maxAttempts) {
                addShareButton();
                if (!document.querySelector('.claude-save-share-button')) {
                    attempts++;
                    setTimeout(tryAddButton, 1000);
                }
            } else {
                console.log("Failed to add share button after maximum attempts");
            }
        }

        tryAddButton();
    }
}

// Initial check when the script loads
checkAndAddShareButton();

// Set up a MutationObserver to watch for URL changes
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        console.log("URL changed to:", url);
        checkAndAddShareButton();
    }
}).observe(document, {subtree: true, childList: true});

// Also check periodically (every 2 seconds) in case the MutationObserver misses something
setInterval(checkAndAddShareButton, 2000);