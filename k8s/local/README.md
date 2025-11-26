# Local Kubernetes Deployment

Deploy AirBNB Clone to Docker Desktop Kubernetes for local testing.

## Prerequisites

1. **Docker Desktop** with Kubernetes enabled
   - Open Docker Desktop → Settings → Kubernetes → Enable Kubernetes
   
2. **kubectl** installed and configured
   ```bash
   kubectl version --client
   ```

3. **Current context** should be `docker-desktop`
   ```bash
   kubectl config current-context
   # Should show: docker-desktop
   ```

## Quick Start

### Deploy Everything

```bash
cd k8s/local
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Build all Docker images locally
2. Create Kubernetes secrets
3. Deploy Kafka + Zookeeper
4. Deploy Ollama (AI service)
5. Deploy all microservices (backend, property, booking, traveler, owner, agent)
6. Deploy Kafka UI
7. Deploy Frontend

### Access Services

Once deployed, access via:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **Property Service**: http://localhost:5003
- **Booking Service**: http://localhost:5004
- **Traveler Service**: http://localhost:5005
- **Owner Service**: http://localhost:5002
- **Agent Service**: http://localhost:8000
- **Kafka UI**: http://localhost:8080

## Management Commands

### View Status

```bash
# View all pods
kubectl get pods

# View all services
kubectl get services

# View deployments
kubectl get deployments
```

### View Logs

```bash
# View logs for a specific service
kubectl logs -f deployment/backend
kubectl logs -f deployment/booking-service

# View logs for a pod
kubectl logs -f <pod-name>
```

### Scale Services

```bash
# Scale a deployment
kubectl scale deployment backend --replicas=3

# Verify scaling
kubectl get pods -l app=backend
```

### Restart Services

```bash
# Restart a deployment
kubectl rollout restart deployment/backend

# Check rollout status
kubectl rollout status deployment/backend
```

### Debug Issues

```bash
# Describe a pod (shows events and details)
kubectl describe pod <pod-name>

# Get pod details
kubectl get pod <pod-name> -o yaml

# Execute commands in a pod
kubectl exec -it <pod-name> -- /bin/sh
```

## Teardown

```bash
cd k8s/local
chmod +x teardown.sh
./teardown.sh
```

This removes all deployments, services, and persistent volume claims.

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Docker Desktop Kubernetes               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Backend  │  │ Property │  │ Booking  │     │
│  │  :5001   │  │  :5003   │  │  :5004   │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │              │            │
│  ┌────┴─────┐  ┌───┴──────┐  ┌───┴──────┐     │
│  │ Traveler │  │  Owner   │  │  Agent   │     │
│  │  :5005   │  │  :5002   │  │  :8000   │     │
│  └──────────┘  └──────────┘  └─────┬────┘     │
│                                     │           │
│  ┌──────────┐  ┌──────────┐  ┌────┴────┐     │
│  │  Kafka   │  │Kafka UI  │  │ Ollama  │     │
│  │ :9092    │  │  :8080   │  │ :11434  │     │
│  └──────────┘  └──────────┘  └─────────┘     │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │           Frontend :5173                 │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
         │
         └──────► MongoDB Atlas (External)
```

## Key Differences from Docker Compose

| Feature | Docker Compose | Kubernetes |
|---------|---------------|------------|
| Service Discovery | Container names | Service DNS |
| Scaling | `docker-compose up --scale` | `kubectl scale` |
| Logs | `docker logs` | `kubectl logs` |
| Restart | `docker-compose restart` | `kubectl rollout restart` |
| Networking | Bridge network | K8s Services + DNS |
| Load Balancing | None (single instance) | Built-in (Service) |

## Troubleshooting

### Pods stuck in Pending
```bash
kubectl describe pod <pod-name>
# Check for resource constraints or image pull issues
```

### Service not accessible
```bash
# Check if service exists
kubectl get svc

# Check if pods are running
kubectl get pods -l app=<service-name>

# Port forward if needed
kubectl port-forward service/<service-name> <local-port>:<service-port>
```

### Image pull errors
Images use `imagePullPolicy: Never` to use local Docker images.
Make sure you ran `docker-compose build` first!

### MongoDB connection issues
Check if MongoDB Atlas URI is correct in `secrets.yaml`

## Next Steps

- ✅ Test locally with Kubernetes
- 🚀 Deploy to AWS EKS (see `/k8s/aws/` folder)
- 📊 Monitor with Kubernetes Dashboard
- 🔄 Set up CI/CD pipelines
