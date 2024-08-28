// Code inspired from https://observablehq.com/@simonw/convert-claude-json-to-markdown
function parseInput(input) {
    try {
      return JSON.parse(input);
    } catch {
      return {};
    }
}
  
  // Function to escape HTML special characters
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
    let emoji = message.sender === 'human' ? '🧑' : (message.sender === 'assistant' ? '🤖' : '👤');
    
    bits.push(`## ${emoji} ${message.sender} _(${formatDate(message.created_at)})_`);
    bits.push(message.text
        .replace(/<antArtifact/g, "```\n<antArtifact")
        .replace(/<\/antArtifact>/g, "</antArtifact>\n```")
    );

    // Handle extracted_content from attachments
    if (message.attachments) {
        message.attachments.forEach((attachment) => {
            if (attachment.extracted_content) {
                bits.push("```");
                bits.push(attachment.extracted_content);
                bits.push("```");
            }
        });
    }

    // Find the most recent child message
    const childMessages = payload.chat_messages.filter(m => m.parent_message_uuid === message.uuid);
    if (childMessages.length > 0) {
        const mostRecentChild = childMessages.reduce((latest, current) => {
            return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
        });
        processMessage(mostRecentChild, payload, bits);
    }
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

    return bits.join("\n");
}

export { convertPayloadToMarkdown };