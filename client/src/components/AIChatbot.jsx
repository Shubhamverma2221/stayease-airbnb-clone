import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import axios from 'axios';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your StayEase travel companion. Ask me about properties, dynamic pricing, 2FA safety setup, or booking checkouts!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat logs
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Extract propertyId dynamically if viewing a listing details page
  const getContextPropertyId = () => {
    const parts = window.location.pathname.split('/');
    if (parts[1] === 'properties' && parts[2]) {
      return parts[2];
    }
    return null;
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Append user message
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setInput('');
    setLoading(true);

    const propertyId = getContextPropertyId();

    try {
      const res = await axios.post('/api/ai/chat', {
        message: text,
        propertyId
      });

      setMessages(prev => [...prev, { sender: 'ai', text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: 'Oops! I encountered a connection issue. Please try again shortly.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (suggestionText) => {
    handleSend(suggestionText);
  };

  const quickSuggestions = [
    { label: '🔒 Setup 2FA', text: 'How do I activate 2FA security?' },
    { label: '💳 Payment Info', text: 'What payment methods are supported?' },
    { label: '🏡 Become a Host', text: 'How do I register as a host?' },
    { label: '🏊 Private Pool?', text: 'Is there a pool at this stay?' },
    { label: '🌦️ Weather Forecast', text: 'How is the local weather?' }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-2xl transition hover:scale-105 active:scale-95 duration-200 cursor-pointer border border-white/10 ${
          isOpen ? '' : 'animate-float-wiggle'
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Floating Glass Chat Box */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[460px] w-[330px] sm:w-[360px] flex-col rounded-3xl ios-glass shadow-2xl overflow-hidden border border-white/20 animate-fade-in">
          
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-white/10 bg-brand/10 p-4 dark:border-neutral-800">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand shadow-md">
              <Bot className="h-5 w-5 text-white" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white dark:border-neutral-800 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-905 dark:text-white flex items-center gap-1">
                <span>StayEase Concierge</span>
                <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">AI Travel Assistant</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs font-semibold leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-brand text-white'
                      : 'bg-white/90 text-neutral-800 border dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl p-3 bg-white/90 border dark:bg-neutral-800 dark:border-neutral-700 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Quick Pills */}
          <div className="px-4 py-2 border-t border-dashed border-white/10 dark:border-neutral-800 overflow-x-auto flex gap-1.5 whitespace-nowrap scrollbar-none">
            {quickSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestion(s.text)}
                className="rounded-full bg-white/40 dark:bg-neutral-800/40 px-3 py-1 text-[10px] font-bold text-neutral-700 hover:bg-white/60 dark:text-neutral-300 dark:hover:bg-neutral-800/60 border border-white/10"
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-white/15 bg-white/40 p-3 dark:border-neutral-800 dark:bg-neutral-850/40"
          >
            <input
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-xl border border-neutral-200 bg-white/80 py-2 px-3.5 text-xs outline-none focus:border-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand text-white shadow hover:bg-brand-dark transition duration-150 active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};

export default AIChatbot;
