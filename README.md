# 🖤 Amy — Goth Tsundere AI Chatbot
> Built by **Affan** · Solo Developer

---

## 🔒 Security — How the API Key is Protected

The API key **never touches the browser**.

```
Browser  →  POST /api/chat  →  Vercel Serverless Function  →  Gemini API
                               (key lives here only)
```

The key is stored as a **server-side** environment variable (`GEMINI_KEY`, no `VITE_` prefix).
Vercel functions run on the server — the key is never bundled into the frontend JS.

---

## 🚀 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env.local

# 3. Add your Gemini key to .env.local
GEMINI_KEY=your_actual_key_here

# 4. Run dev server (Vercel CLI recommended for local /api routes)
npx vercel dev
```

> **Note:** Plain `npm run dev` won't run the `/api/chat` serverless function locally.
> Use `npx vercel dev` to test the full stack locally. Install once: `npm i -g vercel`

---

## 🖼️ Adding Your Amy Image

1. Put your image in the **`/public/`** folder
2. Name it **`amy.png`**
3. Done — it loads everywhere automatically (header, messages, splash, about modal)

If no image is found, a 🖤 fallback placeholder appears.

---

## 🔑 Getting a Gemini API Key

1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with Google → click **Create API Key**
3. Copy the key

---

## ☁️ Deploy on Vercel (via GitHub)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Amy chatbot v2"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/amy-chat.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your `amy-chat` GitHub repo
3. Framework: **Vite** (auto-detected)
4. Open **Environment Variables** and add:
   - Name:  `GEMINI_KEY`
   - Value: `your_gemini_key_here`
   - ⚠️ Do **NOT** use `VITE_GEMINI_KEY` — that would expose it in the browser
5. Click **Deploy** ✅

### Step 3 — Redeploy after adding your image
```bash
# Add amy.png to /public/ then:
git add public/amy.png
git commit -m "add amy logo"
git push
# Vercel auto-redeploys
```

---

## 📁 Project Structure

```
amy-chat/
├── api/
│   └── chat.js          ← Serverless function (API key lives here, server-only)
├── public/
│   └── amy.png          ← 👈 YOUR IMAGE GOES HERE
├── src/
│   ├── App.jsx          ← Frontend (no API key — calls /api/chat)
│   └── main.jsx         ← React entry point
├── .env.example         ← Template (copy to .env.local)
├── .gitignore
├── index.html
├── package.json
├── vercel.json          ← SPA routing config
└── vite.config.js
```

---

## ⚙️ Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GEMINI_KEY` | Server only (Vercel) | Your Google Gemini API key — never exposed to browser |

---

## 🛠️ Tech Stack
- React 18 + Vite 5
- Vercel Serverless Functions (`/api/chat.js`)
- Google Gemini 2.0 Flash
- Pure CSS animations
