# Docker & Kubernetes Setup Guide

This document provides a comprehensive guide for containerizing and orchestrating the Airbnb Clone microservices.

## 📋 Overview

The application has been split into 5 microservices:
1. **Traveler Service** - User management for travelers
2. **Owner Service** - User management for owners
3. **Property Service** - Property CRUD operations
4. **Booking Service** - Booking management
5. **Agent Service** - AI-powered travel planning (Python/FastAPI)

## 🐳 Docker Setup

### Dockerfiles Created

Each service has its own Dockerfile:
- `apps/traveler-service/Dockerfile`
- `apps/owner-service/Dockerfile`
- `apps/property-service/Dockerfile`
- `apps/booking-service/Dockerfile`
- `apps/agent-service/Dockerfile`

### Building Docker Images

#### Option 1: Build All Images at Once

```bash
cd k8s
chmod +x build-images.sh
./build-images.sh
```

#### Option 2: Build Individual Images

```bash
# Traveler Service
docker build -t traveler-service:latest ./apps/traveler-service

# Owner Service
docker build -t owner-service:latest ./apps/owner-service

# Property Service
docker build -t property-service:latest ./apps/property-service

# Booking Service
docker build -t booking-service:latest ./apps/booking-service

# Agent Service
docker build -t agent-service:latest ./apps/agent-service
```

#### Option 3: Build with Custom Registry

```bash
export DOCKER_REGISTRY=your-registry.com
export IMAGE_TAG=v1.0.0
./build-images.sh
```

### Testing Docker Images Locally

```bash
# Run Traveler Service
docker run -p 5001:5001 \
  -e MONGODB_URI="mongodb://admin:password@host.docker.internal:27017/airbnb_travelers?authSource=admin" \
  -e SESSION_SECRET="your-secret" \
  traveler-service:latest

# Run Agent Service
docker run -p 8000:8000 \
  -e MYSQL_HOST="host.docker.internal" \
  -e MYSQL_USER="root" \
  -e MYSQL_PASSWORD="password" \
  -e MYSQL_DATABASE="airbnb_db" \
  agent-service:latest
```

## ☸️ Kubernetes Setup

### Prerequisites

1. **Kubernetes Cluster**
   - Minikube: `minikube start`
   - Kind: `kind create cluster`
   - Cloud provider (GKE, EKS, AKS)

2. **kubectl** configured to access your cluster

3. **NGINX Ingress Controller** (for ingress)
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
   ```

### Quick Deployment

1. **Prepare Secrets**
   ```bash
   cd k8s
   cp secrets/app-secrets.yaml.example secrets/app-secrets.yaml
   # Edit secrets/app-secrets.yaml with your actual values
   # Generate base64: echo -n 'your-value' | base64
   ```

2. **Build Images** (if not already built)
   ```bash
   ./build-images.sh
   ```

3. **Deploy to Kubernetes**
   ```bash
   ./deploy.sh
   ```

4. **Verify Deployment**
   ```bash
   kubectl get pods -n airbnb-clone
   kubectl get services -n airbnb-clone
   kubectl get ingress -n airbnb-clone
   ```

### Manual Deployment Steps

If you prefer to deploy manually:

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Apply ConfigMaps
kubectl apply -f k8s/configmaps/

# 3. Apply Secrets
kubectl apply -f k8s/secrets/app-secrets.yaml

# 4. Apply Persistent Volumes
kubectl apply -f k8s/persistent-volumes/

# 5. Deploy Databases
kubectl apply -f k8s/databases/mongodb/
kubectl apply -f k8s/databases/mysql/

# 6. Wait for databases
kubectl wait --for=condition=ready pod -l app=mongodb -n airbnb-clone --timeout=120s
kubectl wait --for=condition=ready pod -l app=mysql -n airbnb-clone --timeout=120s

# 7. Deploy Services
kubectl apply -f k8s/services/traveler-service/
kubectl apply -f k8s/services/owner-service/
kubectl apply -f k8s/services/property-service/
kubectl apply -f k8s/services/booking-service/
kubectl apply -f k8s/services/agent-service/

# 8. Apply Ingress
kubectl apply -f k8s/ingress/
```

## 🔗 Service Communication

Services communicate using Kubernetes DNS:

- **Internal URLs** (within cluster):
  - `http://traveler-service:5001`
  - `http://owner-service:5002`
  - `http://property-service:5003`
  - `http://booking-service:5004`
  - `http://agent-service:8000`

- **External URLs** (via Ingress):
  - `http://api.airbnb-clone.local/api/travelers`
  - `http://api.airbnb-clone.local/api/owners`
  - `http://api.airbnb-clone.local/api/properties`
  - `http://api.airbnb-clone.local/api/bookings`
  - `http://api.airbnb-clone.local/api/agent`

### Configuring /etc/hosts for Ingress

```bash
# Add to /etc/hosts
127.0.0.1 api.airbnb-clone.local
```

## 📊 Monitoring & Scaling

### Check Service Status

```bash
# All pods
kubectl get pods -n airbnb-clone

# Specific service
kubectl get pods -l app=traveler-service -n airbnb-clone

# Service endpoints
kubectl get endpoints -n airbnb-clone

# Horizontal Pod Autoscalers
kubectl get hpa -n airbnb-clone
```

### View Logs

```bash
# Service logs
kubectl logs -f deployment/traveler-service -n airbnb-clone

# All pods for a service
kubectl logs -f -l app=traveler-service -n airbnb-clone

# Specific pod
kubectl logs <pod-name> -n airbnb-clone
```

### Scaling

**Automatic Scaling** (via HPA):
- Services automatically scale based on CPU (70%) and Memory (80%) utilization
- Min/Max replicas configured per service

**Manual Scaling**:
```bash
# Scale a service
kubectl scale deployment traveler-service --replicas=5 -n airbnb-clone

# Check current replicas
kubectl get deployment traveler-service -n airbnb-clone
```

## 🔧 Configuration

### Environment Variables

Managed through:
- **ConfigMaps**: `k8s/configmaps/app-config.yaml`, `k8s/configmaps/service-urls.yaml`
- **Secrets**: `k8s/secrets/app-secrets.yaml` (create from example)

### Updating Configuration

```bash
# Edit ConfigMap
kubectl edit configmap app-config -n airbnb-clone

# Edit Secret
kubectl edit secret app-secrets -n airbnb-clone

# Restart pods to pick up changes
kubectl rollout restart deployment/traveler-service -n airbnb-clone
```

## 🗑️ Cleanup

### Undeploy Everything

```bash
cd k8s
./undeploy.sh
```

### Manual Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/ingress/
kubectl delete -f k8s/services/
kubectl delete -f k8s/databases/
kubectl delete -f k8s/persistent-volumes/
kubectl delete -f k8s/secrets/app-secrets.yaml
kubectl delete -f k8s/configmaps/
kubectl delete -f k8s/namespace.yaml
```

## 🐛 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n airbnb-clone

# Check events
kubectl get events -n airbnb-clone --sort-by='.lastTimestamp'

# Check logs
kubectl logs <pod-name> -n airbnb-clone
```

### Database Connection Issues

```bash
# Check database pods
kubectl get pods -l app=mongodb -n airbnb-clone
kubectl get pods -l app=mysql -n airbnb-clone

# Test database connectivity
kubectl run -it --rm debug --image=mongo:7 --restart=Never -- mongosh mongodb-service:27017
```

### Service Communication Issues

```bash
# Check service endpoints
kubectl get endpoints -n airbnb-clone

# Test DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup traveler-service

# Port forward for testing
kubectl port-forward service/traveler-service 5001:5001 -n airbnb-clone
```

### Image Pull Errors

```bash
# Check image pull policy
kubectl describe pod <pod-name> -n airbnb-clone | grep Image

# For local images (minikube)
eval $(minikube docker-env)
docker build -t traveler-service:latest ./apps/traveler-service
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

## ✅ Checklist

- [ ] Docker images built for all services
- [ ] Kubernetes cluster configured
- [ ] Secrets file created (`k8s/secrets/app-secrets.yaml`)
- [ ] ConfigMaps reviewed and updated
- [ ] Persistent volumes configured
- [ ] Databases deployed and running
- [ ] All services deployed
- [ ] Ingress configured
- [ ] Health checks passing
- [ ] Service communication verified
- [ ] HPA configured and working
- [ ] Logs accessible
- [ ] Monitoring set up (optional)

## 🚀 Next Steps

1. **Production Considerations**:
   - Use private container registry
   - Implement network policies
   - Set up monitoring (Prometheus/Grafana)
   - Configure backup strategies
   - Set up CI/CD pipeline

2. **Security Enhancements**:
   - Use Kubernetes secrets management (e.g., Sealed Secrets, External Secrets Operator)
   - Implement RBAC
   - Add network policies
   - Enable TLS/SSL

3. **Performance Optimization**:
   - Tune resource requests/limits
   - Configure pod disruption budgets
   - Set up cluster autoscaling
   - Optimize database connections

