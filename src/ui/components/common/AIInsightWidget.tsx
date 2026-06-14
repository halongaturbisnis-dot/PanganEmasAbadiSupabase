import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../../../types';
import { RotateCcw, Copy, Download, MessageSquare, BookOpen, Send } from 'lucide-react';
import { Card, CardHeader, CardContent } from './Card';
import { useGlobalState } from '../../../logic/context/GlobalContext';
import { appAssets } from '../../../ui/styles/assets';

interface AIInsightWidgetProps {
  startDate: string;
  endDate: string;
}

const WaveLoader = () => (
    <div className="flex gap-1 items-center justify-center py-4">
      <div className="w-1.5 h-1.5 bg-[#004691] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-[#004691] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-[#004691] rounded-full animate-bounce"></div>
    </div>
);



const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);
    return <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-3 rounded-lg text-xs shadow-lg">{message}</div>;
};

export const AIInsightWidget: React.FC<AIInsightWidgetProps> = ({ startDate, endDate }) => {
  const { state } = useGlobalState();
  const isMobile = state.viewport.isMobile;

  const [insight, setInsight] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'analyse' | 'chat'>('analyse');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const insightRef = useRef<HTMLDivElement>(null);

  const handleRestart = () => {
    setChatHistory([]);
    setError(null);
  };

  const notify = (msg: string) => setToastMessage(msg);

  const handleCopy = async () => {
    if (insightRef.current) {
        const text = insightRef.current.innerText;
        await navigator.clipboard.writeText(text);
        notify('Berhasil disalin!');
    }
  };

  const handleDownload = () => {
    if (insightRef.current) {
        const text = insightRef.current.innerText;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analisis-finansial.txt';
        a.click();
        URL.revokeObjectURL(url);
        notify('File diunduh!');
    }
  };


  const handleFetchInsight = async (mode: 'standard' | 'deep', questionText?: string) => {
    if (questionCount >= 10) {
        setError('Maaf, Anda mencapai limit fitur AI hari ini');
        return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Add user question to history
    let newHistory = questionText 
        ? [...chatHistory, { role: 'user', content: questionText } as ChatMessage]
        : chatHistory;
        
    setChatHistory(newHistory);
    
    try {
      const response = await fetch('/api/ai/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            startDate, 
            endDate, 
            mode, 
            question: questionText,
            history: newHistory 
        })
      });
      
      if (!response.ok) {
        let errMsg = 'Gagal memproses data. Pastikan koneksi server aktif.';
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

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream response tidak dapat diinisialisasi.');

      let accumulatedContent = '';
      const decoder = new TextDecoder();
      
      // Temporary assistant message
      setChatHistory(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
             try {
              const json = JSON.parse(line.slice(6));
              if (json.content) {
                accumulatedContent += json.content;
                setChatHistory(prev => {
                    const next = [...prev];
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
      setError(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;
    const q = inputQuestion.trim();
    setInputQuestion('');
    handleFetchInsight('standard', q);
  };

  const handleChipClick = (question: string) => {
    handleFetchInsight('standard', question);
  };

  // Sugesti pertanyaan instan yang relevan bagi pebisnis
  const presetQuestions = [
    'Bagaimana kondisi likuiditas & kecukupan kas saat ini?',
    'Mengapa pengeluaran operasional saya tinggi?',
    'Apakah piutang yang beredar aman?',
    'Apa 3 langkah nyata memaksimalkan margin profit?'
  ];

  // Parser mandiri markdown murni ke JSX (Tanpa emoji/icon)
  const parseMarkdownToJSX = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Sub-kategori / Header Sub (e.g. ### Judul)
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-[0.875rem] font-bold mt-4 mb-2 text-slate-800 border-b border-slate-100 pb-1">
            {line.slice(4)}
          </h4>
        );
      }
      // Header Utama (e.g. ## atau #)
      if (line.startsWith('## ') || line.startsWith('# ')) {
        const title = line.replace(/^#+\s+/, '');
        return (
          <h3 key={idx} className="text-[1rem] font-extrabold mt-6 mb-3 text-slate-900 border-l-4 border-[#004691] pl-3">
            {title}
          </h3>
        );
      }

      // Check item berpoin tebal (e.g. - **Judul**: Deskripsi)
      if (/^[-*]\s+\*\*(.*?)\*\*:(.*)/.test(line)) {
        const match = line.match(/^[-*]\s+\*\*(.*?)\*\*:(.*)/);
        const title = match ? match[1] : '';
        const desc = match ? match[2] : '';
        return (
          <div key={idx} className="ml-5 mb-2 text-[0.8125rem] text-slate-700 leading-relaxed flex items-start gap-1">
            <span className="text-slate-400 select-none mr-2">•</span>
            <div>
              <strong className="text-slate-900 font-semibold">{title}</strong>: {desc}
            </div>
          </div>
        );
      }

      // Check item berpoin tebal tanpa titik dua (e.g. - **Judul** Deskripsi)
      if (/^[-*]\s+\*\*(.*?)\*\*(.*)/.test(line)) {
        const match = line.match(/^[-*]\s+\*\*(.*?)\*\*(.*)/);
        const title = match ? match[1] : '';
        const desc = match ? match[2] : '';
        return (
          <div key={idx} className="ml-5 mb-2 text-[0.8125rem] text-slate-700 leading-relaxed flex items-start gap-1">
            <span className="text-slate-400 select-none mr-2">•</span>
            <div>
              <strong className="text-slate-900 font-bold">{title}</strong> {desc}
            </div>
          </div>
        );
      }

      // Check item list biasa (e.g. - Deskripsi)
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().replace(/^[-*]\s+/, '');
        return (
          <div key={idx} className="ml-5 mb-1.5 text-[0.8125rem] text-slate-700 leading-relaxed flex items-start gap-1">
            <span className="text-slate-400 select-none mr-2">•</span>
            <span>{content}</span>
          </div>
        );
      }

      // Baris kosong
      if (line.trim() === '') return <div key={idx} className="h-2" />;

      // Dukungan cetak tebal inline biasa (**teks**)
      const parts = line.split(/\*\*(.*?)\*\*/g);
      if (parts.length > 1) {
        return (
          <p key={idx} className="text-[0.8125rem] text-slate-700 leading-relaxed mb-2">
            {parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-slate-900 font-semibold">{part}</strong> : part)}
          </p>
        );
      }

      return <p key={idx} className="text-[0.8125rem] text-slate-700 leading-relaxed mb-2">{line}</p>;
    });
  };

  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
      
      {/* Header Widget */}
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <img src={appAssets.MaindiLogo} alt="Maindi Logo" className="w-8 h-8 object-contain" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">Maindi AI Assistant</span>
          </div>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          {isCollapsed ? 'Tampil' : 'Sembunyi'}
        </button>
      </CardHeader>

      {/* Konten Widget */}
      {!isCollapsed && (
        <CardContent className="p-4">
          
          {/* Menu Selector Tab */}
          <div className="flex border-b border-slate-100 mb-4">
            <button
              onClick={() => { setActiveTab('analyse'); }}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center ${
                activeTab === 'analyse' 
                  ? 'border-[#004691] text-[#004691]' 
                  : 'border-transparent text-slate-400'
              }`}
            >
              Analisis
            </button>
            <button
              onClick={() => { setActiveTab('chat'); }}
              className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center ${
                activeTab === 'chat' 
                  ? 'border-[#004691] text-[#004691]' 
                  : 'border-transparent text-slate-400'
              }`}
            >
              Tanya
            </button>
          </div>

          <div ref={insightRef} className="space-y-4 max-h-[25rem] overflow-y-auto">
            {chatHistory.map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-slate-100 ml-8' : 'bg-[#f0f4ff] mr-8'}`}>
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase text-[#004691]">{msg.role === 'user' ? 'Anda' : 'Maindi AI'}</span>
                        {msg.role === 'assistant' && (
                            <div className="flex gap-2">
                                <button onClick={handleRestart} className="hover:opacity-75 transition-opacity"><RotateCcw size={12} className="text-[#004691]"/></button>
                                <button onClick={handleCopy} className="hover:opacity-75 transition-opacity"><Copy size={12} className="text-[#004691]"/></button>
                                <button onClick={handleDownload} className="hover:opacity-75 transition-opacity"><Download size={12} className="text-[#004691]"/></button>
                            </div>
                        )}
                     </div>
                     <div className="prose prose-slate max-w-none text-[0.8125rem]">
                        {parseMarkdownToJSX(msg.content)}
                     </div>
                </div>
            ))}
          </div>

          {/* Form Input (hanya di tab chat) */}
          {activeTab === 'chat' && (
             <form onSubmit={handleQuestionSubmit} className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                <input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Ketik pertanyaan..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isLoading}
                  className="px-4 py-2 bg-[#004691] text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </form>
          )}

          {/* KONDISI LOADING */}
          {isLoading && (
             <div className="flex flex-col items-center justify-center py-4">
                <WaveLoader />
             </div>
          )}
          
          {/* KONDISI ERROR */}
          {error && (
            <div className="p-3 text-center text-rose-600 bg-rose-50 rounded-lg text-xs mt-4">
              {error}
            </div>
          )}

        </CardContent>
      )}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </Card>
  );
};
