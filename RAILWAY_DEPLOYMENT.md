# 🚂 Deploy to Railway - Complete Guide

## What You'll Get:
- **Backend**: https://your-backend.railway.app
- **Frontend**: https://your-frontend.railway.app
- **100% Free** for your usage level
- **Automatic deployments** from GitHub
- **Custom domains** available

## 📋 Prerequisites:
1. Code pushed to GitHub repository
2. Railway account (sign up with GitHub)

## 🚀 Deployment Steps:

### Step 1: Deploy Backend to Railway

1. **Go to https://railway.app**
2. **Sign up with GitHub**
3. **Click "Deploy from GitHub repo"**
4. **Select your repository**
5. **Important**: Set root directory to `src/backend`
6. **Set these environment variables in Railway dashboard**:
   ```
   MONGO_URI=mongodb+srv://Admin:CBRCLP@cluster0.xjrey3k.mongodb.net/
   DATABASE_NAME=cbrc
   COLLECTION_NAME=userinfo
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_HOST_USER=cbrcbot@gmail.com
   EMAIL_HOST_PASSWORD=tkxxwctvyfhkjngt
   JWT_SECRET=your-very-secure-jwt-secret-key-change-in-production
   ENVIRONMENT=production
   DEBUG=false
   PORT=8000
   ```
7. **Deploy** - Railway will automatically detect Python and install requirements

### Step 2: Deploy Frontend to Railway

1. **Create a new Railway service**
2. **Same GitHub repo, but root directory is `/` (main folder)**
3. **Set environment variable**:
   ```
   VITE_API_URL=https://your-backend-name.railway.app
   ```
4. **Railway will detect Vite and build automatically**

### Step 3: Update CORS (Important!)

After you get your Railway URLs, update your backend environment variables:
```
CORS_ORIGINS=https://your-frontend-name.railway.app,http://localhost:3000
```

## 🎉 That's It!

Your app will be live at:
- Frontend: `https://your-frontend.railway.app`
- Backend: `https://your-backend.railway.app`

## 💡 Pro Tips:
- Railway gives you **automatic HTTPS**
- **Custom domains** are free to add
- **Auto-deployments** on every git push
- **Logs and metrics** in the dashboard

## 🔧 Troubleshooting:
- If build fails, check the logs in Railway dashboard
- Make sure your GitHub repo is public or Railway has access
- Environment variables are case-sensitive

Ready to deploy? Let me know if you need help with any step!
