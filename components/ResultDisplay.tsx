import React, { useState } from 'react';
import { AnalysisResult, EligibilityStatus } from '../types';

interface ResultDisplayProps {
  result: AnalysisResult;
  onReset: () => void;
  onFollowUp: (question: string, customAnswer: string) => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset, onFollowUp }) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const getStatusConfig = (status: EligibilityStatus) => {
    switch (status) {
      case EligibilityStatus.ELIGIBLE:
        return { icon: 'fa-check-circle', color: 'bg-emerald-500', textColor: 'text-emerald-950', label: 'PASSED' };
      case EligibilityStatus.INELIGIBLE:
        return { icon: 'fa-times-circle', color: 'bg-red-600', textColor: 'text-white', label: 'REJECTED' };
      default:
        return { icon: 'fa-circle-question', color: 'bg-amber-400', textColor: 'text-amber-950', label: 'ON THE FENCE' };
    }
  };

  const config = getStatusConfig(result.status);
  const showFollowUps = result.followUpQuestions && result.followUpQuestions.length > 0;
  
  const hasValidCost = result.estimatedCost && 
    !['null', 'na', 'n/a', '', '0', 'none', 'unknown'].includes(result.estimatedCost.toLowerCase().replace(/[^a-z0-9]/g, ''));

  const hasGrounding = result.groundingUrls && result.groundingUrls.length > 0;

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 break-all">
            {part}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleAnswerSubmit = (index: number) => {
    const q = result.followUpQuestions![index];
    const a = answers[index] || "Not provided";
    onFollowUp(q, a);
  };

  const handleQuickConfirm = (index: number) => {
    const q = result.followUpQuestions![index];
    onFollowUp(q, "Yes, this applies to my purchase.");
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border-4 border-black brutalist-shadow relative overflow-hidden">
        <div className="flex flex-col md:flex-row">
            <div className={`${config.color} border-b-4 md:border-b-0 md:border-r-4 border-black p-8 flex flex-col items-center justify-center md:min-w-[200px]`}>
                <div className="text-5xl mb-4 text-black opacity-20"><i className={`fas ${config.icon}`}></i></div>
                <div className={`text-3xl font-black ${config.textColor} tracking-tighter uppercase italic text-center leading-none`}>
                  {config.label}
                </div>
            </div>

            <div className="flex-grow p-8">
                <div className="flex justify-between items-start mb-6 border-b-2 border-dashed border-gray-200 pb-4">
                    <div className="flex-grow pr-4">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Analysis Target</span>
                        <h3 className="text-2xl font-black text-black uppercase tracking-tight break-words">{result.itemName || 'Bike Purchase'}</h3>
                    </div>
                    {hasValidCost && (
                        <div className="bg-black text-white px-3 py-1 font-black text-sm italic h-fit shrink-0">
                          {result.estimatedCost}
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <p className="text-lg font-bold text-gray-800 leading-tight mb-6">{result.reasoning}</p>
                    
                    {showFollowUps && (
                        <div className="mb-8 bg-black text-white p-6 border-4 border-black brutalist-shadow-sm">
                            <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-amber-400">
                                <i className="fas fa-comment-dots"></i> Action Required to Finalize:
                            </h4>
                            <div className="space-y-6">
                                {result.followUpQuestions?.map((q, i) => (
                                    <div key={i} className="bg-gray-900 border-2 border-gray-800 p-4 transition-all">
                                        <div className="flex gap-3 items-start mb-4">
                                            <div className="bg-amber-400 text-black w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 mt-1">?</div>
                                            <p className="text-sm font-bold text-gray-100 leading-snug">{q}</p>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <textarea
                                              value={answers[i] || ''}
                                              onChange={(e) => setAnswers({...answers, [i]: e.target.value})}
                                              placeholder="Type your answer here..."
                                              className="w-full bg-black border-2 border-gray-700 p-3 text-white text-sm font-bold focus:border-amber-400 outline-none resize-none h-20"
                                            />
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <button 
                                                    onClick={() => handleAnswerSubmit(i)}
                                                    className="bg-amber-400 text-black px-4 py-2 font-black text-[10px] uppercase tracking-wider hover:bg-white transition-all brutalist-shadow-sm"
                                                >
                                                    Submit Answer
                                                </button>
                                                <button 
                                                    onClick={() => handleQuickConfirm(i)}
                                                    className="bg-transparent border-2 border-gray-700 text-gray-400 px-4 py-2 font-black text-[10px] uppercase tracking-wider hover:text-white hover:border-white transition-all"
                                                >
                                                    Quick Confirm (Yes)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-2 mb-6">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Recommended Actions</span>
                        {result.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm font-bold text-gray-600 bg-gray-50 p-3 border-l-4 border-black">
                                <i className="fas fa-arrow-right text-[10px] mt-1"></i>
                                <span className="leading-tight">{renderTextWithLinks(rec)}</span>
                            </div>
                        ))}
                    </div>

                    {hasGrounding && (
                      <div className="pt-4 border-t-2 border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Verification Sources</span>
                        <div className="flex flex-wrap gap-2">
                          {result.groundingUrls?.map((source, i) => (
                            <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-black px-3 py-1 text-[11px] font-black hover:bg-black hover:text-white transition-all brutalist-shadow-sm flex items-center gap-2">
                              <i className="fas fa-link text-[9px]"></i>
                              {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <button onClick={onReset} className="flex-grow bg-white border-4 border-black text-black font-black py-5 px-6 brutalist-button hover:bg-gray-50 transition-all text-center uppercase tracking-widest text-sm">
          ← New Search
        </button>
        {result.status === EligibilityStatus.ELIGIBLE && (
           <a href="https://jawntpass.com/signin/harvard" target="_blank" rel="noopener noreferrer" className="flex-grow bg-black text-white font-black py-5 px-6 brutalist-button hover:bg-red-700 transition-all text-center uppercase tracking-widest text-sm flex items-center justify-center gap-3">
             Submit Claim on Jawnt <i className="fas fa-external-link-alt"></i>
           </a>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;