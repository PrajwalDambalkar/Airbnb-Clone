#!/bin/bash

# Port-forward Kubernetes services to different ports to avoid conflicts with Docker Compose

echo "🚀 Starting Kubernetes port-forwards on alternate ports..."
echo ""
echo "This allows you to run both Docker Compose AND Kubernetes simultaneously!"
echo ""

# Kill existing port-forwards
pkill -f "kubectl port-forward" || true

# Forward K8s services to ports 6001-6005 (Docker uses 5001-5005)
echo "Starting port-forwards..."
kubectl port-forward -n airbnb-clone service/traveler-service 6001:5001 > /dev/null 2>&1 &
kubectl port-forward -n airbnb-clone service/owner-service 6002:5002 > /dev/null 2>&1 &
kubectl port-forward -n airbnb-clone service/property-service 6003:5003 > /dev/null 2>&1 &
kubectl port-forward -n airbnb-clone service/booking-service 6004:5004 > /dev/null 2>&1 &
kubectl port-forward -n airbnb-clone service/agent-service 6000:8000 > /dev/null 2>&1 &

sleep 2

echo "✅ Port-forwards active:"
echo ""
echo "Docker Compose (Original)     │ Kubernetes (New)"
echo "──────────────────────────────┼─────────────────────────"
echo "http://localhost:5001         │ http://localhost:6001 (traveler)"
echo "http://localhost:5002         │ http://localhost:6002 (owner)"
echo "http://localhost:5003         │ http://localhost:6003 (property)"
echo "http://localhost:5004         │ http://localhost:6004 (booking)"
echo "http://localhost:5005         │ http://localhost:6005 (traveler-old)"
echo "http://localhost:8000         │ http://localhost:6000 (agent)"
echo ""
echo "Test K8s services:"
echo "  curl http://localhost:6003/api/properties"
echo ""
echo "To stop port-forwards:"
echo "  pkill -f 'kubectl port-forward'"
