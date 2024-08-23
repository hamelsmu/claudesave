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
  
  // Main function to convert JSON chat to Markdown
function convertPayloadToMarkdown(payload) {
    if (!payload.chat_messages) {
        return "";
    }
    const bits = [];
    bits.push(`# ${payload.name}`);
    payload.chat_messages.forEach((message) => {
        let emoji = '👤';
        if (message.sender === 'human') {
            emoji = '🧑';
        } else if (message.sender === 'assistant') {
            emoji = '🤖';
        }
        
        bits.push(
            `## ${emoji} ${message.sender} _(${formatDate(message.created_at)})_`
        );
        bits.push(
            message.text
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
    }); 
    return bits.join("\n");
}

export { convertPayloadToMarkdown };