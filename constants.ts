
import { Token } from './types';

export const MOCK_TOKENS: Token[] = [
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 145.20, change24h: 3.5, marketCap: 65000000000, volume24h: 2100000000, image: 'https://picsum.photos/seed/sol/200' },
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', price: 0.000021, change24h: -1.2, marketCap: 1200000000, volume24h: 150000000, image: 'https://picsum.photos/seed/bonk/200' },
  { id: 'jupiter', symbol: 'JUP', name: 'Jupiter', price: 1.12, change24h: 12.4, marketCap: 1500000000, volume24h: 300000000, image: 'https://picsum.photos/seed/jup/200' },
  { id: 'pyth', symbol: 'PYTH', name: 'Pyth Network', price: 0.45, change24h: 0.8, marketCap: 600000000, volume24h: 50000000, image: 'https://picsum.photos/seed/pyth/200' },
  { id: 'raydium', symbol: 'RAY', name: 'Raydium', price: 1.85, change24h: -5.1, marketCap: 450000000, volume24h: 20000000, image: 'https://picsum.photos/seed/ray/200' },
];

export const APP_NAME = "StreamBags Terminal";
