# 🎒 StreamBags

**StreamBags** is the first white-label trading infrastructure and real-time revenue overlay for the Solana streaming era. Built on the [Bags.fm](https://docs.bags.fm/) API, it allows creators to capture the value they generate by providing their audience with a high-performance trading terminal and interactive "Revenue Pop" overlays.

---

## 🚀 Key Features

* **1-Click Partner Terminals:** Streamers can launch a custom branded exchange (e.g., `streambags.fm/ninja`) in seconds.
* **Automatic Fee Capture:** Uses the Bags.fm Partner Key system to route trading fees directly to the creator.
* **OBS "Revenue Pop" Overlay:** A transparent browser source that triggers high-fidelity animations on-stream whenever a trade is made through the terminal.
* **Analytics Dashboard:** Real-time tracking of Partner Fees, Lifetime Earnings, and top community "Baggers."

---

## 🛠 Tech Stack (2026 Edition)

- **Frontend:** Next.js 15 (App Router), Tailwind CSS 4.0.
- **Blockchain:** Solana Web3.js, `@solana/wallet-adapter`.
- **API Layer:** Bags.fm V2 Public API.
- **Real-time:** Supabase Realtime / Socket.io for OBS events.
- **Database:** PostgreSQL (Prisma) for Streamer-to-Key mapping.
- **Data Indexing:** Helius Webhooks for rapid trade detection.

---

## 🔌 API Integration Details

The project leverages the following core **Bags.fm** endpoints:

| Endpoint | Purpose |
| :--- | :--- |
| `POST /partner-keys` | Generates unique attribution keys for new streamers. |
| `GET /tokens` | Populates the real-time trading list in the terminal. |
| `POST /trade` | Executes swaps on-chain with the associated `partner_key`. |
| `GET /token-claim-events` | Monitors for successful fee generation to trigger the OBS overlay. |
| `POST /claim-fees` | Allows streamers to withdraw SOL/Tokens from the Bags program. |

---

## ⚙️ Setup Instructions

### 1. Clone & Install
```bash
git clone [https://github.com/your-repo/streambags.git](https://github.com/your-repo/streambags.git)
cd streambags
npm install