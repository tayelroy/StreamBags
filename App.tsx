import React, { useState, useEffect } from 'react';
import { PhantomProvider, useAccounts, AddressType } from "@phantom/react-sdk";
// 1. Import Router Components
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

import Layout from './components/Layout';
import TradingTerminal from './components/TradingTerminal';
import Dashboard from './components/Dashboard';
import Overlay from './components/Overlay';
import { StreamerProfile, AppRoute } from './types'; // Make sure AppRoute is still valid or remove it if unused
import { getAllStreamers, getStreamerByWallet } from './services/bagsService';

const phantomConfig = {
    appId: 'dbba700f-4e6f-42dc-a0e2-5b0476bd6ed6',
    addressTypes: [AddressType.solana],
    providers: ['injected', 'phantom', 'google'], 
};

// --- WRAPPER COMPONENT TO USE ROUTER HOOKS ---
const AppContent: React.FC = () => {
  const accounts = useAccounts();
  const solanaAddress = accounts?.find(
    (account) => (account.addressType as string).toLowerCase() === 'solana'
  )?.address;

  // Replace state-based routing with Hook-based navigation
  const navigate = useNavigate();

  const [myProfile, setMyProfile] = useState<StreamerProfile | undefined>(() => {
    const saved = localStorage.getItem('sb_profile_v2');
    return saved ? JSON.parse(saved) : undefined;
  });
  
  const [allStreamers, setAllStreamers] = useState<StreamerProfile[]>([]);

  // 1. LOGIN LOGIC
  useEffect(() => {
    const syncProfile = async () => {
      if (solanaAddress && !myProfile) {
        const existingProfile = await getStreamerByWallet(solanaAddress);
        if (existingProfile) {
          console.log("Found existing profile:", existingProfile);
          setMyProfile(existingProfile);
          localStorage.setItem('sb_profile_v2', JSON.stringify(existingProfile));
          navigate('/dashboard'); // Use navigate instead of setRoute
        }
      }
    };
    syncProfile();
  }, [solanaAddress, myProfile, navigate]);

  // 2. LOGOUT LOGIC
  useEffect(() => {
    if (!solanaAddress && myProfile) {
      console.log("Wallet disconnected. Clearing profile...");
      setMyProfile(undefined);
      localStorage.removeItem('sb_profile_v2');
      navigate('/');
    }
  }, [solanaAddress, myProfile, navigate]);

  // 3. FETCH STREAMERS (Run once on mount)
  useEffect(() => {
    getAllStreamers().then(setAllStreamers);
  }, []);

  const handleProfileCreated = (p: StreamerProfile) => {
    setMyProfile(p);
    localStorage.setItem('sb_profile_v2', JSON.stringify(p));
    navigate('/dashboard');
  };

  // --- HOME PAGE COMPONENT (Inline for simplicity) ---
  const Home = () => (
    <div className="space-y-20 pb-20">
      <div className="relative pt-20 pb-10 overflow-hidden text-center">
        {/* ... (Your Hero Code) ... */}
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8">
          STREAM.<br />
          <span className="text-yellow-400">REVENUE.</span>
        </h1>
        <button 
            onClick={() => navigate('/dashboard')}
            className="bg-yellow-400 text-black px-10 py-5 rounded-2xl font-black text-xl hover:bg-yellow-300 transition-all shadow-2xl shadow-yellow-400/20"
          >
            {myProfile ? 'OPEN DASHBOARD' : 'LAUNCH MY TERMINAL'}
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-10">Live Terminals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allStreamers.map((streamer) => (
            <div 
              key={streamer.id}
              onClick={() => navigate(`/${streamer.slug}`)} // NAVIGATE TO URL
              className="group bg-zinc-900 border border-white/5 p-6 rounded-3xl hover:border-yellow-400 transition-all cursor-pointer relative overflow-hidden"
            >
              {/* ... Your Card UI ... */}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Layout streamerSlug={myProfile?.slug}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={
          <Dashboard 
            onProfileCreated={handleProfileCreated} 
            currentProfile={myProfile} 
            setRoute={() => {}} // Legacy prop, can be removed later
          />
        } />
        <Route path="/overlay" element={<Overlay profile={myProfile} />} />
        
        {/* THE DYNAMIC ROUTE: Catches /cat, /boldle, etc. */}
        <Route path="/:slug" element={<TradingTerminal />} />
      </Routes>
    </Layout>
  );
};

// --- ROOT COMPONENT ---
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <PhantomProvider config={phantomConfig}>
        <AppContent />
      </PhantomProvider>
    </BrowserRouter>
  );
};

export default App;