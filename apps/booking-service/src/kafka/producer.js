import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'booking-producer',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const producer = kafka.producer();

let isConnected = false;

export const connectProducer = async () => {
  try {
    await producer.connect();
    isConnected = true;
    console.log('✅ Kafka Producer connected (Booking Service)');
  } catch (error) {
    console.error('❌ Failed to connect Kafka Producer:', error);
    isConnected = false;
  }
};

export const sendBookingRequest = async (bookingData) => {
  if (!isConnected) {
    console.warn('⚠️ Kafka producer not connected, skipping message');
    return;
  }

  try {
    await producer.send({
      topic: process.env.KAFKA_REQUEST_TOPIC || 'booking-requests',
      messages: [
        {
          key: bookingData.bookingId,
          value: JSON.stringify(bookingData),
          headers: {
            'event-type': 'booking-created',
            'timestamp': new Date().toISOString(),
          },
        },
      ],
    });
    console.log('📤 Booking request published to Kafka:', bookingData.bookingId);
  } catch (error) {
    console.error('❌ Failed to send booking request to Kafka:', error);
  }
};

export const sendBookingUpdate = async (updateData) => {
  if (!isConnected) {
    console.warn('⚠️ Kafka producer not connected, skipping message');
    return;
  }

  try {
    await producer.send({
      topic: process.env.KAFKA_RESPONSE_TOPIC || 'booking-updates',
      messages: [
        {
          key: updateData.bookingId,
          value: JSON.stringify(updateData),
          headers: {
            'event-type': 'booking-status-updated',
            'timestamp': new Date().toISOString(),
          },
        },
      ],
    });
    console.log('📤 Booking update published to Kafka:', updateData.bookingId, '- Status:', updateData.status);
  } catch (error) {
    console.error('❌ Failed to send booking update to Kafka:', error);
  }
};

export const disconnectProducer = async () => {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
    console.log('🔌 Kafka Producer disconnected');
  }
};
