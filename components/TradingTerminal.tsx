import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // 1. Import useParams
import { Token, StreamerProfile } from '../types';
import { fetchTokens, executeSwap, getStreamerBySlug } from '../services/bagsService'; // 2. Import getStreamerBySlug
import { analyzeToken } from '../services/geminiService';

interface TradingTerminalProps {
  profile: StreamerProfile;
}

const TradingTerminal: React.FC<TradingTerminalProps> = ({ profile: initialProfile }) => {
  const { slug } = useParams<{ slug: string }>(); // 3. Get slug from URL
  const [profile, setProfile] = useState<StreamerProfile | undefined>(initialProfile);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    if (!profile && slug) {
      getStreamerBySlug(slug).then((data) => {
        if (data) setProfile(data);
      });
    }
  }, [slug, profile]);

  useEffect(() => {
    fetchTokens().then(setTokens);
  }, []);

  if (!profile) {
    return <div className="text-center py-20 text-zinc-500 font-black animate-pulse">LOADING TERMINAL DATA...</div>;
  }
  
  const handleAnalyze = async (token: Token) => {
    setIsLoadingAnalysis(true);
    setAiAnalysis(null);
    try {
      const analysis = await analyzeToken(token);
      setAiAnalysis(analysis || "No intelligence available for this asset.");
    } catch (err) {
      setAiAnalysis("Analysis server offline.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleSwap = async () => {
    if (!selectedToken || !amount) return;
    setIsSwapping(true);
    try {
      await executeSwap('SOL', selectedToken.symbol, parseFloat(amount), profile.partnerKey);
      alert(`SWAP SUCCESS! ${amount} SOL → ${selectedToken.symbol}. Fee attributed to ${profile.displayName}.`);
      setAmount('');
    } catch (err) {
      alert("Swap failed. Check balance.");
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-8 space-y-8">
        {/* Market Table */}
        <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md">
            <div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Market Overview</h2>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Solana Network • Bags.fm Liquidity</p>
            </div>
            <div className="px-3 py-1 bg-yellow-400/10 text-yellow-400 rounded-lg text-[10px] font-black border border-yellow-400/20">
              LIVE DATA
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-zinc-500 text-left border-b border-white/5 text-[10px] font-black uppercase tracking-widest bg-black/20">
                  <th className="p-6 pl-8">Asset</th>
                  <th className="p-6">Current Price</th>
                  <th className="p-6">24H Trend</th>
                  <th className="p-6 pr-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tokens.map(token => (
                  <tr key={token.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedToken(token)}>
                    <td className="p-6 pl-8 flex items-center gap-4">
                      <div className="relative">
                        <img src={token.image} className="w-10 h-10 rounded-xl" alt={token.name} />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-900 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
                           <img src="https://cryptologos.cc/logos/solana-sol-logo.png" className="w-2.5 h-2.5" alt="sol" />
                        </div>
                      </div>
                      <div>
                        <div className="font-black text-lg tracking-tight">{token.symbol}</div>
                        <div className="text-xs text-zinc-500 font-bold uppercase">{token.name}</div>
                      </div>
                    </td>
                    <td className="p-6 font-mono text-white/90 font-bold">
                      ${token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(2)}
                    </td>
                    <td className={`p-6 font-black ${token.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h > 0 ? '+' : ''}{token.change24h}%
                    </td>
                    <td className="p-6 pr-8 text-right space-x-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAnalyze(token); }}
                        className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-all border border-white/5 hover:border-yellow-400/30"
                        title="Analyze with AI"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles text-yellow-400"></i>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedToken(token); }}
                        className="bg-yellow-400 text-black px-6 py-2.5 rounded-xl font-black text-sm hover:bg-yellow-300 transition-all active:scale-95 shadow-lg shadow-yellow-400/10 uppercase italic"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Analysis Pane */}
        { (isLoadingAnalysis || aiAnalysis) && (
          <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <i className="fa-solid fa-brain text-7xl text-indigo-400"></i>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-microchip text-white"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Bag Intelligence</h3>
                <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Powered by Gemini AI</p>
              </div>
            </div>
            
            {isLoadingAnalysis ? (
              <div className="space-y-4">
                <div className="h-4 bg-indigo-500/10 rounded-full w-full animate-pulse"></div>
                <div className="h-4 bg-indigo-500/10 rounded-full w-[80%] animate-pulse"></div>
                <div className="h-4 bg-indigo-500/10 rounded-full w-[60%] animate-pulse"></div>
              </div>
            ) : (
              <div className="text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap prose prose-invert max-w-none">
                {aiAnalysis}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trading Sidebar */}
      <div className="lg:col-span-4 sticky top-24">
        <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-8 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>
          
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Quick Swap</h3>
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <i className="fa-solid fa-sliders text-zinc-500"></i>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <span>Sell</span>
                <span>Balance: 12.42 SOL</span>
              </div>
              <div className="flex items-center gap-4 bg-black border border-white/10 p-5 rounded-2xl group focus-within:border-yellow-400/50 transition-colors">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00" 
                  className="bg-transparent border-none outline-none text-3xl font-black w-full text-white placeholder-zinc-800" 
                />
                <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-white/10 font-black text-sm">
                  <img src="https://cryptologos.cc/logos/solana-sol-logo.png" className="w-4 h-4" alt="" />
                  SOL
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-3 relative z-10">
              <button className="w-12 h-12 bg-zinc-800 border-4 border-zinc-900 rounded-2xl flex items-center justify-center hover:bg-yellow-400 hover:text-black transition-all active:rotate-180">
                <i className="fa-solid fa-arrow-down-long"></i>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <span>Buy</span>
                <span>Est. Received</span>
              </div>
              <div className="flex items-center gap-4 bg-black border border-white/10 p-5 rounded-2xl">
                <div className="text-3xl font-black w-full text-zinc-600">
                  {selectedToken && amount ? (parseFloat(amount) * (145 / selectedToken.price)).toFixed(2) : '0.00'}
                </div>
                <button 
                  onClick={() => alert("Search Asset Module coming soon")}
                  className="flex items-center gap-2 bg-yellow-400 text-black px-3 py-1.5 rounded-lg font-black text-sm shadow-lg shadow-yellow-400/10"
                >
                  {selectedToken ? (
                    <>
                      <img src={selectedToken.image} className="w-4 h-4 rounded-full" alt="" />
                      {selectedToken.symbol}
                    </>
                  ) : 'SELECT'}
                  <i className="fa-solid fa-chevron-down text-[10px]"></i>
                </button>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl space-y-3 border border-white/5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-500">Partner Attribution</span>
                <span className="text-yellow-400">1.0% to {profile.displayName}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-500">Slippage Tolerance</span>
                <span className="text-zinc-300">0.5% (Auto)</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between text-xs font-black uppercase">
                <span className="text-zinc-500">Min. Received</span>
                <span className="text-white">--</span>
              </div>
            </div>

            <button 
              disabled={!selectedToken || !amount || isSwapping}
              onClick={handleSwap}
              className={`w-full py-5 rounded-[24px] font-black text-2xl italic tracking-tighter transition-all shadow-2xl ${
                !selectedToken || !amount 
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50' 
                  : 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-[0.98] shadow-yellow-400/20'
              }`}
            >
              {isSwapping ? (
                <span className="flex items-center justify-center gap-3">
                  <i className="fa-solid fa-spinner animate-spin"></i> EXECUTING...
                </span>
              ) : 'CONFIRM SWAP'}
            </button>
          </div>
        </div>

        <div className="mt-6 p-6 bg-indigo-900/10 border border-indigo-500/10 rounded-3xl text-center">
          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">
            Trades are executed via the Bags Program.<br />Fees support the creator directly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TradingTerminal;
