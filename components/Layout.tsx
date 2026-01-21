import React from 'react';
import { AppRoute } from '../types';
// ✅ Import the same Phantom hooks used in Dashboard
import { usePhantom, useModal, useAccounts } from '@phantom/react-sdk';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  setRoute: (route: AppRoute) => void;
  streamerSlug?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeRoute, setRoute, streamerSlug }) => {
  // --- PHANTOM INTEGRATION ---
  const { isConnected } = usePhantom();
  const { open } = useModal(); // Opens the same modal as Dashboard
  const accounts = useAccounts();

  // Safe helper to get address (same logic as Dashboard)
  const solanaAddress = accounts?.find(
    (account) => (account.addressType as string) === 'solana'
  )?.address;

  const isOverlay = activeRoute === AppRoute.OVERLAY;

  if (isOverlay) return <div className="h-screen w-screen overflow-hidden bg-transparent">{children}</div>;

  return (
    <div className="min-h-screen flex flex-col bg-[#050505]">
      <header className="border-b border-white/10 p-4 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setRoute(AppRoute.HOME)}
          >
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-black">SB</div>
            <h1 className="text-xl font-bold tracking-tighter">STREAMBAGS</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setRoute(AppRoute.HOME)}
              className={`hover:text-yellow-400 transition ${activeRoute === AppRoute.HOME ? 'text-yellow-400' : 'text-zinc-400'}`}
            >
              Discover
            </button>
            <button 
              onClick={() => setRoute(AppRoute.DASHBOARD)}
              className={`hover:text-yellow-400 transition ${activeRoute === AppRoute.DASHBOARD ? 'text-yellow-400' : 'text-zinc-400'}`}
            >
              Streamer Dashboard
            </button>
            <button 
              onClick={() => {
                if (streamerSlug) setRoute(AppRoute.TRADING);
                else alert("Launch your terminal first!");
              }}
              className={`hover:text-yellow-400 transition ${activeRoute === AppRoute.TRADING ? 'text-yellow-400' : 'text-zinc-400'}`}
            >
              Trade {streamerSlug ? `on /${streamerSlug}` : ''}
            </button>
          </nav>

          <div className="flex gap-4">
            {/* ✅ CONNECT BUTTON NOW USES PHANTOM MODAL */}
            <button 
              onClick={() => open()} 
              className="bg-white text-black px-4 py-2 rounded-full font-semibold hover:bg-zinc-200 transition flex items-center gap-2"
            >
              {isConnected && solanaAddress ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {solanaAddress.slice(0, 4)}...{solanaAddress.slice(-4)}
                </>
              ) : (
                "Connect Wallet"
              )}
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        {children}
      </main>

      <footer className="border-t border-white/10 p-8 text-center text-zinc-500 text-sm">
        <p>© 2026 StreamBags. Built on Bags.fm</p>
      </footer>
    </div>
  );
};

export default Layout;