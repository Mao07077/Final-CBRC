# CBRCS Docker Deployment Guide

This guide covers both **local development** and **cloud deployment** for public access.

## 🌐 CLOUD DEPLOYMENT (For Public Access)

### Option 1: DigitalOcean Droplet (Recommended)

#### Step 1: Create DigitalOcean Server
1. Go to https://digitalocean.com ($200 free credit available)
2. Create new Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic $6/month (1GB RAM, 1 vCPU)
   - **Add SSH key** or use password

#### Step 2: Setup Server
```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin git -y
```

#### Step 3: Deploy Your App
```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/cbrcs-frontend.git
cd cbrcs-frontend

# Update CORS for production (important!)
# Edit .env file to add your server IP
nano .env
# Add: CORS_ORIGINS=http://YOUR_SERVER_IP,https://YOUR_DOMAIN

# Deploy with Docker
docker compose up -d

# Check status
docker compose ps
```

#### Step 4: Configure Firewall
```bash
# Allow web traffic
ufw allow 80    # Frontend
ufw allow 443   # HTTPS
ufw allow 8000  # Backend API
ufw enable
```

**🎉 Your app is now live at: `http://YOUR_SERVER_IP`**

#### Optional: Add Custom Domain + SSL
```bash
# After pointing your domain to server IP
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

### Option 2: AWS EC2 / Google Cloud VM
Similar process - create Ubuntu VM, install Docker, deploy containers.

---

## 💻 LOCAL DEVELOPMENT

### Prerequisites

- **Docker**: [Download Docker](https://www.docker.com/get-started)
- **Docker Compose**: Usually included with Docker Desktop
- **Git**: To clone the repository

### Verify Installation

```bash
# Check Docker
docker --version

# Check Docker Compose
docker-compose --version
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd cbrcs-frontend
```

### 2. Configure Environment

Copy the environment example file and configure it:

```bash
# Copy environment file
cp .env.example .env

# Edit the .env file with your settings
# Required changes:
# - MONGO_ROOT_PASSWORD: Set a secure password
# - JWT_SECRET: Set a secure random string
# - MONGODB_URI: Configure if using external MongoDB
```

### 3. Deploy the Application

**Option A: Using the deployment script (Recommended)**

For Linux/macOS:
```bash
chmod +x deploy.sh
./deploy.sh
```

For Windows:
```cmd
deploy.bat
```

**Option B: Using Docker Compose directly**

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

Once deployed, you can access:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **MongoDB**: localhost:27017

## 🏗️ Architecture

The application consists of three main services:

### Frontend Service
- **Technology**: React + Vite
- **Container**: Nginx serving static files
- **Port**: 80
- **Features**: 
  - Optimized production build
  - Gzip compression
  - Client-side routing support
  - API proxy to backend

### Backend Service
- **Technology**: FastAPI + Python
- **Port**: 8000
- **Features**:
  - REST API endpoints
  - WebSocket support
  - File uploads
  - Health checks

### Database Service
- **Technology**: MongoDB 6.0
- **Port**: 27017
- **Features**:
  - Persistent data storage
  - Automatic initialization
  - Performance indexes

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://admin:password@mongo:27017/cbrc?authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password

# JWT Configuration
JWT_SECRET=your-very-secure-jwt-secret-key

# Application Configuration
ENVIRONMENT=production
DEBUG=false

# CORS Configuration
CORS_ORIGINS=http://localhost,http://localhost:3000,http://localhost:5173
```

### Using External MongoDB

If you want to use an external MongoDB (like MongoDB Atlas):

1. Update `MONGODB_URI` in `.env`:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cbrc?retryWrites=true&w=majority
   ```

2. Comment out the mongo service in `docker-compose.yml`

## 📊 Management Commands

### Using Deployment Scripts

```bash
# Deploy application
./deploy.sh deploy

# View logs
./deploy.sh logs

# Stop services
./deploy.sh stop

# Restart services
./deploy.sh restart

# Clean up everything
./deploy.sh clean
```

### Using Docker Compose

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart specific service
docker-compose restart [service-name]

# Scale services
docker-compose up -d --scale backend=2

# Update and rebuild
docker-compose up --build -d
```

### Individual Container Management

```bash
# List running containers
docker ps

# Execute commands in container
docker exec -it cbrcs-backend bash
docker exec -it cbrcs-mongo mongosh

# View container logs
docker logs cbrcs-backend -f

# Stop specific container
docker stop cbrcs-backend
```

## 🔍 Monitoring and Debugging

### Health Checks

All services include health checks:

```bash
# Check all service health
docker-compose ps

# Manual health check
curl http://localhost:8000/health
curl http://localhost/
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo

# With timestamps
docker-compose logs -f -t backend
```

### Database Access

```bash
# Access MongoDB shell
docker exec -it cbrcs-mongo mongosh

# Or with authentication
docker exec -it cbrcs-mongo mongosh -u admin -p password --authenticationDatabase admin

# View databases
show dbs

# Use cbrc database
use cbrc

# View collections
show collections
```

## 🛠️ Development

### Development vs Production

For development, you might want to:

1. Mount source code as volumes for hot reloading
2. Use development MongoDB without authentication
3. Enable debug mode

Create a `docker-compose.dev.yml`:

```yaml
version: '3.8'
services:
  backend:
    volumes:
      - ./src/backend:/app
    environment:
      - DEBUG=true
      - ENVIRONMENT=development
  
  frontend:
    command: npm run dev
    ports:
      - "5173:5173"
    volumes:
      - .:/app
```

Run with: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up`

### Building Individual Images

```bash
# Build backend only
docker build -t cbrcs-backend ./src/backend

# Build frontend only
docker build -t cbrcs-frontend .

# Run individual container
docker run -p 8000:8000 cbrcs-backend
```

## 🚢 Production Deployment

### Recommended Production Setup

1. **Use a reverse proxy** (Nginx, Traefik, or cloud load balancer)
2. **Enable HTTPS** with SSL certificates
3. **Use external MongoDB** for better reliability
4. **Set up monitoring** (Prometheus, Grafana)
5. **Configure backups** for data persistence
6. **Use Docker Swarm or Kubernetes** for orchestration

### Security Considerations

1. **Change default passwords** in `.env`
2. **Use strong JWT secrets**
3. **Limit CORS origins** to your domain
4. **Enable MongoDB authentication**
5. **Use secrets management** for sensitive data
6. **Regular security updates**

### Performance Optimization

1. **Resource limits** in docker-compose.yml
2. **Database indexing** for better query performance
3. **CDN** for static assets
4. **Caching** with Redis
5. **Load balancing** for multiple instances

## 🆘 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using the port
netstat -tulpn | grep :80
netstat -tulpn | grep :8000

# Change ports in docker-compose.yml if needed
```

**Database connection issues:**
```bash
# Check MongoDB logs
docker-compose logs mongo

# Verify connection string
docker exec -it cbrcs-backend python -c "from database import test_connection; test_connection()"
```

**Frontend build failures:**
```bash
# Check build logs
docker-compose logs frontend

# Clear npm cache
docker-compose down
docker system prune -f
docker-compose up --build
```

**Memory issues:**
```bash
# Check resource usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
```

### Getting Help

1. **Check logs** first: `docker-compose logs -f`
2. **Verify configuration**: Check `.env` file
3. **Test health endpoints**: `curl http://localhost:8000/health`
4. **Check network connectivity**: `docker network ls`

## 📝 Maintenance

### Regular Tasks

1. **Update images**: `docker-compose pull && docker-compose up -d`
2. **Clean up**: `docker system prune -f`
3. **Backup database**: `docker exec cbrcs-mongo mongodump`
4. **Monitor logs**: Regular log review for errors
5. **Security updates**: Keep base images updated

### Backup and Restore

```bash
# Backup MongoDB
docker exec cbrcs-mongo mongodump --out /backup --authenticationDatabase admin -u admin -p password

# Copy backup from container
docker cp cbrcs-mongo:/backup ./mongodb-backup

# Restore from backup
docker exec -i cbrcs-mongo mongorestore /backup --authenticationDatabase admin -u admin -p password
```

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test with Docker
4. Submit a pull request

For more information, visit the project repository.
