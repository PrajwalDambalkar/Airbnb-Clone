# Kubernetes Deployment - Health Check Fix

## Issue Found
Health check endpoints were incorrect in the initial deployment manifests.

## Service Health Endpoints

| Service | Port | Health Endpoint |
|---------|------|----------------|
| **backend** | 5001 | `/api/health` ✅ |
| property-service | 5003 | `/health` ✅ |
| booking-service | 5004 | `/health` ✅ |
| traveler-service | 5005 | `/health` ✅ |
| owner-service | 5002 | `/health` ✅ |
| agent-service | 8000 | `/health` ✅ (slow startup - 90s+) |

## Changes Made

### 1. Fixed Backend Health Check
- Changed from `/health` → `/api/health`
- File: `k8s/local/backend-deployment.yaml`

### 2. Confirmed Other Services
- property, booking, traveler, owner all use `/health` (correct)

### 3. Increased Agent Service Timeouts
- `initialDelaySeconds`: 60s → 120s (liveness)
- `initialDelaySeconds`: 45s → 90s (readiness)
- `timeoutSeconds`: 5s → 10s
- `failureThreshold`: 3 → 5
- **Reason**: Agent service loads ML models, embeddings, policies (takes 60-90 seconds)

## Current Status

```bash
$ kubectl get pods
NAME                                READY   STATUS    RESTARTS   AGE
backend-7d65b59b65-q8tld            1/1     Running   0          4m
booking-service-99cbdcc88-xjxsr     1/1     Running   0          2m
frontend-6b86766ccc-tg2l6           1/1     Running   0          14m
kafka-0                             1/1     Running   0          14m
kafka-ui-68bcb5fd4-kkk84            1/1     Running   0          14m
ollama-5b77785f79-w4wl7             1/1     Running   0          14m
owner-service-7cdbb89b64-xlrzx      1/1     Running   0          2m
property-service-65b49fdd94-v62c4   1/1     Running   0          2m
traveler-service-5cdc6fbb54-sc92p   1/1     Running   0          2m
agent-service-5587d7967c-65clz      0/1     Running   0          20s  ← Starting
zookeeper-0                         1/1     Running   0          14m
```

## Verified Working

```bash
$ curl http://localhost:5001/api/health
{"status":"healthy","database":"connected","timestamp":"2025-11-26T11:55:41.971Z"}

$ curl http://localhost:5005/health
{"status":"healthy","service":"traveler-service","database":"connected"}
```

## Login Should Work Now

All backend services (5001-5005) are running and responding:
- ✅ Backend API (authentication): http://localhost:5001
- ✅ Traveler Service (user management): http://localhost:5005
- ✅ Property Service: http://localhost:5003
- ✅ Booking Service: http://localhost:5004
- ✅ Owner Service: http://localhost:5002

Frontend at http://localhost:5173 should now be able to authenticate users!

## Next Steps

1. **Test login** at http://localhost:5173
2. **Check agent service** in ~2 minutes (will be ready after ML model loading)
3. **Monitor pods**: `kubectl get pods -w`
4. **View logs**: `kubectl logs -f deployment/<service-name>`

## If Issues Persist

```bash
# Check pod logs
kubectl logs deployment/backend --tail=50
kubectl logs deployment/traveler-service --tail=50

# Check service endpoints
kubectl get svc

# Restart a service
kubectl rollout restart deployment/<service-name>
```
