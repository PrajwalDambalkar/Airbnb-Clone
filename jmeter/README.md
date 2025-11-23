# JMeter Performance Testing for Airbnb Clone

This directory contains the JMeter test plan and scripts for performance testing the Airbnb Clone application.

## Files

- **JMeter_Airbnb_Performance_Test.jmx** - JMeter test plan for performance testing
- **traveler_users.csv** - Test data for traveler accounts
- **owner_users.csv** - Test data for owner accounts
- **properties.csv** - Property IDs for testing (⚠️ **IMPORTANT**: Update with real property IDs from your database)
- **run_performance_tests.sh** - Script to run tests for all concurrency levels
- **generate_report.sh** - Script to generate performance report
- **results/** - Directory for test result files (.jtl)
- **reports/** - Directory for HTML reports

## Prerequisites

1. **Apache JMeter** installed and in PATH
   ```bash
   # Check if JMeter is installed
   jmeter -v
   ```

2. **Backend API running** on `http://localhost:5000`
   ```bash
   # Start the backend service
   cd apps/backend
   npm start
   ```

3. **Test user accounts created** in the database
   - The CSV files contain test credentials that must exist in your database
   - Create these users before running tests

4. **Property IDs** in `properties.csv`
   - ⚠️ **CRITICAL**: Replace placeholder property IDs with real MongoDB ObjectIds from your database
   - You can query your database to get property IDs:
     ```javascript
     // In MongoDB shell or Node.js
     db.properties.find({}, {_id: 1}).limit(10)
     ```

## Quick Start

### 1. Update Property IDs

Before running tests, update `properties.csv` with real property IDs from your database:

```bash
# Example: Get property IDs from MongoDB
# Replace the placeholder IDs in properties.csv with actual IDs
```

### 2. Ensure Test Users Exist

Make sure the test users in `traveler_users.csv` and `owner_users.csv` exist in your database. You can create them using the signup API or database seeding scripts.

### 3. Run Performance Tests

Run tests for all concurrency levels (100, 200, 300, 400, 500 users):

```bash
cd /Users/spartan/finaldemo/Airbnb-Clone/jmeter
./run_performance_tests.sh
```

This will:
- Run tests for each concurrency level
- Generate JTL result files in `results/` directory
- Generate HTML reports in `reports/` directory
- Wait 10 seconds between tests to avoid overwhelming the server

### 4. Generate Report

After tests complete, generate the performance report:

```bash
./generate_report.sh
```

This creates `PERFORMANCE_TEST_REPORT.md` with a summary. You'll need to:
- Extract detailed metrics from HTML reports
- Add screenshots of JMeter graphs
- Complete the analysis sections

## Manual Test Execution

To run a single test manually:

```bash
# Test with 100 concurrent users
jmeter -n \
  -t JMeter_Airbnb_Performance_Test.jmx \
  -l results/test_results_100.jtl \
  -e -o reports/report_100 \
  -JTHREADS=100 \
  -JRAMP_UP=60 \
  -JLOOP_COUNT=1 \
  -JBASE_URL=http://localhost:5000
```

## Test Configuration

- **Base URL**: `http://localhost:5000` (Backend API)
- **Ramp-up Time**: 60 seconds (configurable via `-JRAMP_UP`)
- **Loop Count**: 1 iteration per user (configurable via `-JLOOP_COUNT`)
- **Concurrent Users**: 100, 200, 300, 400, 500

## Test Scenarios

### Traveler Flow (70% of users)
1. Login as traveler
2. Search/get properties list
3. Get property details
4. Create a booking
5. View my bookings

### Owner Flow (30% of users)
1. Login as owner
2. Get owner bookings
3. Approve a booking
4. View booking statistics

## Viewing Results

### HTML Reports
Open the generated HTML reports in your browser:
```bash
open reports/report_100_users/index.html  # macOS
xdg-open reports/report_100_users/index.html  # Linux
```

### JTL Files
JTL files contain raw test data and can be:
- Opened in JMeter GUI
- Processed with custom scripts
- Imported into other analysis tools

## Performance Metrics

The tests measure:
- **Response Time**: Average, min, max, percentiles
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Concurrent Users**: Number of simultaneous users

## Troubleshooting

### "CSV file not found" error
- Ensure CSV files are in the same directory as the JMX file
- Check file paths in the JMX file match your directory structure

### "Connection refused" error
- Verify backend API is running on port 5000
- Check firewall settings
- Ensure CORS is properly configured

### "Authentication failed" errors
- Verify test user credentials exist in database
- Check session management is working
- Ensure cookies are being handled correctly

### "Property not found" errors
- Update `properties.csv` with real property IDs from your database
- Ensure properties exist and are available

## Notes

- The test plan uses session-based authentication (cookies)
- Property IDs must be valid MongoDB ObjectIds
- Test users should have appropriate roles (traveler/owner)
- Consider database cleanup between test runs for consistent results

## Next Steps

1. Update `properties.csv` with real property IDs
2. Create test user accounts in the database
3. Run the performance tests
4. Analyze results and identify bottlenecks
5. Generate and complete the performance report
6. Add screenshots and graphs to the report

