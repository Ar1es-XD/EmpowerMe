const input = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const userInitials = document.querySelector('.avatar-btn')?.textContent?.trim() || 'You';

input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
});

const scrollToBottom = () => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

const appendMessage = (role, text, metaText) => {
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = role === 'user' ? userInitials : '⚖';

    const content = document.createElement('div');
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.textContent = text;

    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    meta.textContent = metaText;

    content.appendChild(bubble);
    content.appendChild(meta);
    msg.appendChild(avatar);
    msg.appendChild(content);
    chatMessages.appendChild(msg);
    scrollToBottom();
};

const sendMessage = () => {
    const value = input.value.trim();
    if (!value) {
        return;
    }

    appendMessage('user', value, 'You · Just now');
    input.value = '';
    input.style.height = 'auto';
};

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

setTimeout(() => {
    const typingMsg = document.getElementById('typingMsg');
    if (!typingMsg) {
        return;
    }

    typingMsg.querySelector('.msg-bubble').innerHTML = `
    The <strong>fastest route</strong> for urgent salary recovery in Karnataka is:<br><br>
    <span class="tag">Step 1</span> File with the <strong>Labour Inspector</strong> at your nearest district office — resolution in <strong>15–30 days</strong>, zero cost.<br><br>
    <span class="tag">Step 2</span> Simultaneously send a <strong>legal notice</strong> via registered post — this often triggers immediate payment.<br><br>
    You can recover up to <strong>3x the unpaid wages</strong> as compensation under the Payment of Wages Act.
  `;
    typingMsg.querySelector('.msg-meta').textContent = 'EmpowerMe AI · Just now';
}, 2800);
