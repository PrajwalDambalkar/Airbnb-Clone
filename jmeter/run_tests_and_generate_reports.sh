#!/bin/bash

# Complete script to run JMeter tests and generate HTML reports
# This script will:
# 1. Check if backend is running
# 2. Run performance tests
# 3. Generate HTML reports from results

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
echo -e "${BLUE}JMeter Test Execution & Report Generation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Step 1: Check Backend
echo -e "${BLUE}Step 1: Checking Backend API...${NC}"
BACKEND_PORT=""
if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
    BACKEND_PORT=5000
    echo -e "${GREEN}✓ Backend is running on port 5000${NC}"
elif curl -s -f http://localhost:5001/api/health > /dev/null 2>&1; then
    BACKEND_PORT=5001
    echo -e "${GREEN}✓ Backend is running on port 5001${NC}"
    echo -e "${YELLOW}⚠ Updating JMeter test plan to use port 5001${NC}"
    # Update test plan to use port 5001
    sed -i.bak 's|http://localhost:5000|http://localhost:5001|g' JMeter_Airbnb_Performance_Test.jmx
    rm -f JMeter_Airbnb_Performance_Test.jmx.bak
else
    echo -e "${RED}✗ Backend is NOT running on port 5000 or 5001${NC}"
    echo ""
    echo "Please start the backend service:"
    echo "  Option 1 (Docker): cd .. && docker-compose up -d backend"
    echo "  Option 2 (Local): cd ../apps/backend && npm start"
    echo ""
    exit 1
fi
echo ""

# Step 2: Check JMeter
echo -e "${BLUE}Step 2: Checking JMeter...${NC}"
if ! command -v jmeter &> /dev/null; then
    echo -e "${RED}✗ JMeter is not installed or not in PATH${NC}"
    exit 1
fi
echo -e "${GREEN}✓ JMeter is installed${NC}"
echo ""

# Step 3: Clean old results
echo -e "${BLUE}Step 3: Cleaning old test results...${NC}"
rm -f results/test_results_*_users.jtl
rm -rf reports/report_*_users
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Step 4: Run tests
echo -e "${BLUE}Step 4: Running Performance Tests...${NC}"
echo "This will test with 100, 200, 300, 400, and 500 concurrent users"
echo "This may take several minutes..."
echo ""

CONCURRENT_USERS=(100 200 300 400 500)
RAMP_UP=60
LOOP_COUNT=1
TEST_PLAN="JMeter_Airbnb_Performance_Test.jmx"

# Get last element for comparison (compatible with all bash versions)
LAST_USER_COUNT=${CONCURRENT_USERS[${#CONCURRENT_USERS[@]}-1]}

for users in "${CONCURRENT_USERS[@]}"; do
    echo -e "${BLUE}----------------------------------------${NC}"
    echo -e "${BLUE}Testing with ${users} concurrent users${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"
    
    RESULT_FILE="results/test_results_${users}_users.jtl"
    REPORT_DIR="reports/report_${users}_users"
    
    # Run JMeter test
    jmeter -n \
        -t "$TEST_PLAN" \
        -l "$RESULT_FILE" \
        -JTHREADS=$users \
        -JRAMP_UP=$RAMP_UP \
        -JLOOP_COUNT=$LOOP_COUNT \
        -JBASE_URL=http://localhost:${BACKEND_PORT} \
        -JDOMAIN=localhost \
        -JPORT=${BACKEND_PORT} \
        2>&1 | grep -E "summary|in |Error" | tail -1 || true
    
    # Check if test generated data
    LINE_COUNT=$(wc -l < "$RESULT_FILE" 2>/dev/null || echo "0")
    if [ "$LINE_COUNT" -gt 1 ]; then
        echo -e "${GREEN}✓ Test completed (${LINE_COUNT} lines of data)${NC}"
        
        # Generate HTML report
        echo "  Generating HTML report..."
        jmeter -g "$RESULT_FILE" -o "$REPORT_DIR" 2>/dev/null
        
        if [ -f "$REPORT_DIR/index.html" ]; then
            echo -e "${GREEN}✓ Report generated: $REPORT_DIR/index.html${NC}"
        else
            echo -e "${YELLOW}⚠ Report generation failed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Test completed but no data recorded${NC}"
        echo "  This usually means the backend API is not responding correctly"
    fi
    
    echo ""
    
    # Wait between tests
    if [ "$users" != "$LAST_USER_COUNT" ]; then
        echo "Waiting 10 seconds before next test..."
        sleep 10
    fi
done

# Step 5: Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Execution Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Count successful reports
REPORT_COUNT=$(find reports -name "index.html" 2>/dev/null | wc -l | tr -d ' ')

if [ "$REPORT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Generated ${REPORT_COUNT} HTML report(s)${NC}"
    echo ""
    echo "HTML Reports are available at:"
    find reports -name "index.html" 2>/dev/null | while read report; do
        echo "  - $report"
    done
    echo ""
    echo "To view a report:"
    echo "  open reports/report_100_users/index.html  # macOS"
    echo "  xdg-open reports/report_100_users/index.html  # Linux"
else
    echo -e "${YELLOW}⚠ No reports were generated${NC}"
    echo "  This means the tests didn't generate any data."
    echo "  Check that:"
    echo "    1. Backend API is running and responding"
    echo "    2. Test users exist in the database"
    echo "    3. Property IDs in properties.csv are valid"
fi

echo ""
echo "JTL result files are in: results/"

