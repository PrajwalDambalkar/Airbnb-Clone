#!/bin/bash

set -e

echo "🗑️  Undeploying Airbnb Clone Microservices from Kubernetes..."
echo ""

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Delete Ingress
echo -e "${YELLOW}🌐 Deleting Ingress...${NC}"
kubectl delete -f ingress/ --ignore-not-found=true

# Delete Services
echo -e "${YELLOW}🚀 Deleting Services...${NC}"
kubectl delete -f services/ --ignore-not-found=true

# Delete Databases
echo -e "${YELLOW}🗄️  Deleting Databases...${NC}"
kubectl delete -f databases/ --ignore-not-found=true

# Delete Persistent Volumes
echo -e "${YELLOW}💾 Deleting Persistent Volumes...${NC}"
kubectl delete -f persistent-volumes/ --ignore-not-found=true

# Delete Secrets
echo -e "${YELLOW}🔐 Deleting Secrets...${NC}"
kubectl delete -f secrets/app-secrets.yaml --ignore-not-found=true

# Delete ConfigMaps
echo -e "${YELLOW}📋 Deleting ConfigMaps...${NC}"
kubectl delete -f configmaps/ --ignore-not-found=true

# Delete Namespace
echo -e "${YELLOW}📦 Deleting Namespace...${NC}"
kubectl delete -f namespace.yaml --ignore-not-found=true

echo ""
echo -e "${GREEN}✅ Undeployment complete!${NC}"

