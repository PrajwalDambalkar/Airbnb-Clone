#!/bin/bash

# ==================================================
# Complete Booking Demo Setup
# ==================================================

echo "╔════════════════════════════════════════════════╗"
echo "║   📋 Airbnb Clone - Booking Demo Setup        ║"
echo "╔════════════════════════════════════════════════╗"
echo ""

DB_NAME="airbnb_db"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL not found. Please install MySQL first."
    exit 1
fi

# Get credentials
echo "🔐 MySQL Login"
read -p "Username (default: root): " DB_USER
DB_USER=${DB_USER:-root}
read -sp "Password: " DB_PASS
echo ""
echo ""

# Test connection
echo "🔌 Testing connection..."
mysql -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to database. Check credentials!"
    exit 1
fi

echo "✅ Connected to database!"
echo ""

# Check current bookings
CURRENT_COUNT=$(mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "SELECT COUNT(*) FROM bookings;")

echo "════════════════════════════════════════════════"
echo "📊 Current Status"
echo "════════════════════════════════════════════════"
echo "Bookings in database: $CURRENT_COUNT"
echo ""

if [ "$CURRENT_COUNT" -ge 30 ]; then
    echo "✅ Dummy data already exists!"
    echo ""
    read -p "Do you want to view the data? (y/n): " VIEW_DATA
    
    if [[ "$VIEW_DATA" =~ ^[Yy]$ ]]; then
        ./view_booking_history.sh
        exit 0
    fi
else
    echo "📥 Inserting dummy booking data..."
    echo ""
    
    mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "apps/backend/mysql queries/insert_dummy_bookings.sql"
    
    if [ $? -eq 0 ]; then
        NEW_COUNT=$(mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -se "SELECT COUNT(*) FROM bookings;")
        
        echo ""
        echo "════════════════════════════════════════════════"
        echo "✅ Success! Dummy Data Inserted"
        echo "════════════════════════════════════════════════"
        echo "Total bookings: $NEW_COUNT"
        echo ""
        
        # Show summary
        mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
        SELECT 
            'Status Breakdown:' as '';
        SELECT 
            status,
            COUNT(*) as count
        FROM bookings
        GROUP BY status;
        "
        
        echo ""
        echo "════════════════════════════════════════════════"
        echo "🎉 Setup Complete!"
        echo "════════════════════════════════════════════════"
        echo ""
        echo "📋 How to View Bookings:"
        echo ""
        echo "1️⃣  For Travelers (My Bookings):"
        echo "    Login: traveler@test.com"
        echo "    Password: password123"
        echo "    Then go to 'My Bookings' page"
        echo ""
        echo "2️⃣  For Owners (Owner Bookings):"
        echo "    Login: owner@test.com"
        echo "    Password: password123"
        echo "    Then go to 'Owner Bookings' page"
        echo ""
        echo "3️⃣  View in Terminal:"
        echo "    ./view_booking_history.sh"
        echo ""
        echo "════════════════════════════════════════════════"
    else
        echo "❌ Failed to insert data"
        exit 1
    fi
fi

