# 🏥 AISH Health Monitoring System

AI-powered waterborne disease surveillance dashboard with Node.js + Express + MongoDB backend.

---

## 📁 Project Structure

```
aish-backend/
├── server.js          ← Backend (Node.js + Express)
├── package.json       ← Dependencies
├── .env.example       ← Environment variable template
├── .gitignore         ← Ignore node_modules & .env
├── index.html         ← Frontend (your original HTML, updated)
└── README.md          ← This file
```

---

## 🚀 How to Deploy for FREE (Step by Step)

You need 3 free services:
| Service | What it does | Cost |
|---------|-------------|------|
| **GitHub** | Hosts the frontend (index.html) | Free |
| **MongoDB Atlas** | The database | Free (512MB) |
| **Render.com** | Hosts the backend (server.js) | Free |

---

### STEP 1 — Set up MongoDB Atlas (Free Database)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free account
3. Click **"Build a Database"** → Choose **M0 Free** tier → Click **Create**
4. Set a username + password (remember these!)
5. Under **"Where would you like to connect from?"** → Click **"Allow access from anywhere"** → Add IP `0.0.0.0/0`
6. Click **Connect** → **Drivers** → Copy the connection string
7. It looks like: `mongodb+srv://username:password@cluster0.abc123.mongodb.net/`
8. Change the end to: `mongodb+srv://username:password@cluster0.abc123.mongodb.net/aish_health?retryWrites=true&w=majority`

---

### STEP 2 — Push Backend to GitHub

1. Create a new repo on [github.com](https://github.com) called `aish-backend`
2. Run these commands in your terminal:

```bash
cd aish-backend
git init
git add .
git commit -m "Initial AISH backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aish-backend.git
git push -u origin main
```

> ⚠️ Make sure `.env` is in `.gitignore` — **never commit your MongoDB password!**

---

### STEP 3 — Deploy Backend on Render (Free Hosting)

1. Go to [https://render.com](https://render.com) → Sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your `aish-backend` GitHub repo
4. Fill in the settings:
   - **Name:** `aish-health-backend` (or anything you like)
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
5. Click **"Advanced"** → **"Add Environment Variable"**:
   - Key: `MONGODB_URI`
   - Value: Your MongoDB connection string from Step 1
6. Click **"Create Web Service"**
7. Wait ~2 minutes for it to deploy
8. You'll get a URL like: `https://aish-health-backend.onrender.com`

---

### STEP 4 — Update Frontend with Your Backend URL

Open `index.html` and find this line:

```javascript
: 'https://YOUR-RENDER-APP-NAME.onrender.com/api'; // ← CHANGE THIS after deploying
```

Replace it with your actual Render URL:

```javascript
: 'https://aish-health-backend.onrender.com/api';
```

---

### STEP 5 — Host Frontend on GitHub Pages (Free)

Option A — Same repo:
1. Go to your GitHub repo → **Settings** → **Pages**
2. Source: **"Deploy from a branch"** → Branch: `main` → Folder: `/` (root)
3. Click **Save**
4. Your site is live at: `https://YOUR_USERNAME.github.io/aish-backend/`

Option B — Separate repo:
1. Create a new repo called `aish-frontend`
2. Upload just the `index.html` file
3. Enable GitHub Pages the same way

---

### STEP 6 — (Optional) Lock Down CORS

Once your GitHub Pages URL is live, open `server.js` and change:

```javascript
origin: '*',
```

to:

```javascript
origin: 'https://YOUR_USERNAME.github.io',
```

Then push to GitHub — Render will auto-redeploy.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check if server is alive |
| GET | `/api/cases` | Get all cases |
| POST | `/api/cases` | Create a new case |
| PUT | `/api/cases/:id` | Update a case |
| DELETE | `/api/cases/:id` | Delete a case |
| POST | `/api/cases/sync` | Bulk sync offline cases |
| GET | `/api/stats` | Get summary stats |

---

## 💻 Running Locally (for development)

```bash
# Install dependencies
npm install

# Copy env file and fill in your MongoDB URI
cp .env.example .env
# Edit .env with your MongoDB Atlas connection string

# Start the server
npm start

# Or with auto-reload (development)
npm run dev
```

Open `index.html` directly in your browser — it will auto-detect localhost and connect to `http://localhost:3000/api`.

---

## ⚠️ Important Notes

- **Render free tier** spins down after 15 minutes of inactivity — first request after sleep takes ~30 seconds. This is normal!
- **MongoDB Atlas free tier** gives you 512MB storage — more than enough for this app
- **GitHub Pages** is completely free with no limits for static HTML
- The frontend has **offline mode** built in — if the backend is sleeping, data saves locally and syncs when backend wakes up

---

## 🔐 Login Credentials (Demo)

| Role | Username | Password |
|------|----------|----------|
| Doctor | `doctor` | `doctor123` |
| Admin | `admin` | `admin123` |
| Observer | *(no login needed)* | — |
