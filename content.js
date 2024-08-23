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
            chrome.runtime.sendMessage({action: "saveToGistAPI", uuid: extractUUID(window.location.href)}, function(response) {
                if (response && response.log_status === 'error') {
                    createBanner(`Error: ${response.log_message}`);
                }
            });
        });
        buttonContainer.appendChild(shareButton);
    }
}

function checkAndAddShareButton() {
    if (window.location.href.startsWith('https://claude.ai/chat/')) {
        const maxAttempts = 15;
        let attempts = 0;

        function tryAddButton() {
            if (attempts < maxAttempts) {
                addShareButton();
                if (!document.querySelector('.claude-save-share-button')) {
                    attempts++;
                    setTimeout(tryAddButton, 1000);
                }
            } else {
                console.log("Failed to add share button after maximum attempts")
            }
        }
        tryAddButton();
    }
}

checkAndAddShareButton();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "checkAndAddShareButton") {
        checkAndAddShareButton();
    }
});


function createBanner(message, type = 'error') {
    const banner = document.createElement('article');
    banner.className = type === 'error' ? 'error' : 'success';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        margin: 0;
        padding: 1rem;
        text-align: center;
        z-index: 9999;
        animation: slideDown 0.5s ease-out;
    `;
    banner.innerHTML = `<p>${message}</p>`;
    document.body.prepend(banner);

    // Set a timeout to remove the banner after 8 seconds
    setTimeout(() => {
        banner.style.animation = 'slideUp 0.5s ease-in';
        setTimeout(() => banner.remove(), 500);
    }, 8000);
}

function extractUUID(url) {
    const urlParts = url.split('https://claude.ai/chat/');
    const lastPart = urlParts[1];
    return lastPart.split('?')[0];
}

// Add these styles to your existing <style> tag in popup.html
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
    }
    @keyframes slideUp {
        from { transform: translateY(0); }
        to { transform: translateY(-100%); }
    }
    article.error {
        background-color: #d30c00;
        border-color: #d30c00;
        color: white;
    }
    article.success {
        background-color: #2ecc40;
        border-color: #2ecc40;
        color: white;
    }
`;
document.head.appendChild(style);