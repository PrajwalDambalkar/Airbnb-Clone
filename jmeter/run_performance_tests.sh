#!/bin/bash

# JMeter Performance Test Runner
# Runs tests for 100, 200, 300, 400, and 500 concurrent users

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JMeter Performance Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo -e "${YELLOW}Error: JMeter is not installed or not in PATH${NC}"
    echo "Please install JMeter or add it to your PATH"
    exit 1
fi

# Create results and reports directories
mkdir -p results
mkdir -p reports

# Test configuration
TEST_PLAN="JMeter_Airbnb_Performance_Test.jmx"
CONCURRENT_USERS=(100 200 300 400 500)
RAMP_UP=60
LOOP_COUNT=1

echo -e "${GREEN}Starting performance tests...${NC}"
echo "Test Plan: $TEST_PLAN"
echo "Ramp-up time: ${RAMP_UP}s"
echo "Loop count: $LOOP_COUNT"
echo ""

# Get the last element for comparison
LAST_USER_COUNT=${CONCURRENT_USERS[${#CONCURRENT_USERS[@]}-1]}

# Run tests for each concurrency level
for users in "${CONCURRENT_USERS[@]}"; do
    echo -e "${BLUE}----------------------------------------${NC}"
    echo -e "${BLUE}Running test with ${users} concurrent users${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"
    
    RESULT_FILE="results/test_results_${users}_users.jtl"
    REPORT_DIR="reports/report_${users}_users"
    
    # Remove existing result file if it exists (JMeter won't overwrite non-empty files)
    if [ -f "$RESULT_FILE" ]; then
        rm -f "$RESULT_FILE"
    fi
    
    # Remove existing report directory if it exists
    if [ -d "$REPORT_DIR" ]; then
        rm -rf "$REPORT_DIR"
    fi
    
    # Run JMeter test
    jmeter -n \
        -t "$TEST_PLAN" \
        -l "$RESULT_FILE" \
        -e -o "$REPORT_DIR" \
        -JTHREADS=$users \
        -JRAMP_UP=$RAMP_UP \
        -JLOOP_COUNT=$LOOP_COUNT \
        -JBASE_URL=http://localhost:5000
    
    if [ $? -eq 0 ]; then
        # Check if JTL file has data (more than just header)
        LINE_COUNT=$(wc -l < "$RESULT_FILE" 2>/dev/null || echo "0")
        if [ "$LINE_COUNT" -gt 1 ]; then
            echo -e "${GREEN}✓ Test completed for ${users} users${NC}"
            echo "  Results: $RESULT_FILE ($LINE_COUNT lines)"
            # Generate report if JTL has data
            if [ -f "$RESULT_FILE" ] && [ "$LINE_COUNT" -gt 1 ]; then
                echo "  Generating HTML report..."
                jmeter -g "$RESULT_FILE" -o "$REPORT_DIR" 2>/dev/null
                if [ -f "$REPORT_DIR/index.html" ]; then
                    echo "  Report: $REPORT_DIR/index.html"
                else
                    echo -e "  ${YELLOW}⚠ Report generation failed${NC}"
                fi
            fi
        else
            echo -e "${YELLOW}⚠ Test completed but no data recorded (${LINE_COUNT} lines)${NC}"
            echo "  This usually means the backend API is not responding or test configuration needs adjustment"
        fi
    else
        echo -e "${YELLOW}✗ Test failed for ${users} users${NC}"
    fi
    
    echo ""
    
    # Wait a bit between tests to avoid overwhelming the server
    if [ "$users" != "$LAST_USER_COUNT" ]; then
        echo "Waiting 10 seconds before next test..."
        sleep 10
    fi
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All tests completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Results are available in:"
echo "  - results/ directory (JTL files)"
echo "  - reports/ directory (HTML reports)"
echo ""
echo "To view a report, open: reports/report_<users>_users/index.html"

