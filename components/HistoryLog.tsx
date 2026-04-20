import React from 'react';
import { HistoryEntry, EligibilityStatus } from '../types';

interface HistoryLogProps {
  history: HistoryEntry[];
  onClear: () => void;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ history, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-4xl font-black text-black uppercase italic tracking-tighter leading-none">Activity Log</h3>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Your recent eligibility checks</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={onClear}
            className="flex-grow md:flex-none bg-white border-4 border-black px-6 py-3 font-black text-xs uppercase brutalist-button hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-trash"></i> Clear History
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {history.slice(0, 10).map((entry) => (
          <div key={entry.id} className="bg-white border-4 border-black p-4 brutalist-shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${entry.status === EligibilityStatus.ELIGIBLE ? 'bg-emerald-500' : entry.status === EligibilityStatus.INELIGIBLE ? 'bg-red-600' : 'bg-amber-400'}`}></div>
              <div>
                <span className="text-[9px] font-black text-gray-400 uppercase block">{new Date(entry.timestamp).toLocaleString()}</span>
                <h4 className="font-black text-black uppercase text-lg leading-none">{entry.itemName || "Unknown Item"}</h4>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className={`px-3 py-1 text-[10px] font-black uppercase italic border-2 border-black ${entry.status === EligibilityStatus.ELIGIBLE ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100'}`}>
                 {entry.status}
               </div>
               <div className="text-xs font-bold text-gray-500 max-w-md truncate hidden lg:block">
                 {entry.reasoning}
               </div>
            </div>
          </div>
        ))}
        {history.length > 10 && (
          <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] py-4">
            + {history.length - 10} more entries stored locally
          </p>
        )}
      </div>
    </div>
  );
};

export default HistoryLog;