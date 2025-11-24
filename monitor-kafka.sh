#!/bin/bash

# Kafka Topic Monitor Script
# Monitor messages in booking-requests and booking-updates topics

echo "🔍 Kafka Topic Monitor"
echo "====================="
echo ""

# Check if topics exist
echo "📋 Available Topics:"
docker exec kafka kafka-topics --bootstrap-server localhost:9092 --list
echo ""

# Check topic details
echo "📊 Topic Details:"
docker exec kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic booking-requests
echo ""
docker exec kafka kafka-topics --bootstrap-server localhost:9092 --describe --topic booking-updates
echo ""

# Check message counts
echo "📈 Message Counts:"
echo -n "  booking-requests: "
OFFSET=$(docker exec kafka kafka-run-class kafka.tools.GetOffsetShell --broker-list localhost:9092 --topic booking-requests | cut -d: -f3)
echo "$OFFSET messages"

echo -n "  booking-updates: "
OFFSET=$(docker exec kafka kafka-run-class kafka.tools.GetOffsetShell --broker-list localhost:9092 --topic booking-updates | cut -d: -f3)
echo "$OFFSET messages"
echo ""

# Monitor messages in real-time
echo "🎧 Monitoring for new messages (Ctrl+C to stop)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Use trap to handle cleanup
trap 'echo ""; echo "👋 Stopped monitoring"; exit 0' INT TERM

# Monitor both topics simultaneously with labels
docker exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic booking-requests \
  --property print.timestamp=true \
  --property print.key=true \
  --from-beginning 2>/dev/null | while IFS= read -r line; do
    echo "📨 [BOOKING-REQUEST] $line"
done &

docker exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic booking-updates \
  --property print.timestamp=true \
  --property print.key=true \
  --from-beginning 2>/dev/null | while IFS= read -r line; do
    echo "📬 [BOOKING-UPDATE] $line"
done &

# Wait for background processes
wait
