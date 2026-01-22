import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // 1. Import
import { usePhantom, useModal, useAccounts } from '@phantom/react-sdk';

interface LayoutProps {
  children: React.ReactNode;
  streamerSlug?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, streamerSlug }) => {
  const { isConnected } = usePhantom();
  const { open } = useModal();
  const accounts = useAccounts();
  
  const navigate = useNavigate();
  const location = useLocation();

  const solanaAddress = accounts?.find(
    (account) => (account.addressType as string).toLowerCase() === 'solana'
  )?.address;

  const isOverlay = location.pathname === '/overlay';
  if (isOverlay) return <div className="h-screen w-screen overflow-hidden bg-transparent">{children}</div>;

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <header className="border-b border-white/10 p-4 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* LOGO */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')} // Navigate Home
          >
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-black">SB</div>
            <h1 className="text-xl font-bold tracking-tighter">STREAMBAGS</h1>
          </div>
          
          {/* NAV */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => navigate('/')}
              className={`hover:text-yellow-400 transition ${isActive('/') ? 'text-yellow-400' : 'text-zinc-400'}`}
            >
              Discover
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className={`hover:text-yellow-400 transition ${isActive('/dashboard') ? 'text-yellow-400' : 'text-zinc-400'}`}
            >
              Streamer Dashboard
            </button>
            <button 
              onClick={() => {
                if (streamerSlug) navigate(`/${streamerSlug}`);
                else alert("Launch your terminal first!");
              }}
              className={`hover:text-yellow-400 transition ${isActive(`/${streamerSlug}`) ? 'text-yellow-400' : 'text-zinc-400'}`}
            >
              Trade {streamerSlug ? `on /${streamerSlug}` : ''}
            </button>
          </nav>

          {/* CONNECT BUTTON (Same as before) */}
          <div className="flex gap-4">
            <button 
              onClick={() => open()} 
              className={`px-6 py-2 rounded-full font-black text-sm transition-all flex items-center gap-2 shadow-lg ${
                isConnected && solanaAddress
                  ? "bg-yellow-400 text-black hover:bg-yellow-300 shadow-yellow-400/10"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {isConnected && solanaAddress ? (
                <>
                  <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                  <span className="font-mono">{solanaAddress.slice(0, 4)}...{solanaAddress.slice(-4)}</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wallet"></i>
                  <span>CONNECT WALLET</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>
      
      {/* Footer... */}
      <footer className="border-t border-white/10 p-8 text-center text-zinc-500 text-sm">
        <p>© 2026 StreamBags. Built on Bags.fm</p>
      </footer>
    </div>
  );
};

export default Layout;