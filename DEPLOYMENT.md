# 🚀 Deployment Guide: GitHub & Render

This guide outlines how to push **Book My Game** to a GitHub repository and deploy it to **Render** as a full-stack production application.

---

## 📌 Architecture on Render

When deployed to Render, the application runs as a **single unified web service**:
- The **Backend (Node.js/Express)** runs the REST API endpoints under `/api/...`.
- The **Frontend (React/Vite)** is automatically built and served directly by the backend for all page routes.
- **Benefit:** Zero CORS issues, single free tier service, and a single domain (e.g. `https://book-my-game.onrender.com`).

---

## 🛠️ Step 1: Push to GitHub

### Method A: Using Git CLI

Open PowerShell in the project directory:

```powershell
cd C:\Users\USER\.gemini\antigravity\scratch\book-my-game

# 1. Initialize git (if not already done)
git init

# 2. Stage all files
git add .

# 3. Create your initial commit
git commit -m "Initial commit: Book My Game fullstack sports platform"

# 4. Set branch to main
git branch -M main

# 5. Link to your new GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/book-my-game.git

# 6. Push to GitHub
git push -u origin main
```

*(If you don't have Git installed in PATH, use **GitHub Desktop** or open this folder in **VS Code** and click "Publish to GitHub").*

---

## 🌐 Step 2: Deploy to Render (Free Tier)

### 1. Create Render Account
* Visit [render.com](https://render.com) and sign in with your GitHub account.

### 2. Create New Web Service
1. Click the **"New +"** button in your Render dashboard and select **"Web Service"**.
2. Select your `book-my-game` GitHub repository.
3. Configure the following service settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `book-my-game` (or your choice) |
| **Region** | Oregon (US West) or Singapore / Frankfurt |
| **Branch** | `main` |
| **Root Directory** | *(Leave blank)* |
| **Runtime** | `Node` |
| **Build Command** | `npm run install:all && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 3. Environment Variables (Optional)
Under the **Environment Variables** section, you can optionally add:
* `NODE_ENV`: `production`
* `JWT_SECRET`: *(Any secure random string, e.g. `bmg_production_secret_key_9841`)*

### 4. Click "Deploy Web Service"
* Render will clone your GitHub repository, install packages, compile both frontend and backend, and launch your server!
* Once the build finishes, Render gives you a public URL:
  `https://book-my-game.onrender.com`

---

## 🩺 Step 3: Verify Your Live Deployment

1. Visit your Render URL: `https://your-service-name.onrender.com`
   * You should see the **Book My Game** dark sports interface with venue listings and the interactive slot booking grid.
2. Check API health: `https://your-service-name.onrender.com/api/health`
   * Should return: `{"status":"online","platform":"Book My Game — Kurnool Sports API",...}`
