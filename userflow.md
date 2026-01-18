```mermaid
graph TD
    %% Actor Definitions
    Streamer((Streamer))
    Viewer((Viewer/Trader))
    API[Bags.fm API]
    DB[(BagStream DB)]
    OBS[OBS Overlay]

    %% Streamer Onboarding
    Streamer -->|1. Connect Wallet| WebApp[StreamBags Web App]
    WebApp -->|2. Request Partner Key| API
    API -->|3. Return Key| WebApp
    WebApp -->|4. Store Mapping| DB
    WebApp -->|5. Provide Dashboard| Streamer

    %% Viewer Trading Flow
    Viewer -->|6. Visit bagstream.fm/slug| WebApp
    WebApp -->|7. Fetch Partner Key| DB
    Viewer -->|8. Execute Swap| API
    API -.->|9. Fee Attributed to Key| API

    %% Real-time Feedback Loop
    API -->|10. Poll Claim Events| Worker[Event Listener]
    Worker -->|11. Match Partner Key| DB
    Worker -->|12. Trigger Animation| OBS
    OBS -->|13. Visual Shoutout| Viewer```