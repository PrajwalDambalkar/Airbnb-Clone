#!/bin/bash

# ==================================================
# Verify Bookings in Database
# ==================================================

echo "=========================================="
echo "🔍 Airbnb Clone - Verify Booking Data"
echo "=========================================="
echo ""

DB_NAME="airbnb_db"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed or not in PATH"
    exit 1
fi

# Prompt for MySQL credentials
read -p "Enter MySQL username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Enter MySQL password: " DB_PASS
echo ""
echo ""

# Test connection
mysql -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Failed to connect to database. Please check your credentials."
    exit 1
fi

echo "✅ Database connection successful!"
echo ""

# Check bookings count
echo "=========================================="
echo "📊 Current Booking Statistics"
echo "=========================================="
echo ""

mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    COUNT(*) as total_bookings,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
FROM bookings;
"

echo ""
echo "=========================================="
echo "👥 Users in Database"
echo "=========================================="
echo ""

mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT id, name, email, role 
FROM users 
ORDER BY role, id;
"

echo ""
echo "=========================================="
echo "📋 Recent Bookings (Last 10)"
echo "=========================================="
echo ""

mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    b.id,
    b.status,
    DATE_FORMAT(b.check_in, '%Y-%m-%d') as check_in,
    t.name as traveler,
    p.property_name
FROM bookings b
JOIN users t ON b.traveler_id = t.id
JOIN properties p ON b.property_id = p.id
ORDER BY b.created_at DESC
LIMIT 10;
"

echo ""
echo "=========================================="
echo "📊 Bookings by Traveler"
echo "=========================================="
echo ""

mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
SELECT 
    t.name as traveler,
    t.email,
    COUNT(b.id) as total_bookings
FROM users t
LEFT JOIN bookings b ON t.id = b.traveler_id
WHERE t.role = 'traveler'
GROUP BY t.id, t.name, t.email
ORDER BY total_bookings DESC;
"

echo ""
echo "=========================================="

# Check if no bookings exist
BOOKING_COUNT=$(mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "SELECT COUNT(*) FROM bookings;")

if [ "$BOOKING_COUNT" -eq "0" ]; then
    echo ""
    echo "⚠️  NO BOOKINGS FOUND!"
    echo ""
    echo "To insert dummy data, run:"
    echo "  ./insert_booking_data.sh"
    echo ""
elif [ "$BOOKING_COUNT" -lt "10" ]; then
    echo ""
    echo "⚠️  Only $BOOKING_COUNT bookings found (expected 30+)"
    echo ""
    echo "To insert more dummy data, run:"
    echo "  ./insert_booking_data.sh"
    echo ""
else
    echo ""
    echo "✅ Database has $BOOKING_COUNT bookings!"
    echo ""
    echo "You can now test the application with these accounts:"
    echo "  • traveler@test.com (password: password123)"
    echo "  • alice@test.com (password: password123)"
    echo "  • owner@test.com (password: password123)"
    echo ""
fi

