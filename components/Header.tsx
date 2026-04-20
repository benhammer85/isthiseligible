import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b-4 border-black sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-black text-white w-10 h-10 flex items-center justify-center brutalist-shadow-sm font-black text-xl italic rotate-3">
            <i className="fas fa-bicycle"></i>
          </div>
          <div>
            <h1 className="text-lg font-black text-black leading-none tracking-tighter uppercase italic">Is This Eligible?</h1>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mt-1 sm:hidden">Bike Commuter Benefit</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;