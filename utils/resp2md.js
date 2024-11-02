// Code inspired from https://observablehq.com/@simonw/convert-claude-json-to-markdown
function parseInput(input) {
    try {
      return JSON.parse(input);
    } catch {
      return {};
    }
}
  
  // Function to escape HTML special characters only within code blocks
function escapeHtml(str) {
    const entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return str.replace(/[&<>"']/g, match => entityMap[match]);
}
  
  // Function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
}
  
  // Function to process a single message and its descendants
function processMessage(message, payload, bits) {
    console.log("Processing message:", {
        uuid: message.uuid,
        sender: message.sender,
        hasContent: Boolean(message.content),
        hasText: Boolean(message.text),
        hasAttachments: Boolean(message.attachments?.length),
        attachmentsCount: message.attachments?.length || 0
    });

    // If the previous item was a code block, ensure it's closed
    if (bits.length > 0 && bits[bits.length - 1].startsWith('```')) {
        bits.push('```');
    }

    let emoji = message.sender === 'human' ? '🧑' : (message.sender === 'assistant' ? '🤖' : '👤');
    
    bits.push(`## ${emoji} ${message.sender} _(${formatDate(message.created_at)})_`);
    
    // Handle content array if it exists
    if (message.content && message.content.length > 0) {
        message.content.forEach(content => {
            if (content.type === 'text') {
                console.log("Adding content text:", content.text.substring(0, 50) + "...");
                bits.push(content.text);
            }
        });
    } else if (message.text) {
        console.log("Adding message text:", message.text.substring(0, 50) + "...");
        bits.push(message.text);
    }

    // Only process attachments if they exist AND have length > 0
    if (message.attachments?.length > 0) {
        message.attachments.forEach((attachment) => {
            if (attachment.extracted_content) {
                console.log("Adding attachment content");
                bits.push("```");
                bits.push(escapeHtml(attachment.extracted_content));
                bits.push("```");
            }
        });
    }

    console.log("Current bits array:", bits.slice(-3));

    // Find and process child messages
    const childMessages = payload.chat_messages.filter(m => m.parent_message_uuid === message.uuid);
    if (childMessages.length > 0) {
        const mostRecentChild = childMessages.reduce((latest, current) => {
            return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
        });
        processMessage(mostRecentChild, payload, bits);
    }
}

// Add this new function
function cleanupMarkdown(markdown) {
    const lines = markdown.split('\n');
    const cleanedLines = [];
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // More permissive regex to catch variations of message headers
        const isMessageHeader = line.match(/^## [🧑🤖👤].*(human|assistant|system).*_\(.*\)_$/i);
        
        if (line === '```') {
            if (inCodeBlock) {
                // We're ending a code block
                cleanedLines.push(line);
                inCodeBlock = false;
            } else {
                // We're starting a code block
                // Check if next lines contain message headers
                let peekIndex = i + 1;
                let foundHeader = false;
                while (peekIndex < lines.length && lines[peekIndex].trim() !== '```') {
                    if (lines[peekIndex].trim().match(/^## [🧑🤖👤].*(human|assistant|system).*_\(.*\)_$/i)) {
                        foundHeader = true;
                        break;
                    }
                    peekIndex++;
                }
                
                if (!foundHeader) {
                    cleanedLines.push(line);
                    inCodeBlock = true;
                }
                // If we found a header, skip adding the opening code block
            }
            continue;
        }

        if (isMessageHeader) {
            if (inCodeBlock) {
                // If we find a header inside a code block, close the block first
                cleanedLines.push('```');
                inCodeBlock = false;
            }
            cleanedLines.push(line);
        } else {
            cleanedLines.push(line);
        }
    }

    // Ensure we close any open code block
    if (inCodeBlock) {
        cleanedLines.push('```');
    }

    return cleanedLines.join('\n');
}

// Main function to convert JSON chat to Markdown
function convertPayloadToMarkdown(payload) {
    if (!payload.chat_messages || payload.chat_messages.length === 0) {
        return "";
    }
    const bits = [];
    bits.push(`# ${payload.name}`);

    // Find the most recent root message
    const mostRecentRootMessage = payload.chat_messages
        .filter(message => message.parent_message_uuid === '00000000-0000-4000-8000-000000000000')
        .reduce((latest, current) => {
            return new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest;
        });

    // Start processing from the most recent root message
    if (mostRecentRootMessage) {
        processMessage(mostRecentRootMessage, payload, bits);
    }

    // Clean up the markdown before returning
    return cleanupMarkdown(bits.join("\n"));
}

export { convertPayloadToMarkdown };