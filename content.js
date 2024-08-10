console.log("content.js loaded");

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
    let attempts = 0;
    const maxAttempts = 20;

    function tryAddButton() {
        let buttonContainer = document.querySelector('.flex.min-w-0.items-center.max-md\\:text-sm');
        
        if (buttonContainer) {
            let faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
            document.head.appendChild(faLink);

            let gitHubIcon = document.createElement('i');
            gitHubIcon.className = 'fa fa-github';

            let shareButton = document.createElement('button');
            shareButton.className = 'inline-flex items-center justify-center relative shrink-0 ring-offset-2 ring-offset-bg-300 ring-accent-main-100 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:drop-shadow-none text-text-200 transition-all font-styrene active:bg-bg-400 hover:bg-bg-500/40 hover:text-text-100 rounded py-1 px-2 whitespace-nowrap text-ellipsis overflow-hidden outline-none gap-1';
            shareButton.innerHTML = '<div class="font-tiempos truncate font-normal tracking-tight">Share</div>';
            
            shareButton.prepend(gitHubIcon);
            shareButton.addEventListener('click', function() {
                const markdown = extractMarkdownConversation();
                chrome.runtime.sendMessage({action: "saveToGistAPI", markdown: markdown}, function(response) {
                    console.log('response received', response);
                    chrome.storage.local.set({log_url: response.url ?? '', log_status: response.status, log_message: response.message ?? ''});
                });
            });
            buttonContainer.appendChild(shareButton);
        } else if (attempts < maxAttempts) {
            attempts++;
            // Wait half a second between each attempt
            setTimeout(tryAddButton, 500);
        } else {
            console.log("Failed to find button container after 30 seconds");
        }
    }
    tryAddButton();
}

// Wait until the page is loaded
window.addEventListener('load', addShareButton, false);

