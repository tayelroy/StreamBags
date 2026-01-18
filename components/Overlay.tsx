
import React, { useState, useEffect } from 'react';
import { TradeEvent, StreamerProfile } from '../types';
import { pollTradeEvents } from '../services/bagsService';

interface OverlayProps {
  profile?: StreamerProfile;
}

const Overlay: React.FC<OverlayProps> = ({ profile }) => {
  const [activeNotification, setActiveNotification] = useState<TradeEvent | null>(null);

  useEffect(() => {
    if (!profile) return;

    const stopPolling = pollTradeEvents(profile.partnerKey, (event) => {
      setActiveNotification(event);
      // Reset after animation duration
      setTimeout(() => {
        setActiveNotification(null);
      }, 6000);
    });

    return stopPolling;
  }, [profile]);

  if (!activeNotification) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-end p-12 pointer-events-none">
      <div className="animate-notification flex items-center gap-5 bg-black/90 border-t-4 border-yellow-400 p-6 rounded-br-2xl rounded-bl-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(250,204,21,0.2)]">
        <div className="relative">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-yellow-400/30">
            <i className="fa-solid fa-bag-shopping text-3xl"></i>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-black text-[10px] font-bold">
            <i className="fa-solid fa-plus"></i>
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-xl tracking-tighter uppercase italic">Bag Secured!</span>
            <span className="bg-yellow-400/10 text-yellow-400 text-[10px] font-black px-2 py-0.5 rounded border border-yellow-400/20">TRADED</span>
          </div>
          <div className="text-zinc-400 font-bold text-sm">
            <span className="text-yellow-400">{activeNotification.userAddress}</span> bought <span className="text-white">${activeNotification.amountUsd}</span> of <span className="text-white">{activeNotification.tokenSymbol}</span>
          </div>
          <div className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest font-mono">
            Attributed to {profile?.displayName}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes notificationIn {
          0% { transform: translateY(-120%) scale(0.9); opacity: 0; filter: blur(10px); }
          10% { transform: translateY(0) scale(1.05); opacity: 1; filter: blur(0); }
          15% { transform: scale(1); }
          85% { transform: scale(1); opacity: 1; filter: blur(0); }
          100% { transform: translateY(-120%) scale(0.9); opacity: 0; filter: blur(10px); }
        }
        .animate-notification {
          animation: notificationIn 6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default Overlay;
