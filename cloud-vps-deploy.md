# Deploy to Cloud VPS (DigitalOcean/AWS/GCP)

## Option A: DigitalOcean App Platform (Easiest)

### 1. Create DigitalOcean Account
- Go to https://digitalocean.com
- Create account and add payment method

### 2. Use App Platform
- Go to Apps section
- Create new app from GitHub
- Select your repository
- Configure:
  - Backend: Python app, src/backend folder
  - Frontend: Static site, build command: `npm run build`, output: `dist`

### 3. Set Environment Variables
Same as above configuration

## Option B: VPS with Docker (Full Control)

### 1. Create Droplet/EC2 Instance
- Ubuntu 22.04 LTS
- At least 1GB RAM
- Enable SSH access

### 2. Install Docker on Server
```bash
# SSH into your server
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin
```

### 3. Upload Your Code
```bash
# On your local machine
scp -r . root@your-server-ip:/app

# Or use git
ssh root@your-server-ip
cd /app
git clone https://github.com/yourusername/yourrepo.git
```

### 4. Deploy with Docker
```bash
# On server
cd /app
docker compose up -d
```

### 5. Configure Nginx (Optional)
```bash
# Install nginx
apt install nginx

# Configure reverse proxy
# Edit /etc/nginx/sites-available/default
```

### 6. Setup Domain & SSL
- Point your domain to server IP
- Install Certbot for free SSL
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

## Result
Your app will be live at your domain with HTTPS!
