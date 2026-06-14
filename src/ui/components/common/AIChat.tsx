import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../../types';
import { RotateCcw, Copy, Download, Send } from 'lucide-react';
import { Card, CardHeader, CardContent } from './Card';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { appAssets } from '../../../ui/styles/assets';

interface AIChatProps {
  startDate: string;
  endDate: string;
}

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg">{message}</div>;
};

// Parser mandiri markdown murni ke JSX (Tanpa emoji/icon)
const parseMarkdownToJSX = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Helper function to handle bold text (**text**)
      const formatText = (content: string) => {
          return content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
              }
              return part;
          });
      };

      if (line.startsWith('### ')) return <h4 key={idx} className="text-[0.875rem] font-bold mt-4 mb-2 text-slate-800 border-b border-slate-100 pb-1">{formatText(line.slice(4))}</h4>;
      if (line.startsWith('## ') || line.startsWith('# ')) return <h3 key={idx} className="text-[1rem] font-extrabold mt-6 mb-3 text-slate-900 border-l-4 border-[#004691] pl-3">{formatText(line.replace(/^#+\s+/, ''))}</h3>;
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) return <div key={idx} className="ml-5 mb-1.5 text-[0.8125rem] text-slate-700 leading-relaxed flex items-start gap-1"><span className="text-slate-400 select-none mr-2">•</span><span>{formatText(line.trim().replace(/^[-*]\s+/, ''))}</span></div>;
      if (line.trim() === '') return <div key={idx} className="h-2" />;
      return <p key={idx} className="text-[0.8125rem] text-slate-700 leading-relaxed mb-2">{formatText(line)}</p>;
    });
};

// Setting untuk rotasi model AI
const AI_MODEL_CONFIG = {
  rotations: [
    { model: 'llama-3.3-70b-versatile', enabled: true },
    { model: 'llama-3.1-8b-instant',    enabled: true }
  ]
};

export const AIChat: React.FC<AIChatProps> = ({ startDate, endDate }) => {
  const [insight, setInsight] = useState<string>(''); // Kept if needed, but not used in new chat logic
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const insightRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleRestart = () => {
    setChatHistory([]);
    setError(null);
  };

  const notify = (msg: string) => setToastMessage(msg);

  const handleCopy = async () => {
    if (insightRef.current) {
        await navigator.clipboard.writeText(insightRef.current.innerText);
        notify('Berhasil disalin!');
    }
  };

  const downloadSession = () => {
      const text = chatHistory
        .map(m => `--- [${m.role.toUpperCase()}] ---\n${m.content.replace(/\*\*/g, '')}\n`)
        .join('\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sesi-chat-maindi-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      notify('Sesi diunduh!');
  };

  const handleDownload = () => {
    if (insightRef.current) {
        const text = insightRef.current.innerText;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat-ai.txt';
        a.click();
        URL.revokeObjectURL(url);
        notify('File diunduh!');
    }
  };

  const handleFetchInsight = async (questionText: string) => {
    if (questionCount >= 10) {
        setError('Maaf, Anda mencapai limit fitur AI hari ini');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // 1. Tambahkan user message DAN placeholder assistant message agar bubble muncul segera
    setChatHistory(prev => [...prev, { role: 'user', content: questionText }, { role: 'assistant', content: '' }]);
    
    // Fungsi helper untuk memanggil fetch dengan model tertentu
    const attemptFetch = async (model: string) => {
        const response = await fetch('/api/ai/analyze-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                startDate, 
                endDate, 
                mode: 'standard', 
                question: questionText, 
                history: chatHistory,
                model // Pass model ke API route jika perlu, atau handle di aiService
            })
        });
        return response;
    };

    try {
      let response;
      let usedModelIndex = -1;

      // Coba model berdasarkan rotasi yang enabled
      for (let i = 0; i < AI_MODEL_CONFIG.rotations.length; i++) {
          if (AI_MODEL_CONFIG.rotations[i].enabled) {
              response = await attemptFetch(AI_MODEL_CONFIG.rotations[i].model);
              usedModelIndex = i;
              if (response.ok) break; 
              // Jika muncul error 429 atau lainnya, coba model berikutnya
              if (response.status !== 429 && i === AI_MODEL_CONFIG.rotations.length - 1) {
                  let errMsg = 'Gagal memproses data.';
                  try {
                      const errData = await response.json();
                      if (errData && errData.error) {
                          errMsg = errData.error;
                      }
                  } catch (e) {
                      // non-JSON or standard error
                  }
                  throw new Error(errMsg);
              }
          }
      }

      if (!response || !response.ok) throw new Error('LIMIT_EXCEEDED');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream response tidak dapat diinisialisasi.');

      let accumulatedContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
             try {
              const json = JSON.parse(line.slice(6));
              if (json.content) {
                accumulatedContent += json.content;
                setChatHistory(prev => {
                    const next = [...prev];
                    // Update content. Placeholder assistant bubble ada di index terakhir
                    next[next.length - 1].content = accumulatedContent;
                    return next;
                });
              }
             } catch (e) {}
          }
        }
      }
      setQuestionCount(prev => prev + 1);
    } catch (err: any) {
      const message = err?.message === 'LIMIT_EXCEEDED' ? 'Maaf, fitur AI sudah mencapai limit' : (err?.message || 'Terjadi kesalahan sistem.');
      setError(message);
      // Remove the failed placeholder if error happens
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={appAssets.MaindiAI} alt="Maindi AI" className="w-8 h-8 object-contain" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">MAINDI ASSISTANT</span>
        </div>
        {chatHistory.length > 0 && (
          <button onClick={downloadSession} className="text-[#004691] hover:opacity-75"><Download size={14}/></button>
        )}
      </header>

      {/* Chat Session (Scrollable) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
            Tanya sesuatu atau pilih quick question
          </div>
        ) : (
          chatHistory.map((msg, i) => (
            <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-slate-100 ml-8' : 'bg-[#f0f4ff] mr-8'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {msg.role === 'assistant' && <img src={appAssets.MaindiAI} alt="Logo" className="w-4 h-4"/>}
                  <span className="text-[10px] font-bold uppercase text-[#004691]">{msg.role === 'user' ? 'Anda' : 'Maindi AI'}</span>
                </div>
                {msg.role === 'assistant' && (
                  <div className="flex gap-2">
                      <button onClick={handleRestart} className="hover:opacity-75"><RotateCcw size={12} className="text-[#004691]"/></button>
                      <button onClick={handleCopy} className="hover:opacity-75"><Copy size={12} className="text-[#004691]"/></button>
                      <button onClick={handleDownload} className="hover:opacity-75"><Download size={12} className="text-[#004691]"/></button>
                  </div>
                )}
              </div>
              <div ref={msg.role === 'assistant' ? insightRef: null} className="prose prose-slate max-w-none text-[0.8125rem]">
                {msg.role === 'assistant' && isLoading && msg.content === '' ? (
                    <div className="flex items-center gap-1 py-1">
                        <span className="w-2 h-2 bg-[#004691] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-[#004691] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-[#004691] rounded-full animate-bounce"></span>
                    </div>
                ) : (
                    parseMarkdownToJSX(msg.content)
                )}
              </div>
            </div>
          ))
        )}
        {error && <div className="p-3 text-center text-rose-600 bg-rose-50 rounded-lg text-xs mt-4">{error}</div>}
      </div>

      {/* Footer (Fixed at bottom) */}
      <footer className="p-4 border-t border-slate-100 bg-white">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['Kondisi Kas?', 'Analisis Profit?', 'Beban Tinggi?'].map(q => (
            <button key={q} onClick={() => handleFetchInsight(q)} className="text-[10px] p-2 rounded-lg bg-[#004691] text-white font-bold transition-all truncate hover:bg-opacity-90">
              {q}
            </button>
          ))}
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); if(inputQuestion.trim()){ handleFetchInsight(inputQuestion); setInputQuestion(''); } }} className="flex gap-2">
          <input type="text" value={inputQuestion} onChange={(e) => setInputQuestion(e.target.value)} placeholder="Ketik pertanyaan..." className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none" />
          <button type="submit" disabled={!inputQuestion.trim() || isLoading} className="px-4 py-2 bg-[#004691] text-white rounded-lg text-xs font-bold disabled:opacity-50">
            <Send size={14} />
          </button>
        </form>
      </footer>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
};
