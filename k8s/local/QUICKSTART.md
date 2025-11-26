# AirBNB Clone - Kubernetes Quick Start

## ✅ What's Ready

Complete local Kubernetes setup with **11 manifests** for all services:
- ✅ Backend, Frontend, Property, Booking, Traveler, Owner, Agent services
- ✅ Kafka + Zookeeper (StatefulSets with persistent storage)
- ✅ Kafka UI for monitoring
- ✅ Ollama AI service
- ✅ All secrets configured (MongoDB Atlas URIs)

## 🚀 Deploy to Local Kubernetes

### Prerequisites
1. **Enable Kubernetes in Docker Desktop**
   - Docker Desktop → Settings → Kubernetes → ☑️ Enable Kubernetes
   
2. **Verify setup**
   ```bash
   kubectl version --client
   kubectl config current-context  # Should show: docker-desktop
   ```

### One-Command Deploy
```bash
cd /Users/spartan/Desktop/Projects/AirBNB-PK/k8s/local
./deploy.sh
```

**What it does:**
1. Builds all Docker images from your source code
2. Creates Kubernetes secrets (MongoDB URIs, session secrets)
3. Deploys Kafka infrastructure
4. Deploys all 7 microservices
5. Deploys Ollama AI
6. Deploys frontend
7. Waits for everything to be ready

**Expected time:** 5-10 minutes

### Access Your App
- Frontend: http://localhost:5173
- Backend: http://localhost:5001
- All services: http://localhost:5002-5005, 8000, 8080

## 📊 Management Commands

```bash
# View all pods
kubectl get pods

# View services
kubectl get services

# View logs
kubectl logs -f deployment/backend
kubectl logs -f deployment/traveler-service

# Scale a service
kubectl scale deployment backend --replicas=3

# Restart a service
kubectl rollout restart deployment/booking-service

# Debug a pod
kubectl describe pod <pod-name>
kubectl exec -it <pod-name> -- /bin/sh
```

## 🧹 Teardown

```bash
cd /Users/spartan/Desktop/Projects/AirBNB-PK/k8s/local
./teardown.sh
```

Removes all deployments and services (keeps Docker images).

## 🎯 Key Features

### vs Docker Compose
| Feature | Docker Compose | Kubernetes |
|---------|---------------|------------|
| **Orchestration** | Single host | Cluster-ready |
| **Service Discovery** | Container names | DNS (service-name) |
| **Scaling** | Manual | `kubectl scale` |
| **Health Checks** | Basic | Liveness + Readiness probes |
| **Rolling Updates** | No | Yes |
| **Load Balancing** | None | Automatic |

### Your App Behavior
**Identical functionality:**
- ✅ Same environment variables
- ✅ Same MongoDB Atlas connections
- ✅ Same Kafka topics
- ✅ Same ports exposed
- ✅ Same service communication

**Enhanced features:**
- ✅ Automatic restarts on failure
- ✅ Health monitoring
- ✅ Resource limits (prevents runaway memory)
- ✅ Ready for AWS EKS deployment

## 📝 Files Created

```
k8s/local/
├── backend-deployment.yaml           # Backend API
├── frontend-deployment.yaml          # React frontend
├── property-service-deployment.yaml  # Property management
├── booking-service-deployment.yaml   # Booking handling
├── traveler-service-deployment.yaml  # Traveler auth/profile
├── owner-service-deployment.yaml     # Owner management
├── agent-service-deployment.yaml     # AI agent
├── kafka-deployment.yaml             # Kafka + Zookeeper StatefulSets
├── kafka-ui-deployment.yaml          # Kafka monitoring UI
├── ollama-deployment.yaml            # Ollama AI model
├── secrets.yaml                      # MongoDB URIs, secrets
├── deploy.sh                         # Automated deployment
├── teardown.sh                       # Cleanup script
└── README.md                         # Full documentation

Total: 14 files
```

## 🔄 Workflow

### Local Testing (Current)
```bash
# Docker Compose (you're here)
docker-compose up

# OR Local Kubernetes (new option)
./k8s/local/deploy.sh
```

### AWS EKS Deployment (Next)
```bash
# Push images to ECR
./k8s/aws/push-to-ecr.sh

# Deploy to EKS
./k8s/aws/deploy-eks.sh
```

**Same app, same Dockerfiles, different orchestration!**

## 🎓 Learning Benefits

Using K8s locally helps you:
1. **Understand** pod/service concepts
2. **Debug** K8s-specific issues locally
3. **Test** before AWS deployment
4. **Learn** kubectl commands
5. **Demonstrate** scalability in your report

## ⚠️ Important Notes

1. **Images use `imagePullPolicy: Never`**
   - Uses your local Docker images
   - No registry pulls needed
   
2. **MongoDB is external**
   - Still uses MongoDB Atlas
   - No local MongoDB pod needed
   
3. **Persistent volumes**
   - Kafka, Zookeeper, Ollama use PVCs
   - Data persists across pod restarts
   
4. **Port conflicts**
   - Can't run Docker Compose + K8s simultaneously
   - Stop one before starting the other

## 🐛 Troubleshooting

### Pods stuck in Pending
```bash
kubectl describe pod <pod-name>
# Look for: Events section
```

### ImagePullBackOff error
```bash
# Build images first!
cd /Users/spartan/Desktop/Projects/AirBNB-PK
docker-compose build
```

### Service not accessible
```bash
kubectl get svc
kubectl port-forward service/backend 5001:5001
```

### Check Kafka connectivity
```bash
kubectl logs -f deployment/kafka-ui
# Should show "Connected to Kafka"
```

## 🎯 Next Steps

1. ✅ **Test locally**: `./deploy.sh`
2. 📊 **Monitor**: Visit http://localhost:8080 (Kafka UI)
3. 🧪 **Experiment**: Scale services, view logs
4. 📸 **Screenshots**: For your lab report
5. 🚀 **Deploy AWS**: Use similar manifests for EKS

---

**Ready to deploy?**
```bash
cd /Users/spartan/Desktop/Projects/AirBNB-PK/k8s/local
./deploy.sh
```

**Questions?** Check `README.md` in this folder for detailed docs.
