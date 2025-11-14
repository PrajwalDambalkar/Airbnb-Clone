#!/bin/bash

# ==================================================
# Insert Dummy Booking Data Script
# ==================================================

echo "=========================================="
echo "📋 Airbnb Clone - Insert Dummy Bookings"
echo "=========================================="
echo ""

# Set the database name
DB_NAME="airbnb_db"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed or not in PATH"
    exit 1
fi

echo "🔍 Checking database connection..."
echo ""

# Prompt for MySQL credentials
read -p "Enter MySQL username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "Enter MySQL password: " DB_PASS
echo ""
echo ""

# Test connection
mysql -u"$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
    echo ""
else
    echo "❌ Failed to connect to database. Please check your credentials."
    exit 1
fi

# Navigate to the mysql queries directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
QUERIES_DIR="$SCRIPT_DIR/apps/backend/mysql queries"

echo "📁 SQL Files Location: $QUERIES_DIR"
echo ""

# Insert dummy data
echo "=========================================="
echo "📝 Inserting Dummy Booking Data..."
echo "=========================================="
echo ""

mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$QUERIES_DIR/insert_dummy_bookings.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Dummy booking data inserted successfully!"
    echo "=========================================="
    echo ""
    
    # Show quick summary
    echo "📊 Quick Summary:"
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
    echo "🎉 Setup Complete!"
    echo "=========================================="
    echo ""
    echo "📖 Next Steps:"
    echo "   1. View detailed booking history:"
    echo "      ./view_booking_history.sh"
    echo ""
    echo "   2. Or use MySQL directly:"
    echo "      mysql -u$DB_USER -p $DB_NAME < 'apps/backend/mysql queries/check_booking_history.sql'"
    echo ""
    echo "   3. Test with these accounts:"
    echo "      - traveler@test.com (password: password123)"
    echo "      - owner@test.com (password: password123)"
    echo ""
else
    echo ""
    echo "❌ Failed to insert dummy data"
    exit 1
fi

