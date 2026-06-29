import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, X, MessageSquare, Clock } from 'lucide-react';

const ChatComponent = ({ bookingId, user, receiverName, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Establish Socket.io connection
    const socket = io('http://localhost:5000', {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket client connected:', socket.id);
      // Join booking room
      socket.emit('join_booking_chat', { bookingId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Message listener
    socket.on('receive_booking_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Populate initial system/welcome message
    setMessages([
      {
        sender: { id: 'system', name: 'System' },
        message: `Welcome to the secure Booking Chat. Send a message to start conversation with ${receiverName}.`,
        timestamp: new Date(),
      },
    ]);

    return () => {
      socket.disconnect();
    };
  }, [bookingId, receiverName]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const payload = {
      bookingId,
      sender: { id: user.id, name: user.name },
      message: inputMessage,
    };

    // Emit message to backend
    socketRef.current.emit('send_booking_message', payload);
    setInputMessage('');
  };

  return (
    <div className="flex h-96 w-80 flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 bg-brand px-4 py-3 text-white rounded-t-2xl dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <div>
            <h4 className="text-sm font-bold truncate max-w-[140px]">{receiverName}</h4>
            <span className="text-[10px] opacity-90">
              {isConnected ? '● Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => {
          const isMe = m.sender.id === user.id;
          const isSystem = m.sender.id === 'system';

          if (isSystem) {
            return (
              <div key={idx} className="text-center">
                <span className="inline-block rounded-lg bg-neutral-100 px-3 py-1.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  {m.message}
                </span>
              </div>
            );
          }

          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  isMe
                    ? 'bg-brand text-white rounded-br-none'
                    : 'bg-neutral-100 text-neutral-800 rounded-bl-none dark:bg-neutral-800 dark:text-white'
                }`}
              >
                {m.message}
              </div>
              <span className="mt-1 flex items-center gap-1 text-[9px] text-neutral-400">
                <Clock className="h-2.5 w-2.5" />
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="flex border-t border-neutral-100 p-2.5 dark:border-neutral-800">
        <input
          type="text"
          placeholder="Type message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 bg-transparent px-2 text-xs outline-none dark:text-white"
        />
        <button type="submit" className="rounded-full bg-brand p-2 text-white transition hover:bg-brand-dark">
          <Send className="h-3 w-3" />
        </button>
      </form>

    </div>
  );
};

export default ChatComponent;
