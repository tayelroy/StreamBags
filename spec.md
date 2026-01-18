This technical architecture defines the **Streamer-Key Terminal**, a platform allowing influencers to launch custom trading portals that generate real-time partner fees via the Bags.fm API.

### **System Overview**

The system consists of a **White-Label Trading Frontend**, a **Streamer Management Dashboard**, and a **Real-Time Notification Engine** for OBS (Open Broadcaster Software) overlays.

---

### **Phase 1: Environment & API Foundation**

**Goal:** Establish secure communication with Solana and Bags.fm.

1. **Tech Stack:**
* **Frontend:** Next.js (App Router), Tailwind CSS, Lucide-react (icons).
* **Backend:** Node.js/Express or Next.js API Routes.
* **Database:** PostgreSQL (via Supabase or Prisma) to map `Streamer_ID` to `Bags_Partner_Key`.
* **Real-time:** Socket.io or Supabase Realtime for the OBS widget.


2. **External Integrations:**
* **Bags API Base URL:** `https://public-api-v2.bags.fm/api/v1/`
* **Required Headers:** `x-api-key: [DEVELOPER_KEY]`


3. **Authentication:**
* Implement Solana Wallet-Standard (using `@solana/wallet-adapter-react`) for streamers to sign in and claim fees.



---

### **Phase 2: Partner Key & Routing Logic**

**Goal:** Dynamically generate and map trading volume to specific influencers.

1. **Database Schema:**
* `Streamers` Table: `id`, `wallet_address`, `slug` (e.g., /stream/ninja), `partner_key`, `total_fees_earned`.


2. **Partner Key Automation:**
* When a streamer signs up, call `POST /partner-keys` on Bags.fm to generate a unique key.
* Store this key securely in the database.


3. **Dynamic Routing:**
* Create a dynamic route: `app/trade/[slug]/page.tsx`.
* When a user visits `bags-terminal.com/trade/streamer123`, the system fetches `streamer123`’s Partner Key from the DB and injects it into all subsequent Bags API trading calls.



---

### **Phase 3: The Trading Engine (Core Integration)**

**Goal:** Replicate the Bags trading experience with fee-tracking enabled.

1. **Token Discovery:**
* Use `GET /tokens` to populate the trading list.
* Use `GET /tokens/{address}` for individual token charts and data.


2. **Trade Execution:**
* Implement the swap UI. Use `POST /trade` endpoint.
* **Constraint:** Every trade request MUST include the `partner_key` associated with the current URL slug to ensure fee attribution.


3. **Fee Calculation:**
* Use `GET /partner-fees/{partner_key}` to show the streamer their "Unclaimed Balance" in the dashboard.



---

### **Phase 4: Real-Time OBS Overlay (The "Revenue Pop")**

**Goal:** Create a transparent "Proof of Revenue" widget for live streams.

1. **Webhook/Polling Service:**
* Bags API uses `GET /token-claim-events`. Set up a worker to poll this endpoint every 5–10 seconds.
* Filter events by the streamer’s `partner_key`.


2. **Socket Emission:**
* When a new trade/fee event is detected, emit a message via WebSockets: `io.to(streamer_id).emit('new_trade', { amount, fee_usd })`.


3. **The Overlay Component:**
* Create a dedicated route: `/overlay/[slug]`.
* This page is a transparent background with a CSS animation (e.g., a "Bags" icon jumping with a  text pop-up) triggered by the socket event.



---

### **Phase 5: Fee Claiming & Management**

**Goal:** Allow streamers to withdraw their earnings.

1. **Claim Interface:**
* A dashboard displaying "Lifetime Fees" and "Claimable Fees" using `GET /token-lifetime-fees`.


2. **Claim Execution:**
* Trigger `POST /claim-fees` for the specific Partner Key.
* The backend signs the transaction (or passes it to the frontend for the streamer’s wallet to sign) to move SOL/Tokens from the Bags program to the streamer’s wallet.



---

### **Implementation Steps for the Coding Agent**

1. **Step 1 (Scaffolding):** Setup Next.js with `@solana/web3.js` and a basic UI that lists tokens from `GET /tokens`.
2. **Step 2 (API Wrapper):** Write a centralized `bagsClient.ts` utility that handles authentication headers and error handling for all Bags.fm endpoints.
3. **Step 3 (The Swap Logic):** Build the swap component. Ensure the `partner_key` is passed as a variable based on the URL.
4. **Step 4 (Database Integration):** Connect PostgreSQL to store streamer profiles and their assigned Bags Partner Keys.
5. **Step 5 (The Overlay):** Build the transparent `/overlay/[slug]` page and the polling logic to trigger the animations.
6. **Step 6 (Deployment):** Deploy to Vercel, ensuring environment variables for the Bags API Key are strictly protected.