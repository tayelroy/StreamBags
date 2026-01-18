// server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config(); // Load environment variables from .env

const app = express();
app.use(cors()); // Allow your Vite app to talk to this server
app.use(express.json());

// Initialize Gemini securely on the server
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Endpoint for analyzing tokens
app.post('/api/analyze', async (req, res) => {
  try {
    const { token } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this crypto token data... (same prompt as before)
      Symbol: ${token.symbol}
      Price: $${token.price}
      24h Change: ${token.change24h}%
      Market Cap: $${token.marketCap}`,
      config: { temperature: 0.7, topK: 40, topP: 0.95 }
    });

    // Send the text back to the frontend
    res.json({ text: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to analyze token' });
  }
});

// server.ts (Add this new endpoint)

// Endpoint for trading advice / chat
app.post('/api/advice', async (req, res) => {
  try {
    const { query, availableTokens } = req.body;

    // Format the token list for the AI
    const tokenList = availableTokens.map((t: any) => `${t.symbol} ($${t.price})`).join(', ');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Or 'gemini-2.0-flash' if 1.5 is unavailable
      contents: `The user asks: "${query}". 
      The current available tokens are: ${tokenList}. 
      Act as a high-frequency trading analyst assistant for the Solana ecosystem. Recommend tokens if they match the query, or explain general market conditions.`,
      config: {
        temperature: 0.8,
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Advice Error:", error);
    res.status(500).json({ error: 'Failed to get advice' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});