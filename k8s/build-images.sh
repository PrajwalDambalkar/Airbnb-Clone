#!/bin/bash

set -e

echo "🔨 Building Docker images for all services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Docker registry (change this to your registry)
REGISTRY="${DOCKER_REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Function to build image
build_image() {
    local service=$1
    local dockerfile_path="$PROJECT_ROOT/apps/$service"
    
    if [ ! -f "$dockerfile_path/Dockerfile" ]; then
        echo -e "${YELLOW}⚠️  Dockerfile not found for $service, skipping...${NC}"
        return
    fi
    
    echo -e "${GREEN}🔨 Building $service...${NC}"
    
    if [ -n "$REGISTRY" ]; then
        docker build -t "$REGISTRY/$service:$IMAGE_TAG" -f "$dockerfile_path/Dockerfile" "$dockerfile_path"
        echo -e "${GREEN}✅ Built $REGISTRY/$service:$IMAGE_TAG${NC}"
    else
        docker build -t "$service:$IMAGE_TAG" -f "$dockerfile_path/Dockerfile" "$dockerfile_path"
        echo -e "${GREEN}✅ Built $service:$IMAGE_TAG${NC}"
    fi
}

# Build all services
build_image "traveler-service"
build_image "owner-service"
build_image "property-service"
build_image "booking-service"
build_image "agent-service"

echo ""
echo -e "${GREEN}✅ All images built successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 To push images to registry (if REGISTRY is set):${NC}"
echo "  docker push \$REGISTRY/traveler-service:\$IMAGE_TAG"
echo "  docker push \$REGISTRY/owner-service:\$IMAGE_TAG"
echo "  docker push \$REGISTRY/property-service:\$IMAGE_TAG"
echo "  docker push \$REGISTRY/booking-service:\$IMAGE_TAG"
echo "  docker push \$REGISTRY/agent-service:\$IMAGE_TAG"

