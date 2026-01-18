// services/geminiService.ts
import { Token } from "../types";

// Use the Vite env variable, fallback to localhost for safety
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

/**
 * Analyzes a token's market data via our secure backend.
 */
export const analyzeToken = async (token: Token) => {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error analyzing token:", error);
    return "Analysis unavailable.";
  }
};

/**
 * Provides trading alpha via our secure backend.
 */
export const getTradingAdvice = async (query: string, availableTokens: Token[]) => {
  try {
    const response = await fetch(`${API_URL}/advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, availableTokens }),
    });

    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error getting advice:", error);
    return "Trading advice unavailable at the moment.";
  }
};