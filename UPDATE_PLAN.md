# 🚀 Tandres AI Studio: Monetization & Feature Roadmap (V3.0)

This document outlines the final business logic for Subscription Plans, the Lab tools, the Ad-Monetization strategy, and all Homepage/UI changes.

---

## 💎 1. Subscription & Credit Plans

### 🛡️ Tier 1: Free Tier (Default)
*   **Access**: Ad-supported.
*   **Ad Gate**: Users must watch **1 advert** before any action (Audio or Video). One ad = one action unlocked.
*   **YouTube / Instagram Limits**: Allows extraction of videos up to **30 minutes** in duration.
*   **TikTok Limits**: Allows extraction of videos up to **1 minute 30 seconds** in duration.
*   **Editing Tools (Trimmer, Joiner, Magic Sync)**: Available, but ad-gated (1 ad per action).
*   **🎁 Get Free Credits**:
    - Users can **proactively watch ad videos** to earn free credits: **1 ad video = 1 free credit**.
    - Free credits are **saved to the user's account** and can be accumulated over time.
    - When a user wants to perform any action (extraction, trimming, joining, etc.), they can **spend 1 free credit instead of watching an ad** — skipping the ad gate entirely.
    - **Example**: A user watches 5 ad videos in advance → earns 5 free credits → later extracts 3 videos without watching any ads (balance goes from 5 → 2).
    - Free credits work across **all Lab tools** (Audio Extraction, Video Extraction, Trimmer, Joiner, Magic Sync).

### ⚡ Tier 2: Starter Plan (₦3,000 / 1 Month)
*   **Ad-Free Experience**: No advertisements across **any** Lab tool (Extraction, Trimming, Joining, Magic Sync) for the full month.
*   **YouTube Extraction**: Free & unlimited, up to **1-hour** video duration.
*   **Instagram Extraction**: Free & unlimited, up to **1-hour** video duration.
*   **TikTok Extraction**: **200 Extractions** included. Each TikTok extraction (audio or video) deducts 1 from the balance (e.g., extract 1 TikTok → remaining balance = 199).
*   **TikTok Duration Limit**: Maximum **5-minute** video per extraction.

### 🏆 Tier 3: Pro Plan (₦15,000 / 2 Months)
*   **Ad-Free Experience**: Complete ad-free usage across **all** Lab tools for 2 full months.
*   **YouTube Extraction**: Free & unlimited, up to **2-hour** video duration.
*   **Instagram Extraction**: Free & unlimited, up to **2-hour** video duration.
*   **TikTok Extraction**: **500 Extractions** included. Each TikTok extraction (audio or video) deducts 1 from the balance.
*   **TikTok Duration Limit**: Maximum **10-minute** video per extraction.

### 🪄 Tier 4: Elite Pulse Credits (Flat Credit Purchase)
*   *Replaces the old "Monthly Pro" pack. This is NOT a monthly subscription — it's a one-time credit purchase.*
*   **Volume**: **150 Premium Credits** (Flat purchase, use whenever you want).
*   **No Daily Limits**: Users can use all 150 credits in one sitting if they want. There are absolutely **0 daily limits**.
*   **No Cooldowns**: No cooldown between generations unless it starts causing server or application issues. If server load becomes a problem, we may add a small cooldown (e.g., 30s between runs or 5-min cooldown after 20 consecutive runs), but **only** if necessary.
*   **Simple Rule**: You finish your credits → you purchase more. No restrictions.

> **Note on other Voice Clone Packs (Start Pack, Creator Pack, Studio Pack):** These remain unchanged. Only the old "Monthly Pro" has been replaced by this new "Elite Pulse Credits" flat purchase system.

---

## 🏗️ 2. The Lab — Tool UI Specs

### 🛑 General UI Directives
*   **Hide the Tech**: Remove **ALL** of the following from the UI:
    - "Zero-Cost"
    - "Powered by Browser Engine" / "Powered by Zero-Cost browser engine"
    - "LPU Engaged"
    - "Privacy: Start-to-End"
    - Any model/engine version info (e.g., "engine 1.5")
    - Any processing messages that explain how the system works internally (e.g., "processing locally", "sending to your browser", etc.)
*   **No Technical Explanations**: Processing should look like **magic**. Users should **never** see details about local processing, hardware stats, or what models/tools we use. That information is for us only.
*   **Unified Button Names**:
    - Input Phase: Change the **"Link"** button to **"Extract"** (greyed out until a link is pasted, then becomes clickable).
    - Final Action: Change **"Engage Suite"** to **"Extract Now"** (for extraction tools) or **"Process Now"** (for editing tools).

---

### 🛠️ Tool Inventory & UI Behavior

#### 1. 🎵 Audio Extraction
*   **Full Name**: Audio Extraction *(not "Audio Ext")*.
*   **Description**: "Extract crystal-clear audio from any video link or local file."
*   **Inputs**: URL Link **and** Local File Upload.
*   **Buttons**: "Link" → **"Extract"** | "Engage Suite" → **"Extract Now"**.
*   **Live Workspace Fix**: [x] Currently, the live workspace only previews extracted **videos** but does **not** play extracted **audio** live. **This must be fixed** — audio should play live in an interactive waveform player after extraction.

#### 2. 📽️ Video Extraction
*   **Full Name**: Video Extraction *(not "Video Ext")*.
*   **Description**: "Extract high-quality video directly from YouTube, Instagram, or TikTok."
*   **Inputs**: **URL Links Only**. Remove the Local File Upload for this tool entirely — we are extracting from online links, not uploading local files.
*   **Buttons**: "Link" → **"Extract"** | "Engage Suite" → **"Extract Now"**.

#### 3. ✂️ Audio Trimmer
*   **Full Name**: Audio Trimmer *(not "Cutter" or "Cut Up")*.
*   **Description**: "Clip your audio tracks with studio-level accuracy." *(Replace "Clip Sections" with a better phrase like this)*.
*   **Inputs**: **Local Upload Only**. No link extraction for this tool.
*   **Buttons**: "Engage Suite" → **"Process Now"**.
*   **Studio UI (CapCut-Style)**: [x]
    - When the user uploads an audio file, it should display in a **studio-style player**.
    - The user must be able to **play** the audio and **seek through it** freely (e.g., click/drag to jump to 10s, 30s, etc. — just like playing a song on your phone where you can skip to any point).
    - **Mark Start / Mark End**: While playing, the user clicks **"Mark Start"** at the desired start point and **"Mark End"** at the desired end point to define the cut range.
    - **Example**: User uploads a 1-minute audio → plays to 10 seconds → clicks "Mark Start" → continues playing to 25 seconds → clicks "Mark End" → this defines a 15-second clip from 0:10 to 0:25.
    - **No parameters/input fields** for entering timestamps manually — it should all be done visually via the playhead, like CapCut.

#### 4. ➕ Audio Joiner
*   **Full Name**: Audio Joiner.
*   **Description**: "Seamlessly merge multiple audio tracks into a single masterpiece."
*   **Inputs**: **Multiple Local Uploads Only**. No link extraction.
*   **Buttons**: "Engage Suite" → **"Process Now"**.
*   **Studio UI (CapCut-Style)**: [x]
    - When the user uploads the **first** audio file, it appears on the **left side**.
    - When they upload the **second** file, it appears on the **right side** (next to the first).
    - **Third file** and beyond: continues stacking to the right in order.
    - Each uploaded audio file should have its own **playback controls** — the user can play/preview each track individually.
    - A **"Live Preview"** button plays all the tracks combined in sequence so the user can hear the final merged result before downloading.
    - The same **seek/playhead** functionality from the Audio Trimmer applies here — users can scrub through each individual track.

#### 5. 🪄 Magic Sync (A+V Fusion)
*   **Full Name**: Magic Sync.
*   **Description**: "Extract audio and video from any link at once."
*   **Inputs**: **URL Links Only** (YouTube, Instagram, TikTok). **Remove Local File Upload** for this tool.
*   **Buttons**: "Link" → **"Extract"** | "Engage Suite" → **"Extract Now"**.
*   **Live Workspace**: [x] After extraction, show a **live preview for the audio** (waveform player) **and** a **live preview for the video** (video player), both visible simultaneously.
*   **TikTok Rules Apply**: If the user pastes a TikTok link, all TikTok duration limits and extraction deduction rules apply based on the user's plan (see Section 4 below).

---

## 💰 3. Monetization & Ad Network Strategy

### 🌍 Primary Network: Monetag (Nigeria/Africa Focus)
*   **Why Monetag**: Best ad network for our target audience (Nigerian & African users).
*   **Specialty**: High eCPM for emerging African markets (Nigeria, Kenya, South Africa).
*   **SmartTag**: One piece of code that automatically rotates between the highest-paying ad formats:
    1.  **Skip-Ads (Pre-roll)** — Video ads users can skip.
    2.  **Interstitials (Bridges)** — Full-screen ads between actions.
    3.  **Vignettes (Native)** — Lightweight native-style ads.
*   **Payouts**: Easy withdrawal in Nigeria via Payoneer, Wire transfer, etc.

### 🛡️ Fallback Hierarchy (100% Fill Rate)
To ensure we **always** have an ad to show (never a blank/failed ad slot), the system uses a 3-layer fallback:
1.  **Layer 1 (Primary)**: Monetag SmartTag.
2.  **Layer 2 (Backfill)**: Adsterra — High ad density, great for mobile users.
3.  **Layer 3 (Global Fallback)**: PropellerAds — Standard clean ads, global coverage.

> **Goal**: 100% fill rate. There should **always** be an advert to show to free-tier users. If Monetag has no ad, Adsterra fills in. If Adsterra has no ad, PropellerAds fills in.

---

## 🏠 4. Homepage Changes

*   **Add Lab to Homepage**: Place the Lab (all 5 tools) on the homepage **beside the Voice Clone** section.
*   **Remove "Multimedia Fusion Suite"**: Replace this branding with just **"The Lab"** or a cleaner name on the homepage.
*   **Remove All Technical Info from Homepage**:
    - Remove "Zero-Cost", "LPU Engaged", "Privacy: Start-to-End" labels.
    - Remove any model/engine references (e.g., "engine 1.5", "Powered by…").
    - Remove any processing messages that explain our internal architecture.
    - **Rule**: The user should never know how the system works behind the scenes. It's magic to them.

---

## 🛠️ 5. Technical Constraints & Universal Rules

### 🔴 TikTok Universal Rule
**This rule applies to EVERY tool that touches a TikTok link** — whether it's Video Extraction, Audio Extraction, or Magic Sync:
*   **1 TikTok Link = 1 Deduction** from the user's plan balance, regardless of whether Audio or Video is extracted. (e.g., if you have 200 TikTok extractions and you extract 1 audio from TikTok → balance = 199).
*   **Duration limits** are enforced per plan:
    - **Free Tier**: Max **1 min 30 sec**.
    - **Starter Plan**: Max **5 minutes**.
    - **Pro Plan**: Max **10 minutes**.
*   This rule applies everywhere: Video Extraction, Audio Extraction, **and** Magic Sync. If a TikTok link is detected, the TikTok rules kick in automatically.

### 🔐 Auth & Syncing
*   All plans, credit balances, and TikTok deduction counts are synced to **Supabase**.
*   Plan status is checked on every action to enforce limits.

### ⚡ Performance
*   Use `/api/serve-media` for all tunneled TikTok content to ensure zero production lag.
