# Kafka Integration for Asynchronous Messaging

## Overview

This document describes the Kafka integration implemented for the Airbnb Clone microservices architecture. The system uses Apache Kafka as a message broker to enable asynchronous communication between services, specifically for the booking workflow.

## Architecture

### Producer-Consumer Model

```
┌─────────────────────┐         ┌──────────────┐         ┌─────────────────────┐
│  Traveler Service   │────────>│    Kafka     │────────>│   Owner Service     │
│    (Producer)       │         │   Broker     │         │    (Consumer)       │
│                     │         │              │         │                     │
│ - Creates bookings  │         │  Topics:     │         │ - Receives requests │
│ - Publishes events  │         │  1. booking- │         │ - Approves/Rejects  │
│                     │         │     requests │         │ - Publishes updates │
└─────────────────────┘         │  2. booking- │         └─────────────────────┘
         ^                      │     updates  │                   │
         │                      │              │                   │
         │                      └──────────────┘                   │
         │                                                          │
         └──────────────────────────────────────────────────────────┘
                         Consumes status updates
```

### Message Flow

1. **Booking Creation (Frontend → Backend)**
   - Traveler creates a booking via frontend
   - Request goes to **Traveler Service** (Port 5005)
   - Traveler Service saves booking to MongoDB with status `PENDING`
   - Publishes event to Kafka topic: `booking-requests`

2. **Booking Processing (Backend → Backend)**
   - **Owner Service** (Port 5002) consumes from `booking-requests`
   - Owner receives notification about new booking
   - Owner can approve/reject via Owner Service API

3. **Status Update (Backend → Frontend)**
   - Owner Service updates booking status in MongoDB
   - Publishes event to Kafka topic: `booking-updates`
   - **Traveler Service** consumes from `booking-updates`
   - Traveler receives notification about status change

## Kafka Topics

### 1. `booking-requests`
**Purpose**: Booking creation events  
**Producer**: Traveler Service  
**Consumer**: Owner Service  
**Message Format**:
```json
{
  "type": "booking-created",
  "bookingId": "507f1f77bcf86cd799439011",
  "propertyId": "507f1f77bcf86cd799439012",
  "propertyName": "Luxury Beach Villa",
  "travelerId": "507f1f77bcf86cd799439013",
  "ownerId": "507f1f77bcf86cd799439014",
  "checkIn": "2025-12-01T00:00:00.000Z",
  "checkOut": "2025-12-05T00:00:00.000Z",
  "guests": 4,
  "totalPrice": 1200,
  "timestamp": "2025-11-19T10:30:00.000Z"
}
```

### 2. `booking-updates`
**Purpose**: Booking status change events  
**Producer**: Owner Service  
**Consumer**: Traveler Service  
**Message Format**:
```json
{
  "type": "booking-status-updated",
  "bookingId": "507f1f77bcf86cd799439011",
  "status": "ACCEPTED",
  "reason": "Optional cancellation reason",
  "travelerId": "507f1f77bcf86cd799439013",
  "ownerId": "507f1f77bcf86cd799439014",
  "timestamp": "2025-11-19T11:00:00.000Z"
}
```

## Service Configuration

### Traveler Service (Port 5005)
**Role**: Producer & Consumer

**Producer**: Publishes booking requests
- Topic: `booking-requests`
- File: `src/kafka/producer.js`
- Triggered by: `POST /api/travelers/bookings`

**Consumer**: Receives status updates
- Topic: `booking-updates`
- File: `src/kafka/consumer.js`
- Handler: `src/services/notificationService.js`

### Owner Service (Port 5002)
**Role**: Consumer & Producer

**Consumer**: Receives booking requests
- Topic: `booking-requests`
- File: `src/kafka/consumer.js`
- Handler: `src/services/bookingService.js`

**Producer**: Publishes status updates
- Topic: `booking-updates`
- File: `src/kafka/producer.js`
- Triggered by:
  - `PUT /api/owners/bookings/:id/approve`
  - `PUT /api/owners/bookings/:id/reject`
  - `PUT /api/owners/bookings/:id/cancel`

## API Endpoints

### Traveler Service (Frontend Service - Producer)

#### Create Booking
```http
POST /api/travelers/bookings
Content-Type: application/json

{
  "property_id": "507f1f77bcf86cd799439012",
  "check_in_date": "2025-12-01",
  "check_out_date": "2025-12-05",
  "guests": 4,
  "total_price": 1200
}
```

**Response**:
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "PENDING",
    ...
  }
}
```

#### Get Traveler Bookings
```http
GET /api/travelers/bookings?status=PENDING
```

### Owner Service (Backend Service - Consumer)

#### Get Owner Bookings
```http
GET /api/owners/bookings?status=PENDING
```

#### Approve Booking
```http
PUT /api/owners/bookings/:id/approve
```

**Response**: Publishes to `booking-updates` topic

#### Reject Booking
```http
PUT /api/owners/bookings/:id/reject
Content-Type: application/json

{
  "reason": "Property not available for those dates"
}
```

**Response**: Publishes to `booking-updates` topic

## Deployment

### Docker Compose (Local Development)

The `docker-compose.yml` includes:
- Zookeeper (Port 2181)
- Kafka (Port 9092)
- All microservices with Kafka environment variables

**Start services**:
```bash
cd /Users/spartan/finaldemo/Airbnb-Clone
docker-compose up -d
```

**Check Kafka logs**:
```bash
docker logs kafka
docker logs zookeeper
```

**Check service logs**:
```bash
docker logs traveler-service
docker logs owner-service
```

### Kubernetes (Production)

Kafka manifests are in `k8s/kafka/`:
- `zookeeper.yaml` - Zookeeper StatefulSet
- `kafka.yaml` - Kafka StatefulSet
- `configmap.yaml` - Kafka configuration

**Deploy Kafka**:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/kafka/
```

**Verify deployment**:
```bash
kubectl get pods -n airbnb-clone -l app=kafka
kubectl get svc -n airbnb-clone | grep kafka
```

**Update service deployments** to include Kafka config:
```yaml
envFrom:
  - configMapRef:
      name: kafka-config
```

## Environment Variables

All services require these Kafka environment variables:

```env
KAFKA_BROKERS=localhost:9092
KAFKA_REQUEST_TOPIC=booking-requests
KAFKA_RESPONSE_TOPIC=booking-updates
```

For Docker Compose, these are set in `docker-compose.yml`.  
For Kubernetes, these are in `k8s/kafka/configmap.yaml`.

## Testing the Flow

### 1. Start All Services
```bash
docker-compose up -d
```

### 2. Create a Booking (Traveler → Kafka)
```bash
curl -X POST http://localhost:5005/api/travelers/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -d '{
    "property_id": "507f1f77bcf86cd799439012",
    "check_in_date": "2025-12-01",
    "check_out_date": "2025-12-05",
    "guests": 4,
    "total_price": 1200
  }'
```

**Expected**:
- Traveler Service logs: `📤 Booking request published to Kafka`
- Owner Service logs: `📥 Booking request received`

### 3. Approve Booking (Owner → Kafka)
```bash
curl -X PUT http://localhost:5002/api/owners/bookings/BOOKING_ID/approve \
  -H "Cookie: connect.sid=OWNER_SESSION_ID"
```

**Expected**:
- Owner Service logs: `📤 Booking ACCEPTED update published to Kafka`
- Traveler Service logs: `📥 Status update received: ACCEPTED`

### 4. Monitor Kafka Topics

Install `kcat` (formerly `kafkacat`):
```bash
# macOS
brew install kcat

# Ubuntu
sudo apt-get install kafkacat
```

**Consume from topics**:
```bash
# Watch booking requests
kcat -b localhost:9092 -t booking-requests -C

# Watch booking updates
kcat -b localhost:9092 -t booking-updates -C
```

### 5. Verify Database
```bash
# Connect to MongoDB Atlas and check bookings collection
# Status should be updated from PENDING → ACCEPTED
```

## Monitoring & Debugging

### Check Kafka Connection
```bash
# List Kafka topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Describe topic
docker exec -it kafka kafka-topics --describe --topic booking-requests --bootstrap-server localhost:9092
```

### View Consumer Groups
```bash
docker exec -it kafka kafka-consumer-groups --list --bootstrap-server localhost:9092
docker exec -it kafka kafka-consumer-groups --describe --group owner-group --bootstrap-server localhost:9092
```

### Common Issues

1. **Kafka not connecting**
   - Check if Kafka and Zookeeper containers are running
   - Verify `KAFKA_BROKERS` environment variable
   - Check network connectivity between services

2. **Messages not being consumed**
   - Check consumer group status
   - Verify topic exists and has messages
   - Check service logs for connection errors

3. **Database not updated**
   - Verify MongoDB connection
   - Check if booking exists in database
   - Review service logs for errors

## Benefits

1. **Decoupling**: Services communicate asynchronously without direct dependencies
2. **Scalability**: Can scale producers and consumers independently
3. **Reliability**: Messages are persisted in Kafka until consumed
4. **Fault Tolerance**: If a service is down, messages are queued
5. **Event Sourcing**: Complete audit trail of all booking events
6. **Real-time Notifications**: Instant updates to travelers about booking status

## Future Enhancements

1. **Email Notifications**: Integrate nodemailer to send emails on status changes
2. **Push Notifications**: Add Firebase/OneSignal for mobile notifications
3. **WebSockets**: Real-time UI updates via Socket.io
4. **Dead Letter Queue**: Handle failed messages
5. **Monitoring**: Add Kafka monitoring with Prometheus/Grafana
6. **Schema Registry**: Use Avro/Protobuf for message schemas
7. **Event Replay**: Ability to replay events for debugging
8. **Analytics**: Stream booking events to analytics pipeline

## Architecture Diagram

```
                    ┌─────────────────────────────────┐
                    │         Frontend (React)        │
                    │         Port 5173               │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │  Traveler Service   │   │   Owner Service    │
         │  (Producer)         │   │   (Consumer)       │
         │  Port 5005          │   │   Port 5002        │
         └──────────┬──────────┘   └─────────┬──────────┘
                    │                        │
         Publishes  │                        │ Consumes
         booking-   │                        │ booking-
         requests   │                        │ requests
                    │                        │
                    └────────►┌──────┐◄──────┘
                              │Kafka │
                    ┌─────────┤Broker├────────┐
                    │         └──────┘        │
         Consumes   │                         │ Publishes
         booking-   │                         │ booking-
         updates    │                         │ updates
                    │                         │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │  Traveler Service   │   │   Owner Service    │
         │  (Consumer)         │   │   (Producer)       │
         └─────────────────────┘   └────────────────────┘
                    │                        │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     MongoDB Atlas       │
                    │     (Shared Database)   │
                    └─────────────────────────┘
```

## Conclusion

The Kafka integration successfully decouples the booking flow into asynchronous message-driven architecture. Traveler Service acts as a producer (frontend service), Owner Service acts as both consumer and producer (backend service), and Kafka ensures reliable message delivery between them.

This implementation follows the diagram provided, with clear separation between frontend services (producers) and backend services (consumers), connected via Kafka message queues.

