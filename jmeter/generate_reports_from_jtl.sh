#!/bin/bash

# Script to generate HTML reports from existing JTL files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Generate HTML Reports from JTL Files${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo -e "${YELLOW}Error: JMeter is not installed or not in PATH${NC}"
    exit 1
fi

# Create reports directory
mkdir -p reports

# Find all JTL files in results directory
JTL_FILES=$(find results -name "test_results_*_users.jtl" -type f 2>/dev/null | sort)

if [ -z "$JTL_FILES" ]; then
    echo -e "${YELLOW}No JTL files found in results/ directory${NC}"
    exit 1
fi

echo "Found JTL files:"
echo "$JTL_FILES"
echo ""

# Generate reports for each JTL file
for JTL_FILE in $JTL_FILES; do
    # Extract user count from filename (e.g., test_results_100_users.jtl -> 100)
    USER_COUNT=$(echo "$JTL_FILE" | sed -n 's/.*test_results_\([0-9]*\)_users\.jtl/\1/p')
    
    if [ -z "$USER_COUNT" ]; then
        echo -e "${YELLOW}Skipping $JTL_FILE (could not extract user count)${NC}"
        continue
    fi
    
    # Check if JTL file has data (more than just header)
    LINE_COUNT=$(wc -l < "$JTL_FILE" 2>/dev/null || echo "0")
    
    if [ "$LINE_COUNT" -le 1 ]; then
        echo -e "${YELLOW}⚠ Skipping $JTL_FILE (no data, only $LINE_COUNT lines)${NC}"
        continue
    fi
    
    REPORT_DIR="reports/report_${USER_COUNT}_users"
    
    echo -e "${BLUE}Generating report for ${USER_COUNT} users...${NC}"
    echo "  JTL File: $JTL_FILE ($LINE_COUNT lines)"
    echo "  Report Dir: $REPORT_DIR"
    
    # Remove existing report directory
    if [ -d "$REPORT_DIR" ]; then
        rm -rf "$REPORT_DIR"
    fi
    
    # Generate HTML report
    jmeter -g "$JTL_FILE" -o "$REPORT_DIR" 2>/dev/null
    
    if [ -f "$REPORT_DIR/index.html" ]; then
        echo -e "${GREEN}✓ Report generated: $REPORT_DIR/index.html${NC}"
    else
        echo -e "${YELLOW}✗ Report generation failed${NC}"
    fi
    
    echo ""
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Report generation complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "HTML reports are available in:"
echo "  $SCRIPT_DIR/reports/"
echo ""
echo "To view a report, open:"
echo "  open reports/report_<users>_users/index.html  # macOS"
echo "  xdg-open reports/report_<users>_users/index.html  # Linux"

