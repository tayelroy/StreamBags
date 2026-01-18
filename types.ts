
export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  image: string;
}

export interface StreamerProfile {
  id: string;
  slug: string;
  walletAddress: string;
  partnerKey: string;
  displayName: string;
}

export interface TradeEvent {
  id: string;
  tokenSymbol: string;
  amountUsd: number;
  timestamp: number;
  userAddress: string;
}

export interface FeeData {
  unclaimed: number;
  lifetime: number;
}

export enum AppRoute {
  HOME = 'home',
  TRADING = 'trading',
  DASHBOARD = 'dashboard',
  OVERLAY = 'overlay'
}
