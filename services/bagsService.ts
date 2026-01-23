import { createClient } from '@supabase/supabase-js';
import { Token, StreamerProfile, TradeEvent, FeeData } from '../types';

// --- CONFIGURATION ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; 
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const JUPITER_API_KEY = import.meta.env.VITE_JUPITER_API_KEY; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. STATIC METADATA (Stable, Fast, Prevents API 400 Errors)
const POPULAR_TOKENS_METADATA: Token[] = [
  {
    id: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    price: 0,
    change24h: 0,
    marketCap: 0,
    volume24h: 0
  },
  {
    id: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    price: 0,
    change24h: 0,
    marketCap: 0,
    volume24h: 0
  },
  {
    id: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk',
    image: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
    price: 0,
    change24h: 0,
    marketCap: 0,
    volume24h: 0
  },
  {
    id: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    symbol: 'WIF',
    name: 'dogwifhat',
    image: 'https://bafkreibk3cvsi5ctw7qqk4vkkkm67xoxotzyuxgssfxk3vng7izj7uw5mn.ipfs.nftstorage.link',
    price: 0,
    change24h: 0,
    marketCap: 0,
    volume24h: 0
  },
  {
    id: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    symbol: 'JUP',
    name: 'Jupiter',
    image: 'https://static.jup.ag/jup/icon.png',
    price: 0,
    change24h: 0,
    marketCap: 0,
    volume24h: 0
  },
];

// --- DATABASE FUNCTIONS (Unchanged) ---
export const getAllStreamers = async (): Promise<StreamerProfile[]> => {
  const { data, error } = await supabase.from('streamers').select('*');
  if (error) {
    console.error('Error fetching streamers:', error);
    return [];
  }
  return data.map(d => ({
    id: d.id,
    slug: d.slug,
    displayName: d.display_name,
    walletAddress: d.wallet_address,
    partnerKey: d.partner_key
  }));
};

export const getStreamerBySlug = async (slug: string): Promise<StreamerProfile | undefined> => {
  const { data, error } = await supabase
    .from('streamers')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .maybeSingle();

  if (error || !data) return undefined;

  return {
    id: data.id,
    slug: data.slug,
    displayName: data.display_name,
    walletAddress: data.wallet_address,
    partnerKey: data.partner_key
  };
};

export const getStreamerByWallet = async (walletAddress: string): Promise<StreamerProfile | undefined> => {
  const { data, error } = await supabase
    .from('streamers')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (error || !data) return undefined;

  return {
    id: data.id,
    slug: data.slug,
    displayName: data.display_name,
    walletAddress: data.wallet_address,
    partnerKey: data.partner_key
  };
};

export const createPartnerKey = async (walletAddress: string, slug: string, displayName: string): Promise<StreamerProfile> => {
  const fakePartnerKey = `pk_bags_${Math.random().toString(36).substring(2, 10)}`;
  const { data, error } = await supabase
    .from('streamers')
    .insert([{ 
        slug: slug.toLowerCase(), 
        display_name: displayName, 
        wallet_address: walletAddress,
        partner_key: fakePartnerKey
    }])
    .select()
    .single();

  if (error) throw new Error("Slug likely already taken");

  return {
    id: data.id,
    slug: data.slug,
    displayName: data.display_name,
    walletAddress: data.wallet_address,
    partnerKey: data.partner_key
  };
};

/**
 * Fetch recent tokens from Jupiter API
 */
export const fetchRecentTokens = async (): Promise<Token[]> => {
  try {
    const response = await fetch('https://api.jup.ag/tokens/v2/recent', {
      headers: {
        'x-api-key': JUPITER_API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Recent tokens API failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Response is an array of token objects
    const tokens = Array.isArray(data) ? data : [];
    
    return tokens.map((token: any) => ({
      id: token.id || '',
      symbol: token.symbol || 'UNKNOWN',
      name: token.name || token.symbol || 'Unknown Token',
      image: token.icon || '',
      price: typeof token.usdPrice === 'number' ? token.usdPrice : 0,
      change24h: token.stats24h?.priceChange || 0,
      marketCap: token.mcap || 0,
      volume24h: (token.stats24h?.buyVolume || 0) + (token.stats24h?.sellVolume || 0),
      fdv: token.fdv || 0,
      organicScore: token.organicScore || 0,
      // Additional metadata for future use
      liquidity: token.liquidity || 0,
      holderCount: token.holderCount || 0,
      isVerified: token.isVerified || false,
    })).filter(token => token.id); // Filter out invalid tokens

  } catch (error) {
    console.error("Failed to fetch recent tokens:", error);
    return [];
  }
};

// --- MOCK TRADE/FEE FUNCTIONS (Unchanged) ---
export const executeSwap = async (from: string, to: string, amount: number, partnerKey: string): Promise<void> => {
  console.log(`[Bags Protocol] Swapping ${amount} ${from} -> ${to}`);
  console.log(`[Fee Engine] 1% routed to Partner Key: ${partnerKey}`);
  return new Promise((resolve) => setTimeout(resolve, 1500));
};

export const fetchFeeData = async (partnerKey: string): Promise<FeeData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        unclaimed: Math.random() * 5.0,
        lifetime: 1240.50
      });
    }, 500);
  });
};

export const pollTradeEvents = (partnerKey: string, callback: (event: TradeEvent) => void) => {
  const interval = setInterval(() => {
    if (Math.random() > 0.85) {
      const event: TradeEvent = {
        id: Math.random().toString(36).substring(7),
        tokenSymbol: "SOL",
        amountUsd: Math.floor(Math.random() * 200) + 5,
        timestamp: Date.now(),
        userAddress: `Anon...${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      };
      callback(event);
    }
  }, 4000);
  return () => clearInterval(interval);
};