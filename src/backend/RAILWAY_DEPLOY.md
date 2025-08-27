# Railway Configuration for CBRCS Backend

## Environment Variables to Set in Railway:

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

## Deployment Steps:

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "Deploy from GitHub repo"
4. Select this repository
5. Choose "src/backend" as the root directory
6. Set the environment variables above
7. Deploy!

Your backend will be available at: https://your-app-name.railway.app
