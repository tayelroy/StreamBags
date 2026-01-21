
import React, { useState, useEffect } from 'react';
import { PhantomProvider, useModal, darkTheme, usePhantom, AddressType } from "@phantom/react-sdk";
import Layout from './components/Layout';
import TradingTerminal from './components/TradingTerminal';
import Dashboard from './components/Dashboard';
import Overlay from './components/Overlay';
import { AppRoute, StreamerProfile, Token } from './types';
import { getTradingAdvice } from './services/geminiService';
import { fetchTokens, getAllStreamers, getStreamerBySlug } from './services/bagsService';

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.HOME);
  const [myProfile, setMyProfile] = useState<StreamerProfile | undefined>(() => {
    const saved = localStorage.getItem('sb_profile_v2');
    return saved ? JSON.parse(saved) : undefined;
  });
  
  // The profile currently being "viewed" in the terminal
  const [activeTerminal, setActiveTerminal] = useState<StreamerProfile | undefined>();
  const [allStreamers, setAllStreamers] = useState<StreamerProfile[]>([]);

  const [aiChat, setAiChat] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

const phantomConfig = {
    appId: 'dbba700f-4e6f-42dc-a0e2-5b0476bd6ed6',
    addressTypes: [AddressType.solana], 
    providers: ['injected', 'phantom', 'google'] as const, 
  };

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
      setAiChat([...newChat, { role: 'assistant' as const, text: "Gemini is currently off-grid. Please try again." }]);
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
            {/* Hero Section */}
            <div className="relative pt-20 pb-10 overflow-hidden text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-400/5 blur-[120px] -z-10 rounded-full"></div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-8">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                Solana Streaming Era
              </div>
              <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8">
                STREAM.<br />
                <span className="text-yellow-400">REVENUE.</span>
              </h1>
              <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
                Launch a custom branded trading terminal and capture fees automatically via the Bags.fm protocol.
              </p>
              <div className="flex flex-col sm:row justify-center gap-4">
                <button 
                  onClick={() => setRoute(AppRoute.DASHBOARD)}
                  className="bg-yellow-400 text-black px-10 py-5 rounded-2xl font-black text-xl hover:bg-yellow-300 transition-all shadow-2xl shadow-yellow-400/20"
                >
                  {myProfile ? 'OPEN DASHBOARD' : 'LAUNCH MY TERMINAL'}
                </button>
              </div>
            </div>

            {/* Terminal Registry */}
            <div className="space-y-8">
              <div className="flex items-end justify-between border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter">Live Terminals</h2>
                  <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-2">Browse community-launched exchanges</p>
                </div>
                <div className="text-zinc-500 text-xs font-bold">
                  {allStreamers.length} Registered Partners
                </div>
              </div>

              {allStreamers.length === 0 ? (
                <div className="p-20 bg-zinc-900/20 border border-white/5 rounded-[40px] text-center">
                  <p className="text-zinc-600 font-bold italic">No public terminals found. Be the first to launch!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allStreamers.map((s) => (
                    <div 
                      key={s.id} 
                      onClick={() => selectTerminal(s)}
                      className="group bg-zinc-900/50 border border-white/5 p-8 rounded-[32px] hover:border-yellow-400/50 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-terminal text-6xl"></i>
                      </div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-1">{s.displayName}</h3>
                      <p className="text-yellow-400/80 font-bold text-sm">streambags.fm/{s.slug}</p>
                      <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <span>Liquidity: Bags.fm</span>
                        <span className="text-white group-hover:text-yellow-400 transition-colors">Trade Now <i className="fa-solid fa-arrow-right ml-1"></i></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Assistant Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-zinc-900/50 border border-white/5 p-8 md:p-12 rounded-[40px]">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <i className="fa-solid fa-brain text-white text-2xl"></i>
                </div>
                <h2 className="text-4xl md:text-5xl font-black leading-tight">AI Trading<br />Assistant</h2>
                <p className="text-zinc-400 text-lg leading-relaxed">
                  Every terminal is equipped with <span className="text-indigo-400 font-bold">Gemini Intelligence</span>. Provide your viewers with real-time sentiment analysis for any Solana token.
                </p>
              </div>

              <div className="bg-black border border-white/10 rounded-3xl h-[400px] flex flex-col shadow-2xl">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {aiChat.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-zinc-600 text-sm italic">"Try: Analyze current Solana trends..."</p>
                    </div>
                  )}
                  {aiChat.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                        msg.role === 'user' ? 'bg-zinc-800' : 'bg-indigo-900/20 text-indigo-100'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && <div className="text-xs text-indigo-400 animate-pulse p-4">Gemini thinking...</div>}
                </div>
                <div className="p-4 bg-zinc-900/50 border-t border-white/5 flex gap-3">
                  <input 
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAiAsk()}
                    placeholder="Ask Bag Intelligence..." 
                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 outline-none"
                  />
                  <button onClick={handleAiAsk} className="w-12 h-12 bg-yellow-400 text-black rounded-xl flex items-center justify-center">
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  
return (
    <PhantomProvider config={phantomConfig}>
      <Layout activeRoute={route} setRoute={setRoute} streamerSlug={myProfile?.slug}>
        {renderContent()}
      </Layout>
    </PhantomProvider>
  );

};



export default App;
