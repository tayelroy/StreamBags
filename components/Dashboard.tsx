
import React, { useState, useEffect } from 'react';
import { StreamerProfile, FeeData, AppRoute } from '../types';
import { createPartnerKey, fetchFeeData } from '../services/bagsService';

interface DashboardProps {
  onProfileCreated: (p: StreamerProfile) => void;
  currentProfile?: StreamerProfile;
  setRoute: (route: AppRoute) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onProfileCreated, currentProfile, setRoute }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [fees, setFees] = useState<FeeData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (currentProfile) {
      setWalletConnected(true);
      setWalletAddress(currentProfile.walletAddress);
      fetchFeeData(currentProfile.partnerKey).then(setFees);
    }
  }, [currentProfile]);

  const connectWallet = () => {
    setIsCreating(true);
    setTimeout(() => {
      const mockAddress = `7xK...${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setWalletAddress(mockAddress);
      setWalletConnected(true);
      setIsCreating(false);
    }, 800);
  };

  const handleCreate = async () => {
    if (!slug || !name || !walletAddress) return;
    setIsCreating(true);
    try {
      // Logic updated for Phase 2 "Database" mapping
      const profile = await createPartnerKey(walletAddress, slug, name);
      onProfileCreated(profile);
    } catch (err) {
      alert("API Error: Could not register terminal.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!walletConnected) {
    return (
      <div className="max-w-xl mx-auto py-24">
        <div className="bg-zinc-900 border border-white/10 p-12 rounded-[40px] text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12">
            <i className="fa-solid fa-rocket text-[120px]"></i>
          </div>
          <div className="w-20 h-20 bg-yellow-400 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-yellow-400/20">
            <i className="fa-solid fa-wallet text-black text-3xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Partner Portal</h2>
            <p className="text-zinc-500 mt-2">Connect your Solana wallet to launch your white-label trading terminal.</p>
          </div>
          <button 
            onClick={connectWallet}
            disabled={isCreating}
            className="w-full py-5 bg-white text-black font-black text-xl rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {isCreating ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-bolt"></i>}
            CONNECT WALLET
          </button>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <div className="bg-zinc-900 border border-white/10 rounded-[48px] p-12 space-y-10 shadow-2xl">
          <div className="flex justify-between items-center">
             <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Setup Terminal</h2>
             <div className="text-[10px] font-black bg-zinc-800 px-3 py-1 rounded-full text-zinc-400">{walletAddress}</div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest pl-2">Display Name</label>
              <input 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Ninja's Alpha Hub" 
                className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-yellow-400 transition-all font-bold text-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest pl-2">Unique Slug</label>
              <div className="flex items-center gap-3 bg-black border border-white/10 p-5 rounded-2xl focus-within:border-yellow-400 transition-all">
                <span className="text-zinc-600 font-bold">streambags.fm/</span>
                <input 
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase())}
                  placeholder="username" 
                  className="bg-transparent border-none outline-none w-full font-bold text-yellow-400 placeholder-zinc-800"
                />
              </div>
              <p className="text-[10px] text-zinc-600 font-bold italic pl-2">Warning: Slug is permanent once registered in the registry.</p>
            </div>
            <button 
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full py-6 bg-yellow-400 text-black font-black text-2xl italic tracking-tighter rounded-2xl hover:bg-yellow-300 transition-all active:scale-95 uppercase"
            >
              {isCreating ? 'REGISTERING TERMINAL...' : 'LAUNCH TERMINAL'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-2 py-0.5 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest rounded italic">ACTIVE PARTNER</div>
            <span className="text-zinc-600 text-[10px] font-black tracking-widest uppercase">KEY: {currentProfile.partnerKey.slice(-8)}</span>
          </div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">{currentProfile.displayName}</h2>
          <div className="flex items-center gap-2 mt-3 text-zinc-500 font-bold">
            <i className="fa-solid fa-link text-xs"></i>
            <span>streambags.fm/{currentProfile.slug}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setRoute(AppRoute.OVERLAY)}
            className="px-8 py-4 bg-zinc-900 border border-white/10 text-white font-black italic rounded-2xl hover:bg-zinc-800 transition-all uppercase tracking-tighter"
          >
            OBS Overlay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-zinc-900/50 border border-white/5 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-sack-dollar text-[120px]"></i>
          </div>
          <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-4">Claimable Fees</div>
          <div className="text-6xl font-black italic tracking-tighter text-yellow-400">${fees?.unclaimed.toFixed(2) || '0.00'}</div>
          <button className="mt-8 w-full py-4 bg-zinc-800 text-white font-black italic rounded-xl text-sm hover:bg-zinc-700 transition-all uppercase border border-white/5">
            Claim Sol
          </button>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-chart-line text-[120px]"></i>
          </div>
          <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-4">Lifetime Total</div>
          <div className="text-6xl font-black italic tracking-tighter text-white">${fees?.lifetime.toFixed(2) || '0.00'}</div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
           <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-signal text-[120px]"></i>
          </div>
          <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-4">Registry Status</div>
          <div className="text-6xl font-black italic tracking-tighter text-green-400 uppercase">Synced</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
