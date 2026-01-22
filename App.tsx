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
        // ... (Keep your existing Home content exactly as is)
        return (
          <div className="space-y-20 pb-20">
            {/* HERO */}
            <div className="relative pt-20 pb-10 overflow-hidden text-center">
               {/* ... (Your existing hero JSX) ... */}
               <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8">
                STREAM.<br />
                <span className="text-yellow-400">REVENUE.</span>
              </h1>
              <button 
                  onClick={() => setRoute(AppRoute.DASHBOARD)}
                  className="bg-yellow-400 text-black px-10 py-5 rounded-2xl font-black text-xl hover:bg-yellow-300 transition-all shadow-2xl shadow-yellow-400/20"
                >
                  {myProfile ? 'OPEN DASHBOARD' : 'LAUNCH MY TERMINAL'}
              </button>
            </div>
            
            {/* ... (Rest of your Home JSX) ... */}
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