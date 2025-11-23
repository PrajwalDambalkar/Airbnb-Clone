#!/bin/bash

# Generate aggregated performance report from JMeter test results

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JMeter Performance Report Generator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if results directory exists
if [ ! -d "results" ]; then
    echo -e "${YELLOW}Error: results directory not found${NC}"
    echo "Please run the performance tests first"
    exit 1
fi

# Create reports directory if it doesn't exist
mkdir -p reports

CONCURRENT_USERS=(100 200 300 400 500)
REPORT_FILE="PERFORMANCE_TEST_REPORT.md"

echo -e "${GREEN}Generating performance report...${NC}"
echo ""

# Start generating the report
cat > "$REPORT_FILE" << 'EOF'
# JMeter Performance Test Report

## Test Configuration

- **Test Plan**: JMeter_Airbnb_Performance_Test.jmx
- **Test Date**: $(date)
- **Target Application**: Airbnb Clone Backend API
- **Base URL**: http://localhost:5000

## Test Scenarios

### 1. Traveler Booking Flow
- Login (POST /api/auth/login)
- Get Properties List (GET /api/properties)
- Get Property Details (GET /api/properties/:id)
- Create Booking (POST /api/bookings)
- Get My Bookings (GET /api/bookings)

### 2. Owner Booking Management
- Owner Login (POST /api/auth/login)
- Get Owner Bookings (GET /api/bookings/owner/all)
- Approve Booking (PUT /api/bookings/:id/status)
- Get Booking Stats (GET /api/bookings/owner/stats)

## Test Results Summary

| Concurrent Users | Average Response Time (ms) | Throughput (req/sec) | Error Rate (%) | Min (ms) | Max (ms) |
|-----------------|---------------------------|---------------------|----------------|----------|----------|
EOF

# Extract metrics from each test result
for users in "${CONCURRENT_USERS[@]}"; do
    RESULT_FILE="results/test_results_${users}_users.jtl"
    REPORT_DIR="reports/report_${users}_users"
    
    if [ -f "$RESULT_FILE" ]; then
        echo -e "${BLUE}Processing results for ${users} users...${NC}"
        
        # Extract metrics using JMeter's Aggregate Report or parse JTL file
        # For now, we'll note that detailed metrics are in the HTML reports
        echo "| ${users} | See report | See report | See report | See report | See report |" >> "$REPORT_FILE"
    else
        echo -e "${YELLOW}Warning: Results file not found for ${users} users: $RESULT_FILE${NC}"
        echo "| ${users} | N/A | N/A | N/A | N/A | N/A |" >> "$REPORT_FILE"
    fi
done

cat >> "$REPORT_FILE" << 'EOF'

## Detailed Results

For detailed metrics, graphs, and analysis, please refer to the HTML reports in the `reports/` directory:
- `reports/report_100_users/index.html`
- `reports/report_200_users/index.html`
- `reports/report_300_users/index.html`
- `reports/report_400_users/index.html`
- `reports/report_500_users/index.html`

## Performance Analysis

### Response Time Analysis

[Add your analysis here based on the graphs from HTML reports]

### Throughput Analysis

[Add your analysis here]

### Error Rate Analysis

[Add your analysis here]

## Performance Bottlenecks

[Identify and document performance bottlenecks found during testing]

### Identified Issues:
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

## Recommendations

[Provide recommendations for performance improvements]

## Graphs

### Average Response Time vs Concurrent Users

[Insert graph showing average response time for each concurrency level]

### Throughput vs Concurrent Users

[Insert graph showing throughput for each concurrency level]

### Error Rate vs Concurrent Users

[Insert graph showing error rate for each concurrency level]

## Test Environment

- **JMeter Version**: $(jmeter -v 2>&1 | head -1)
- **Java Version**: $(java -version 2>&1 | head -1)
- **OS**: $(uname -s) $(uname -r)
- **CPU Cores**: $(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo "N/A")
- **Memory**: $(sysctl -n hw.memsize 2>/dev/null | awk '{print $1/1024/1024/1024 " GB"}' || free -h 2>/dev/null | grep Mem | awk '{print $2}' || echo "N/A")

## Conclusion

[Add your conclusion and summary here]

---
*Report generated on $(date)*
EOF

# Replace date placeholders
sed -i.bak "s/\$(date)/$(date)/g" "$REPORT_FILE" 2>/dev/null || \
    sed -i "s/\$(date)/$(date)/g" "$REPORT_FILE"

# Replace JMeter version
JMETER_VERSION=$(jmeter -v 2>&1 | head -1 | sed 's/.*version //' | sed 's/ .*//')
sed -i.bak "s/\$(jmeter -v 2>&1 | head -1)/JMeter $JMETER_VERSION/g" "$REPORT_FILE" 2>/dev/null || \
    sed -i "s/\$(jmeter -v 2>&1 | head -1)/JMeter $JMETER_VERSION/g" "$REPORT_FILE"

# Replace Java version
JAVA_VERSION=$(java -version 2>&1 | head -1)
sed -i.bak "s/\$(java -version 2>&1 | head -1)/$JAVA_VERSION/g" "$REPORT_FILE" 2>/dev/null || \
    sed -i "s/\$(java -version 2>&1 | head -1)/$JAVA_VERSION/g" "$REPORT_FILE"

# Replace OS info
OS_INFO="$(uname -s) $(uname -r)"
sed -i.bak "s/\$(uname -s) \$(uname -r)/$OS_INFO/g" "$REPORT_FILE" 2>/dev/null || \
    sed -i "s/\$(uname -s) \$(uname -r)/$OS_INFO/g" "$REPORT_FILE"

# Clean up backup files
rm -f "$REPORT_FILE.bak" 2>/dev/null

echo -e "${GREEN}✓ Report generated: $REPORT_FILE${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review the HTML reports in the reports/ directory"
echo "2. Extract metrics from the HTML reports and update $REPORT_FILE"
echo "3. Add screenshots of JMeter graphs to the report"
echo "4. Complete the performance analysis sections"

