#!/bin/bash

# Run JMeter Performance Tests for Microservices Architecture
# Tests with 100, 200, 300, 400, and 500 concurrent users

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
echo -e "${BLUE}JMeter Microservices Performance Tests${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check JMeter
if ! command -v jmeter &> /dev/null; then
    echo -e "${RED}✗ JMeter is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ JMeter is installed${NC}"

# Clean old results
echo -e "${BLUE}Cleaning old results...${NC}"
rm -f results/microservices_test_*.jtl
rm -rf reports/microservices_report_*
mkdir -p results reports
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Test configuration
CONCURRENT_USERS=(100 200 300 400 500)
RAMP_UP=60
LOOP_COUNT=1
TEST_PLAN="JMeter_Airbnb_Microservices_Test.jmx"
LAST_USER_COUNT=500

echo -e "${BLUE}Running tests for: ${CONCURRENT_USERS[@]} concurrent users${NC}"
echo -e "${BLUE}Ramp-up time: ${RAMP_UP} seconds${NC}"
echo -e "${BLUE}Loop count: ${LOOP_COUNT}${NC}"
echo ""

# Run tests for each concurrency level
for users in "${CONCURRENT_USERS[@]}"; do
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Testing with ${users} concurrent users${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    RESULT_FILE="results/microservices_test_${users}_users.jtl"
    REPORT_DIR="reports/microservices_report_${users}_users"
    
    # Run JMeter test
    echo "Running JMeter test..."
    jmeter -n \
        -t "$TEST_PLAN" \
        -l "$RESULT_FILE" \
        -e -o "$REPORT_DIR" \
        -JTHREADS=$users \
        -JRAMP_UP=$RAMP_UP \
        -JLOOP_COUNT=$LOOP_COUNT \
        2>&1 | grep -E "summary|Err:" || true
    
    # Check results
    if [ -f "$RESULT_FILE" ]; then
        LINE_COUNT=$(wc -l < "$RESULT_FILE" 2>/dev/null || echo "0")
        if [ "$LINE_COUNT" -gt 1 ]; then
            echo -e "${GREEN}✓ Test completed successfully (${LINE_COUNT} samples)${NC}"
            
            if [ -f "$REPORT_DIR/index.html" ]; then
                echo -e "${GREEN}✓ HTML report generated: $REPORT_DIR/index.html${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ Test completed but no data recorded${NC}"
        fi
    else
        echo -e "${RED}✗ Test failed - no result file generated${NC}"
    fi
    
    echo ""
    
    # Wait between tests (except after the last one)
    if [ "$users" != "$LAST_USER_COUNT" ]; then
        echo "Waiting 15 seconds before next test..."
        sleep 15
    fi
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All Tests Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Summary
echo "Results Summary:"
echo "----------------"
for users in "${CONCURRENT_USERS[@]}"; do
    RESULT_FILE="results/microservices_test_${users}_users.jtl"
    if [ -f "$RESULT_FILE" ]; then
        LINE_COUNT=$(wc -l < "$RESULT_FILE" 2>/dev/null || echo "0")
        if [ "$LINE_COUNT" -gt 1 ]; then
            echo -e "${GREEN}✓${NC} ${users} users: $((LINE_COUNT - 1)) samples recorded"
        else
            echo -e "${YELLOW}⚠${NC} ${users} users: No data"
        fi
    else
        echo -e "${RED}✗${NC} ${users} users: Test failed"
    fi
done

echo ""
echo "HTML Reports:"
find reports/microservices_report_* -name "index.html" 2>/dev/null | while read report; do
    echo "  - $report"
done

echo ""
echo -e "${BLUE}To view a report:${NC}"
echo "  open reports/microservices_report_100_users/index.html"
