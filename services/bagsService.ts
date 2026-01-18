
import { Token, StreamerProfile, TradeEvent, FeeData } from '../types';
import { MOCK_TOKENS } from '../constants';

const DB_KEY = 'streambags_registry_v1';

/**
 * DATABASE SIMULATION (Phase 2)
 * Maps Streamer_ID and Slug to Bags_Partner_Key.
 */
const getRegistry = (): StreamerProfile[] => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : [];
};

const saveToRegistry = (profile: StreamerProfile) => {
  const registry = getRegistry();
  const existingIndex = registry.findIndex(p => p.slug === profile.slug);
  if (existingIndex > -1) {
    registry[existingIndex] = profile;
  } else {
    registry.push(profile);
  }
  localStorage.setItem(DB_KEY, JSON.stringify(registry));
};

export const getStreamerBySlug = async (slug: string): Promise<StreamerProfile | undefined> => {
  const registry = getRegistry();
  return registry.find(p => p.slug === slug.toLowerCase());
};

export const getAllStreamers = async (): Promise<StreamerProfile[]> => {
  return getRegistry();
};

/**
 * Bags.fm API Client Wrapper
 */
export const fetchTokens = async (): Promise<Token[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_TOKENS), 600);
  });
};

export const executeSwap = async (from: string, to: string, amount: number, partnerKey: string): Promise<void> => {
  console.log(`[Bags API] Swap executed. Attribution: ${partnerKey}`);
  return new Promise((resolve) => setTimeout(resolve, 1500));
};

export const createPartnerKey = async (walletAddress: string, slug: string, displayName: string): Promise<StreamerProfile> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const profile: StreamerProfile = {
        id: Math.random().toString(36).substring(2, 10),
        slug: slug.toLowerCase().replace(/[^a-z0-9]/g, ''),
        displayName,
        walletAddress,
        partnerKey: `pk_bags_${Math.random().toString(36).substring(2, 10)}`
      };
      saveToRegistry(profile);
      resolve(profile);
    }, 1000);
  });
};

export const fetchFeeData = async (partnerKey: string): Promise<FeeData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        unclaimed: Math.random() * 2.5,
        lifetime: 100 + Math.random() * 500
      });
    }, 500);
  });
};

export const pollTradeEvents = (partnerKey: string, callback: (event: TradeEvent) => void) => {
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
