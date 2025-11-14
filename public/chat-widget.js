(function() {
  // Tránh load nhiều lần
  if (window.chatWidgetLoaded) return;
  window.chatWidgetLoaded = true;

  const style = document.createElement('style');
  style.innerHTML = `
    #chat-widget-toggle { position:fixed; bottom:20px; right:20px; background:linear-gradient(135deg,#4facfe,#00f2fe); color:#fff; border:none; padding:14px 18px; border-radius:50%; cursor:pointer; font-size:20px; z-index:99999; box-shadow:0 4px 12px rgba(0,0,0,0.3); transition: transform 0.2s; }
    #chat-widget-toggle:hover { transform: scale(1.1); }
    #chat-widget-box { position:fixed; bottom:80px; right:20px; width:320px; height:420px; background:#fff; border-radius:12px; display:none; flex-direction:column; overflow:hidden; z-index:99999; box-shadow:0 8px 20px rgba(0,0,0,0.25); font-family:Arial,sans-serif; }
    #chat-widget-messages { flex:1; padding:12px; overflow-y:auto; background:#f5f5f5; display:flex; flex-direction:column; }
    #chat-widget-input { display:flex; border-top:1px solid #ddd; }
    #chat-widget-input input { flex:1; padding:10px; border:none; outline:none; font-size:14px; }
    #chat-widget-input button { padding:10px 16px; border:none; background:linear-gradient(135deg,#4facfe,#00f2fe); color:white; cursor:pointer; transition:background 0.3s; }
    #chat-widget-input button:hover { background:linear-gradient(135deg,#00f2fe,#4facfe); }
    .chat-widget-message { margin-bottom:8px; padding:6px 10px; border-radius:10px; max-width:80%; word-wrap:break-word; font-size:14px; line-height:1.4; }
    .chat-widget-message.user { background:#4facfe; color:#fff; align-self:flex-end; }
    .chat-widget-message.agent { background:#e0e0e0; color:#333; align-self:flex-start; }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'chat-widget-toggle';
  btn.innerText = '💬';
  document.body.appendChild(btn);

  const box = document.createElement('div');
  box.id = 'chat-widget-box';
  box.innerHTML = `
    <div id="chat-widget-messages"></div>
    <div id="chat-widget-input">
      <input type="text" id="chat-widget-text" placeholder="Type a message..." />
      <button id="chat-widget-send">Send</button>
    </div>
  `;
  document.body.appendChild(box);

  if (btn) {
    btn.addEventListener('click', () => {
      if (box.style.display === 'flex') {
        box.style.display = 'none';
      } else {
        box.style.display = 'flex';
      }
    });
  }

  // Lấy URL server từ script src hoặc dùng mặc định
  const currentScript = document.currentScript || document.querySelector('script[src*="chat-widget.js"]');
  const scriptSrc = currentScript ? currentScript.src : '';
  const serverUrl = scriptSrc ? new URL(scriptSrc).origin : window.location.origin;

  const socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    withCredentials: false
  });

  let visitorId = localStorage.getItem('chat-widget-visitorId');
  if (!visitorId) {
    visitorId = 'visitor-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chat-widget-visitorId', visitorId);
  }

  const messagesDiv = document.getElementById('chat-widget-messages');
  const input = document.getElementById('chat-widget-text');
  const sendBtn = document.getElementById('chat-widget-send');

  if (!messagesDiv || !input || !sendBtn) {
    console.error('Chat elements not found');
    return;
  }

  function renderMessage(m) {
    if (!m || !m.text) return;
    const div = document.createElement('div');
    div.className = 'chat-widget-message ' + (m.sender === 'user' ? 'user' : 'agent');
    div.textContent = m.text;
    if (messagesDiv) {
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    console.log('Message rendered:', m);
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    // Hiển thị tin nhắn ngay lập tức
    renderMessage({ sender: 'user', text: text });
    
    socket.emit('send_message', { visitorId, text });
    input.value = '';
    console.log('Message sent:', text);
  }

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });

  socket.on('message_received', msg => {
    console.log('Message received from server:', msg);
    // Không render lại vì đã render khi gửi
  });

  socket.on('message_from_admin', ({ visitorId: id, message }) => {
    console.log('Message from admin:', id, message);
    if (id === visitorId && message) {
      renderMessage(message);
    }
  });

  socket.on('connect', () => {
    console.log('✅ Chat widget connected to server:', serverUrl);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Chat widget connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('❌ Chat widget socket error:', error);
  });

  socket.on('disconnect', () => {
    console.log('⚠️ Chat widget disconnected');
  });

  console.log('🚀 Chat widget initialized with server:', serverUrl);
})();
