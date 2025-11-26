# AWS Deployment - Visual Guide

## 🎯 The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│  YOU (Your Computer)                                        │
│  ├─ Open AWS Console                                        │
│  ├─ Launch EC2 Instance (t2.micro)                         │
│  └─ Connect via SSH                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  AWS EC2 Instance (Running in Cloud)                        │
│  ├─ Run deploy.sh (installs Docker)                        │
│  ├─ Docker builds your app                                 │
│  └─ 9 containers start running                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  YOUR APP (Running on EC2)                                  │
│  ├─ Frontend → http://EC2-IP:5173                          │
│  ├─ Backend  → http://EC2-IP:5001                          │
│  ├─ Kafka UI → http://EC2-IP:8080                          │
│  └─ Connected to MongoDB Atlas                             │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
               TAKE SCREENSHOTS! 📸
```

---

## 📋 Step-by-Step Visual Flow

### Phase 1: AWS Setup (15 min)

```
AWS Console
    │
    ├─► Click "Launch Instance"
    │
    ├─► Fill in:
    │   ├─ Name: airbnb-lab2
    │   ├─ AMI: Amazon Linux 2023 ✅ Free tier
    │   ├─ Type: t2.micro ✅ Free tier
    │   ├─ Key: Create new (.pem file) 💾 SAVE THIS!
    │   └─ Security: Open ports 22, 5001-5005, 5173, 8080
    │
    └─► Click "Launch" → Wait 2 min → COPY PUBLIC IP 📝
```

**Result:** You now have a computer running in AWS! 🖥️

---

### Phase 2: Connect & Install (30 min)

```
Your Terminal
    │
    ├─► cd ~/Downloads
    │
    ├─► chmod 400 airbnb-lab2-key.pem
    │
    ├─► ssh -i airbnb-lab2-key.pem ec2-user@XX.XX.XX.XX
    │   (Replace XX.XX.XX.XX with your EC2 IP)
    │
    ├─► You're now INSIDE EC2! 🎉
    │
    ├─► curl -o deploy.sh https://raw.githubusercontent.com/...
    │
    ├─► chmod +x deploy.sh
    │
    ├─► ./deploy.sh
    │   ⏱️ Wait 5-10 minutes...
    │   ✅ Installation Complete!
    │
    ├─► exit (logout)
    │
    ├─► ssh -i airbnb-lab2-key.pem ec2-user@XX.XX.XX.XX (login again)
    │
    └─► cd Airbnb-Clone
```

**Result:** Docker installed, project ready! ✅

---

### Phase 3: Start Application (15 min)

```
EC2 Terminal
    │
    ├─► docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d --build
    │
    │   🔨 Building images...
    │   ⏱️ Wait 10-15 minutes (first time is slow)
    │
    │   Output shows:
    │   ✅ Building backend... done
    │   ✅ Building frontend... done
    │   ✅ Building booking-service... done
    │   ✅ Creating containers...
    │   ✅ Starting containers...
    │
    ├─► docker ps
    │
    │   Should show 9 containers:
    │   • backend
    │   • frontend
    │   • property-service
    │   • booking-service
    │   • traveler-service
    │   • owner-service
    │   • kafka
    │   • zookeeper
    │   • kafka-ui
    │
    └─► ✅ ALL RUNNING!
```

**Result:** Your entire app is now running on AWS! 🚀

---

### Phase 4: Access & Screenshot (30 min)

```
Your Web Browser
    │
    ├─► Open: http://XX.XX.XX.XX:5173
    │   📸 Screenshot: Frontend homepage
    │   📸 Screenshot: Property search
    │   📸 Screenshot: Redux DevTools (F12 → Redux tab)
    │
    ├─► Open: http://XX.XX.XX.XX:8080
    │   📸 Screenshot: Kafka UI
    │   📸 Screenshot: Topics page
    │
    └─► Open: AWS Console
        📸 Screenshot: EC2 Dashboard
        📸 Screenshot: Instance details
        📸 Screenshot: Security groups
        📸 Screenshot: Billing ($0.00)
```

```
EC2 Terminal
    │
    ├─► docker ps
    │   📸 Screenshot this output
    │
    ├─► docker stats --no-stream
    │   📸 Screenshot this output
    │
    └─► ./scripts/screenshot-helper.sh
        (Guides you through everything!)
```

**Result:** All screenshots captured! 📸✅

---

## 🎨 Container Architecture

```
┌─────────────────────────────────────────────────────┐
│              AWS EC2 (t2.micro)                     │
│  ┌───────────────────────────────────────────────┐  │
│  │         Docker Containers                     │  │
│  │                                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │ Frontend │  │ Backend  │  │ Property │  │  │
│  │  │  :5173   │  │  :5001   │  │  :5003   │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  │  │
│  │                                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │ Booking  │  │ Traveler │  │  Owner   │  │  │
│  │  │  :5004   │  │  :5005   │  │  :5002   │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  │  │
│  │                                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │  Kafka   │  │Zookeeper│  │ Kafka UI │  │  │
│  │  │  :9092   │  │  :2181   │  │  :8080   │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  │  │
│  │                                               │  │
│  └───────────────────┬───────────────────────────┘  │
│                      │                              │
└──────────────────────┼──────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │ MongoDB Atlas  │
              │   (Cloud DB)   │
              └────────────────┘
```

---

## 📊 Timeline Visualization

```
Total Time: ~2 hours
Cost: $0.00

Hour 1:
├─ 00:00 → 00:15  Launch EC2 instance
├─ 00:15 → 00:20  Connect via SSH
├─ 00:20 → 00:30  Run deploy.sh
├─ 00:30 → 00:45  Start docker-compose (building)
└─ 00:45 → 01:00  Waiting for containers to build

Hour 2:
├─ 01:00 → 01:10  Verify all services running
├─ 01:10 → 01:40  Take screenshots (AWS, App, Kafka, Redux)
└─ 01:40 → 02:00  Stop services, organize screenshots

✅ DONE!
```

---

## 🔍 What Each Port Does

```
Port 5001 → Backend API
    ├─ Handles authentication
    ├─ Main API gateway
    └─ Connects to MongoDB

Port 5002 → Owner Service
    ├─ Owner dashboard
    └─ Property management

Port 5003 → Property Service
    ├─ Property listings
    ├─ Search functionality
    └─ Property details

Port 5004 → Booking Service
    ├─ Booking creation
    ├─ Kafka producer
    └─ Booking management

Port 5005 → Traveler Service
    ├─ Traveler dashboard
    └─ Booking requests

Port 5173 → Frontend
    ├─ React application
    ├─ Redux state management
    └─ User interface

Port 8080 → Kafka UI
    ├─ View topics
    ├─ Monitor messages
    └─ Consumer groups

Port 9092 → Kafka Broker
    └─ Message queue (internal)

Port 2181 → Zookeeper
    └─ Kafka coordination (internal)
```

---

## 🚦 Status Indicators

### ✅ Everything Working

```
$ docker ps
Shows 9 containers, all with "Up" status

$ curl http://localhost:5001/health
Returns: {"status":"healthy"}

$ Browser: http://XX.XX.XX.XX:5173
Shows: Frontend loads correctly
```

### ⚠️ Something Wrong

```
$ docker ps
Shows fewer than 9 containers OR containers restarting

$ docker-compose logs <service-name>
Check error messages

Common fixes:
├─ Out of memory → Remove agent-service from compose file
├─ Kafka failing → docker-compose down -v, then up again
└─ Port blocked → Check security group in AWS Console
```

---

## 💾 Save Points

**After EC2 Launch:**

- ✅ Save .pem key file
- ✅ Note down EC2 public IP
- ✅ Screenshot EC2 dashboard

**After Services Running:**

- ✅ Export logs: `docker-compose logs > logs.txt`
- ✅ Take all screenshots
- ✅ Save to organized folders

**Before Stopping:**

- ✅ Verify you have all screenshots
- ✅ Export any data needed
- ✅ Document any issues for report

---

## 🎯 Success Criteria

You know it's working when:

1. ✅ `docker ps` shows 9 containers running
2. ✅ Frontend loads in browser
3. ✅ Kafka UI shows topics
4. ✅ Backend health check returns success
5. ✅ No error messages in logs
6. ✅ All screenshots captured
7. ✅ AWS billing shows $0.00

---

## 🔄 Quick Recovery

If something goes wrong:

```
Restart Everything:
    docker-compose -f docker-compose.aws.yml down
    docker system prune -f
    docker-compose -f docker-compose.aws.yml up -d

Restart Single Service:
    docker-compose -f docker-compose.aws.yml restart backend

Check Logs:
    docker-compose -f docker-compose.aws.yml logs -f backend

Get Help:
    ./scripts/screenshot-helper.sh
    Or read: AWS_FREE_TIER_DEPLOYMENT.md
```

---

## 📱 Mobile-Friendly Summary

```
1️⃣ AWS Console → Launch t2.micro
2️⃣ SSH to EC2
3️⃣ Run deploy.sh
4️⃣ docker-compose up
5️⃣ Take screenshots
6️⃣ Stop when done

Time: 2 hours
Cost: $0
```

---

**Ready? Start with: `START_HERE_AWS.md`** 🚀
