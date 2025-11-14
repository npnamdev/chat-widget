(function() {
  const style = document.createElement('style');
  style.innerHTML = `
    #chat-toggle { position:fixed; bottom:20px; right:20px; background:linear-gradient(135deg,#4facfe,#00f2fe); color:#fff; border:none; padding:14px 18px; border-radius:50%; cursor:pointer; font-size:20px; z-index:9999; box-shadow:0 4px 12px rgba(0,0,0,0.3); transition: transform 0.2s; }
    #chat-toggle:hover { transform: scale(1.1); }
    #chat-box { position:fixed; bottom:80px; right:20px; width:320px; height:420px; background:#fff; border-radius:12px; display:none; flex-direction:column; overflow:hidden; z-index:9999; box-shadow:0 8px 20px rgba(0,0,0,0.25); font-family:Arial,sans-serif; }
    #chat-messages { flex:1; padding:12px; overflow-y:auto; background:#f5f5f5; }
    #chat-input { display:flex; border-top:1px solid #ddd; }
    #chat-input input { flex:1; padding:10px; border:none; outline:none; font-size:14px; }
    #chat-input button { padding:10px 16px; border:none; background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; cursor:pointer; transition:background 0.3s; }
    #chat-input button:hover { background:linear-gradient(135deg,#00f2fe,#4facfe); }
    .chat-message { margin-bottom:8px; padding:6px 10px; border-radius:10px; max-width:80%; word-wrap:break-word; font-size:14px; line-height:1.4; }
    .chat-message.user { background:#4facfe; color:#fff; align-self:flex-end; }
    .chat-message.agent { background:#e0e0e0; color:#333; align-self:flex-start; }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'chat-toggle';
  btn.innerText = '💬';
  document.body.appendChild(btn);

  const box = document.createElement('div');
  box.id = 'chat-box';
  box.innerHTML = `
    <div id="chat-messages"></div>
    <div id="chat-input">
      <input type="text" id="chat-text" placeholder="Type a message..." />
      <button id="chat-send">Send</button>
    </div>
  `;
  document.body.appendChild(box);

  if (btn) {
    btn.addEventListener('click', () => {
      box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
      box.style.display = 'flex';
    });
  }

  const socket = io();

  let visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = 'visitor-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('visitorId', visitorId);
  }

  const messagesDiv = document.getElementById('chat-messages');
  const input = document.getElementById('chat-text');
  const sendBtn = document.getElementById('chat-send');

  if (!messagesDiv || !input || !sendBtn) {
    console.error('Chat elements not found');
    return;
  }

  function renderMessage(m) {
    if (!m || !m.text) return;
    const div = document.createElement('div');
    div.className = 'chat-message ' + (m.sender === 'user' ? 'user' : 'agent');
    div.textContent = m.text;
    if (messagesDiv) {
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    socket.emit('send_message', { visitorId, text });
    input.value = '';
  });

  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendBtn.click();
  });

  socket.on('message_received', msg => {
    if (msg) renderMessage(msg);
  });
  socket.on('message_from_admin', ({ visitorId: id, message }) => {
    if (id === visitorId && message) renderMessage(message);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
})();
