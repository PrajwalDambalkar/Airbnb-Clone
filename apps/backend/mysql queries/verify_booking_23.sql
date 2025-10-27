-- Verify Booking ID 23
-- Run this to check the booking data

-- 1. Check if booking 23 exists
SELECT 'Booking 23 Details:' as info;
SELECT 
    b.id,
    b.traveler_id,
    b.property_id,
    b.check_in,
    b.check_out,
    b.status,
    p.property_name,
    p.city,
    p.state
FROM bookings b
JOIN properties p ON b.property_id = p.id
WHERE b.id = 23;

-- 2. Check what user owns this booking
SELECT 'User who owns booking 23:' as info;
SELECT 
    u.id,
    u.name,
    u.email,
    u.role
FROM users u
JOIN bookings b ON u.id = b.traveler_id
WHERE b.id = 23;

-- 3. Check all bookings for the traveler (to see if they have other bookings)
SELECT 'All bookings for this traveler:' as info;
SELECT 
    b.id,
    b.check_in,
    b.check_out,
    b.status,
    p.property_name
FROM bookings b
JOIN properties p ON b.property_id = p.id
WHERE b.traveler_id = (SELECT traveler_id FROM bookings WHERE id = 23)
ORDER BY b.created_at DESC;

