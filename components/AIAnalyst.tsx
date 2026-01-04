import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { ChatMessage, DiskNode } from '../types';
import { getAggregatedStats } from '../mockData';

interface AIAnalystProps {
  diskData: DiskNode;
}

export const AIAnalyst: React.FC<AIAnalystProps> = ({ diskData }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Hello! I\'m your Disk AI Analyst. I\'ve scanned your disk structure. Ask me anything about your storage usage, like "What is taking up the most space?" or "Suggest some files to clean up."',
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      // Prepare context - summarize data to avoid token limits
      const stats = getAggregatedStats();
      const topFiles = stats.slice(0, 5).map(s => `${s.name}: ${s.value} bytes`);
      const context = `
        Disk Summary:
        - Total Root Size: ${diskData.size} bytes
        - Top File Types: ${JSON.stringify(topFiles)}
        - Structure Sample: Users/Admin/Downloads has large files.
        - Detailed Structure (JSON snippet): ${JSON.stringify(diskData).substring(0, 2000)}...
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          System: You are a helpful IT expert analyzing a user's disk usage. 
          Here is the file system summary data: ${context}
          
          User Question: ${input}
          
          Answer concisely and provide specific actionable advice if possible. Format response in Markdown.
        `,
      });

      const text = response.text || "I couldn't analyze that right now.";

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error connecting to the AI service. Please check your API key configuration.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg">AI Storage Assistant</h3>
            <p className="text-xs text-indigo-100 opacity-80">Powered by Gemini 3 Flash</p>
          </div>
        </div>
        {!process.env.API_KEY && (
             <div className="flex items-center text-xs bg-red-500/80 px-3 py-1 rounded text-white font-medium">
                <AlertCircle className="w-3 h-3 mr-1" />
                No API Key
             </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1 mx-2 ${
                msg.role === 'user' ? 'bg-blue-500' : 'bg-indigo-600'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div
                className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-tr-none'
                    : 'bg-white text-gray-700 rounded-tl-none border border-gray-200'
                }`}
              >
                {msg.text.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">{line}</p>
                ))}
                <span className={`text-[10px] block mt-2 opacity-60 ${msg.role === 'user' ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex flex-row items-center space-x-2 mx-12">
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                <span className="text-xs text-gray-500 font-medium">Analyzing disk data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your disk usage..."
            className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-center">
            <p className="text-[10px] text-gray-400">AI can make mistakes. Verify important file details manually.</p>
        </div>
      </div>
    </div>
  );
};