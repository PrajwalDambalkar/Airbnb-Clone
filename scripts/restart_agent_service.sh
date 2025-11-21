#!/bin/bash

# Quick script to rebuild and restart the agent service
echo "🔄 Rebuilding and Restarting Agent Service"
echo "=========================================="
echo ""

cd "$(dirname "$0")/.." || exit 1

echo "📦 Stopping current agent service..."
docker-compose stop agent-service
echo ""

echo "🏗️  Rebuilding agent service image..."
docker-compose build agent-service
echo ""

echo "🚀 Starting agent service..."
docker-compose up -d agent-service
echo ""

echo "⏳ Waiting for service to start (10 seconds)..."
sleep 10
echo ""

echo "📊 Checking service status..."
docker-compose ps agent-service
echo ""

echo "📝 Recent logs:"
echo "----------------------------------------"
docker-compose logs --tail=20 agent-service
echo "----------------------------------------"
echo ""

echo "✅ Done!"
echo ""
echo "To follow logs in real-time:"
echo "  docker-compose logs -f agent-service"
echo ""
echo "To run tests:"
echo "  ./scripts/test_agent_service.sh"
echo ""

