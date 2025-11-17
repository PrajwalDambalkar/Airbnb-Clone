#!/bin/bash

set -e

echo "🔧 Setting up Kubernetes cluster for Airbnb Clone..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if cluster already exists
if kubectl cluster-info &> /dev/null; then
    echo -e "${GREEN}✅ Kubernetes cluster already running!${NC}"
    kubectl cluster-info | head -1
    exit 0
fi

# Check for Docker Desktop Kubernetes
if docker info &> /dev/null; then
    echo -e "${YELLOW}🐳 Docker Desktop detected${NC}"
    echo -e "${YELLOW}   Please enable Kubernetes in Docker Desktop:${NC}"
    echo "   1. Open Docker Desktop"
    echo "   2. Go to Settings > Kubernetes"
    echo "   3. Check 'Enable Kubernetes'"
    echo "   4. Click 'Apply & Restart'"
    echo ""
    echo -e "${YELLOW}   Then run: ./deploy.sh${NC}"
    exit 0
fi

# Check for minikube
if command -v minikube &> /dev/null; then
    echo -e "${GREEN}📦 Found minikube${NC}"
    echo -e "${YELLOW}   Starting minikube cluster...${NC}"
    minikube start
    echo -e "${GREEN}✅ Minikube cluster started!${NC}"
    exit 0
fi

# Check for kind
if command -v kind &> /dev/null; then
    echo -e "${GREEN}📦 Found kind${NC}"
    echo -e "${YELLOW}   Creating kind cluster...${NC}"
    kind create cluster --name airbnb-clone
    echo -e "${GREEN}✅ Kind cluster created!${NC}"
    exit 0
fi

# No cluster tools found
echo -e "${RED}❌ No Kubernetes cluster tools found${NC}"
echo ""
echo -e "${YELLOW}Please install one of the following:${NC}"
echo ""
echo -e "${YELLOW}Option 1: Install minikube${NC}"
echo "  brew install minikube"
echo "  minikube start"
echo ""
echo -e "${YELLOW}Option 2: Enable Kubernetes in Docker Desktop${NC}"
echo "  1. Open Docker Desktop"
echo "  2. Go to Settings > Kubernetes"
echo "  3. Enable Kubernetes"
echo ""
echo -e "${YELLOW}Option 3: Install kind${NC}"
echo "  brew install kind"
echo "  kind create cluster --name airbnb-clone"
echo ""

