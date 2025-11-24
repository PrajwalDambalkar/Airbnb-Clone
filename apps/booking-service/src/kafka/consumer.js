import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'booking-consumer',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const consumer = kafka.consumer({ groupId: 'booking-group' });

let isConnected = false;

export const connectBookingUpdateConsumer = async (handleBookingUpdate) => {
  try {
    await consumer.connect();
    isConnected = true;
    console.log('✅ Kafka Consumer connected (Booking Service)');

    await consumer.subscribe({
      topic: process.env.KAFKA_RESPONSE_TOPIC || 'booking-updates',
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          const eventType = message.headers?.['event-type']?.toString() || 'unknown';
          
          console.log('📥 Booking update received:', {
            topic,
            partition,
            eventType,
            bookingId: data.bookingId,
            status: data.status,
          });

          await handleBookingUpdate(data);
        } catch (error) {
          console.error('❌ Error processing booking update:', error);
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
