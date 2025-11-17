# Kubernetes Deployment Guide

This directory contains all Kubernetes manifests for deploying the Airbnb Clone microservices.

## 📁 Directory Structure

```
k8s/
├── namespace.yaml              # Kubernetes namespace
├── configmaps/                # Configuration maps
│   ├── app-config.yaml
│   └── service-urls.yaml
├── secrets/                   # Secrets (create from example)
│   ├── app-secrets.yaml.example
│   └── app-secrets.yaml      # Create this file
├── persistent-volumes/        # Storage volumes
│   ├── mongodb-pv.yaml
│   ├── mysql-pv.yaml
│   └── uploads-pv.yaml
├── databases/                 # Database deployments
│   ├── mongodb/
│   └── mysql/
├── services/                 # Service deployments
│   ├── traveler-service/
│   ├── owner-service/
│   ├── property-service/
│   ├── booking-service/
│   └── agent-service/
├── ingress/                  # Ingress configuration
│   └── ingress.yaml
├── deploy.sh                 # Deployment script
├── undeploy.sh              # Undeployment script
└── build-images.sh          # Docker image build script
```

## 🚀 Quick Start

### Prerequisites

1. **Kubernetes cluster** (minikube, kind, or cloud provider)
2. **kubectl** configured to access your cluster
3. **Docker** for building images
4. **NGINX Ingress Controller** (for ingress)

### Step 1: Prepare Secrets

```bash
# Copy the example secrets file
cp secrets/app-secrets.yaml.example secrets/app-secrets.yaml

# Edit and update with your actual secrets
# Generate base64 encoded values:
echo -n 'your-secret-value' | base64
```

### Step 2: Build Docker Images

```bash
# Build all images
chmod +x build-images.sh
./build-images.sh

# Or build individually:
docker build -t traveler-service:latest ./apps/traveler-service
docker build -t owner-service:latest ./apps/owner-service
docker build -t property-service:latest ./apps/property-service
docker build -t booking-service:latest ./apps/booking-service
docker build -t agent-service:latest ./apps/agent-service
```

### Step 3: Deploy to Kubernetes

```bash
# Make scripts executable
chmod +x deploy.sh undeploy.sh

# Deploy all services
./deploy.sh
```

### Step 4: Verify Deployment

```bash
# Check pods
kubectl get pods -n airbnb-clone

# Check services
kubectl get services -n airbnb-clone

# Check ingress
kubectl get ingress -n airbnb-clone

# Check HPA
kubectl get hpa -n airbnb-clone
```

## 📊 Service Endpoints

Once deployed, services are accessible via:

- **Traveler Service**: `http://traveler-service:5001` (internal)
- **Owner Service**: `http://owner-service:5002` (internal)
- **Property Service**: `http://property-service:5003` (internal)
- **Booking Service**: `http://booking-service:5004` (internal)
- **Agent Service**: `http://agent-service:8000` (internal)

### External Access (via Ingress)

Configure `/etc/hosts`:
```
127.0.0.1 api.airbnb-clone.local
```

Then access:
- `http://api.airbnb-clone.local/api/travelers`
- `http://api.airbnb-clone.local/api/owners`
- `http://api.airbnb-clone.local/api/properties`
- `http://api.airbnb-clone.local/api/bookings`
- `http://api.airbnb-clone.local/api/agent`

## 🔧 Configuration

### Environment Variables

All environment variables are managed through:
- **ConfigMaps**: Non-sensitive configuration (`app-config.yaml`, `service-urls.yaml`)
- **Secrets**: Sensitive data (`app-secrets.yaml`)

### Scaling

Each service has HorizontalPodAutoscaler (HPA) configured:
- **Traveler/Owner Service**: 2-10 replicas
- **Property/Booking Service**: 3-15 replicas
- **Agent Service**: 2-8 replicas

Scaling triggers:
- CPU utilization > 70%
- Memory utilization > 80%

### Manual Scaling

```bash
# Scale a service manually
kubectl scale deployment traveler-service --replicas=5 -n airbnb-clone
```

## 📝 Useful Commands

### View Logs

```bash
# View logs for a service
kubectl logs -f deployment/traveler-service -n airbnb-clone

# View logs for all pods
kubectl logs -f -l app=traveler-service -n airbnb-clone
```

### Debugging

```bash
# Get pod details
kubectl describe pod <pod-name> -n airbnb-clone

# Execute command in pod
kubectl exec -it <pod-name> -n airbnb-clone -- /bin/sh

# Port forward for local testing
kubectl port-forward service/traveler-service 5001:5001 -n airbnb-clone
```

### Update Deployment

```bash
# After building new image
docker build -t traveler-service:v2.0 ./apps/traveler-service

# Update image in deployment
kubectl set image deployment/traveler-service traveler-service=traveler-service:v2.0 -n airbnb-clone

# Or edit deployment directly
kubectl edit deployment traveler-service -n airbnb-clone
```

## 🗑️ Undeploy

```bash
# Remove all resources
./undeploy.sh
```

## 🔐 Security Notes

1. **Secrets**: Never commit `app-secrets.yaml` to version control
2. **Image Registry**: Use private registry for production images
3. **Network Policies**: Consider adding network policies for service isolation
4. **RBAC**: Configure proper RBAC for service accounts

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

## 🐛 Troubleshooting

### Pods not starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n airbnb-clone

# Check logs
kubectl logs <pod-name> -n airbnb-clone
```

### Services can't communicate

```bash
# Verify service endpoints
kubectl get endpoints -n airbnb-clone

# Test DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup traveler-service
```

### Database connection issues

```bash
# Check database pods
kubectl get pods -l app=mongodb -n airbnb-clone
kubectl get pods -l app=mysql -n airbnb-clone

# Check database logs
kubectl logs -l app=mongodb -n airbnb-clone
```

