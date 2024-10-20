const messagesContainer = document.getElementById('messages');

function appendMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const userMessage = input.value.trim();

    if (!userMessage) return;

    appendMessage(userMessage, 'user');
    input.value = '';

    try {
        const response = await fetch('/dnd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage }),
        });

        const data = await response.json();
        appendMessage(data.reply, 'bot');
    } catch (error) {
        appendMessage('Error: Could not process your command.', 'bot');
    }
}
