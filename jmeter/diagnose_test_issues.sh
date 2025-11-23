#!/bin/bash

# Diagnostic script to identify why JMeter tests aren't generating data

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JMeter Test Diagnostics${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check 1: Backend API
echo -e "${BLUE}1. Checking Backend API...${NC}"
if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is responding on port 5000${NC}"
    BACKEND_STATUS=$(curl -s http://localhost:5000/api/health | head -1)
    echo "  Response: $BACKEND_STATUS"
else
    echo -e "${RED}✗ Backend API is NOT responding on port 5000${NC}"
    echo "  Please start your backend service:"
    echo "    cd apps/backend && npm start"
fi
echo ""

# Check 2: CSV Files
echo -e "${BLUE}2. Checking CSV Test Data Files...${NC}"
CSV_FILES=("traveler_users.csv" "owner_users.csv" "properties.csv")
for csv in "${CSV_FILES[@]}"; do
    if [ -f "$csv" ]; then
        LINE_COUNT=$(wc -l < "$csv")
        echo -e "${GREEN}✓ $csv exists (${LINE_COUNT} lines)${NC}"
        if [ "$LINE_COUNT" -lt 2 ]; then
            echo -e "  ${YELLOW}⚠ Warning: File has less than 2 lines (needs header + data)${NC}"
        fi
    else
        echo -e "${RED}✗ $csv NOT FOUND${NC}"
    fi
done
echo ""

# Check 3: JTL Files Status
echo -e "${BLUE}3. Checking Existing Test Results...${NC}"
JTL_FILES=$(find results -name "test_results_*_users.jtl" -type f 2>/dev/null | sort)
if [ -z "$JTL_FILES" ]; then
    echo -e "${YELLOW}⚠ No JTL files found${NC}"
else
    for jtl in $JTL_FILES; do
        LINE_COUNT=$(wc -l < "$jtl" 2>/dev/null || echo "0")
        if [ "$LINE_COUNT" -le 1 ]; then
            echo -e "${YELLOW}⚠ $(basename $jtl): Empty (only header, ${LINE_COUNT} lines)${NC}"
        else
            echo -e "${GREEN}✓ $(basename $jtl): Has data (${LINE_COUNT} lines)${NC}"
        fi
    done
fi
echo ""

# Check 4: Test Plan File
echo -e "${BLUE}4. Checking Test Plan...${NC}"
if [ -f "JMeter_Airbnb_Performance_Test.jmx" ]; then
    echo -e "${GREEN}✓ Test plan file exists${NC}"
    # Check if thread groups are configured
    THREAD_COUNT=$(grep -c "ThreadGroup.num_threads" JMeter_Airbnb_Performance_Test.jmx || echo "0")
    echo "  Found $THREAD_COUNT thread group(s)"
else
    echo -e "${RED}✗ Test plan file NOT FOUND${NC}"
fi
echo ""

# Check 5: JMeter Installation
echo -e "${BLUE}5. Checking JMeter Installation...${NC}"
if command -v jmeter &> /dev/null; then
    JMETER_VERSION=$(jmeter -v 2>&1 | head -1)
    echo -e "${GREEN}✓ JMeter is installed${NC}"
    echo "  $JMETER_VERSION"
else
    echo -e "${RED}✗ JMeter is NOT installed or not in PATH${NC}"
fi
echo ""

# Check 6: Test User Accounts
echo -e "${BLUE}6. Checking Test User Accounts...${NC}"
if [ -f "traveler_users.csv" ]; then
    FIRST_EMAIL=$(tail -n +2 traveler_users.csv | head -1 | cut -d',' -f1)
    if [ -n "$FIRST_EMAIL" ]; then
        echo "  Sample traveler email: $FIRST_EMAIL"
        echo -e "${YELLOW}⚠ Ensure this user exists in your database${NC}"
    fi
fi
if [ -f "owner_users.csv" ]; then
    FIRST_EMAIL=$(tail -n +2 owner_users.csv | head -1 | cut -d',' -f1)
    if [ -n "$FIRST_EMAIL" ]; then
        echo "  Sample owner email: $FIRST_EMAIL"
        echo -e "${YELLOW}⚠ Ensure this user exists in your database${NC}"
    fi
fi
echo ""

# Summary and Recommendations
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Diagnostics Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Common Issues and Solutions:${NC}"
echo ""
echo "1. If Backend API is not responding:"
echo "   - Start the backend: cd apps/backend && npm start"
echo "   - Verify it's running on port 5000"
echo ""
echo "2. If JTL files are empty (only headers):"
echo "   - Tests are completing but not executing requests"
echo "   - Check thread count calculation in test plan"
echo "   - Verify CSV files are readable"
echo "   - Ensure test users exist in database"
echo ""
echo "3. If reports folder is empty:"
echo "   - Reports can only be generated from JTL files with data"
echo "   - Run: ./generate_reports_from_jtl.sh (after tests have data)"
echo ""
echo "4. To generate reports manually:"
echo "   jmeter -g results/test_results_100_users.jtl -o reports/report_100_users"

