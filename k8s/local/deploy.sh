#!/bin/bash

# Local Kubernetes Deployment Script
# Deploys AirBNB application to Docker Desktop Kubernetes

set -e

echo "🚀 Deploying AirBNB Clone to Local Kubernetes..."
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl."
    exit 1
fi

# Check if connected to docker-desktop context
CURRENT_CONTEXT=$(kubectl config current-context)
if [ "$CURRENT_CONTEXT" != "docker-desktop" ]; then
    echo "⚠️  Current context is: $CURRENT_CONTEXT"
    echo "Switching to docker-desktop..."
    kubectl config use-context docker-desktop
fi

echo "✅ Using context: docker-desktop"
echo ""

# Step 1: Build all Docker images locally
echo "📦 Step 1: Building Docker images..."
cd ../..
docker-compose build
echo "✅ Images built successfully"
echo ""

# Step 2: Apply secrets
echo "🔐 Step 2: Creating secrets..."
kubectl apply -f k8s/local/secrets.yaml
echo "✅ Secrets created"
echo ""

# Step 3: Deploy Kafka infrastructure
echo "📡 Step 3: Deploying Kafka infrastructure..."
kubectl apply -f k8s/local/kafka-deployment.yaml
echo "⏳ Waiting for Zookeeper to be ready..."
kubectl wait --for=condition=ready pod -l app=zookeeper --timeout=120s || true
echo "⏳ Waiting for Kafka to be ready..."
kubectl wait --for=condition=ready pod -l app=kafka --timeout=120s || true
echo "✅ Kafka infrastructure deployed"
echo ""

# Step 4: Deploy Ollama
echo "🤖 Step 4: Deploying Ollama..."
kubectl apply -f k8s/local/ollama-deployment.yaml
echo "⏳ Waiting for Ollama to be ready (this may take a while)..."
kubectl wait --for=condition=ready pod -l app=ollama --timeout=180s || true
echo "✅ Ollama deployed"
echo ""

# Step 5: Deploy microservices
echo "🔧 Step 5: Deploying microservices..."
kubectl apply -f k8s/local/backend-deployment.yaml
kubectl apply -f k8s/local/property-service-deployment.yaml
kubectl apply -f k8s/local/booking-service-deployment.yaml
kubectl apply -f k8s/local/traveler-service-deployment.yaml
kubectl apply -f k8s/local/owner-service-deployment.yaml
kubectl apply -f k8s/local/agent-service-deployment.yaml
echo "✅ Microservices deployed"
echo ""

# Step 6: Deploy Kafka UI
echo "📊 Step 6: Deploying Kafka UI..."
kubectl apply -f k8s/local/kafka-ui-deployment.yaml
echo "✅ Kafka UI deployed"
echo ""

# Step 7: Deploy Frontend
echo "🎨 Step 7: Deploying Frontend..."
kubectl apply -f k8s/local/frontend-deployment.yaml
echo "✅ Frontend deployed"
echo ""

# Wait for all deployments to be ready
echo "⏳ Waiting for all deployments to be ready..."
kubectl wait --for=condition=available deployment --all --timeout=300s || true
echo ""

# Display status
echo "📊 Deployment Status:"
echo ""
kubectl get pods
echo ""
kubectl get services
echo ""

echo "✅ Deployment Complete!"
echo ""
echo "📝 Access your services:"
echo "   Frontend:        http://localhost:5173"
echo "   Backend:         http://localhost:5001"
echo "   Property:        http://localhost:5003"
echo "   Booking:         http://localhost:5004"
echo "   Traveler:        http://localhost:5005"
echo "   Owner:           http://localhost:5002"
echo "   Agent:           http://localhost:8000"
echo "   Kafka UI:        http://localhost:8080"
echo ""
echo "💡 Useful commands:"
echo "   View pods:       kubectl get pods"
echo "   View logs:       kubectl logs -f <pod-name>"
echo "   View services:   kubectl get services"
echo "   Teardown:        ./teardown.sh"
echo ""
