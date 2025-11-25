# 🚀 START HERE - AWS Deployment in 3 Simple Steps

**Goal:** Get your app running on AWS for FREE to take screenshots for your report.

**Time:** 1-2 hours
**Cost:** $0.00

---

## Step 1: Create EC2 Instance (15 minutes)

### 1.1 Go to AWS Console
- Open: https://console.aws.amazon.com/ec2/
- Click **"Launch Instance"** (big orange button)

### 1.2 Configure Instance

**Instance name:**
```
airbnb-lab2
```

**Choose AMI (Operating System):**
- Select: **Amazon Linux 2023 AMI**
- Make sure it says "Free tier eligible" ✅

**Choose Instance Type:**
- Select: **t2.micro** (should be selected by default)
- Make sure it says "Free tier eligible" ✅

**Key Pair:**
- Click "Create new key pair"
- Name: `airbnb-lab2-key`
- Type: RSA
- Format: .pem
- Click "Create key pair" - **This will download a file. SAVE IT!**

**Network Settings (IMPORTANT!):**
- Click "Edit" next to Network settings
- Under "Firewall (security groups)", select "Create security group"
- Security group name: `airbnb-lab2-sg`

Click **"Add security group rule"** multiple times and add these:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | My IP | SSH access |
| Custom TCP | 5001 | Anywhere (0.0.0.0/0) | Backend |
| Custom TCP | 5002 | Anywhere | Owner Service |
| Custom TCP | 5003 | Anywhere | Property Service |
| Custom TCP | 5004 | Anywhere | Booking Service |
| Custom TCP | 5005 | Anywhere | Traveler Service |
| Custom TCP | 5173 | Anywhere | Frontend |
| Custom TCP | 8080 | Anywhere | Kafka UI |

**Storage:**
- Keep default: 30 GiB gp3 (This is free tier)

### 1.3 Launch Instance
- Click **"Launch Instance"** (orange button at bottom)
- Wait 2-3 minutes for instance to start
- Click on the instance name to see details
- **COPY THE PUBLIC IP ADDRESS** (looks like: 54.123.45.67)

---

## Step 2: Connect & Deploy (30 minutes)

### 2.1 Connect to EC2

**On Mac/Linux:**
```bash
# Go to where you downloaded the .pem file
cd ~/Downloads

# Set correct permissions
chmod 400 airbnb-lab2-key.pem

# Connect (replace XX.XX.XX.XX with your EC2 public IP)
ssh -i airbnb-lab2-key.pem ec2-user@XX.XX.XX.XX
```

When asked "Are you sure you want to continue?", type `yes`

You should now see something like:
```
[ec2-user@ip-xxx-xx-xx-xx ~]$
```

✅ **You're now inside your EC2 instance!**

### 2.2 Run the Magic Script

Copy and paste these commands **ONE BY ONE**:

```bash
# Download the deployment script
curl -o deploy.sh https://raw.githubusercontent.com/PrajwalDambalkar/Airbnb-Clone/feature/Jmeter/scripts/deploy-aws.sh

# Make it executable
chmod +x deploy.sh

# Run it (this takes 5-10 minutes)
./deploy.sh
```

The script will install Docker, Git, and set everything up. Just wait for it to complete.

When it's done, you'll see:
```
✓ Installation Complete! 🎉
```

### 2.3 Logout and Login Again

```bash
# Type this:
exit

# Now reconnect (same command as before)
ssh -i airbnb-lab2-key.pem ec2-user@XX.XX.XX.XX
```

This is needed for Docker permissions to work.

### 2.4 Start Your Application

```bash
# Go to the project folder
cd Airbnb-Clone

# Start all services (this takes 10-15 minutes to build)
docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d --build
```

You'll see Docker building images. This is normal. Just wait...

When done, check if everything is running:
```bash
docker ps
```

You should see 9 containers running! ✅

---

## Step 3: Access & Take Screenshots (30 minutes)

### 3.1 Access Your Application

Replace `XX.XX.XX.XX` with your EC2 public IP:

**In your web browser, open:**
- Frontend: `http://XX.XX.XX.XX:5173`
- Kafka UI: `http://XX.XX.XX.XX:8080`

**Test backend API (in terminal):**
```bash
curl http://localhost:5001/health
```

Should return: `{"status":"healthy"}` or similar ✅

### 3.2 Quick Screenshot Checklist

You need these screenshots for your report:

#### A. AWS Console (take these now while in AWS)
1. Go to EC2 Dashboard - screenshot showing your instance running
2. Click on your instance - screenshot of instance details
3. Security tab - screenshot of security group rules
4. Monitoring tab - screenshot of CPU/Network graphs
5. Billing Dashboard - screenshot showing $0.00

#### B. Application Screenshots
1. Frontend homepage (`http://XX.XX.XX.XX:5173`)
2. Kafka UI (`http://XX.XX.XX.XX:8080`) - Topics page
3. Run this in terminal and screenshot:
   ```bash
   docker ps
   ```
4. Run this and screenshot:
   ```bash
   docker stats --no-stream
   ```

#### C. Redux DevTools (in browser)
1. Open frontend (`http://XX.XX.XX.XX:5173`)
2. Press F12 (open DevTools)
3. Click "Redux" tab
4. Screenshot the state tree

### 3.3 Use the Screenshot Helper

For a guided tour of all screenshots:
```bash
./scripts/screenshot-helper.sh
```

This will walk you through everything step by step!

---

## 🎉 You're Done!

You now have:
- ✅ App running on AWS Free Tier
- ✅ All services working
- ✅ Screenshots for your report
- ✅ Zero cost

---

## 🛑 When You're Done (IMPORTANT!)

### Stop Services
```bash
# In EC2 terminal
docker-compose -f docker-compose.aws.yml down
```

### Stop EC2 Instance
1. Go to AWS Console
2. EC2 → Instances
3. Select your instance
4. Instance State → Stop instance

**Don't forget to stop it to avoid charges!**

---

## 🐛 Troubleshooting

### Can't connect to EC2
```bash
# Make sure .pem file has correct permissions
chmod 400 airbnb-lab2-key.pem

# Make sure you're using the right IP
# Get it from AWS Console → EC2 → Your instance → Public IPv4 address
```

### Docker build fails
```bash
# If you run out of memory, try removing some services
# Edit docker-compose.aws.yml and comment out:
# - agent-service (not needed for screenshots)
# - kafka-ui (optional, can use CLI instead)
```

### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.aws.yml logs

# Restart specific service
docker-compose -f docker-compose.aws.yml restart backend
```

### Can't access frontend in browser
1. Double-check the EC2 public IP address
2. Make sure security group has port 5173 open
3. Wait 1-2 minutes after starting - Docker needs time to start services

---

## 📊 Quick Commands Reference

```bash
# Check running containers
docker ps

# View logs
docker-compose -f docker-compose.aws.yml logs -f

# Stop all services
docker-compose -f docker-compose.aws.yml down

# Restart a service
docker-compose -f docker-compose.aws.yml restart backend

# Check resources
docker stats

# Get your EC2 IP
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

---

## 📞 Need Help?

1. Read the detailed guide: `AWS_FREE_TIER_DEPLOYMENT.md`
2. Check quick reference: `AWS_QUICK_REFERENCE.md`
3. Full summary: `AWS_DEPLOYMENT_SUMMARY.md`

---

## ✅ Final Checklist

- [ ] EC2 instance launched (t2.micro)
- [ ] Security groups configured
- [ ] Connected via SSH
- [ ] Ran deploy.sh script
- [ ] Started services with docker-compose
- [ ] All containers running (docker ps shows 9 containers)
- [ ] Frontend accessible in browser
- [ ] Kafka UI accessible
- [ ] Screenshots captured (AWS Console, Docker, App, Redux)
- [ ] Services stopped when done
- [ ] EC2 instance stopped

**That's it! You're all set! 🚀**
