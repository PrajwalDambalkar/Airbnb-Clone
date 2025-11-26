# AirBNB Clone - Kubernetes Deployment Session Summary
**Date:** November 26, 2025  
**Project:** AirBNB-PK Microservices Application

---

## 🎯 What We Accomplished

Successfully deployed a **11-service microservices application** to **local Kubernetes** (Docker Desktop) for learning, testing, and preparation for AWS EKS deployment.

---

## 📋 Complete Journey

### 1. **Initial Setup & Planning**
- Started with app running on Docker Compose
- Decided to migrate to Kubernetes for:
  - Learning Kubernetes orchestration
  - Preparing for AWS EKS deployment
  - Understanding scaling capabilities
  - Lab report requirements

### 2. **Created Complete Kubernetes Infrastructure**
Built 15 configuration files in `/k8s/local/`:

#### Deployment Files:
1. **backend-deployment.yaml** - Main API (port 5001)
2. **frontend-deployment.yaml** - React UI with Vite (port 5173)
3. **property-service-deployment.yaml** - Property management (port 5003)
4. **booking-service-deployment.yaml** - Booking + Kafka producer (port 5004)
5. **traveler-service-deployment.yaml** - User management + Kafka consumer (port 5005)
6. **owner-service-deployment.yaml** - Property owner service + Kafka consumer (port 5002)
7. **agent-service-deployment.yaml** - AI chatbot with Ollama (port 8000)
8. **kafka-deployment.yaml** - Kafka StatefulSet for messaging
9. **kafka-ui-deployment.yaml** - Kafka monitoring UI (port 8080)
10. **ollama-deployment.yaml** - AI model service (port 11434)

#### Configuration Files:
11. **secrets.yaml** - MongoDB Atlas URIs, API keys, session secrets
12. **deploy.sh** - Automated deployment script
13. **teardown.sh** - Cleanup script
14. **README.md** - Complete documentation
15. **QUICKSTART.md** - Quick reference guide

### 3. **Troubleshooting & Fixes**

#### Issue #1: Health Check Failures ❌ → ✅
- **Problem:** Pods restarting continuously, health checks failing
- **Root Cause:** Backend health endpoint was `/api/health`, not `/health`
- **Solution:** Updated all deployment manifests with correct endpoints:
  - Backend: `/api/health` on port 5001
  - All other services: `/health` on respective ports

#### Issue #2: Kafka Connection Failures ❌ → ✅
- **Problem:** Services couldn't connect to Kafka ("Connection refused")
- **Root Cause:** Services using `kafka-service:9092` (external port) instead of `kafka-service:29092` (internal cluster port)
- **Solution:** Updated `KAFKA_BROKERS` environment variable in booking, traveler, and owner service deployments from `:9092` to `:29092`

#### Issue #3: Agent Service Timeout ❌ → ✅
- **Problem:** Agent service failing readiness/liveness checks, timing out
- **Root Cause:** ML model loading takes 90+ seconds (sentence transformers, embedding generation for 99 policy chunks)
- **Solution:** Increased timeouts in agent-service-deployment.yaml:
  - `initialDelaySeconds: 90` (readiness)
  - `initialDelaySeconds: 120` (liveness)
  - `timeoutSeconds: 10`

#### Issue #4: Search Filters Not Working ❌ → ✅
- **Problem:** Frontend search/filters not updating property list in UI
- **Root Cause:** Redux `applyFilters` action not accepting payload, only reading from existing state
- **Solution:** 
  - Modified `apps/frontend/src/store/slices/propertiesSlice.ts`
  - Changed `applyFilters` from `(state)` to `(state, action: PayloadAction<...>)`
  - Added logic to update `state.filters` from payload BEFORE applying filters
  - Rebuilt frontend Docker image: `docker build -t frontend:latest ./apps/frontend`
  - Restarted frontend deployment: `kubectl rollout restart deployment/frontend`

#### Issue #5: Teardown Script Path Error ❌ → ✅
- **Problem:** `./teardown.sh` failing with "path does not exist" error
- **Root Cause:** Script using relative paths (`k8s/local/...`) that only work from project root
- **Solution:** Added `SCRIPT_DIR` variable to make paths relative to script location, works from any directory

---

## 🏗️ Architecture Overview

### Services Structure:
```
Frontend (5173) → Backend (5001) → MongoDB Atlas (cloud)
                       ↓
    ┌──────────────────┴──────────────────┐
    ↓                  ↓                   ↓
Property (5003)   Booking (5004)    Traveler (5005)
                       ↓
                  Kafka (29092) ← Message Queue
                       ↓
    ┌──────────────────┼──────────────────┐
    ↓                  ↓                   ↓
Owner (5002)      Agent (8000)      Ollama (11434)
                       ↑
                 Kafka UI (8080)
```

### Kafka Topics & Consumers:
- **booking-requests** → Owner Service (notifies property owners)
- **booking-updates** → Traveler Service (notifies travelers)
- Consumer groups: `booking-group`, `traveler-group`, `owner-group`

### Key Technologies:
- **Orchestration:** Kubernetes (Docker Desktop)
- **Message Queue:** Kafka 7.4.0 + Zookeeper
- **Database:** MongoDB Atlas (external cloud)
- **AI/ML:** Ollama with sentence transformers
- **Frontend:** React + Vite + Redux Toolkit
- **Backend:** Node.js/Express

---

## 🚀 How to Use

### Option 1: Docker Compose (Quick Development)
```bash
cd /Users/spartan/Desktop/Projects/AirBNB-PK
docker-compose up -d
```
- **Startup:** ~2 minutes
- **Use case:** Daily development, quick testing
- **Scaling:** Manual (edit docker-compose.yml)

### Option 2: Kubernetes (Production-Like)
```bash
cd /Users/spartan/Desktop/Projects/AirBNB-PK/k8s/local
./deploy.sh
```
- **Startup:** ~5 minutes
- **Use case:** Learning K8s, AWS EKS prep, scaling tests
- **Scaling:** `kubectl scale deployment/booking-service --replicas=3`

**Note:** Cannot run both simultaneously (port conflicts on 5001-5005, 8080, 9092, 5173)

### Switching Between Options:
```bash
# Stop Kubernetes, start Docker Compose
cd /Users/spartan/Desktop/Projects/AirBNB-PK/k8s/local
./teardown.sh
cd ../..
docker-compose up -d

# Stop Docker Compose, start Kubernetes
docker-compose down
cd k8s/local
./deploy.sh
```

---

## 📊 Validation & Testing

### Verify All Services Running:
```bash
kubectl get pods
# Expected: 11/11 pods in Running state, all 1/1 Ready
```

### Test Health Endpoints:
```bash
# Backend
curl http://localhost:5001/api/health
# Expected: {"status":"healthy","database":"connected"}

# Property Service
curl http://localhost:5003/health
# Expected: {"status":"ok"}
```

### Access Services:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5001/api
- **Kafka UI:** http://localhost:8080
- **Property Service:** http://localhost:5003
- **Booking Service:** http://localhost:5004
- **Agent Chatbot:** http://localhost:8000

### Verify Kafka:
```bash
kubectl logs deployment/booking-service | grep Kafka
# Expected: "✅ Kafka Producer connected" and "✅ Kafka Consumer connected"

kubectl logs deployment/traveler-service | grep "Consumer has joined"
# Expected: "Consumer has joined the group"
```

### Test Search Filters:
1. Open http://localhost:5173
2. Enter destination, dates, guests
3. Click Search
4. Verify property list updates with filtered results

---

## 📁 Important Files

### Configuration:
- **k8s/local/** - All Kubernetes manifests
- **docker-compose.yml** - Docker Compose configuration
- **env.example** - Environment variables template

### Scripts:
- **k8s/local/deploy.sh** - Deploy to Kubernetes
- **k8s/local/teardown.sh** - Clean up Kubernetes resources
- **verify_fix.sh** - Verify Docker Compose health

### Documentation:
- **k8s/local/README.md** - Detailed Kubernetes guide
- **k8s/local/QUICKSTART.md** - Quick commands reference
- **BACKEND_API_GUIDE.md** - API documentation
- **POSTMAN_API_GUIDE.md** - Postman collection guide

---

## ✅ Current Status

**All systems operational!**

✅ 11 services deployed to Kubernetes  
✅ All health checks passing  
✅ Kafka messaging working (3 consumers connected)  
✅ Frontend search filters functional  
✅ Backend connected to MongoDB Atlas  
✅ AI agent service ready  

### Pod Status:
```
NAME                              READY   STATUS
agent-service-xxx                 1/1     Running
backend-xxx                       1/1     Running
booking-service-xxx               1/1     Running
frontend-xxx                      1/1     Running
kafka-0                           1/1     Running
kafka-ui-xxx                      1/1     Running
ollama-xxx                        1/1     Running
owner-service-xxx                 1/1     Running
property-service-xxx              1/1     Running
traveler-service-xxx              1/1     Running
zookeeper-0                       1/1     Running
```

---

## 🎓 Key Learnings

1. **Health Checks:** Must match exact endpoint paths in service code
2. **Kafka Internals:** Internal cluster communication uses different port (29092) than external access (9092)
3. **ML Services:** Need longer startup timeouts (90-120s for model loading)
4. **Redux State:** Actions must accept payloads to update state dynamically
5. **Script Portability:** Use `$SCRIPT_DIR` for location-independent scripts

---

## 🔮 Next Steps

### For Lab Report:
1. ✅ Kubernetes deployment working
2. ⏳ Take screenshots of:
   - `kubectl get pods` output
   - Frontend UI (http://localhost:5173)
   - Kafka UI (http://localhost:8080)
   - Search filter functionality
3. ⏳ Document architecture diagram
4. ⏳ Compare Docker Compose vs Kubernetes performance

### For AWS EKS Deployment:
1. Create ECR repositories for all 7 microservice images
2. Build and push images to ECR
3. Create EKS-specific manifests in `k8s/aws/`
4. Update image references from local to ECR URLs
5. Deploy to EKS cluster
6. Configure ALB Ingress for external access
7. Update documentation with AWS deployment guide

---

## 🤝 Useful Commands

### Kubernetes Management:
```bash
# View all pods
kubectl get pods

# View all services
kubectl get svc

# View pod logs
kubectl logs deployment/booking-service

# Describe pod (for troubleshooting)
kubectl describe pod <pod-name>

# Scale a service
kubectl scale deployment/booking-service --replicas=3

# Restart a deployment
kubectl rollout restart deployment/frontend

# Execute command in pod
kubectl exec -it kafka-0 -- bash
```

### Docker Management:
```bash
# View running containers
docker ps

# View logs
docker logs <container-name>

# Rebuild specific service
docker-compose build booking-service

# Restart specific service
docker-compose restart booking-service
```

---

## 📞 Support Resources

- **Kubernetes Docs:** https://kubernetes.io/docs/
- **Kafka Docs:** https://kafka.apache.org/documentation/
- **Project README:** `/Users/spartan/Desktop/Projects/AirBNB-PK/README.md`
- **K8s Local Guide:** `/Users/spartan/Desktop/Projects/AirBNB-PK/k8s/local/README.md`

---

**Summary:** Successfully deployed 11-service microservices app to local Kubernetes, fixed 5 major issues (health checks, Kafka connectivity, ML timeouts, Redux state, script paths), and validated full functionality. Ready for lab report screenshots and AWS EKS deployment! 🎉
