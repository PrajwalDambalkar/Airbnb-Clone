#!/bin/bash

set -e

echo "🚀 Deploying Airbnb Clone Microservices to Kubernetes..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install kubectl first.${NC}"
    exit 1
fi

# Check if Kubernetes cluster is available
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ No Kubernetes cluster found!${NC}"
    echo ""
    echo -e "${YELLOW}📝 To set up a local Kubernetes cluster, choose one:${NC}"
    echo ""
    echo -e "${YELLOW}Option 1: Install and start minikube${NC}"
    echo "  brew install minikube"
    echo "  minikube start"
    echo ""
    echo -e "${YELLOW}Option 2: Enable Kubernetes in Docker Desktop${NC}"
    echo "  1. Open Docker Desktop"
    echo "  2. Go to Settings > Kubernetes"
    echo "  3. Enable Kubernetes"
    echo "  4. Click 'Apply & Restart'"
    echo ""
    echo -e "${YELLOW}Option 3: Install kind${NC}"
    echo "  brew install kind"
    echo "  kind create cluster --name airbnb-clone"
    echo ""
    echo -e "${YELLOW}After setting up a cluster, run this script again.${NC}"
    exit 1
fi

# Verify cluster connection
echo -e "${GREEN}✅ Kubernetes cluster detected${NC}"
kubectl cluster-info | head -1
echo ""

# Check if namespace exists, if not create it
if ! kubectl get namespace airbnb-clone &> /dev/null; then
    echo -e "${YELLOW}📦 Creating namespace...${NC}"
    kubectl apply -f namespace.yaml
else
    echo -e "${GREEN}✅ Namespace already exists${NC}"
fi

# Apply ConfigMaps
echo -e "${YELLOW}📋 Applying ConfigMaps...${NC}"
kubectl apply -f configmaps/

# Check if secrets file exists
if [ ! -f "secrets/app-secrets.yaml" ]; then
    echo -e "${RED}❌ Secrets file not found!${NC}"
    echo -e "${YELLOW}⚠️  Please create secrets/app-secrets.yaml from secrets/app-secrets.yaml.example${NC}"
    echo -e "${YELLOW}   Run: cp secrets/app-secrets.yaml.example secrets/app-secrets.yaml${NC}"
    echo -e "${YELLOW}   Then edit secrets/app-secrets.yaml with your actual secrets${NC}"
    exit 1
fi

# Apply Secrets
echo -e "${YELLOW}🔐 Applying Secrets...${NC}"
kubectl apply -f secrets/app-secrets.yaml

# Apply Persistent Volumes
echo -e "${YELLOW}💾 Applying Persistent Volumes...${NC}"
kubectl apply -f persistent-volumes/

# Deploy Databases
echo -e "${YELLOW}🗄️  Deploying Databases...${NC}"
kubectl apply -f databases/mongodb/
kubectl apply -f databases/mysql/

# Wait for databases to be ready
echo -e "${YELLOW}⏳ Waiting for databases to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=mongodb -n airbnb-clone --timeout=120s || echo -e "${YELLOW}⚠️  MongoDB not ready yet, continuing...${NC}"
kubectl wait --for=condition=ready pod -l app=mysql -n airbnb-clone --timeout=120s || echo -e "${YELLOW}⚠️  MySQL not ready yet, continuing...${NC}"

# Deploy Services
echo -e "${YELLOW}🚀 Deploying Services...${NC}"
kubectl apply -f services/traveler-service/
kubectl apply -f services/owner-service/
kubectl apply -f services/property-service/
kubectl apply -f services/booking-service/
kubectl apply -f services/agent-service/

# Apply Ingress
echo -e "${YELLOW}🌐 Applying Ingress...${NC}"
kubectl apply -f ingress/

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}📊 Check status:${NC}"
echo "  kubectl get pods -n airbnb-clone"
echo "  kubectl get services -n airbnb-clone"
echo "  kubectl get ingress -n airbnb-clone"
echo "  kubectl get hpa -n airbnb-clone"
echo ""
echo -e "${YELLOW}📝 View logs:${NC}"
echo "  kubectl logs -f deployment/traveler-service -n airbnb-clone"
echo "  kubectl logs -f deployment/owner-service -n airbnb-clone"
echo "  kubectl logs -f deployment/property-service -n airbnb-clone"
echo "  kubectl logs -f deployment/booking-service -n airbnb-clone"
echo "  kubectl logs -f deployment/agent-service -n airbnb-clone"

