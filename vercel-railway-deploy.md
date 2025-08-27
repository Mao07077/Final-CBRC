# Deploy with Vercel (Frontend) + Railway (Backend)

## Deploy Backend to Railway

### 1. Go to Railway.app
- Sign up at https://railway.app
- Connect your GitHub account
- Click "Deploy from GitHub repo"
- Select your repository
- Choose the `src/backend` folder as root

### 2. Set Environment Variables in Railway
```
MONGO_URI=mongodb+srv://Admin:CBRCLP@cluster0.xjrey3k.mongodb.net/
DATABASE_NAME=cbrc
COLLECTION_NAME=userinfo
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=cbrcbot@gmail.com
EMAIL_HOST_PASSWORD=tkxxwctvyfhkjngt
JWT_SECRET=your-very-secure-jwt-secret-key-change-in-production
PORT=8000
```

### 3. Railway will automatically deploy your backend

## Deploy Frontend to Vercel

### 1. Update API URLs
First, update your frontend to use the Railway backend URL.

### 2. Go to Vercel.com
- Sign up at https://vercel.com
- Import your GitHub repository
- Vercel will auto-detect it's a Vite project
- Set build command: `npm run build`
- Set output directory: `dist`

### 3. Set Environment Variables in Vercel
```
VITE_API_URL=https://your-railway-backend-url.railway.app
```

## Result
- Frontend: https://your-app.vercel.app
- Backend: https://your-backend.railway.app
- Lightning fast, global CDN, automatic HTTPS
