# Climate Action Games

Two interactive, AI-powered climate education simulations:

- **A Degree of Consequence** — You are a UN Climate Coordinator making global policy decisions across 5 decades (2026–2076). Grounded in IPCC AR6 science.
- **What You Can Actually Do** — You are a suburban homeowner and parent making local community decisions across 5 years (2026–2030). Grounded in peer-reviewed community action research.

Both games use the Claude API to generate unique narrative consequences for every decision, and support a "rewind and branch" feature to explore alternate paths.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- An [Anthropic API key](https://console.anthropic.com/)
- A free [Vercel account](https://vercel.com/) (for hosting)
- A free [GitHub account](https://github.com/) (for deployment)

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up your API key

Copy the example env file and add your key:

```bash
cp .env.example .env.local
```

Then open `.env.local` and replace `your_api_key_here` with your actual Anthropic API key from [console.anthropic.com](https://console.anthropic.com/).

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deploying to Vercel (Free Hosting)

### Step 1 — Push to GitHub

1. Go to [github.com](https://github.com) and create a new repository (name it `climate-games` or anything you like). Make it **private** if you prefer.
2. In your terminal, from the `climate-games` folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Step 2 — Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (or sign up — it's free).
2. Click **"Add New Project"**.
3. Click **"Import Git Repository"** and select your GitHub repo.
4. Vercel will auto-detect it as a Vite project. The default settings are correct — no changes needed.

### Step 3 — Add your API key in Vercel

Before clicking Deploy, scroll down to **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_ANTHROPIC_API_KEY` | `your_actual_api_key_here` |

### Step 4 — Deploy

Click **"Deploy"**. Vercel will build and deploy in about 60 seconds.

Your site will be live at a URL like `https://climate-games-abc123.vercel.app`.

### Step 5 — Custom domain (optional)

In your Vercel project settings, go to **Domains** and add your own domain if you have one.

---

## Redeploying After Changes

Any time you push changes to GitHub, Vercel will automatically redeploy:

```bash
git add .
git commit -m "your change description"
git push
```

---

## Project Structure

```
climate-games/
├── index.html              # HTML entry point
├── vite.config.js          # Vite configuration
├── vercel.json             # Vercel SPA routing config
├── package.json
├── .env.example            # Copy to .env.local and add your API key
├── .gitignore
└── src/
    ├── main.jsx            # React entry point + router
    ├── App.jsx             # Landing page (choose a game)
    ├── ClimateGame.jsx     # Global policy simulation
    └── ClimateLocal.jsx    # Local community simulation
```

---

## API Key Security Note

This app calls the Anthropic API directly from the browser. Your API key is included in the built client-side code, which means it is technically visible to anyone who inspects the page source.

**For a public educational site, this is generally acceptable** — but to protect against abuse:
- Set a **monthly spend limit** on your API key at [console.anthropic.com](https://console.anthropic.com/) under Billing → Usage Limits.
- Consider restricting the key to only the models you need.
- If the site gets significant traffic, consider adding a simple backend proxy (a Vercel serverless function) that holds the key server-side.

---

## Built With

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Claude API](https://docs.anthropic.com/) (claude-sonnet-4-20250514)
- Science: IPCC AR6, IEA Net Zero 2050, EPA, Global Carbon Budget, and peer-reviewed research
