# Kafka Architecture Diagram - Airbnb Clone

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                         │
│                         http://localhost:5173                           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────┐                    ┌──────────────────┐
│  Backend Service │                    │ Property Service │
│   Port 5001      │                    │   Port 5003      │
│                  │                    │                  │
│ - Authentication │                    │ - Property CRUD  │
│ - User Management│                    │ - Search/Filter  │
└──────────────────┘                    └──────────────────┘
```

## Kafka-Enabled Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRODUCER-CONSUMER ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐                                ┌─────────────────────┐
│  FRONTEND SERVICES  │                                │  BACKEND SERVICES   │
│    (Producers)      │                                │    (Consumers)      │
└─────────────────────┘                                └─────────────────────┘

┌─────────────────────┐         ┌──────────────┐         ┌─────────────────────┐
│                     │         │              │         │                     │
│ Traveler Service    │────────>│    KAFKA     │────────>│   Owner Service     │
│   Port 5005         │         │   BROKER     │         │   Port 5002         │
│                     │         │              │         │                     │
│ ┌─────────────────┐ │         │  Topics:     │         │ ┌─────────────────┐ │
│ │ Kafka Producer  │ │         │              │         │ │ Kafka Consumer  │ │
│ │                 │ │         │ 1. booking-  │         │ │                 │ │
│ │ Publishes:      │ │         │    requests  │         │ │ Consumes:       │ │
│ │ - Booking       │ │         │              │         │ │ - Booking       │ │
│ │   Requests      │ │         │ 2. booking-  │         │ │   Requests      │ │
│ └─────────────────┘ │         │    updates   │         │ └─────────────────┘ │
│                     │         │              │         │                     │
│ ┌─────────────────┐ │         │              │         │ ┌─────────────────┐ │
│ │ Kafka Consumer  │ │         │              │         │ │ Kafka Producer  │ │
│ │                 │ │<────────┤              │<────────┤ │                 │ │
│ │ Consumes:       │ │         │              │         │ │ Publishes:      │ │
│ │ - Status        │ │         │              │         │ │ - Status        │ │
│ │   Updates       │ │         │              │         │ │   Updates       │ │
│ └─────────────────┘ │         │              │         │ └─────────────────┘ │
│                     │         └──────────────┘         │                     │
│ ┌─────────────────┐ │                                  │ ┌─────────────────┐ │
│ │ Notification    │ │                                  │ │ Booking         │ │
│ │ Service         │ │                                  │ │ Service         │ │
│ │ - Email         │ │                                  │ │ - Approve       │ │
│ │ - Push          │ │                                  │ │ - Reject        │ │
│ │ - SMS           │ │                                  │ │ - Cancel        │ │
│ └─────────────────┘ │                                  │ └─────────────────┘ │
└─────────────────────┘                                  └─────────────────────┘
         │                                                         │
         │                                                         │
         └────────────────────┬────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  MongoDB Atlas   │
                    │                  │
                    │  Collections:    │
                    │  - users         │
                    │  - properties    │
                    │  - bookings      │
                    │  - sessions      │
                    └──────────────────┘
```

## Detailed Message Flow

```
STEP 1: Booking Creation
┌─────────┐
│Traveler │
└────┬────┘
     │ 1. POST /api/travelers/bookings
     ▼
┌──────────────────┐
│ Traveler Service │
│                  │
│ 2. Save to DB    │
│    status=PENDING│
└────┬─────────────┘
     │ 3. Publish Event
     ▼
┌──────────────────┐
│ Kafka Broker     │
│ Topic:           │
│ booking-requests │
└────┬─────────────┘
     │ 4. Consume Event
     ▼
┌──────────────────┐
│ Owner Service    │
│                  │
│ 5. Notify Owner  │
└──────────────────┘

STEP 2: Booking Approval
┌─────────┐
│ Owner   │
└────┬────┘
     │ 6. PUT /api/owners/bookings/:id/approve
     ▼
┌──────────────────┐
│ Owner Service    │
│                  │
│ 7. Update DB     │
│    status=ACCEPTED
└────┬─────────────┘
     │ 8. Publish Event
     ▼
┌──────────────────┐
│ Kafka Broker     │
│ Topic:           │
│ booking-updates  │
└────┬─────────────┘
     │ 9. Consume Event
     ▼
┌──────────────────┐
│ Traveler Service │
│                  │
│ 10. Notify       │
│     Traveler     │
└──────────────────┘
```

## Kafka Topic Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    booking-requests                         │
├─────────────────────────────────────────────────────────────┤
│ Producer: Traveler Service                                  │
│ Consumer: Owner Service                                     │
│ Partitions: 1                                               │
│ Replication Factor: 1                                       │
│                                                             │
│ Message Format:                                             │
│ {                                                           │
│   "type": "booking-created",                                │
│   "bookingId": "507f1f77bcf86cd799439011",                  │
│   "propertyId": "507f1f77bcf86cd799439012",                 │
│   "propertyName": "Luxury Beach Villa",                     │
│   "travelerId": "507f1f77bcf86cd799439013",                 │
│   "ownerId": "507f1f77bcf86cd799439014",                    │
│   "checkIn": "2025-12-01T00:00:00.000Z",                    │
│   "checkOut": "2025-12-05T00:00:00.000Z",                   │
│   "guests": 4,                                              │
│   "totalPrice": 1200,                                       │
│   "timestamp": "2025-11-19T10:30:00.000Z"                   │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    booking-updates                          │
├─────────────────────────────────────────────────────────────┤
│ Producer: Owner Service                                     │
│ Consumer: Traveler Service                                  │
│ Partitions: 1                                               │
│ Replication Factor: 1                                       │
│                                                             │
│ Message Format:                                             │
│ {                                                           │
│   "type": "booking-status-updated",                         │
│   "bookingId": "507f1f77bcf86cd799439011",                  │
│   "status": "ACCEPTED",                                     │
│   "reason": "Optional cancellation reason",                 │
│   "travelerId": "507f1f77bcf86cd799439013",                 │
│   "ownerId": "507f1f77bcf86cd799439014",                    │
│   "timestamp": "2025-11-19T11:00:00.000Z"                   │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Service Communication Matrix

```
┌──────────────────┬─────────┬─────────┬──────────┬──────────┐
│                  │ Traveler│ Owner   │ Kafka    │ MongoDB  │
│                  │ Service │ Service │ Broker   │ Atlas    │
├──────────────────┼─────────┼─────────┼──────────┼──────────┤
│ Traveler Service │    -    │    ✗    │ Pub/Sub  │ Read/Wrt │
├──────────────────┼─────────┼─────────┼──────────┼──────────┤
│ Owner Service    │    ✗    │    -    │ Pub/Sub  │ Read/Wrt │
├──────────────────┼─────────┼─────────┼──────────┼──────────┤
│ Kafka Broker     │ Pub/Sub │ Pub/Sub │    -     │    ✗     │
├──────────────────┼─────────┼─────────┼──────────┼──────────┤
│ MongoDB Atlas    │ Read/Wrt│ Read/Wrt│    ✗     │    -     │
└──────────────────┴─────────┴─────────┴──────────┴──────────┘

Legend:
  ✗ = No direct communication
  Pub/Sub = Kafka publish/subscribe
  Read/Wrt = Database read/write operations
```

## Docker Compose Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────┐  │
│  │  Zookeeper   │    │    Kafka     │    │  Traveler   │  │
│  │  Port 2181   │───>│  Port 9092   │<───│  Service    │  │
│  │              │    │  Port 29092  │    │  Port 5005  │  │
│  └──────────────┘    └──────┬───────┘    └─────────────┘  │
│                             │                              │
│                             │                              │
│  ┌──────────────┐    ┌──────▼───────┐    ┌─────────────┐  │
│  │   Backend    │    │    Owner     │    │  Property   │  │
│  │   Service    │    │   Service    │    │  Service    │  │
│  │  Port 5001   │    │  Port 5002   │    │  Port 5003  │  │
│  └──────────────┘    └──────────────┘    └─────────────┘  │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────┐  │
│  │   Booking    │    │    Agent     │    │   Ollama    │  │
│  │   Service    │    │   Service    │    │  Port 11434 │  │
│  │  Port 5004   │    │  Port 8000   │    │             │  │
│  └──────────────┘    └──────────────┘    └─────────────┘  │
│                                                             │
│  All services connect to MongoDB Atlas (Cloud)             │
└─────────────────────────────────────────────────────────────┘
```

## Kubernetes Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Namespace: airbnb-clone                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Kafka Infrastructure                  │    │
│  │                                                    │    │
│  │  ┌──────────────┐         ┌──────────────┐       │    │
│  │  │  Zookeeper   │         │    Kafka     │       │    │
│  │  │  StatefulSet │────────>│  StatefulSet │       │    │
│  │  │  Replicas: 1 │         │  Replicas: 1 │       │    │
│  │  │              │         │              │       │    │
│  │  │  Service:    │         │  Service:    │       │    │
│  │  │  zookeeper   │         │  kafka       │       │    │
│  │  │  Port: 2181  │         │  Port: 29092 │       │    │
│  │  └──────────────┘         └──────────────┘       │    │
│  │                                                    │    │
│  │  ┌──────────────────────────────────────┐        │    │
│  │  │        ConfigMap: kafka-config       │        │    │
│  │  │  KAFKA_BROKERS=kafka:29092           │        │    │
│  │  │  KAFKA_REQUEST_TOPIC=booking-requests│        │    │
│  │  │  KAFKA_RESPONSE_TOPIC=booking-updates│        │    │
│  │  └──────────────────────────────────────┘        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Microservices Deployments                │    │
│  │                                                    │    │
│  │  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │  Traveler    │  │    Owner     │              │    │
│  │  │  Service     │  │   Service    │              │    │
│  │  │  Deployment  │  │  Deployment  │              │    │
│  │  │  Replicas: 2 │  │  Replicas: 2 │              │    │
│  │  │              │  │              │              │    │
│  │  │  envFrom:    │  │  envFrom:    │              │    │
│  │  │  kafka-config│  │  kafka-config│              │    │
│  │  └──────────────┘  └──────────────┘              │    │
│  │                                                    │    │
│  │  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │  Property    │  │   Booking    │              │    │
│  │  │  Service     │  │   Service    │              │    │
│  │  │  Deployment  │  │  Deployment  │              │    │
│  │  │  Replicas: 2 │  │  Replicas: 2 │              │    │
│  │  └──────────────┘  └──────────────┘              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Ingress Controller                    │    │
│  │  Routes external traffic to services               │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Event Flow Timeline

```
Time  │ Traveler Service      │ Kafka Broker         │ Owner Service
──────┼──────────────────────┼─────────────────────┼────────────────────
T0    │ Receive POST request │                      │
T1    │ Validate data        │                      │
T2    │ Save to MongoDB      │                      │
T3    │ Publish event ──────>│ Store in topic       │
T4    │                      │ ──────────────────> │ Consume event
T5    │                      │                      │ Process notification
T6    │                      │                      │ Log booking request
──────┼──────────────────────┼─────────────────────┼────────────────────
...   │ (Owner approves via UI)                     │
──────┼──────────────────────┼─────────────────────┼────────────────────
T10   │                      │                      │ Receive PUT request
T11   │                      │                      │ Update MongoDB
T12   │                      │ <──────────────────  │ Publish event
T13   │ Consume event <──────│ Store in topic       │
T14   │ Process notification │                      │
T15   │ Log status update    │                      │
```

## Benefits Visualization

```
┌────────────────────────────────────────────────────────────┐
│              Traditional Synchronous Flow                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Traveler ──HTTP──> Owner ──HTTP──> Traveler             │
│                                                            │
│  ❌ Tight coupling                                         │
│  ❌ If owner service down, booking fails                   │
│  ❌ Blocking operations                                    │
│  ❌ No audit trail                                         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│           Kafka Asynchronous Flow (Implemented)            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Traveler ──Kafka──> Owner ──Kafka──> Traveler           │
│                                                            │
│  ✅ Loose coupling                                         │
│  ✅ If owner service down, messages queued                 │
│  ✅ Non-blocking operations                                │
│  ✅ Complete audit trail in Kafka                          │
│  ✅ Can replay events                                      │
│  ✅ Scalable independently                                 │
└────────────────────────────────────────────────────────────┘
```

## Summary

This Kafka integration implements a **Producer-Consumer** architecture where:

- **Traveler Service** acts as both **Producer** (booking requests) and **Consumer** (status updates)
- **Owner Service** acts as both **Consumer** (booking requests) and **Producer** (status updates)
- **Kafka** acts as the message broker, ensuring reliable, asynchronous communication
- **MongoDB Atlas** stores the persistent state of all bookings

The system is designed for **scalability**, **fault tolerance**, and **loose coupling** between services.

