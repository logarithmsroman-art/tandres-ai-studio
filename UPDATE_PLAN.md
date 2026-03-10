# 🚀 Tandres AI Studio: Future Update Plan

This document outlines the roadmap for the "Free Tier" and "Ad-Gate" credit system.

---

## 💎 1. Free Tier Structure
Every new user enters the **Free Tier** by default upon account creation.

### 🛡️ Hard Limits (Free Tier)
*   **Audio Studio**: Maximum 1-minute duration per track/action.
*   **Video Studio/Magic Sync**: Maximum 1-minute duration per extraction.

---

## 💰 2. "Get Free Credits" System
A dedicated UI section (Top Header or Sidebar) allowing users to "Pre-load" their account with credits by exchanging time for ads.

### 📺 Credit Packages
*   **Bronze Bundle**: Get **1 Credit** (Watch 1 Video Ad).
*   **Gold Bundle**: Get **5 Credits** (Watch 5 Video Ads sequentially).
    *   *Note: Ads will play back-to-back. Each completion triggers a credit update in the Supabase database.*

### 🕒 "Banked" Credits Workflow
*   Users can watch ads during their free time (e.g., afternoon) to build a "Credit Balance."
*   These credits are saved to their profile and can be used later without watching more ads during the actual creative process.

---

## 🚧 3. "Instant Action" Gating
For users who haven't "Pre-loaded" credits, the tool will require an instant "Ad-Pass" before the engine starts.

### 🎧 Audio Extraction Gate
*   **Click "Generate"** -> Popup appears showing **"Ads: 0 / 1"**.
*   **Ad Plays** -> Once finished, the tool executes immediately.

### 📽️ Video Extraction / Magic Sync Gate
*   **Click "Generate"** -> Popup appears showing **"Ads: 0 / 3"**.
*   **Ad Loop**: 
    1.  Ad 1 finishes -> **"Ads: 1 / 3"**.
    2.  Ad 2 finishes -> **"Ads: 2 / 3"**.
    3.  Ad 3 finishes -> **"Ads: 3 / 3"**.
*   **Success**: Tool executes.

---

## 🪙 5. Dual-Currency Economy
The platform distinguishes between "Paid Power" and "Free Utility" to ensure profitability.

### ✨ Premium Credits (Paid)
*   **Symbol**: Gold/Purple Sparkle Icon.
*   **Acquisition**: Purchased via Top-up (Paystack).
*   **Usage**: Required for external AI API calls:
    *   Voice Clone (XTTS-v2)
    *   AI Presenter (Talking Head)
    *   Video Face-Swap
*   **Rule**: Ads **cannot** be used to earn Premium Credits.

### 🎞️ Free Tokens (Rewarded)
*   **Symbol**: Silver/Blue Film Icon.
*   **Acquisition**: Earned by watching 15-30s ads (Monetag).
*   **Usage**: Required for internal server tools (Multimedia Fusion Suite):
    *   Audio/Video Extraction
    *   Audio Joining/Trimming
    *   Magic Sync (A+V)
*   **Rule**: 1 Token = 1 Audio Action; 3 Tokens = 1 Video Action.

---

## 🏗️ 7. Zero-Cost Scaling Strategy
To compete with "Big Proxy" sites and reach ₦0.00 marginal cost.

### 🌐 Client-Side Processing (FFmpeg.wasm)
*   **Logic**: Shift CPU-heavy tasks (Trimming, Cutting, Extracting) to the user's browser.
*   **Benefit**: Platform pays $0 for CPU power. 10,000 users = 10,000 "Free" Workers.

### 🧠 Global Media Cache
*   **Logic**: Store results of popular URLs (YouTube link, etc.) in Supabase for 24 hours.
*   **Benefit**: Instant delivery for redundant requests with zero re-processing cost.

### 🔌 Proxy-Based Downloads
*   **Logic**: Use high-speed proxy APIs for initial video fetching to bypass Railway bandwidth limits.

---

## 🛠️ 8. Technical Implementation Notes
*   **Mediation Strategy**: Use **Monetag** as primary with **Adsterra** fallback to ensure 100% Fill Rate. 
*   **Database**: Add `premium_credits` and `free_tokens` columns to the `users` table in Supabase.
*   **Security**: Use "Ad Completion Callbacks" to prevent users from skipping videos or using dev-tools to fake views.
*   **Clean Up**: Auto-delete non-cached files on Railway disk every 60 minutes to stay within 25GB free tier.
