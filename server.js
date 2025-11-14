// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Lưu chat tạm thời
let chatHistory = {};

app.use(express.static(path.join(process.cwd(), 'public')));

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('send_message', ({ visitorId, text }) => {
    if (!chatHistory[visitorId]) chatHistory[visitorId] = [];
    const message = { sender: 'user', text, timestamp: new Date() };
    chatHistory[visitorId].push(message);

    socket.emit('message_received', message);
    io.to('admin').emit('new_message', { visitorId, message });
  });

  socket.on('join_admin', () => {
    socket.join('admin');
    socket.emit('all_chats', chatHistory);
  });

  socket.on('send_admin_message', ({ visitorId, text }) => {
    if (!chatHistory[visitorId]) chatHistory[visitorId] = [];
    const message = { sender: 'admin', text, timestamp: new Date() };
    chatHistory[visitorId].push(message);

    io.emit('message_from_admin', { visitorId, message });
    socket.emit('message_sent', { visitorId, message });
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
