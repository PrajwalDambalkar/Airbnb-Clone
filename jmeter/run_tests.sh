#!/bin/bash

# JMeter Performance Tests - Simplified
set -e

cd "$(dirname "$0")"

echo "========================================="
echo "JMeter Performance Tests"
echo "========================================="
echo ""

# Clean and create directories
rm -rf results reports
mkdir -p results reports

# Test configurations
USERS=(100 200 300 400 500)
BASE_URL="http://localhost:5003"

# Run tests
for user_count in "${USERS[@]}"; do
    echo "Testing with $user_count concurrent users..."
    echo "-----------------------------------------"
    
    # Run test
    jmeter -n \
        -t Simple_Performance_Test.jmx \
        -l "results/test_${user_count}.jtl" \
        -JTHREADS=$user_count \
        -JRAMP_UP=60 \
        -JLOOP_COUNT=1 \
        -JBASE_URL=$BASE_URL \
        2>&1 | grep -E "summary"
    
    echo "✓ Test completed"
    echo ""
    
    # Wait between tests
    if [ "$user_count" != "500" ]; then
        echo "Waiting 10 seconds..."
        sleep 10
    fi
done

echo ""
echo "========================================="
echo "Generating HTML Reports..."
echo "========================================="

# Generate reports
for user_count in "${USERS[@]}"; do
    echo "Generating report for $user_count users..."
    jmeter -g "results/test_${user_count}.jtl" \
        -o "reports/report_${user_count}_users" \
        2>&1 | grep -v "WARN" || true
done

echo ""
echo "========================================="
echo "All Tests Complete!"
echo "========================================="
echo ""
echo "View reports:"
for user_count in "${USERS[@]}"; do
    echo "  open reports/report_${user_count}_users/index.html"
done
