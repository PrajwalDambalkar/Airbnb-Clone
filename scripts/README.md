# Scripts Directory

This directory contains helper scripts for deploying and managing the Airbnb Clone application.

## Available Scripts

### 1. `deploy-aws.sh` - AWS EC2 Automated Deployment

**Purpose:** Automates the entire EC2 setup process including Docker installation, project cloning, and configuration.

**Usage:**
```bash
# On EC2 instance after SSH
curl -o deploy.sh https://raw.githubusercontent.com/PrajwalDambalkar/Airbnb-Clone/feature/Jmeter/scripts/deploy-aws.sh
chmod +x deploy.sh
./deploy.sh
```

**What it does:**
- Updates system packages
- Installs Docker and Docker Compose
- Installs Git
- Detects EC2 public IP automatically
- Clones the repository
- Creates environment configuration
- Updates docker-compose.aws.yml with actual IP

**Time:** ~5-10 minutes

---

### 2. `screenshot-helper.sh` - Screenshot Capture Guide

**Purpose:** Provides a guided walkthrough for capturing all required screenshots for your report.

**Usage:**
```bash
# On EC2 instance, in project directory
./scripts/screenshot-helper.sh
```

**What it covers:**
- AWS Console screenshots (5)
- Docker & Services screenshots (6)
- Kafka screenshots (4)
- Redux screenshots (4)
- System architecture screenshots
- Testing & performance screenshots

**Time:** ~30 minutes

---

### 3. `verify_fix.sh` - Service Verification

**Purpose:** Verifies that all services are running correctly.

**Usage:**
```bash
./verify_fix.sh
```

**What it checks:**
- Service health endpoints
- Database connectivity
- Kafka topics
- Container status

---

## Quick Start

### For AWS Deployment

1. **Launch EC2 instance** (t2.micro, Amazon Linux 2023)

2. **SSH to EC2:**
   ```bash
   ssh -i your-key.pem ec2-user@<EC2-IP>
   ```

3. **Run deployment script:**
   ```bash
   curl -o deploy.sh https://raw.githubusercontent.com/PrajwalDambalkar/Airbnb-Clone/feature/Jmeter/scripts/deploy-aws.sh
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Logout and login again** (for Docker group changes)

5. **Start services:**
   ```bash
   cd Airbnb-Clone
   docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d --build
   ```

6. **Take screenshots:**
   ```bash
   ./scripts/screenshot-helper.sh
   ```

---

## Script Details

### deploy-aws.sh Features

- ✅ Automatic system detection
- ✅ Idempotent (safe to run multiple times)
- ✅ Color-coded output for clarity
- ✅ Error handling with exit on failure
- ✅ Progress indicators
- ✅ Comprehensive next-step instructions

### screenshot-helper.sh Features

- ✅ Interactive guided tour
- ✅ Section-by-section organization
- ✅ Copy-paste ready commands
- ✅ URL generation with actual IPs
- ✅ Checklist summary
- ✅ Report writing guidance

---

## Environment Variables

Scripts look for or create these files:

- **`.env.aws`** - Production environment variables (created by deploy-aws.sh)
- **`.env.aws.example`** - Template for environment variables

---

## Troubleshooting

### Deploy script fails

**Issue:** Permission denied
```bash
# Solution
chmod +x scripts/deploy-aws.sh
```

**Issue:** Docker commands don't work after installation
```bash
# Solution: Logout and login again
exit
ssh -i your-key.pem ec2-user@<EC2-IP>
```

### Screenshot helper shows wrong IP

**Issue:** Can't detect EC2 IP
```bash
# Solution: Manually get IP
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Edit the script or use the IP directly in commands
```

---

## Adding New Scripts

To add a new script:

1. Create the script file in this directory
2. Add execution permissions: `chmod +x scripts/your-script.sh`
3. Add documentation to this README
4. Test thoroughly before committing

### Script Template

```bash
#!/bin/bash

# Script Name - Brief Description
# Usage: ./your-script.sh [options]

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${NC}→ $1${NC}"; }

# Main script logic
print_info "Starting script..."

# Your code here

print_success "Script completed!"
```

---

## CI/CD Integration

These scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Deploy to AWS
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to EC2
        run: |
          ssh -i ${{ secrets.EC2_KEY }} ec2-user@${{ secrets.EC2_IP }} \
            'bash -s' < scripts/deploy-aws.sh
```

---

## Best Practices

1. **Always test locally first** before running on production
2. **Check permissions** before executing scripts
3. **Review environment variables** before deployment
4. **Monitor resource usage** during deployment
5. **Keep backups** of configuration files

---

## Support

For issues with scripts:

1. Check script output for error messages
2. Review AWS CloudWatch logs
3. Check Docker logs: `docker-compose logs`
4. Verify security group settings
5. Ensure EC2 instance has internet access

---

## License

These scripts are part of the Airbnb Clone project and follow the same license.

---

**Last Updated:** November 24, 2025
**Maintained By:** Project Team
