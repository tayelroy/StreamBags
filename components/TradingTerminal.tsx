import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Token, StreamerProfile } from '../types';
import { fetchRecentTokens, executeSwap, getStreamerBySlug } from '../services/bagsService';
import { analyzeToken } from '../services/geminiService';

interface TradingTerminalProps {
  profile: StreamerProfile;
}

const TradingTerminal: React.FC<TradingTerminalProps> = ({ profile: initialProfile }) => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<StreamerProfile | undefined>(initialProfile);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [viewingToken, setViewingToken] = useState<Token | null>(null);
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
    fetchRecentTokens().then(setTokens);
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

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getOrganicScoreColor = (score?: number) => {
    if (!score) return 'text-zinc-500';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Market Table */}
          <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Recent Tokens</h2>
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
                    <th className="p-6">Price</th>
                    <th className="p-6">24H Change</th>
                    <th className="p-6">Organic Score</th>
                    <th className="p-6 pr-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tokens.map(token => (
                    <tr key={token.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setViewingToken(token)}>
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
                        {token.change24h > 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </td>
                      <td className="p-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-black/20 border border-white/5 ${getOrganicScoreColor(token.organicScore)}`}>
                          <i className="fa-solid fa-chart-line text-xs"></i>
                          <span className="font-black text-sm">{token.organicScore?.toFixed(0) || 'N/A'}</span>
                        </div>
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
          {(isLoadingAnalysis || aiAnalysis) && (
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

      {/* Token Details Modal */}
      {viewingToken && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingToken(null)}>
          <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
              <div className="flex items-center gap-4">
                <img src={viewingToken.image} className="w-16 h-16 rounded-2xl shadow-lg" alt={viewingToken.name} />
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">{viewingToken.symbol}</h2>
                  <p className="text-zinc-500 text-sm font-bold">{viewingToken.name}</p>
                </div>
              </div>
              <button onClick={() => setViewingToken(null)} className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* Stats Grid */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Price</div>
                  <div className="text-2xl font-black text-white font-mono">
                    ${viewingToken.price < 0.01 ? viewingToken.price.toFixed(6) : viewingToken.price.toFixed(2)}
                  </div>
                </div>
                
                <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">24H Change</div>
                  <div className={`text-2xl font-black ${viewingToken.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {viewingToken.change24h > 0 ? '+' : ''}{viewingToken.change24h.toFixed(2)}%
                  </div>
                </div>
                
                <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Market Cap</div>
                  <div className="text-2xl font-black text-white">
                    {viewingToken.marketCap ? formatNumber(viewingToken.marketCap) : 'N/A'}
                  </div>
                </div>
                
                <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">FDV</div>
                  <div className="text-2xl font-black text-white">
                    {viewingToken.fdv ? formatNumber(viewingToken.fdv) : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Liquidity</div>
                  <div className="text-xl font-black text-white">
                    {viewingToken.liquidity ? formatNumber(viewingToken.liquidity) : 'N/A'}
                  </div>
                </div>
                
                <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">24H Volume</div>
                  <div className="text-xl font-black text-white">
                    {viewingToken.volume24h ? formatNumber(viewingToken.volume24h) : 'N/A'}
                  </div>
                </div>
                
                <div className="bg-black/20 border border-white/5 rounded-2xl p-6">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Holders</div>
                  <div className="text-xl font-black text-white flex items-center gap-2">
                    {viewingToken.holderCount ? viewingToken.holderCount.toLocaleString() : 'N/A'}
                    {viewingToken.isVerified && (
                      <i className="fa-solid fa-circle-check text-blue-400 text-sm"></i>
                    )}
                  </div>
                </div>
              </div>

              {/* Organic Score */}
              <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Organic Score</div>
                    <div className={`text-4xl font-black ${getOrganicScoreColor(viewingToken.organicScore)}`}>
                      {viewingToken.organicScore?.toFixed(0) || 'N/A'}/100
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-chart-line text-3xl text-indigo-400"></i>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-black/30 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${viewingToken.organicScore && viewingToken.organicScore >= 60 ? 'bg-green-400' : 'bg-yellow-400'}`}
                    style={{ width: `${viewingToken.organicScore || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="bg-black/20 border border-white/5 rounded-2xl p-8">
                <div className="text-center py-20">
                  <i className="fa-solid fa-chart-candlestick text-6xl text-zinc-700 mb-4"></i>
                  <h3 className="text-xl font-black text-zinc-600 uppercase italic">TradingView Chart</h3>
                  <p className="text-zinc-700 text-sm font-bold mt-2">Coming Soon</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setSelectedToken(viewingToken);
                    setViewingToken(null);
                  }}
                  className="flex-1 bg-yellow-400 text-black py-4 rounded-2xl font-black text-lg hover:bg-yellow-300 transition-all active:scale-95 shadow-lg shadow-yellow-400/10 uppercase italic"
                >
                  <i className="fa-solid fa-arrow-right-arrow-left mr-2"></i>
                  Trade Now
                </button>
                <button 
                  onClick={() => {
                    handleAnalyze(viewingToken);
                    setViewingToken(null);
                  }}
                  className="flex-1 bg-indigo-500 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-400 transition-all active:scale-95 shadow-lg shadow-indigo-500/10 uppercase italic"
                >
                  <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                  AI Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TradingTerminal;