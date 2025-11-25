#!/bin/bash

# AWS EC2 Deployment Script for Airbnb Clone
# Run this script on your EC2 instance after SSH connection

set -e  # Exit on any error

echo "================================================"
echo "  Airbnb Clone - AWS EC2 Deployment Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${NC}→ $1${NC}"
}

# Step 1: Update system
print_info "Step 1: Updating system packages..."
sudo yum update -y
print_success "System updated"

# Step 2: Install Docker
print_info "Step 2: Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo yum install docker -y
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    print_success "Docker installed"
else
    print_warning "Docker already installed"
fi

# Step 3: Install Docker Compose
print_info "Step 3: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
else
    print_warning "Docker Compose already installed"
fi

# Step 4: Install Git
print_info "Step 4: Installing Git..."
if ! command -v git &> /dev/null; then
    sudo yum install git -y
    print_success "Git installed"
else
    print_warning "Git already installed"
fi

# Verify installations
echo ""
echo "Verifying installations:"
docker --version
docker-compose --version
git --version
echo ""

# Step 5: Get EC2 Public IP
print_info "Step 5: Detecting EC2 Public IP..."
EC2_PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
if [ -n "$EC2_PUBLIC_IP" ]; then
    print_success "EC2 Public IP: $EC2_PUBLIC_IP"
else
    print_error "Could not detect EC2 public IP"
    EC2_PUBLIC_IP="<EC2-PUBLIC-IP>"
fi

# Step 6: Clone or pull repository
print_info "Step 6: Setting up project repository..."
if [ -d "Airbnb-Clone" ]; then
    print_warning "Project directory exists, pulling latest changes..."
    cd Airbnb-Clone
    git pull origin feature/Jmeter
else
    print_info "Cloning repository..."
    git clone https://github.com/PrajwalDambalkar/Airbnb-Clone.git
    cd Airbnb-Clone
    git checkout feature/Jmeter
    print_success "Repository cloned"
fi

# Step 7: Create environment file
print_info "Step 7: Creating environment configuration..."
if [ -f ".env.aws" ]; then
    print_warning ".env.aws already exists, backing up..."
    mv .env.aws .env.aws.backup.$(date +%s)
fi

cat > .env.aws << EOF
# Auto-generated AWS Environment Configuration
# Generated on: $(date)

# MongoDB Connection Strings
MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority
TRAVELER_MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority
OWNER_MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority
PROPERTY_MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_properties?retryWrites=true&w=majority
BOOKING_MONGODB_URI=mongodb+srv://pprathkanthiwar_db_user:Somalwar1!@cluster0.y1r5ijv.mongodb.net/airbnb_db?retryWrites=true&w=majority

# Session Secret
SESSION_SECRET=aws-deployment-secret-$(date +%s)

# Node Environment
NODE_ENV=production

# EC2 Public IP
EC2_PUBLIC_IP=$EC2_PUBLIC_IP
EOF

print_success "Environment file created"

# Step 8: Update docker-compose.aws.yml with actual IP
print_info "Step 8: Updating docker-compose.aws.yml with EC2 IP..."
if [ -f "docker-compose.aws.yml" ]; then
    sed -i "s|<EC2-PUBLIC-IP>|$EC2_PUBLIC_IP|g" docker-compose.aws.yml
    print_success "Docker Compose file updated"
else
    print_error "docker-compose.aws.yml not found!"
fi

# Step 9: Display next steps
echo ""
echo "================================================"
echo "  Installation Complete! 🎉"
echo "================================================"
echo ""
print_success "All dependencies installed"
print_success "Project repository ready"
print_success "Environment configured"
echo ""
echo "Your EC2 Public IP: $EC2_PUBLIC_IP"
echo ""
echo "================================================"
echo "  Next Steps:"
echo "================================================"
echo ""
echo "1. Logout and login again (to apply Docker group changes):"
echo "   ${YELLOW}exit${NC}"
echo "   ${YELLOW}ssh -i your-key.pem ec2-user@$EC2_PUBLIC_IP${NC}"
echo ""
echo "2. Navigate to project directory:"
echo "   ${YELLOW}cd Airbnb-Clone${NC}"
echo ""
echo "3. Start all services:"
echo "   ${YELLOW}docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d --build${NC}"
echo ""
echo "4. Check running containers:"
echo "   ${YELLOW}docker ps${NC}"
echo ""
echo "5. View logs:"
echo "   ${YELLOW}docker-compose -f docker-compose.aws.yml logs -f${NC}"
echo ""
echo "6. Access your application:"
echo "   Frontend:       ${GREEN}http://$EC2_PUBLIC_IP:5173${NC}"
echo "   Backend API:    ${GREEN}http://$EC2_PUBLIC_IP:5001${NC}"
echo "   Property:       ${GREEN}http://$EC2_PUBLIC_IP:5003${NC}"
echo "   Booking:        ${GREEN}http://$EC2_PUBLIC_IP:5004${NC}"
echo "   Kafka UI:       ${GREEN}http://$EC2_PUBLIC_IP:8080${NC}"
echo ""
echo "================================================"
echo "  Troubleshooting:"
echo "================================================"
echo ""
echo "If services fail to start due to memory:"
echo "  ${YELLOW}docker-compose -f docker-compose.aws.yml down${NC}"
echo "  ${YELLOW}docker system prune -f${NC}"
echo "  Try removing kafka-ui and agent-service from compose file"
echo ""
echo "Check service health:"
echo "  ${YELLOW}docker stats${NC}"
echo ""
echo "View specific service logs:"
echo "  ${YELLOW}docker logs backend${NC}"
echo "  ${YELLOW}docker logs kafka${NC}"
echo ""
echo "================================================"
echo "  Cost Monitoring:"
echo "================================================"
echo ""
print_warning "Remember to set up AWS billing alarms!"
print_warning "Stop instance when not in use to stay within free tier"
echo ""
echo "To stop services:"
echo "  ${YELLOW}docker-compose -f docker-compose.aws.yml down${NC}"
echo ""
echo "================================================"

print_info "Deployment script completed!"
