# AWS Free Tier Deployment - Quick Reference Card

## 🚀 5-Minute Setup

### 1. Launch EC2 Instance

```
AMI: Amazon Linux 2023 (Free tier eligible)
Type: t2.micro
Storage: 30GB gp3
Security Group: Open ports 22, 80, 5001-5005, 8080
```

### 2. Connect & Deploy

```bash
# SSH to EC2
ssh -i your-key.pem ec2-user@<EC2-IP>

# Run deployment script
curl -o deploy.sh https://raw.githubusercontent.com/PrajwalDambalkar/Airbnb-Clone/feature/Jmeter/scripts/deploy-aws.sh
chmod +x deploy.sh
./deploy.sh

# Logout and login again
exit
ssh -i your-key.pem ec2-user@<EC2-IP>

# Start services
cd Airbnb-Clone
docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d --build
```

### 3. Access Application

```
Frontend:    http://<EC2-IP>:5173
Backend:     http://<EC2-IP>:5001
Kafka UI:    http://<EC2-IP>:8080
```

---

## 🎯 Essential Commands

### Service Management

```bash
# Start all services
docker-compose -f docker-compose.aws.yml up -d

# Stop all services
docker-compose -f docker-compose.aws.yml down

# Restart specific service
docker-compose -f docker-compose.aws.yml restart backend

# View logs
docker-compose -f docker-compose.aws.yml logs -f

# View specific service logs
docker logs backend
docker logs kafka
```

### Monitoring

```bash
# Check running containers
docker ps

# Monitor resource usage
docker stats

# Check disk space
df -h

# Check memory
free -m

# System resources
top
```

### Troubleshooting

```bash
# If out of memory
docker-compose -f docker-compose.aws.yml down
docker system prune -af

# Rebuild specific service
docker-compose -f docker-compose.aws.yml up -d --build backend

# Check service health
curl http://localhost:5001/health
curl http://localhost:5003/api/properties

# Kafka health check
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

---

## 📸 Screenshots Checklist

### AWS Console

- [ ] EC2 Dashboard showing t2.micro instance running
- [ ] Instance details (AMI, type, security groups)
- [ ] Security group rules (all ports configured)
- [ ] CloudWatch metrics (CPU, Network)
- [ ] Billing dashboard showing $0.00

### Application

- [ ] Frontend UI (homepage, search, properties)
- [ ] Backend API health check response
- [ ] Kafka UI showing topics
- [ ] Docker containers running (`docker ps` output)
- [ ] Redux DevTools (state tree, actions)

### Testing

- [ ] User authentication flow
- [ ] Property search results
- [ ] Booking creation
- [ ] Kafka messages in UI
- [ ] Service logs showing message flow

---

## 💰 Free Tier Limits

| Resource      | Limit         | Your Usage         |
| ------------- | ------------- | ------------------ |
| EC2 Hours     | 750 hrs/month | 1 instance 24/7 ✅ |
| Storage       | 30 GB         | ~20 GB ✅          |
| Data Transfer | 15 GB out     | Minimal ✅         |
| MongoDB Atlas | 512 MB        | Free forever ✅    |

**Cost: $0/month** ✅

---

## ⚠️ Before You Stop

### Cleanup Commands

```bash
# Save logs for report
docker-compose -f docker-compose.aws.yml logs > deployment-logs.txt

# Stop all containers
docker-compose -f docker-compose.aws.yml down

# Remove all images (optional)
docker system prune -af --volumes

# On AWS Console
# 1. Stop EC2 instance (not terminate, unless done)
# 2. Create final AMI backup (optional)
```

### Billing Alarms

1. Go to AWS CloudWatch
2. Create alarms:
   - $1 warning
   - $5 alert
   - $10 critical

---

## 🐛 Common Issues & Solutions

### Issue: Services won't start

```bash
# Check memory
free -m

# Reduce services (comment out in docker-compose.aws.yml):
# - agent-service
# - kafka-ui (can access Kafka via CLI)

# Restart
docker-compose -f docker-compose.aws.yml up -d
```

### Issue: Kafka crash looping

```bash
# Stop everything
docker-compose -f docker-compose.aws.yml down

# Remove Kafka data
docker volume prune -f

# Start Zookeeper first
docker-compose -f docker-compose.aws.yml up -d zookeeper
sleep 10

# Then Kafka
docker-compose -f docker-compose.aws.yml up -d kafka
sleep 10

# Then other services
docker-compose -f docker-compose.aws.yml up -d
```

### Issue: Frontend can't connect to backend

```bash
# Check if EC2_PUBLIC_IP is set correctly in docker-compose.aws.yml
grep EC2-PUBLIC-IP docker-compose.aws.yml

# Update it manually
nano docker-compose.aws.yml
# Replace all <EC2-PUBLIC-IP> with actual IP

# Rebuild frontend
docker-compose -f docker-compose.aws.yml up -d --build frontend
```

### Issue: Port not accessible

```bash
# Check security group on AWS Console
# Ensure ports 5001-5005, 8080, 5173 are open

# Check if service is listening
netstat -tulpn | grep 5001
docker logs backend
```

---

## 📊 Performance Tips

### Optimize Memory

```yaml
# In docker-compose.aws.yml, set memory limits:
mem_limit: 256m  # for backend
mem_limit: 200m  # for other services
```

### Reduce Services

```
Priority 1 (Must Run): backend, frontend, kafka, zookeeper
Priority 2 (Optional): kafka-ui, property-service
Priority 3 (Skip): agent-service, ollama
```

### Build Optimization

```bash
# Build images locally first (faster)
docker-compose build

# Or pull pre-built images (if available)
docker pull yourusername/airbnb-backend:latest
```

---

## 🎓 Report Documentation

### Architecture Diagram

```
┌──────────────┐
│  User/Client │
└──────┬───────┘
       │
   Internet
       │
┌──────▼───────────────────────────┐
│  AWS EC2 (t2.micro, Free Tier)  │
├──────────────────────────────────┤
│  Docker Compose:                 │
│  • Frontend (React + Redux)      │
│  • Backend (Node.js)             │
│  • Microservices (5 services)    │
│  • Kafka + Zookeeper             │
└──────┬───────────────────────────┘
       │
┌──────▼──────────┐
│ MongoDB Atlas   │
│ (Free 512MB)    │
└─────────────────┘
```

### Cost Analysis Table

| Service   | AWS Option | Cost        | Our Choice        | Savings     |
| --------- | ---------- | ----------- | ----------------- | ----------- |
| Compute   | EKS        | $73/mo      | EC2 t2.micro      | $73/mo      |
| Messaging | MSK        | $150/mo     | Self-hosted Kafka | $150/mo     |
| Database  | DocumentDB | $50/mo      | MongoDB Atlas     | $50/mo      |
| **Total** |            | **$273/mo** | **$0/mo**         | **$273/mo** |

### Key Points to Highlight

- ✅ Successfully deployed to AWS Free Tier
- ✅ All 5 microservices running
- ✅ Kafka message queue operational
- ✅ MongoDB Atlas integration
- ✅ Redux state management in frontend
- ✅ Zero cost implementation
- ✅ Production-ready Docker setup

---

## 📞 Quick Help

### Check Service Status

```bash
# All services
docker-compose -f docker-compose.aws.yml ps

# Specific service
docker inspect backend

# Health endpoints
curl http://localhost:5001/health
curl http://localhost:5003/api/properties
```

### Get EC2 Public IP

```bash
# On EC2 instance
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Or from AWS Console
# EC2 → Instances → Select your instance → Copy Public IPv4
```

### Access Kafka

```bash
# List topics
docker exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Create test topic
docker exec kafka kafka-topics --create --topic test --bootstrap-server localhost:9092

# Produce message
docker exec -it kafka kafka-console-producer --topic booking-requests --bootstrap-server localhost:9092

# Consume messages
docker exec -it kafka kafka-console-consumer --topic booking-requests --from-beginning --bootstrap-server localhost:9092
```

---

## ⏱️ Timeline

**Total Time: ~2 hours**

- Launch EC2: 15 min
- SSH & Install dependencies: 20 min
- Clone & configure: 10 min
- Build & start services: 45 min
- Test & screenshots: 30 min

**Total Cost: $0.00**

---

## 🔐 Security Reminders

- ✅ Change SESSION_SECRET in .env.aws
- ✅ Use MongoDB Atlas (not exposed directly)
- ✅ Restrict SSH to your IP only
- ✅ Don't commit .env.aws to Git
- ✅ Set up AWS billing alarms
- ✅ Use IAM roles (not root account)

---

## 🎯 Success Criteria

- [x] EC2 instance running (t2.micro, free tier)
- [x] All services containerized
- [x] Kafka messaging working
- [x] MongoDB connected
- [x] Frontend accessible
- [x] Zero AWS charges
- [x] Screenshots captured
- [x] Documentation complete

---

**You're ready to deploy! 🚀**

**Questions? Check AWS_FREE_TIER_DEPLOYMENT.md for detailed guide.**
