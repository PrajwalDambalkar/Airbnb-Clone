#!/bin/bash

set -e

echo "🔧 Setting up service directories with package.json files..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"

# Check if backend package.json exists
if [ ! -f "$BACKEND_DIR/package.json" ]; then
    echo -e "${YELLOW}⚠️  Backend package.json not found at $BACKEND_DIR/package.json${NC}"
    exit 1
fi

# Function to setup service
setup_service() {
    local service=$1
    local service_dir="$PROJECT_ROOT/apps/$service"
    
    echo -e "${GREEN}📦 Setting up $service...${NC}"
    
    # Create directory if it doesn't exist
    mkdir -p "$service_dir"
    
    # Copy package.json from backend
    if [ ! -f "$service_dir/package.json" ]; then
        cp "$BACKEND_DIR/package.json" "$service_dir/package.json"
        # Update name in package.json
        sed -i.bak "s/\"name\": \"backend\"/\"name\": \"$service\"/" "$service_dir/package.json"
        rm "$service_dir/package.json.bak" 2>/dev/null || true
        echo -e "${GREEN}  ✅ Created package.json${NC}"
    else
        echo -e "${YELLOW}  ⚠️  package.json already exists, skipping...${NC}"
    fi
    
    # Copy package-lock.json if it exists
    if [ -f "$BACKEND_DIR/package-lock.json" ] && [ ! -f "$service_dir/package-lock.json" ]; then
        cp "$BACKEND_DIR/package-lock.json" "$service_dir/package-lock.json"
        echo -e "${GREEN}  ✅ Created package-lock.json${NC}"
    fi
}

# Setup all services
setup_service "traveler-service"
setup_service "owner-service"
setup_service "property-service"
setup_service "booking-service"

echo ""
echo -e "${GREEN}✅ Service setup complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Copy your service code to each service directory"
echo "  2. Update package.json if needed for each service"
echo "  3. Run: ./build-images.sh"

