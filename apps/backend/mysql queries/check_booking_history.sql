-- ==========================================
-- CHECK BOOKING HISTORY
-- Quick queries to view booking data
-- ==========================================

USE airbnb_db;

-- ==========================================
-- 1. ALL BOOKINGS OVERVIEW
-- ==========================================
SELECT 
    '========================================' as '';
SELECT 'ALL BOOKINGS OVERVIEW' as '';
SELECT '========================================' as '';

SELECT 
    b.id,
    b.status,
    b.party_type,
    DATE_FORMAT(b.check_in, '%Y-%m-%d') as check_in,
    DATE_FORMAT(b.check_out, '%Y-%m-%d') as check_out,
    DATEDIFF(b.check_out, b.check_in) as nights,
    b.number_of_guests as guests,
    CONCAT('$', FORMAT(b.total_price, 2)) as price,
    t.name as traveler,
    t.email as traveler_email,
    p.property_name,
    p.city,
    o.name as owner,
    DATE_FORMAT(b.created_at, '%b %d, %Y') as booking_date
FROM bookings b
JOIN users t ON b.traveler_id = t.id
JOIN properties p ON b.property_id = p.id
JOIN users o ON b.owner_id = o.id
ORDER BY b.created_at DESC;

-- ==========================================
-- 2. BOOKINGS BY STATUS
-- ==========================================
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'BOOKINGS BY STATUS' as '';
SELECT '========================================' as '';

SELECT 
    status,
    COUNT(*) as total_count,
    CONCAT('$', FORMAT(SUM(total_price), 2)) as total_value,
    CONCAT('$', FORMAT(AVG(total_price), 2)) as avg_value
FROM bookings
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'PENDING' THEN 1
        WHEN 'ACCEPTED' THEN 2
        WHEN 'CANCELLED' THEN 3
    END;

-- ==========================================
-- 3. BOOKINGS BY TIME PERIOD
-- ==========================================
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'BOOKINGS BY TIME PERIOD' as '';
SELECT '========================================' as '';

SELECT 
    CASE 
        WHEN check_in < CURDATE() THEN 'Past'
        WHEN check_in = CURDATE() THEN 'Today'
        WHEN check_in <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'This Week'
        WHEN check_in <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'This Month'
        ELSE 'Future'
    END as time_period,
    COUNT(*) as count,
    GROUP_CONCAT(DISTINCT status ORDER BY status) as statuses
FROM bookings
GROUP BY time_period
ORDER BY 
    CASE time_period
        WHEN 'Past' THEN 1
        WHEN 'Today' THEN 2
        WHEN 'This Week' THEN 3
        WHEN 'This Month' THEN 4
        WHEN 'Future' THEN 5
    END;

-- ==========================================
-- 4. TRAVELER STATISTICS
-- ==========================================
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'TRAVELER BOOKING STATISTICS' as '';
SELECT '========================================' as '';

SELECT 
    t.id,
    t.name,
    t.email,
    t.city,
    t.state,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
    CONCAT('$', FORMAT(SUM(CASE WHEN b.status = 'ACCEPTED' THEN b.total_price ELSE 0 END), 2)) as total_spent
FROM users t
LEFT JOIN bookings b ON t.id = b.traveler_id
WHERE t.role = 'traveler'
GROUP BY t.id, t.name, t.email, t.city, t.state
ORDER BY total_bookings DESC;

-- ==========================================
-- 5. OWNER STATISTICS
-- ==========================================
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'OWNER BOOKING STATISTICS' as '';
SELECT '========================================' as '';

SELECT 
    o.id,
    o.name,
    o.email,
    o.city,
    o.state,
    COUNT(DISTINCT p.id) as properties_count,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pending_requests,
    SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
    CONCAT('$', FORMAT(SUM(CASE WHEN b.status = 'ACCEPTED' THEN b.total_price ELSE 0 END), 2)) as total_revenue
FROM users o
LEFT JOIN properties p ON o.id = p.owner_id
LEFT JOIN bookings b ON o.id = b.owner_id
WHERE o.role = 'owner'
GROUP BY o.id, o.name, o.email, o.city, o.state
ORDER BY total_revenue DESC;

-- ==========================================
-- 6. PROPERTY PERFORMANCE
-- ==========================================
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'PROPERTY BOOKING PERFORMANCE' as '';
SELECT '========================================' as '';

SELECT 
    p.id,
    p.property_name,
    p.city,
    p.state,
    CONCAT('$', FORMAT(p.price_per_night, 2)) as price_per_night,
    o.name as owner,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
    CONCAT('$', FORMAT(SUM(CASE WHEN b.status = 'ACCEPTED' THEN b.total_price ELSE 0 END), 2)) as total_revenue
FROM properties p
LEFT JOIN bookings b ON p.id = b.property_id
LEFT JOIN users o ON p.owner_id = o.id
GROUP BY p.id, p.property_name, p.city, p.state, p.price_per_night, o.name
ORDER BY total_bookings DESC;

-- ==========================================
-- 7. UPCOMING BOOKINGS (Next 30 Days)
-- ==========================================
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'UPCOMING BOOKINGS (Next 30 Days)' as '';
SELECT '========================================' as '';

SELECT 
    b.id,
    b.status,
    DATE_FORMAT(b.check_in, '%Y-%m-%d') as check_in,
    DATE_FORMAT(b.check_out, '%Y-%m-%d') as check_out,
    DATEDIFF(b.check_in, CURDATE()) as days_away,
    t.name as traveler,
    p.property_name,
    p.city,
    o.name as owner,
    CONCAT('$', FORMAT(b.total_price, 2)) as price
FROM bookings b
JOIN users t ON b.traveler_id = t.id
JOIN properties p ON b.property_id = p.id
JOIN users o ON b.owner_id = o.id
WHERE b.check_in >= CURDATE() 
  AND b.check_in <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND b.status IN ('PENDING', 'ACCEPTED')
ORDER BY b.check_in ASC;

-- ==========================================
-- 8. PENDING BOOKINGS REQUIRING ACTION
-- ==========================================
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'PENDING BOOKINGS REQUIRING OWNER ACTION' as '';
SELECT '========================================' as '';

SELECT 
    b.id,
    DATE_FORMAT(b.check_in, '%Y-%m-%d') as check_in,
    DATE_FORMAT(b.check_out, '%Y-%m-%d') as check_out,
    DATEDIFF(b.check_in, CURDATE()) as days_until_checkin,
    t.name as traveler,
    t.email as traveler_email,
    t.phone_number as traveler_phone,
    p.property_name,
    p.city,
    o.name as owner,
    b.number_of_guests as guests,
    CONCAT('$', FORMAT(b.total_price, 2)) as price,
    DATE_FORMAT(b.created_at, '%b %d, %Y %H:%i') as requested_on
FROM bookings b
JOIN users t ON b.traveler_id = t.id
JOIN properties p ON b.property_id = p.id
JOIN users o ON b.owner_id = o.id
WHERE b.status = 'PENDING'
ORDER BY b.check_in ASC;

-- ==========================================
-- 9. RECENT BOOKING ACTIVITY (Last 10)
-- ==========================================
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'RECENT BOOKING ACTIVITY (Last 10)' as '';
SELECT '========================================' as '';

SELECT 
    b.id,
    b.status,
    DATE_FORMAT(b.check_in, '%Y-%m-%d') as check_in,
    t.name as traveler,
    p.property_name,
    o.name as owner,
    CONCAT('$', FORMAT(b.total_price, 2)) as price,
    DATE_FORMAT(b.created_at, '%b %d, %Y %H:%i') as booking_time
FROM bookings b
JOIN users t ON b.traveler_id = t.id
JOIN properties p ON b.property_id = p.id
JOIN users o ON b.owner_id = o.id
ORDER BY b.created_at DESC
LIMIT 10;

-- ==========================================
-- 10. SUMMARY STATISTICS
-- ==========================================
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'OVERALL STATISTICS' as '';
SELECT '========================================' as '';

SELECT 
    COUNT(*) as total_bookings,
    COUNT(DISTINCT traveler_id) as unique_travelers,
    COUNT(DISTINCT property_id) as booked_properties,
    COUNT(DISTINCT owner_id) as owners_with_bookings,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
    CONCAT('$', FORMAT(SUM(CASE WHEN status = 'ACCEPTED' THEN total_price ELSE 0 END), 2)) as total_revenue,
    CONCAT('$', FORMAT(AVG(total_price), 2)) as avg_booking_value,
    ROUND(AVG(number_of_guests), 1) as avg_guests,
    ROUND(AVG(DATEDIFF(check_out, check_in)), 1) as avg_nights
FROM bookings;

SELECT '' as '';
SELECT '✅ Booking history check complete!' as '';

