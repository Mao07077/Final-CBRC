# Deploy Docker to AWS EC2

## Step 1: Create AWS EC2 Instance
1. Go to AWS Console (aws.amazon.com)
2. Launch EC2 instance:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.micro (free tier)
   - **Security Group**: Allow HTTP (80), HTTPS (443), Custom TCP (8000)

## Step 2: Connect and Setup
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Install Docker
sudo apt update
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose-plugin git -y

# Logout and login again for docker group
exit
# SSH back in
```

## Step 3: Deploy Application
```bash
# Clone and deploy
git clone https://github.com/YOUR_USERNAME/cbrcs-frontend.git
cd cbrcs-frontend
docker compose up -d
```

## Result
Access your app at: http://YOUR_EC2_PUBLIC_IP
