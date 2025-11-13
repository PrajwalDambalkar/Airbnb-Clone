#!/bin/bash

# ==================================================
# View Booking History Script
# ==================================================

echo "=========================================="
echo "📋 Airbnb Clone - View Booking History"
echo "=========================================="
echo ""

# Set the database name
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

# View booking history
echo "=========================================="
echo "📊 Loading Booking History..."
echo "=========================================="
echo ""

mysql -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$QUERIES_DIR/check_booking_history.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Booking history loaded successfully!"
    echo "=========================================="
    echo ""
else
    echo ""
    echo "❌ Failed to load booking history"
    exit 1
fi

