-- ==========================================
-- INSERT DUMMY BOOKING DATA
-- For Travellers and Owners
-- ==========================================

USE airbnb_db;

-- First, let's add more test users if they don't exist
INSERT IGNORE INTO users (name, email, password, role, city, state, country, phone_number) VALUES
-- Travelers
('Alice Johnson', 'alice@test.com', '$2a$10$N9qo8uLOickgx2ZMRZo5i.Ul0Xr6x6rF6r1uZ5l6h0l6h0l6h0l6h0', 'traveler', 'Boston', 'MA', 'United States', '555-0201'),
('Michael Chen', 'michael@test.com', '$2a$10$N9qo8uLOickgx2ZMRZo5i.Ul0Xr6x6rF6r1uZ5l6h0l6h0l6h0l6h0', 'traveler', 'Seattle', 'WA', 'United States', '555-0202'),
('Sarah Martinez', 'sarah@test.com', '$2a$10$N9qo8uLOickgx2ZMRZo5i.Ul0Xr6x6rF6r1uZ5l6h0l6h0l6h0l6h0', 'traveler', 'Chicago', 'IL', 'United States', '555-0203'),
('David Wilson', 'david@test.com', '$2a$10$N9qo8uLOickgx2ZMRZo5i.Ul0Xr6x6rF6r1uZ5l6h0l6h0l6h0l6h0', 'traveler', 'Austin', 'TX', 'United States', '555-0204'),
('Emma Davis', 'emma@test.com', '$2a$10$N9qo8uLOickgx2ZMRZo5i.Ul0Xr6x6rF6r1uZ5l6h0l6h0l6h0l6h0', 'traveler', 'Portland', 'OR', 'United States', '555-0205'),
-- Owners (who might also travel)
('Robert Taylor', 'robert@test.com', '$2a$10$N9qo8uLOickgx2ZMRZo5i.Ul0Xr6x6rF6r1uZ5l6h0l6h0l6h0l6h0', 'owner', 'Miami', 'FL', 'United States', '555-0301'),
('Linda Anderson', 'linda@test.com', '$2a$10$N9qo8uLOickgx2ZMRZo5i.Ul0Xr6x6rF6r1uZ5l6h0l6h0l6h0l6h0', 'owner', 'Denver', 'CO', 'United States', '555-0302');

-- ==========================================
-- VIEW CURRENT BOOKINGS BEFORE INSERT
-- ==========================================
SELECT 'CURRENT BOOKINGS BEFORE INSERT:' as '';
SELECT 
    b.id,
    b.status,
    b.check_in,
    b.check_out,
    t.name as traveler,
    p.property_name,
    o.name as owner
FROM bookings b
JOIN users t ON b.traveler_id = t.id
JOIN properties p ON b.property_id = p.id
JOIN users o ON b.owner_id = o.id
ORDER BY b.created_at DESC;

-- ==========================================
-- INSERT DIVERSE BOOKING HISTORY
-- ==========================================

-- PAST BOOKINGS (Completed - ACCEPTED status)
INSERT INTO bookings (traveler_id, property_id, owner_id, check_in, check_out, number_of_guests, total_price, status, party_type, created_at) VALUES
-- Past bookings from various travelers
(1, 3, 3, '2025-09-10', '2025-09-15', 5, 1285.00, 'ACCEPTED', 'family', '2025-09-01 10:00:00'),
(1, 4, 2, '2025-08-20', '2025-08-25', 6, 1940.00, 'ACCEPTED', 'family', '2025-08-10 14:30:00'),
(4, 1, 2, '2025-07-15', '2025-07-20', 2, 1885.00, 'ACCEPTED', 'couple', '2025-07-01 09:00:00'),
(5, 5, 3, '2025-07-01', '2025-07-07', 8, 3900.00, 'ACCEPTED', 'group', '2025-06-15 11:20:00'),
(6, 2, 2, '2025-08-05', '2025-08-10', 2, 575.00, 'ACCEPTED', 'couple', '2025-07-25 16:45:00'),
(7, 6, 2, '2025-09-01', '2025-09-05', 4, 1100.00, 'ACCEPTED', 'family', '2025-08-20 13:15:00'),
(8, 7, 2, '2025-08-15', '2025-08-18', 1, 615.00, 'ACCEPTED', 'solo', '2025-08-05 10:30:00'),
(4, 8, 2, '2025-09-20', '2025-09-25', 3, 900.00, 'ACCEPTED', 'group', '2025-09-10 08:00:00'),

-- CANCELLED PAST BOOKINGS (by travelers and owners)
(5, 3, 3, '2025-08-10', '2025-08-15', 4, 1285.00, 'CANCELLED', 'family', '2025-07-28 14:00:00'),
(6, 4, 2, '2025-09-15', '2025-09-20', 5, 1940.00, 'CANCELLED', 'group', '2025-09-01 12:00:00'),
(7, 1, 2, '2025-07-25', '2025-07-30', 3, 1885.00, 'CANCELLED', 'family', '2025-07-15 09:30:00'),

-- CURRENT/ONGOING BOOKINGS (ACCEPTED)
(1, 9, 3, '2025-10-25', '2025-10-30', 2, 900.00, 'ACCEPTED', 'couple', '2025-10-15 10:00:00'),
(4, 10, 2, '2025-10-26', '2025-10-29', 4, 1275.00, 'ACCEPTED', 'family', '2025-10-18 11:30:00'),

-- UPCOMING BOOKINGS (ACCEPTED - Confirmed)
(1, 5, 3, '2025-11-10', '2025-11-15', 7, 3250.00, 'ACCEPTED', 'group', '2025-10-20 14:00:00'),
(4, 6, 2, '2025-11-20', '2025-11-25', 4, 1375.00, 'ACCEPTED', 'family', '2025-10-22 09:30:00'),
(5, 8, 2, '2025-12-01', '2025-12-05', 2, 720.00, 'ACCEPTED', 'couple', '2025-10-25 16:00:00'),
(6, 9, 3, '2025-12-10', '2025-12-15', 3, 1475.00, 'ACCEPTED', 'family', '2025-10-26 10:45:00'),
(7, 1, 2, '2025-12-20', '2025-12-27', 6, 2639.00, 'ACCEPTED', 'family', '2025-11-01 13:20:00'),
(8, 3, 3, '2026-01-05', '2026-01-10', 5, 1285.00, 'ACCEPTED', 'group', '2025-10-28 15:00:00'),

-- PENDING BOOKINGS (Awaiting owner approval)
(4, 2, 2, '2025-11-15', '2025-11-20', 2, 575.00, 'PENDING', 'couple', '2025-10-25 12:00:00'),
(5, 7, 2, '2025-11-25', '2025-11-28', 1, 615.00, 'PENDING', 'solo', '2025-10-26 14:30:00'),
(6, 4, 2, '2025-12-05', '2025-12-10', 6, 1940.00, 'PENDING', 'family', '2025-10-27 09:00:00'),
(7, 10, 2, '2025-12-15', '2025-12-20', 3, 1375.00, 'PENDING', 'group', '2025-10-27 11:00:00'),
(8, 5, 3, '2026-01-15', '2026-01-22', 9, 4550.00, 'PENDING', 'group', '2025-10-27 16:30:00'),

-- REJECTED BOOKINGS (Owner rejected these)
(4, 1, 2, '2025-11-08', '2025-11-12', 8, 1508.00, 'CANCELLED', 'group', '2025-10-20 10:00:00'),
(5, 6, 2, '2025-11-18', '2025-11-22', 5, 1100.00, 'CANCELLED', 'group', '2025-10-22 15:00:00'),

-- BUSINESS TRAVELER BOOKINGS
(4, 10, 2, '2025-11-05', '2025-11-08', 2, 825.00, 'ACCEPTED', 'business', '2025-10-18 08:00:00'),
(5, 2, 2, '2025-11-12', '2025-11-15', 1, 345.00, 'ACCEPTED', 'business', '2025-10-20 13:00:00'),
(6, 7, 2, '2025-12-03', '2025-12-06', 1, 615.00, 'PENDING', 'business', '2025-10-26 10:00:00'),

-- SOLO TRAVELER BOOKINGS
(7, 2, 2, '2025-11-22', '2025-11-25', 1, 345.00, 'PENDING', 'solo', '2025-10-27 12:00:00'),
(8, 7, 2, '2025-12-08', '2025-12-11', 1, 615.00, 'ACCEPTED', 'solo', '2025-10-25 14:00:00');

-- ==========================================
-- VIEW BOOKINGS AFTER INSERT
-- ==========================================
SELECT '' as '';
SELECT '========================================' as '';
SELECT 'BOOKINGS SUMMARY AFTER INSERT:' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- Summary by Status
SELECT 
    status,
    COUNT(*) as count,
    SUM(total_price) as total_revenue
FROM bookings
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'PENDING' THEN 1
        WHEN 'ACCEPTED' THEN 2
        WHEN 'CANCELLED' THEN 3
    END;

SELECT '' as '';
SELECT '========================================' as '';
SELECT 'BOOKINGS BY PARTY TYPE:' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- Summary by Party Type
SELECT 
    party_type,
    COUNT(*) as count,
    AVG(total_price) as avg_price
FROM bookings
GROUP BY party_type
ORDER BY count DESC;

SELECT '' as '';
SELECT '========================================' as '';
SELECT 'TRAVELER BOOKING HISTORY:' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- Traveler's booking history
SELECT 
    t.name as traveler,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
    SUM(b.total_price) as total_spent
FROM users t
LEFT JOIN bookings b ON t.id = b.traveler_id
WHERE t.role = 'traveler'
GROUP BY t.id, t.name
ORDER BY total_bookings DESC;

SELECT '' as '';
SELECT '========================================' as '';
SELECT 'OWNER BOOKING STATISTICS:' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- Owner's property bookings
SELECT 
    o.name as owner,
    COUNT(b.id) as total_bookings,
    SUM(CASE WHEN b.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
    SUM(CASE WHEN b.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
    SUM(CASE WHEN b.status = 'ACCEPTED' THEN b.total_price ELSE 0 END) as total_revenue
FROM users o
LEFT JOIN bookings b ON o.id = b.owner_id
WHERE o.role = 'owner'
GROUP BY o.id, o.name
ORDER BY total_revenue DESC;

SELECT '' as '';
SELECT '========================================' as '';
SELECT 'DETAILED BOOKING LIST (Recent 20):' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- Detailed view of all bookings
SELECT 
    b.id,
    b.status,
    b.party_type,
    DATE_FORMAT(b.check_in, '%Y-%m-%d') as check_in,
    DATE_FORMAT(b.check_out, '%Y-%m-%d') as check_out,
    DATEDIFF(b.check_out, b.check_in) as nights,
    b.number_of_guests as guests,
    CONCAT('$', FORMAT(b.total_price, 2)) as total_price,
    t.name as traveler,
    p.property_name,
    p.city,
    o.name as owner,
    DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i') as booked_at
FROM bookings b
JOIN users t ON b.traveler_id = t.id
JOIN properties p ON b.property_id = p.id
JOIN users o ON b.owner_id = o.id
ORDER BY b.created_at DESC
LIMIT 20;

SELECT '' as '';
SELECT '========================================' as '';
SELECT 'UPCOMING BOOKINGS (Next 30 days):' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- Upcoming bookings
SELECT 
    b.id,
    b.status,
    DATE_FORMAT(b.check_in, '%Y-%m-%d') as check_in,
    DATE_FORMAT(b.check_out, '%Y-%m-%d') as check_out,
    DATEDIFF(b.check_in, CURDATE()) as days_until_checkin,
    t.name as traveler,
    p.property_name,
    p.city,
    o.name as owner,
    CONCAT('$', FORMAT(b.total_price, 2)) as total_price
FROM bookings b
JOIN users t ON b.traveler_id = t.id
JOIN properties p ON b.property_id = p.id
JOIN users o ON b.owner_id = o.id
WHERE b.check_in >= CURDATE() 
  AND b.check_in <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND b.status IN ('PENDING', 'ACCEPTED')
ORDER BY b.check_in ASC;

SELECT '' as '';
SELECT '========================================' as '';
SELECT 'TOTAL STATISTICS:' as '';
SELECT '========================================' as '';
SELECT '' as '';

-- Overall statistics
SELECT 
    COUNT(*) as total_bookings,
    COUNT(DISTINCT traveler_id) as unique_travelers,
    COUNT(DISTINCT property_id) as booked_properties,
    CONCAT('$', FORMAT(SUM(CASE WHEN status = 'ACCEPTED' THEN total_price ELSE 0 END), 2)) as total_revenue,
    CONCAT('$', FORMAT(AVG(total_price), 2)) as avg_booking_value,
    AVG(number_of_guests) as avg_guests_per_booking,
    AVG(DATEDIFF(check_out, check_in)) as avg_nights_per_booking
FROM bookings;

SELECT '' as '';
SELECT '✅ Dummy booking data inserted successfully!' as '';
SELECT '' as '';

