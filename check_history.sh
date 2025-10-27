#!/bin/bash

# Quick check for history bookings

echo "🔍 Checking booking history..."
echo ""

read -p "MySQL username (default: root): " DB_USER
DB_USER=${DB_USER:-root}
read -sp "MySQL password: " DB_PASS
echo ""
echo ""

mysql -u"$DB_USER" -p"$DB_PASS" airbnb_db -e "
SELECT 
    '=== ALL BOOKINGS ===' as '';
SELECT 
    status,
    COUNT(*) as count,
    MIN(check_out) as earliest_checkout,
    MAX(check_out) as latest_checkout
FROM bookings
GROUP BY status;

SELECT '' as '';
SELECT '=== PAST BOOKINGS (for History) ===' as '';
SELECT 
    COUNT(*) as past_completed_bookings
FROM bookings
WHERE check_out < CURDATE() 
  AND status = 'ACCEPTED';

SELECT '' as '';
SELECT '=== Sample Past Bookings ===' as '';
SELECT 
    id,
    status,
    check_in,
    check_out,
    DATEDIFF(CURDATE(), check_out) as days_ago
FROM bookings
WHERE check_out < CURDATE()
ORDER BY check_out DESC
LIMIT 5;

SELECT '' as '';
SELECT 'Current Date:' as '', CURDATE() as today;
"


