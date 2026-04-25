# Environment Variables Guide

This guide explains how to obtain the keys and configuration values required for the `.env` file in the TrendSeismograph project.

> **ZerveHack 2026 note.** Reddit API access was not granted for the hackathon submission, so Section 3 below is dormant for the Zerve project (the legacy NestJS service still uses it if configured). The active discourse signal is YouTube Data API v3; see [`zerve/cells/03_fetch_youtube.py`](../zerve/cells/03_fetch_youtube.py) for the `YOUTUBE_API_KEY` requirement.

## 1. App & Security

### `API_KEY_SECRET`
- **What it is:** A secret key used to protect write/delete endpoints (e.g., adding trends, creating alerts).
- **How to get it:** Generate a long, random string.
- **Example (bash):** `openssl rand -base64 32`

### `NLP_SERVICE_SECRET`
- **What it is:** A shared secret between the NestJS backend and the Python NLP service.
- **How to get it:** Generate another long, random string. It **must** be the same value in both the backend and NLP service environments.
- **Example (bash):** `openssl rand -base64 32`

---

## 2. Infrastructure (PostgreSQL & Redis)

If you are using **Docker Compose**, these are defined by you.

### `POSTGRES_PASSWORD` / `DATABASE_URL`
- **How to get it:** Choose a strong password for `POSTGRES_PASSWORD`.
- **Database URL format:** `postgresql://postgres:<your-password>@localhost:5432/trendseismograph`

### `REDIS_PASSWORD` / `REDIS_URL`
- **How to get it:** Choose a strong password for `REDIS_PASSWORD`.
- **Redis URL format:** `redis://:<your-password>@localhost:6379`

---

## 3. Reddit API (`REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`)

Required for the NLP service to fetch recent discourse about trends.

1.  Log in to your Reddit account.
2.  Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps).
3.  Scroll to the bottom and click **"are you a developer? create an app..."**.
4.  **IF YOU GET REDIRECTED TO A SUPPORT/REQUEST FORM:** 
    Reddit now manually reviews some accounts. Use these professional responses to ensure fast approval for this hackathon project:

    - **Inquiry Type:** Select "Individual Developer" or "Hobbyist/Research".
    - **App Description:** "TrendSeismograph is a research project for the Zerve AI Hackathon. It functions as a read-only data-science pipeline that fetches public posts/comments to perform discourse stage classification using HuggingFace NLP models. No data is resold."
    - **Why not use Devvit?:** "My project requires an external multi-service architecture (NestJS + Python NLP microservice) to fuse Reddit data with external signals like Google Trends. This complex, high-compute cross-platform processing cannot be executed within the Devvit sandbox."
    - **Subreddits:** "General interest, hobby, and technology subreddits (e.g., r/technology, r/fitness, r/gaming) for read-only trend analysis."
    - **Benefit:** "Provides a 'macro' view of community growth and discourse evolution. Helps researchers identify tipping points in cultural trends early."

5.  **IF YOU SEE THE STANDARD 'CREATE APP' FORM:**
    - **name:** `TrendSeismograph`
    - **App type:** Select **script**.
    - **redirect uri:** `http://localhost:8080`
6.  Click **create app**.
7.  **Client ID:** The string appearing directly under "personal use script" (e.g., `k8x9J...`).
8.  **Client Secret:** The string labeled "secret" (e.g., `_zL0...`).
9.  **User Agent:** `web:TrendSeismograph:1.0 (by /u/YourRedditUsername)`

---

## 4. Email Alerts (`RESEND_API_KEY`)

Required for sending email notifications when a trend crosses a score threshold.

1.  Go to [resend.com](https://resend.com) and create an account.
2.  Go to the **API Keys** section in the dashboard.
3.  Click **Create API Key**.
4.  Give it a name (e.g., `TrendSeismograph Prod`) and set the permission to **Full Access**.
5.  Copy the key starting with `re_`.
6.  **`ALERT_FROM_EMAIL`**: By default, Resend allows sending from `onboarding@resend.dev` to your own email. For production, you must verify a domain in Resend and use an email like `alerts@yourdomain.com`.

---

## 5. Frontend & URLs

### `FRONTEND_URL`
- **Local:** `http://localhost:3000`
- **Production:** The URL where your Next.js app is hosted (e.g., `https://trendseismograph.com`).

### `NEXT_PUBLIC_API_URL`
- **Local:** `http://localhost:3001`
- **Production:** The public URL of your NestJS backend.

---

## Summary Checklist

| Key | Source | Required for... |
| :--- | :--- | :--- |
| `API_KEY_SECRET` | Manual Generation | Security (API) |
| `REDDIT_CLIENT_ID` | Reddit Dev Portal | Ingestion (Reddit) |
| `REDDIT_CLIENT_SECRET` | Reddit Dev Portal | Ingestion (Reddit) |
| `RESEND_API_KEY` | Resend Dashboard | Notifications (Email) |
| `DATABASE_URL` | Self-hosted or Provider | Data Persistence |
| `REDIS_URL` | Self-hosted or Provider | Caching / Queues |
