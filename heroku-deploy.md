# Deploy to Heroku

## Prerequisites
1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Create Heroku account: https://heroku.com

## Steps

### 1. Login to Heroku
```bash
heroku login
```

### 2. Create Heroku Apps
```bash
# Create backend app
heroku create your-app-name-backend

# Create frontend app  
heroku create your-app-name-frontend
```

### 3. Deploy Backend
```bash
# Navigate to backend
cd src/backend

# Initialize git if not already done
git init
git add .
git commit -m "Initial backend commit"

# Add Heroku remote
heroku git:remote -a your-app-name-backend

# Set environment variables
heroku config:set MONGO_URI=mongodb+srv://Admin:CBRCLP@cluster0.xjrey3k.mongodb.net/
heroku config:set DATABASE_NAME=cbrc
heroku config:set COLLECTION_NAME=userinfo
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_HOST_USER=cbrcbot@gmail.com
heroku config:set EMAIL_HOST_PASSWORD=tkxxwctvyfhkjngt
heroku config:set JWT_SECRET=your-very-secure-jwt-secret-key-change-in-production

# Deploy
git push heroku main
```

### 4. Deploy Frontend
```bash
# Go back to root
cd ../..

# Build frontend for production
npm run build

# Create static site deployment or use buildpack
```

## Your app will be live at:
- Backend: https://your-app-name-backend.herokuapp.com
- Frontend: https://your-app-name-frontend.herokuapp.com
