import React, { useState, useEffect } from 'react';
import { PhantomProvider, useAccounts, AddressType } from "@phantom/react-sdk";
import Layout from './components/Layout';
import TradingTerminal from './components/TradingTerminal';
import Dashboard from './components/Dashboard';
import Overlay from './components/Overlay';
import { AppRoute, StreamerProfile } from './types';
import { getTradingAdvice } from './services/geminiService';
import { fetchTokens, getAllStreamers, getStreamerByWallet } from './services/bagsService';

// --- 1. CONFIGURATION ---
const phantomConfig = {
    appId: 'dbba700f-4e6f-42dc-a0e2-5b0476bd6ed6',
    addressTypes: [AddressType.solana],
    // REMOVE 'as const' from the end of this line:
    providers: ['injected', 'phantom', 'google'], 
};

// --- 2. THE MAIN LOGIC (Renamed from App to AppContent) ---
const AppContent: React.FC = () => {
  // NOW this hook works because it's inside the Provider (see bottom of file)
  const accounts = useAccounts();
  const solanaAddress = accounts?.find(
    (account) => (account.addressType as string).toLowerCase() === 'solana'
  )?.address;

  const [route, setRoute] = useState<AppRoute>(AppRoute.HOME);
  const [myProfile, setMyProfile] = useState<StreamerProfile | undefined>(() => {
    const saved = localStorage.getItem('sb_profile_v2');
    return saved ? JSON.parse(saved) : undefined;
  });

  const [activeTerminal, setActiveTerminal] = useState<StreamerProfile | undefined>();
  const [allStreamers, setAllStreamers] = useState<StreamerProfile[]>([]);
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Sync Supabase when wallet connects
  useEffect(() => {
    const syncProfile = async () => {
      if (solanaAddress && !myProfile) {
        const existingProfile = await getStreamerByWallet(solanaAddress);
        if (existingProfile) {
          console.log("Found existing profile:", existingProfile);
          setMyProfile(existingProfile);
          localStorage.setItem('sb_profile_v2', JSON.stringify(existingProfile));
          setRoute(AppRoute.DASHBOARD);
        }
      }
    };
    syncProfile();
  }, [solanaAddress, myProfile]);

  useEffect(() => {
    getAllStreamers().then(setAllStreamers);
  }, [route]);

  const handleProfileCreated = (p: StreamerProfile) => {
    setMyProfile(p);
    localStorage.setItem('sb_profile_v2', JSON.stringify(p));
    setRoute(AppRoute.DASHBOARD);
  };

  const selectTerminal = (profile: StreamerProfile) => {
    setActiveTerminal(profile);
    setRoute(AppRoute.TRADING);
  };

  const handleAiAsk = async () => {
    if (!userInput.trim()) return;
    const tokens = await fetchTokens();
    const newChat = [...aiChat, { role: 'user' as const, text: userInput }];
    setAiChat(newChat);
    setUserInput('');
    setIsTyping(true);

    try {
      const advice = await getTradingAdvice(userInput, tokens);
      setAiChat([...newChat, { role: 'assistant' as const, text: advice || "Analysis incomplete." }]);
    } catch (err) {
      setAiChat([...newChat, { role: 'assistant' as const, text: "Gemini is currently off-grid." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (route === AppRoute.OVERLAY) {
    return <Overlay profile={myProfile} />;
  }

  const renderContent = () => {
    switch (route) {
      case AppRoute.TRADING:
        return activeTerminal ? (
          <TradingTerminal profile={activeTerminal} />
        ) : (
          <div className="py-20 text-center">
            <h2 className="text-3xl font-black">Terminal Not Selected</h2>
            <button onClick={() => setRoute(AppRoute.HOME)} className="mt-4 text-yellow-400">Return to Directory</button>
          </div>
        );
      case AppRoute.DASHBOARD:
        return <Dashboard onProfileCreated={handleProfileCreated} currentProfile={myProfile} setRoute={setRoute} />;
      case AppRoute.HOME:
      default:
        return (
          <div className="space-y-20 pb-20">
            {/* 1. HERO SECTION */}
            <div className="relative pt-20 pb-10 overflow-hidden text-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-yellow-400/20 blur-[120px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-yellow-400 font-black text-xs uppercase tracking-widest mb-4">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                  v2.0 Now Live on Solana
                </div>
                
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8">
                  STREAM.<br />
                  <span className="text-yellow-400">REVENUE.</span>
                </h1>
                
                <p className="text-zinc-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                  Launch your own white-label DEX in seconds. <br/>
                  Earn trading fees directly from your stream overlay.
                </p>

                <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={() => setRoute(AppRoute.DASHBOARD)}
                    className="bg-yellow-400 text-black px-10 py-5 rounded-2xl font-black text-xl hover:bg-yellow-300 transition-all shadow-2xl shadow-yellow-400/20 active:scale-95"
                  >
                    {myProfile ? 'OPEN DASHBOARD' : 'LAUNCH MY TERMINAL'}
                  </button>
                  <button className="px-10 py-5 rounded-2xl font-black text-xl text-white border border-white/10 hover:bg-white/5 transition-all">
                    VIEW DOCS
                  </button>
                </div>
              </div>
            </div>

            {/* 2. LIVE TERMINALS GRID (The Supabase Data) */}
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter">Live Terminals</h2>
                  <p className="text-zinc-500 font-bold">Trade on community-owned endpoints.</p>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-3xl font-black text-yellow-400">{allStreamers.length}</div>
                  <div className="text-xs font-black text-zinc-600 uppercase tracking-widest">Active Nodes</div>
                </div>
              </div>

              {allStreamers.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                   <p className="text-zinc-500 font-bold">No terminals online yet. Be the first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allStreamers.map((streamer) => (
                    <div 
                      key={streamer.id}
                      onClick={() => {
                        setActiveTerminal(streamer);
                        setRoute(AppRoute.TRADING);
                      }}
                      className="group bg-zinc-900 border border-white/5 p-6 rounded-3xl hover:border-yellow-400 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <i className="fa-solid fa-arrow-right -rotate-45 text-4xl"></i>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-zinc-800 to-black rounded-xl border border-white/10 flex items-center justify-center text-xl font-black text-zinc-500 group-hover:text-yellow-400 transition-colors">
                          {streamer.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none group-hover:text-yellow-400 transition-colors">
                            {streamer.displayName}
                          </h3>
                          <p className="text-xs font-bold text-zinc-600">/{streamer.slug}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Online
                        </div>
                        <span className="text-xs font-bold text-white group-hover:underline">Trade Now</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <Layout activeRoute={route} setRoute={setRoute} streamerSlug={myProfile?.slug}>
      {renderContent()}
    </Layout>
  );
};

// --- 3. THE ROOT COMPONENT (Exports the Provider) ---
const App: React.FC = () => {
  return (
    <PhantomProvider config={phantomConfig}>
      <AppContent />
    </PhantomProvider>
  );
};

export default App;