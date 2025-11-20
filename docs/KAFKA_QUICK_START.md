# Kafka Quick Start Guide

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB Atlas connection (already configured)

## Step 1: Start All Services

```bash
cd /Users/spartan/finaldemo/Airbnb-Clone

# Start all services including Kafka and Zookeeper
docker-compose up -d

# Verify all services are running
docker-compose ps
```

Expected output should show:
- ✅ zookeeper (Port 2181)
- ✅ kafka (Port 9092)
- ✅ traveler-service (Port 5005)
- ✅ owner-service (Port 5002)
- ✅ backend (Port 5001)
- ✅ property-service (Port 5003)
- ✅ booking-service (Port 5004)

## Step 2: Check Kafka Health

```bash
# Check Kafka logs
docker logs kafka

# List Kafka topics (they will be auto-created on first message)
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
```

## Step 3: Check Service Logs

```bash
# Traveler Service (should show Kafka producer/consumer connected)
docker logs traveler-service

# Owner Service (should show Kafka producer/consumer connected)
docker logs owner-service
```

Expected log messages:
```
✅ Kafka Producer connected (Traveler Service)
✅ Kafka Consumer connected (Traveler Service)
📥 Kafka Consumer: Listening for booking updates
```

## Step 4: Test the Booking Flow

### A. Start Frontend (if not already running)

```bash
cd apps/frontend
npm install
npm run dev
```

Access at: http://localhost:5173

### B. Test via Frontend UI

1. **Login as Traveler**
   - Go to http://localhost:5173
   - Login with traveler account

2. **Create a Booking**
   - Browse properties
   - Select a property
   - Fill booking form (dates, guests)
   - Submit booking

3. **Check Traveler Service Logs**
   ```bash
   docker logs -f traveler-service
   ```
   
   You should see:
   ```
   📝 Creating booking: {...}
   ✅ Booking created with ID: 507f1f77bcf86cd799439011
   📤 Booking request published to Kafka: 507f1f77bcf86cd799439011
   ```

4. **Check Owner Service Logs**
   ```bash
   docker logs -f owner-service
   ```
   
   You should see:
   ```
   📥 Booking request received: {...}
   📬 ========== NEW BOOKING REQUEST ==========
   🆔 Booking ID: 507f1f77bcf86cd799439011
   🏠 Property: Luxury Beach Villa
   ===========================================
   ```

5. **Login as Owner**
   - Logout from traveler account
   - Login with owner account

6. **Approve/Reject Booking**
   - Go to Owner Dashboard
   - View pending bookings
   - Click "Approve" or "Reject"

7. **Check Owner Service Logs**
   ```bash
   docker logs -f owner-service
   ```
   
   You should see:
   ```
   📤 Booking ACCEPTED update published to Kafka: 507f1f77bcf86cd799439011
   ```

8. **Check Traveler Service Logs**
   ```bash
   docker logs -f traveler-service
   ```
   
   You should see:
   ```
   📥 Status update received: {...}
   📬 ========== BOOKING UPDATE NOTIFICATION ==========
   ✅ GOOD NEWS! Your booking has been ACCEPTED by the owner!
   ==================================================
   ```

## Step 5: Monitor Kafka Messages (Optional)

### Install kcat (Kafka CLI tool)

```bash
# macOS
brew install kcat

# Ubuntu/Debian
sudo apt-get install kafkacat

# Windows (via WSL)
sudo apt-get install kafkacat
```

### Monitor Topics in Real-Time

Open two terminal windows:

**Terminal 1 - Watch Booking Requests:**
```bash
kcat -b localhost:9092 -t booking-requests -C -f 'Topic: %t [%p] at offset %o\nKey: %k\nValue: %s\n\n'
```

**Terminal 2 - Watch Booking Updates:**
```bash
kcat -b localhost:9092 -t booking-updates -C -f 'Topic: %t [%p] at offset %o\nKey: %k\nValue: %s\n\n'
```

Now create a booking and watch the messages flow through Kafka!

## Step 6: Test via API (Alternative)

### A. Get Session Cookie

Login via frontend or use curl:

```bash
# Login as traveler
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "traveler@example.com",
    "password": "password123"
  }'
```

### B. Create Booking

```bash
curl -X POST http://localhost:5005/api/travelers/bookings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "property_id": "YOUR_PROPERTY_ID",
    "check_in_date": "2025-12-01",
    "check_out_date": "2025-12-05",
    "guests": 4,
    "total_price": 1200
  }'
```

### C. Login as Owner

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -c owner_cookies.txt \
  -d '{
    "email": "owner@example.com",
    "password": "password123"
  }'
```

### D. Get Owner Bookings

```bash
curl -X GET http://localhost:5002/api/owners/bookings?status=PENDING \
  -b owner_cookies.txt
```

### E. Approve Booking

```bash
curl -X PUT http://localhost:5002/api/owners/bookings/BOOKING_ID/approve \
  -b owner_cookies.txt
```

## Troubleshooting

### Issue: Kafka not starting

**Solution:**
```bash
# Check Zookeeper first
docker logs zookeeper

# Restart services
docker-compose restart zookeeper
sleep 5
docker-compose restart kafka
```

### Issue: Services can't connect to Kafka

**Solution:**
```bash
# Check if Kafka is accessible
docker exec -it kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Restart services
docker-compose restart traveler-service owner-service
```

### Issue: Topics not created

**Solution:**
```bash
# Create topics manually
docker exec -it kafka kafka-topics --create \
  --topic booking-requests \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1

docker exec -it kafka kafka-topics --create \
  --topic booking-updates \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1
```

### Issue: Messages not being consumed

**Solution:**
```bash
# Check consumer groups
docker exec -it kafka kafka-consumer-groups --list --bootstrap-server localhost:9092

# Reset consumer group offset (if needed)
docker exec -it kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group owner-group \
  --reset-offsets \
  --to-earliest \
  --topic booking-requests \
  --execute
```

## Verification Checklist

- [ ] All Docker containers running
- [ ] Kafka and Zookeeper healthy
- [ ] Traveler Service shows Kafka connected
- [ ] Owner Service shows Kafka connected
- [ ] Can create booking via frontend/API
- [ ] Traveler Service logs show "📤 Booking request published"
- [ ] Owner Service logs show "📥 Booking request received"
- [ ] Can approve booking via frontend/API
- [ ] Owner Service logs show "📤 Booking update published"
- [ ] Traveler Service logs show "📥 Status update received"
- [ ] Database updated with correct status

## Next Steps

1. ✅ Test the complete flow end-to-end
2. 📊 Monitor Kafka topics with kcat
3. 🔍 Check MongoDB Atlas for booking records
4. 📧 (Future) Add email notifications
5. 🚀 Deploy to Kubernetes (see `docs/KAFKA_INTEGRATION.md`)

## Quick Commands Reference

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker logs -f traveler-service
docker logs -f owner-service
docker logs -f kafka

# List Kafka topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Monitor topic
kcat -b localhost:9092 -t booking-requests -C

# Restart a service
docker-compose restart traveler-service

# Rebuild and restart
docker-compose up -d --build traveler-service
```

## Success! 🎉

If you see the Kafka messages flowing and database updating, your Kafka integration is working perfectly!

For more details, see:
- Full documentation: `docs/KAFKA_INTEGRATION.md`
- Setup summary: `KAFKA_SETUP_SUMMARY.md`

