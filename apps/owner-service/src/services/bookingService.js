// Service to handle incoming booking requests from Kafka
// This is called when owner-service consumes booking-requests topic

export const handleBookingRequest = async (data) => {
  try {
    const { type, bookingId, propertyName, travelerId, ownerId, checkIn, checkOut, guests, totalPrice, timestamp } = data;

    console.log(`\n📬 ========== NEW BOOKING REQUEST ==========`);
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`🆔 Booking ID: ${bookingId}`);
    console.log(`🏠 Property: ${propertyName}`);
    console.log(`👤 Traveler ID: ${travelerId}`);
    console.log(`👨‍💼 Owner ID: ${ownerId}`);
    console.log(`📆 Check-in: ${checkIn}`);
    console.log(`📆 Check-out: ${checkOut}`);
    console.log(`👥 Guests: ${guests}`);
    console.log(`💰 Total Price: $${totalPrice}`);
    console.log(`===========================================\n`);

    // In production, you would:
    // 1. Send email notification to owner
    // 2. Send push notification to owner's mobile app
    // 3. Update owner dashboard with new pending booking
    // 4. Log to analytics/monitoring system
    // 5. Trigger any business logic (e.g., automatic approval for trusted travelers)

    // For now, just log the event
    console.log(`✅ Owner notified about new booking request: ${bookingId}`);

  } catch (error) {
    console.error('❌ Error handling booking request:', error);
  }
};

