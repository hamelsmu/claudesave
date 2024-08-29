import { convertPayloadToMarkdown } from './utils/resp2md.js';
import { saveToGist } from './utils/github.js';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "saveToGistAPI" || request.action === "SaveToClipboard") {
        chrome.storage.sync.get(['pat'], (result) => {
            const pat = result.pat;
            if (!pat && request.action === "saveToGistAPI") {
                const msg = 'No PAT found, please set one in the extension by clicking on the extension icon';
                chrome.storage.local.set({log_url: '', log_status: 'error', log_message: msg});
                sendResponse({log_status: 'error', log_message: msg });
                return true;
            }
            chrome.storage.local.get([`chat_${request.uuid}`], (result) => {
                const payload = result[`chat_${request.uuid}`];
                if (!payload) {
                    const msg = 'No payload found, try refreshing the page.';
                    chrome.storage.local.set({log_url: '', log_status: 'error', log_message: msg});
                    sendResponse({log_status: 'error', log_message: msg });
                    return true;
                }
                else {
                    let markdown = convertPayloadToMarkdown(payload);
                    if (request.action === "saveToGistAPI") {
                        saveToGist(markdown, pat, `https://claude.ai/chat/${request.uuid}`)
                        .then(result => {
                            chrome.tabs.create({ url: result.url });
                            chrome.storage.local.set({log_url: result.url, log_status: 'success', log_message: 'Gist created'});
                            sendResponse({log_status: 'success'});
                        })
                        .catch(error => {
                            const msg = error.message + ' Please make sure your PAT has the correct permissions to create gists.';
                            chrome.storage.local.set({log_url: '', log_status: 'error', log_message: error.message});
                            sendResponse({log_status: 'error', log_message: msg});
                        });
                    } else if (request.action === "SaveToClipboard") {
                        sendResponse({log_status: 'success', log_message: 'Copied to clipboard', markdown: markdown});
                    }
                }
            });
        });
        return true;
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url && changeInfo.url.startsWith('https://claude.ai/chat/')) {
        chrome.tabs.sendMessage(tabId, {action: "checkAndAddShareButton"});
    }
});

chrome.webRequest.onBeforeSendHeaders.addListener((obj) => {
    if (isChatRequest(obj) && !isOwnRequest(obj)) {
        fetchChat(obj).then(resp => {
            if (resp.chat_messages && resp.uuid) {
                chrome.storage.local.set({[`chat_${resp.uuid}`]: resp});
            }
        });
    }
}, {urls: ["https://api.claude.ai/api/*chat_conversations*"]}, ['requestHeaders', 'extraHeaders']);


function isChatRequest(obj) {
    return obj.url.endsWith('?tree=True&rendering_mode=raw') && obj.method === 'GET';
}

function isOwnRequest(obj) {
    return obj.requestHeaders?.some(header => header.name === 'X-Own-Request') ?? false;
}

async function fetchChat(obj) {
    const headers = {};
    obj.requestHeaders.forEach(header => headers[header.name] = header.value);
    headers['X-Own-Request'] = 'true';
    try {
        const response = await fetch(obj.url, {
            method: obj.method,
            headers: headers,
            credentials: "include"
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}