# AWS Free Tier Deployment Guide (Cost: $0)

## 🎯 Goal
Deploy minimal services to AWS Free Tier to get screenshots for your report without spending money.

## 📊 Architecture

```
┌─────────────────────────────────────────────────┐
│         AWS Free Tier (t2.micro EC2)           │
├─────────────────────────────────────────────────┤
│  Docker Compose Running:                       │
│  • Frontend (React + Redux)                    │
│  • Backend API                                 │
│  • Property Service                            │
│  • Booking Service                             │
│  • Kafka + Zookeeper (lightweight)             │
└─────────────────────────────────────────────────┘
         │
         └──────► MongoDB Atlas (Free 512MB)
```

## 🆓 Services Used

| Service | Cost | What For |
|---------|------|----------|
| EC2 t2.micro | **FREE** (750hrs/month) | Run all containers |
| MongoDB Atlas | **FREE** (512MB) | Database |
| Elastic IP | **FREE** (when attached) | Static IP for access |
| Security Groups | **FREE** | Firewall rules |

**Total Monthly Cost: $0** ✅

---

## 🚀 Step-by-Step Setup

### Step 1: Launch EC2 Instance

1. **Login to AWS Console**
   - Go to EC2 Dashboard
   - Click "Launch Instance"

2. **Instance Configuration**
   ```
   Name: airbnb-clone-lab2
   AMI: Amazon Linux 2023 (Free tier eligible)
   Instance Type: t2.micro (1 vCPU, 1GB RAM)
   Key Pair: Create new or use existing
   Storage: 30GB gp3 (Free tier: 30GB)
   ```

3. **Security Group Rules**
   ```
   Type            Port    Source          Description
   SSH             22      Your IP         SSH access
   HTTP            80      0.0.0.0/0       Web access
   Custom TCP      5001    0.0.0.0/0       Backend API
   Custom TCP      5002    0.0.0.0/0       Owner Service
   Custom TCP      5003    0.0.0.0/0       Property Service
   Custom TCP      5004    0.0.0.0/0       Booking Service
   Custom TCP      5005    0.0.0.0/0       Traveler Service
   Custom TCP      5173    0.0.0.0/0       Frontend
   Custom TCP      8080    0.0.0.0/0       Kafka UI
   ```

4. **Launch Instance**

### Step 2: Connect to EC2

```bash
# Download your key pair (.pem file)
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

### Step 3: Install Docker & Docker Compose

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Logout and login again for group changes
exit
# SSH back in
```

### Step 4: Transfer Your Project

**Option A: Using Git (Recommended)**
```bash
# On EC2
sudo yum install git -y
git clone https://github.com/PrajwalDambalkar/Airbnb-Clone.git
cd Airbnb-Clone
git checkout feature/Jmeter
```

**Option B: Using SCP**
```bash
# On your local machine
cd /Users/spartan/Desktop/Projects/AirBNB-PK
tar -czf airbnb-clone.tar.gz --exclude='node_modules' --exclude='.git' .
scp -i your-key.pem airbnb-clone.tar.gz ec2-user@<EC2-PUBLIC-IP>:~/

# On EC2
tar -xzf airbnb-clone.tar.gz
```

### Step 5: Create Minimal Docker Compose

Create `docker-compose.aws.yml` on EC2:

```yaml
version: "3.9"

services:
  backend:
    image: backend:latest
    build:
      context: ./apps/backend
    container_name: backend
    environment:
      NODE_ENV: production
      PORT: 5001
      MONGODB_URI: ${MONGODB_URI}
      AGENT_SERVICE_URL: http://agent-service:8000
    ports:
      - "5001:5001"
    restart: unless-stopped

  property-service:
    image: property-service:latest
    build:
      context: ./apps/property-service
    container_name: property-service
    environment:
      NODE_ENV: production
      PORT: 5003
      MONGODB_URI: ${PROPERTY_MONGODB_URI}
    ports:
      - "5003:5003"
    restart: unless-stopped

  booking-service:
    image: booking-service:latest
    build:
      context: ./apps/booking-service
    container_name: booking-service
    depends_on:
      - kafka
    environment:
      NODE_ENV: production
      PORT: 5004
      MONGODB_URI: ${BOOKING_MONGODB_URI}
      KAFKA_BROKERS: kafka:29092
    ports:
      - "5004:5004"
    restart: unless-stopped

  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    container_name: kafka
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    depends_on:
      - kafka
    environment:
      KAFKA_CLUSTERS_0_NAME: airbnb-kafka
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:29092
    ports:
      - "8080:8080"

  frontend:
    image: frontend:latest
    build:
      context: ./apps/frontend
    container_name: frontend
    environment:
      VITE_BACKEND_URL: http://<EC2-PUBLIC-IP>:5001
      VITE_PROPERTY_SERVICE_URL: http://<EC2-PUBLIC-IP>:5003
      VITE_BOOKING_SERVICE_URL: http://<EC2-PUBLIC-IP>:5004
    ports:
      - "5173:5173"
    restart: unless-stopped
```

### Step 6: Configure Environment Variables

```bash
# On EC2, create .env file
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority
PROPERTY_MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_properties?retryWrites=true&w=majority
BOOKING_MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority
NODE_ENV=production
SESSION_SECRET=aws-deployment-secret
EOF
```

### Step 7: Deploy Services

```bash
# Build and start services
docker-compose -f docker-compose.aws.yml up -d --build

# Check running containers
docker ps

# View logs
docker-compose -f docker-compose.aws.yml logs -f
```

### Step 8: Access Your Application

```
Frontend: http://<EC2-PUBLIC-IP>:5173
Backend API: http://<EC2-PUBLIC-IP>:5001
Property Service: http://<EC2-PUBLIC-IP>:5003
Booking Service: http://<EC2-PUBLIC-IP>:5004
Kafka UI: http://<EC2-PUBLIC-IP>:8080
```

---

## 📸 Screenshots Needed for Report

### 1. AWS Console Screenshots
- ✅ EC2 Instance running (Dashboard)
- ✅ Instance details (showing t2.micro, free tier)
- ✅ Security Group rules
- ✅ CloudWatch metrics (CPU, Network)
- ✅ Cost Explorer showing $0.00

### 2. Application Screenshots
- ✅ Frontend running on EC2
- ✅ Backend API health check: `http://<EC2-IP>:5001/health`
- ✅ Kafka UI showing topics: `http://<EC2-IP>:8080`
- ✅ Docker containers running: `docker ps`

### 3. Redux DevTools
- ✅ State tree showing auth, properties, bookings
- ✅ Action logs showing state changes
- ✅ Time-travel debugging

### 4. Kafka Message Flow
- ✅ Kafka UI showing topics: booking-requests, booking-updates
- ✅ Message producer/consumer logs
- ✅ Backend logs showing message processing

---

## 🛑 Important: Cost Control

### Set Billing Alarms

1. Go to AWS Billing Dashboard
2. Set alarms at:
   - $1.00 (warning)
   - $5.00 (alert)
   - $10.00 (critical)

### Monitor Usage Daily

```bash
# On EC2, monitor resources
docker stats

# Check disk usage
df -h

# Monitor memory
free -m
```

### Stop Services When Not Needed

```bash
# Stop containers (keeps instance running)
docker-compose -f docker-compose.aws.yml down

# Stop EC2 instance (stops billing if you go over 750hrs)
# AWS Console → EC2 → Stop Instance
```

### Cleanup After Report

```bash
# On EC2, remove all containers
docker-compose -f docker-compose.aws.yml down -v
docker system prune -af

# On AWS Console
# Terminate EC2 instance
# Delete Elastic IP (if created)
# Delete Security Groups (optional)
```

---

## 🔧 Troubleshooting

### Issue: Out of Memory
**Solution:** Disable Ollama (AI service) - not needed for screenshots
```bash
# Remove agent-service and ollama from docker-compose.aws.yml
```

### Issue: Docker build fails
**Solution:** Build locally and push to Docker Hub
```bash
# Local machine
docker tag backend:latest yourusername/airbnb-backend:latest
docker push yourusername/airbnb-backend:latest

# EC2 - use pre-built images
# Update docker-compose.aws.yml to use: image: yourusername/airbnb-backend:latest
```

### Issue: Kafka not starting
**Solution:** Increase memory allocation
```bash
# Add to kafka environment:
KAFKA_HEAP_OPTS: "-Xmx256M -Xms256M"
```

### Issue: Services can't connect
**Solution:** Use internal Docker network names
```bash
# Services should reference: kafka:29092, not localhost:9092
# Frontend is exception: use EC2 public IP for external access
```

---

## 📊 Alternative: Even Simpler Deployment

If t2.micro struggles with all services:

### Ultra-Minimal Setup (Just for Screenshots)
```yaml
services:
  backend:
    # Backend + Property Service combined
  frontend:
    # React app
  kafka:
    # Just Kafka (no UI)
  zookeeper:
    # Required for Kafka
```

**This runs 4 containers instead of 9 - Much lighter!**

---

## 🎓 What to Document in Report

### AWS Deployment Section
```
1. Architecture Diagram (EC2 → Services → MongoDB)
2. EC2 Instance Configuration (t2.micro specs)
3. Docker Compose setup on cloud
4. Security Group configuration
5. Cost analysis: $0 spent (Free Tier)
6. Screenshots of running services
7. Performance comparison: Local vs AWS
```

### Why This Approach?
```
✅ Demonstrates AWS knowledge
✅ Uses Docker in production environment
✅ Shows cost optimization skills
✅ Proves scalability understanding
✅ Documents infrastructure-as-code
✅ Maintains free tier eligibility
```

---

## 📝 Report Template Section

```markdown
## AWS Deployment

### Infrastructure Setup
- **Provider:** Amazon Web Services (AWS)
- **Instance Type:** EC2 t2.micro (1 vCPU, 1GB RAM)
- **OS:** Amazon Linux 2023
- **Deployment Method:** Docker Compose
- **Database:** MongoDB Atlas (External, Free Tier)

### Services Deployed
1. Frontend (React + Vite) - Port 5173
2. Backend API - Port 5001
3. Property Service - Port 5003
4. Booking Service - Port 5004
5. Kafka + Zookeeper - Messaging
6. Kafka UI - Port 8080

### Cost Optimization
- Utilized AWS Free Tier: $0/month
- Alternative to EKS ($73/month): Local K8s + Documentation
- Alternative to MSK ($150/month): Self-hosted Kafka
- **Total Savings:** $223/month

### Screenshots
[Insert EC2 Dashboard]
[Insert Running Containers]
[Insert Application UI]
[Insert Kafka Message Flow]
```

---

## 🚀 Quick Start Commands

```bash
# 1. Launch EC2 t2.micro instance
# 2. SSH into instance
ssh -i your-key.pem ec2-user@<EC2-IP>

# 3. Install dependencies
sudo yum update -y
sudo yum install docker git -y
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# 4. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Clone project
git clone https://github.com/PrajwalDambalkar/Airbnb-Clone.git
cd Airbnb-Clone
git checkout feature/Jmeter

# 6. Create minimal docker-compose.aws.yml (see above)

# 7. Start services
docker-compose -f docker-compose.aws.yml up -d

# 8. Check status
docker ps
docker-compose -f docker-compose.aws.yml logs

# 9. Access application
# Frontend: http://<EC2-IP>:5173
# Backend: http://<EC2-IP>:5001
# Kafka UI: http://<EC2-IP>:8080
```

---

## ⚠️ Free Tier Limits to Watch

| Resource | Free Tier Limit | Usage Strategy |
|----------|----------------|----------------|
| EC2 Hours | 750 hrs/month | 1 instance 24/7 = 720 hrs ✅ |
| Storage | 30 GB | Use 20GB max ✅ |
| Data Transfer | 15 GB/month | Minimal for testing ✅ |
| Snapshots | 1 GB | Don't create snapshots |
| Elastic IP | Free when attached | Keep attached to instance |

---

## 📅 Deployment Timeline

1. **Day 1:** Launch EC2, Install Docker (1 hour)
2. **Day 2:** Transfer project, Configure services (2 hours)
3. **Day 3:** Deploy and test services (2 hours)
4. **Day 4:** Take screenshots, Document (1 hour)
5. **Day 5:** Terminate instance (if done)

**Total Time:** ~6 hours
**Total Cost:** $0.00

---

**Ready to deploy? Follow the steps above and you'll have AWS screenshots without spending a penny! 🎉**
