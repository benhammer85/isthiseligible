import React, { useState, useRef, useMemo, useEffect } from 'react';
import Header from './components/Header';
import ResultDisplay from './components/ResultDisplay';
import { analyzeBikePurchase } from './services/geminiService';
import { trackSearch, trackPageView } from './services/telemetry';
import { AnalysisState } from './types';
import { EXAMPLE_PURCHASES } from './constants';

const App: React.FC = () => {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    result: null,
    error: null,
  });
  const [inputText, setInputText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    trackPageView('Home');
  }, []);

  const handleFollowUp = async (question: string, customAnswer: string) => {
    const context = `Context: The user previously asked about a bike purchase. 
Model Question: ${question}
User Answer: ${customAnswer}

Please re-evaluate eligibility based on this new information.`;
    
    setInputText(`Answering: ${question} -> ${customAnswer}`);
    setState({ ...state, isAnalyzing: true, result: null });
    try {
      const result = await analyzeBikePurchase(context);
      setState({ isAnalyzing: false, result, error: null });
      trackSearch(result.itemName || "Clarification", result.status);
    } catch (err: any) {
      setState({ isAnalyzing: false, result: null, error: err.message || 'Failed to re-analyze.' });
    }
  };

  const resizeImage = (file: File): Promise<{ data: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          resolve({ data: canvas.toDataURL('image/jpeg', 0.8).split(',')[1], mimeType: 'image/jpeg' });
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setState({ ...state, isAnalyzing: true, error: null });
    try {
      let payload;
      if (file.type.startsWith('image/')) {
        payload = await resizeImage(file);
      } else {
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result?.toString().split(',')[1] || "");
          reader.readAsDataURL(file);
        });
        payload = { data: base64Data, mimeType: file.type };
      }
      const result = await analyzeBikePurchase(payload);
      setState({ isAnalyzing: false, result, error: null });
      trackSearch(result.itemName || "Image Upload", result.status);
    } catch (err: any) {
      setState({ isAnalyzing: false, result: null, error: err.message || 'Analysis failed.' });
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setState({ ...state, isAnalyzing: true, error: null });
    try {
      const result = await analyzeBikePurchase(inputText);
      setState({ isAnalyzing: false, result, error: null });
      trackSearch(result.itemName || inputText, result.status);
    } catch (err: any) {
      setState({ isAnalyzing: false, result: null, error: err.message || 'Failed to analyze text.' });
    }
  };

  const randomExample = useMemo(() => {
    return EXAMPLE_PURCHASES[Math.floor(Math.random() * EXAMPLE_PURCHASES.length)];
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col selection:bg-black selection:text-white">
      <Header />

      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-16">
          <h2 className="text-6xl md:text-8xl font-black text-black mb-6 tracking-tighter leading-[0.9] uppercase italic">
            Eligibility Check
          </h2>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
             <div className="h-2 w-24 bg-red-600"></div>
             <p className="text-black max-w-lg font-bold text-lg leading-snug">
               Scan receipts, provide a product link or describe your gear to determine eligibility for the bike benefit program.
             </p>
          </div>
        </div>

        {state.error && (
          <div className="mb-8 bg-red-600 text-white p-6 border-4 border-black brutalist-shadow-sm">
            <div className="flex items-center gap-4">
              <i className="fas fa-circle-exclamation text-3xl"></i>
              <div className="flex-grow">
                <h4 className="font-black uppercase tracking-tight">System Notice</h4>
                <p className="text-sm font-bold opacity-90">{state.error}</p>
              </div>
              <button onClick={() => setState({ ...state, error: null })} className="bg-white text-black px-4 py-2 font-black text-xs uppercase">Dismiss</button>
            </div>
          </div>
        )}

        {state.result ? (
          <ResultDisplay 
            result={state.result} 
            onReset={() => setState({ ...state, result: null, error: null })} 
            onFollowUp={handleFollowUp}
          />
        ) : state.isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-32 text-center overflow-hidden">
            <div className="w-full max-w-md mb-12">
               {/* Minimalist Brutalist Progress Bar */}
               <div className="w-full h-4 bg-gray-200 border-4 border-black relative overflow-hidden">
                 <div className="absolute top-0 bottom-0 bg-black w-1/3 animate-[brutalist-progress_1.5s_infinite_ease-in-out]"></div>
               </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-4xl font-black text-black tracking-tighter uppercase italic">
                Pedaling through the fine print...
              </h3>
            </div>

            <style>{`
              @keyframes brutalist-progress {
                0% { left: -33%; width: 33%; }
                50% { left: 33%; width: 50%; }
                100% { left: 100%; width: 33%; }
              }
            `}</style>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div onClick={() => fileInputRef.current?.click()} className="bg-white border-4 border-black p-8 flex flex-col items-start justify-end h-96 brutalist-shadow cursor-pointer hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all group relative overflow-hidden">
              <div className="absolute top-6 left-6 text-4xl text-black group-hover:scale-110 transition-transform"><i className="fas fa-camera-retro"></i></div>
              <div className="absolute top-6 right-6 opacity-10 text-8xl"><i className="fas fa-receipt"></i></div>
              <div className="w-full">
                <h3 className="text-3xl font-black text-black uppercase leading-none mb-2">Upload<br/>Receipt</h3>
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider italic">JPG, PNG or PDF</p>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf" />
            </div>

            <div className="bg-white border-4 border-black p-8 flex flex-col h-96 brutalist-shadow hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
              <form onSubmit={handleTextSubmit} className="flex flex-col h-full gap-4">
                <div className="flex-grow">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 block mb-2">Input Details</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Describe your item (e.g. '${randomExample}')`}
                    className="w-full h-44 bg-gray-50 p-4 border-2 border-transparent focus:border-black outline-none transition-all resize-none font-bold text-lg placeholder:text-gray-300"
                  />
                </div>
                <button type="submit" disabled={!inputText.trim()} className="w-full bg-black text-white font-black py-5 px-6 brutalist-button hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all uppercase tracking-widest text-sm">
                  Analyze Item →
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 bg-black text-white mt-auto">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="text-left md:text-right ml-auto">
            <p className="text-xs text-gray-400 font-bold uppercase mb-2">Need Support?</p>
            <a href="mailto:commuterchoice@harvard.edu" className="text-2xl font-black hover:text-red-500 transition-colors underline decoration-4 underline-offset-4">
              Contact CommuterChoice
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;