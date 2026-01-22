import { createClient } from '@supabase/supabase-js';
import { Token, StreamerProfile, TradeEvent, FeeData } from '../types';
import { MOCK_TOKENS } from '../constants';

// --- CONFIGURATION ---
// TODO: Move these to a .env file for production (e.g. import.meta.env.VITE_SUPABASE_URL)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; 
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 1. REAL DATABASE: STREAMER REGISTRY
 */

export const getAllStreamers = async (): Promise<StreamerProfile[]> => {
  const { data, error } = await supabase
    .from('streamers')
    .select('*');
    
  if (error) {
    console.error('Error fetching streamers:', error);
    return [];
  }
  
  // Map snake_case DB columns to camelCase TS types if needed, 
  // or ensure your DB columns match your types.
  return data.map(d => ({
    id: d.id,
    slug: d.slug,
    displayName: d.display_name,    // Mapping DB 'display_name' to TS 'displayName'
    walletAddress: d.wallet_address, // Mapping DB 'wallet_address' to TS 'walletAddress'
    partnerKey: d.partner_key       // Mapping DB 'partner_key' to TS 'partnerKey'
  }));
};

export const getStreamerBySlug = async (slug: string): Promise<StreamerProfile | undefined> => {
  const { data, error } = await supabase
    .from('streamers')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .single();

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

  if (error) {
    console.error("Supabase Error:", error);
    return undefined;
  }
  
  if (!data) return undefined; // Now this handles "user not found" gracefully

  return {
    id: data.id,
    slug: data.slug,
    displayName: data.display_name,
    walletAddress: data.wallet_address,
    partnerKey: data.partner_key
  };
};

export const createPartnerKey = async (walletAddress: string, slug: string, displayName: string): Promise<StreamerProfile> => {
  // 1. Generate a "Bags" partner key (In real life, this comes from the Bags Protocol API)
  const fakePartnerKey = `pk_bags_${Math.random().toString(36).substring(2, 10)}`;

  // 2. Save to Public Database
  const { data, error } = await supabase
    .from('streamers')
    .insert([
      { 
        slug: slug.toLowerCase(), 
        display_name: displayName, 
        wallet_address: walletAddress,
        partner_key: fakePartnerKey
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Registration Error:", error);
    throw new Error("Slug likely already taken");
  }

  return {
    id: data.id,
    slug: data.slug,
    displayName: data.display_name,
    walletAddress: data.wallet_address,
    partnerKey: data.partner_key
  };
};


/**
 * 2. BAGS PROTOCOL API (Still Simulated for MVP)
 * We still simulate the "Trading" part because we aren't connected to the real Bags Dex contract yet.
 */

export const fetchTokens = async (): Promise<Token[]> => {
  // In Phase 3: Replace with fetch('https://api.bags.fm/tokens')
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_TOKENS), 600));
};

export const executeSwap = async (from: string, to: string, amount: number, partnerKey: string): Promise<void> => {
  console.log(`[Bags Protocol] Swapping ${amount} ${from} -> ${to}`);
  console.log(`[Fee Engine] 1% routed to Partner Key: ${partnerKey}`);
  
  // This simulation is fine for the MVP Frontend demo
  return new Promise((resolve) => setTimeout(resolve, 1500));
};

export const fetchFeeData = async (partnerKey: string): Promise<FeeData> => {
  // Simulates fetching earnings from the blockchain
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
  // Simulates websocket events from the DEX
  const interval = setInterval(() => {
    if (Math.random() > 0.85) {
      const event: TradeEvent = {
        id: Math.random().toString(36).substring(7),
        tokenSymbol: MOCK_TOKENS[Math.floor(Math.random() * MOCK_TOKENS.length)].symbol,
        amountUsd: Math.floor(Math.random() * 200) + 5,
        timestamp: Date.now(),
        userAddress: `Anon...${Math.random().toString(36).substring(2, 6).toUpperCase()}`
      };
      callback(event);
    }
  }, 4000);
  return () => clearInterval(interval);
};