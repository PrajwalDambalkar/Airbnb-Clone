import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'owner-consumer',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const consumer = kafka.consumer({ groupId: 'owner-group' });

let isConnected = false;

export const connectBookingConsumer = async (handleBookingRequest) => {
  try {
    await consumer.connect();
    isConnected = true;
    console.log('✅ Kafka Consumer connected (Owner Service)');

    await consumer.subscribe({
      topic: process.env.KAFKA_REQUEST_TOPIC || 'booking-requests',
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          const eventType = message.headers?.['event-type']?.toString() || 'unknown';
          
          console.log('📥 Booking request received:', {
            topic,
            partition,
            eventType,
            bookingId: data.bookingId,
            ownerId: data.ownerId,
            propertyName: data.propertyName,
          });

          await handleBookingRequest(data);
        } catch (error) {
          console.error('❌ Error processing booking request:', error);
        }
      },
    });
  } catch (error) {
    console.error('❌ Failed to connect Kafka Consumer:', error);
    isConnected = false;
  }
};

export const disconnectConsumer = async () => {
  if (isConnected) {
    await consumer.disconnect();
    isConnected = false;
    console.log('🔌 Kafka Consumer disconnected');
  }
};

