import React from 'react';
import { ChatMessage } from '../types';
import { Sparkles, X, Send, Cpu } from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isChatting: boolean;
  onSendChat: (e: React.FormEvent) => void;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatDrawer({
  isOpen,
  onClose,
  chatMessages,
  chatInput,
  setChatInput,
  isChatting,
  onSendChat,
  chatBottomRef
}: ChatDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end font-sans transition-all duration-300">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800/80 h-full flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-slideIn">
        
        {/* Chat Drawer Header */}
        <div className="p-4 border-b border-slate-800/60 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <span className="font-display font-bold text-xs tracking-tight text-white block">JARVIS CO-PILOT</span>
              <span className="text-[8px] font-mono font-bold text-slate-500 block uppercase tracking-wide">Cognitive Advisory Node</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer border border-transparent hover:border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Log Board */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin text-xs">
          {chatMessages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border leading-relaxed relative ${
                  isUser 
                    ? 'bg-amber-500/5 border-amber-500/15 ml-8 text-amber-200/90' 
                    : 'bg-slate-900/60 border-slate-850 mr-8 text-slate-300'
                }`}
              >
                <span className={`font-mono font-bold text-[8px] block mb-1 uppercase tracking-wider ${
                  isUser ? 'text-amber-400/80' : 'text-slate-500'
                }`}>
                  {isUser ? 'Active Trader' : 'Jarvis Intelligence'}
                </span>
                <div className="whitespace-pre-line font-sans leading-normal">{msg.content}</div>
              </div>
            );
          })}
          
          {isChatting && (
            <div className="p-4 bg-slate-900/20 border border-slate-900 mr-8 text-slate-500 italic rounded-xl flex items-center gap-2 font-mono">
              <Cpu className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              <span>Analyzing order logs...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Chat Drawer Input Form */}
        <form onSubmit={onSendChat} className="p-4 border-t border-slate-800/60 bg-slate-900/20 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about SMC setups or lot sizing..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/40 font-sans"
            disabled={isChatting}
          />
          <button
            type="submit"
            disabled={isChatting}
            className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-slate-950 font-sans font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </form>

      </div>
    </div>
  );
}
