import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, X, Send, Terminal, Sparkles, AlertCircle, Plus, Trash2, Clock, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { useAiChat } from '../../hooks/useAi';
import client from '../../api/client';
import { db } from '../../db/db';
import { useSpatialStore } from '../../store/spatialStore';

const AssistantDrawer = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'system',
      text: 'SYSTEM BOOT: NARI Operational. Core services synchronized. Ready for directives.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [showBrainContext, setShowBrainContext] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [brainContext, setBrainContext] = useState('FETCHING SYSTEM STATE...');
  
  // Local-first persistent chat states
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const messagesEndRef = useRef(null);
  const aiChat = useAiChat();

  const activeSuggestions = [
    { label: 'Request Morning Brief', text: 'Good morning NARI, please compile my morning briefing.' },
    { label: 'Status of Goals & Habits', text: 'What is the status of my active goals and habits?' },
    { label: 'Review Today\'s Schedule', text: 'What tasks and reminders do I have scheduled for today?' },
    { label: 'Weather Impact Report', text: 'NARI, how does the current weather impact my planning?' }
  ];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiChat.isPending]);

  // Fetch brain context when drawer is open
  useEffect(() => {
    if (isOpen && showBrainContext) {
      fetchContext();
    }
  }, [isOpen, showBrainContext]);

  // Load chat sessions from IndexedDB on mount or when drawer opens
  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    try {
      const allSessions = await db.chat_sessions.orderBy('updated_at').reverse().toArray();
      setSessions(allSessions);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  };

  const selectSession = async (sessionId) => {
    try {
      const historyMessages = await db.chat_messages
        .where('session_id')
        .equals(sessionId)
        .toArray();

      const formatted = historyMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        text: msg.text,
        action: msg.action,
        status: msg.status || 'success',
        timestamp: new Date(msg.timestamp)
      }));

      // If empty, reset to system welcome
      if (formatted.length === 0) {
        setMessages([
          {
            id: 'welcome',
            role: 'system',
            text: 'SYSTEM BOOT: NARI Operational. Core services synchronized. Ready for directives.',
            timestamp: new Date()
          }
        ]);
      } else {
        setMessages(formatted);
      }
      
      setActiveSessionId(sessionId);
    } catch (err) {
      console.error('Failed to select chat session:', err);
    }
  };

  const startNewChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'system',
        text: 'SYSTEM BOOT: NARI Operational. Core services synchronized. Ready for directives.',
        timestamp: new Date()
      }
    ]);
    setActiveSessionId(null);
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation(); // Avoid triggering selectSession
    try {
      await db.chat_sessions.delete(sessionId);
      await db.chat_messages.where('session_id').equals(sessionId).delete();
      
      if (activeSessionId === sessionId) {
        startNewChat();
      }
      loadSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const fetchContext = async () => {
    try {
      setBrainContext('SYNCING LIVE BRAIN CONTEXT...');
      const { currentCoords, activeNode } = useSpatialStore.getState();
      const params = {};
      if (currentCoords) {
        params.latitude = currentCoords[0];
        params.longitude = currentCoords[1];
      }
      if (activeNode) {
        params.active_node_label = activeNode.label;
      }
      const response = await client.get('/ai/context', { params });
      if (response && response.data) {
        setBrainContext(response.data.context || 'No context returned.');
      } else {
        setBrainContext('NARI API: NO ACTIVE DATA WINDOW FOUND.');
      }
    } catch (err) {
      setBrainContext(`LINK FAILURE: ${err.message || 'COULD NOT RETRIEVE SYSTEMS DATA'}`);
    }
  };

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    let currentSessionId = activeSessionId;

    try {
      // 1. If this is a new chat, dynamically create a chat session in Dexie first
      if (!currentSessionId) {
        const title = query.length > 30 ? query.substring(0, 30) + '...' : query;
        currentSessionId = await db.chat_sessions.add({
          title: title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setActiveSessionId(currentSessionId);
      }

      // 2. Add user message locally and to IndexedDB
      const timestamp = new Date().toISOString();
      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: query,
        timestamp: new Date(timestamp)
      };
      
      setMessages(prev => [...prev, userMsg]);
      setInput('');

      await db.chat_messages.add({
        session_id: currentSessionId,
        role: 'user',
        text: query,
        timestamp
      });

      // Update session's updated_at timestamp
      await db.chat_sessions.update(currentSessionId, {
        updated_at: timestamp
      });
      loadSessions();

      // 3. Request LLM response
      const response = await aiChat.mutateAsync(query);
      
      let text = 'LINK ERROR: No response payload received.';
      let action = null;
      let status = 'success';

      if (response) {
        if (response.data) {
          text = response.data.text || '';
          action = response.data.action || null;
          status = response.data.status || 'success';
        } else {
          text = response.text || '';
          action = response.action || null;
          status = response.status || 'success';
        }
      }

      const aiMsgTime = new Date().toISOString();
      const aiMsgId = `ai-${Date.now()}`;

      // Save AI message to IndexedDB
      await db.chat_messages.add({
        session_id: currentSessionId,
        role: 'assistant',
        text,
        action,
        status,
        timestamp: aiMsgTime
      });

      // Update session updated timestamp again
      await db.chat_sessions.update(currentSessionId, {
        updated_at: aiMsgTime
      });

      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'assistant',
        text: text,
        action: action,
        status: status,
        timestamp: new Date(aiMsgTime)
      }]);

      loadSessions();

      // If drawer is open and showBrainContext is active, refresh the context
      if (showBrainContext) {
        setTimeout(fetchContext, 500);
      }
    } catch (error) {
      let errorText = error.message || 'SYSTEM RETRIEVAL TIMEOUT';
      if (errorText.toLowerCase().includes('api key') || errorText.includes('401')) {
        errorText = `${errorText}. Please configure a valid NVIDIA NIM API Key in the Settings panel (accessible via the Gear icon in the sidebar).`;
      }
      setMessages(prev => [...prev, {
        id: `ai-err-${Date.now()}`,
        role: 'system',
        text: `CRITICAL EXCEPTION: ${errorText}`,
        status: 'error',
        timestamp: new Date()
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Dark overlay backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]"
      />

      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={clsx(
          "fixed top-0 right-0 bottom-0 bg-surface/95 backdrop-blur-2xl border-l border-primary/20 z-[60] shadow-2xl flex transition-all duration-300",
          showBrainContext 
            ? "w-full max-w-5xl" 
            : showHistoryPanel 
              ? "w-full max-w-2xl" 
              : "w-full max-w-md"
        )}
      >
        {/* Retro scanline overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px] z-10"></div>

        {/* Sidebar Panel: Chat Sessions History */}
        {showHistoryPanel && (
          <div className="flex flex-col w-80 border-r border-white/5 bg-black/40 p-5 overflow-hidden z-20">
            <div className="flex items-center justify-between mb-4 border-b border-primary/10 pb-3">
              <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock size={12} />
                Convo Streams
              </span>
              <button
                onClick={startNewChat}
                className="text-[9px] border border-primary/30 px-2 py-1 rounded-xl text-primary hover:bg-primary/10 transition-colors uppercase font-mono tracking-widest flex items-center gap-1 font-bold"
              >
                <Plus size={10} />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-[10px] font-mono text-secondary uppercase tracking-widest">
                  No convo streams initialized.
                </div>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    onClick={() => selectSession(sess.id)}
                    className={clsx(
                      "flex items-center justify-between p-3 rounded-xl border font-mono text-[10px] cursor-pointer group transition-all",
                      activeSessionId === sess.id
                        ? "bg-primary/10 border-primary/30 text-primary shadow-[0_0_10px_rgba(0,242,255,0.05)]"
                        : "bg-surface-light/30 border-transparent text-slate-300 hover:bg-white/5 hover:border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <MessageSquare size={12} className={clsx(activeSessionId === sess.id ? "text-primary" : "text-secondary")} />
                      <span className="truncate font-semibold uppercase">{sess.title}</span>
                    </div>
                    <button
                      onClick={(e) => deleteSession(e, sess.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Brain Context Live Panel (Side-car screen) */}
        {showBrainContext && (
          <div className="hidden md:flex flex-col w-1/2 border-r border-white/5 bg-black/40 p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-primary/10 pb-3">
              <span className="text-primary text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Terminal size={14} className="animate-pulse" />
                Live Brain Context
              </span>
              <button 
                onClick={fetchContext} 
                className="text-[9px] border border-primary/30 px-2 py-0.5 rounded text-primary/80 hover:bg-primary/10 transition-colors uppercase font-mono tracking-widest"
              >
                Refresh
              </button>
            </div>
            
            <pre className="flex-1 text-[10px] font-mono leading-relaxed text-success overflow-y-auto whitespace-pre-wrap select-all bg-surface/50 p-4 border border-success/15 custom-scrollbar uppercase">
              {brainContext}
            </pre>
          </div>
        )}

        {/* Chat Interface (Main Panel) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-20 bg-surface-light/40">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-secondary hover:text-primary relative group"
                title="Toggle Conversation History"
              >
                {showHistoryPanel ? <ChevronLeft size={20} /> : <MessageSquare size={20} />}
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse-slow border border-surface" />
              </button>

              <div>
                <h2 className="text-md font-black uppercase tracking-tight text-white flex items-center gap-2">
                  NARI CO-PILOT
                  <span className="text-[7px] border border-success text-success bg-success/5 px-1 py-0.5 tracking-widest animate-pulse-slow">ONLINE</span>
                </h2>
                <p className="text-[8px] font-mono text-secondary uppercase tracking-widest">Neural assistant interface</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowBrainContext(!showBrainContext)} 
                className={clsx(
                  "px-2.5 py-1.5 border font-mono text-[9px] font-black uppercase tracking-widest rounded-xl transition-all hidden md:block",
                  showBrainContext ? "bg-primary text-black border-primary" : "bg-white/5 text-secondary border-white/5 hover:border-white/10"
                )}
              >
                Inspect Context
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-secondary">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative z-20">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={clsx(
                  "flex flex-col max-w-[85%] rounded-2xl p-4 border transition-all relative overflow-hidden",
                  msg.role === 'user' 
                    ? "bg-primary/5 border-primary/20 text-white ml-auto"
                    : msg.role === 'system'
                      ? "bg-black/50 border-white/5 text-secondary text-xs font-mono font-bold tracking-tight uppercase"
                      : "bg-surface-light border-white/5 text-slate-100 mr-auto"
                )}
              >
                {/* Visual Left Accent for System/AI Responses */}
                {msg.role === 'assistant' && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent" />
                )}

                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1.5 flex justify-between gap-4">
                  <span>{msg.role === 'user' ? 'Direct Command' : msg.role === 'system' ? 'Core Status' : 'NARI Agent'}</span>
                  <span>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className={clsx(
                  "leading-relaxed break-words whitespace-pre-wrap",
                  msg.role === 'system' ? "font-mono" : "text-sm font-semibold"
                )}>
                  {msg.text}
                </p>

                {msg.action && (
                  <div className="mt-2.5 flex items-center gap-2 border border-success/20 bg-success/5 rounded-xl p-2.5 text-[9px] font-mono font-bold text-success uppercase tracking-widest">
                    <Sparkles size={12} className="animate-pulse" />
                    Action Executed: {msg.action}
                  </div>
                )}
              </div>
            ))}

            {/* AI Processing Typing Indicator */}
            {aiChat.isPending && (
              <div className="bg-surface-light border border-white/5 rounded-2xl p-4 mr-auto max-w-[85%] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-Action suggestions */}
          {messages.length < 3 && !aiChat.isPending && (
            <div className="px-6 py-2 relative z-20 space-y-2">
              <p className="text-[8px] font-mono font-black uppercase tracking-[0.25em] text-secondary">Quick System Directives</p>
              <div className="flex flex-wrap gap-2">
                {activeSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sug.text)}
                    className="text-[9px] font-mono font-bold uppercase tracking-wider text-primary/70 bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-left"
                  >
                    {`> ${sug.label}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 border-t border-white/5 relative z-20 bg-surface/50">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Transmitting direct directives..."
                className="w-full bg-surface-light border border-white/10 rounded-2xl pl-4 pr-14 py-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all font-mono"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || aiChat.isPending}
                className="absolute right-3 p-2.5 rounded-xl bg-primary text-black hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default AssistantDrawer;
