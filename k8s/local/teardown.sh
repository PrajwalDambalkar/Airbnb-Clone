#!/bin/bash

# Teardown Script for Local Kubernetes Deployment

set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🧹 Tearing down AirBNB Clone from Local Kubernetes..."
echo ""

# Delete all deployments
echo "🗑️  Deleting deployments..."
kubectl delete -f "$SCRIPT_DIR/frontend-deployment.yaml" --ignore-not-found=true
kubectl delete -f "$SCRIPT_DIR/kafka-ui-deployment.yaml" --ignore-not-found=true
kubectl delete -f "$SCRIPT_DIR/agent-service-deployment.yaml" --ignore-not-found=true
kubectl delete -f "$SCRIPT_DIR/owner-service-deployment.yaml" --ignore-not-found=true
kubectl delete -f "$SCRIPT_DIR/traveler-service-deployment.yaml" --ignore-not-found=true
kubectl delete -f "$SCRIPT_DIR/booking-service-deployment.yaml" --ignore-not-found=true
kubectl delete -f "$SCRIPT_DIR/property-service-deployment.yaml" --ignore-not-found=true
kubectl delete -f "$SCRIPT_DIR/backend-deployment.yaml" --ignore-not-found=true
kubectl delete -f "$SCRIPT_DIR/ollama-deployment.yaml" --ignore-not-found=true
kubectl delete -f "$SCRIPT_DIR/kafka-deployment.yaml" --ignore-not-found=true
echo "✅ Deployments deleted"
echo ""

# Delete secrets
echo "🔐 Deleting secrets..."
kubectl delete -f "$SCRIPT_DIR/secrets.yaml" --ignore-not-found=true
echo "✅ Secrets deleted"
echo ""

# Delete PVCs (optional - comment out if you want to keep data)
echo "💾 Deleting persistent volume claims..."
kubectl delete pvc --all --ignore-not-found=true
echo "✅ PVCs deleted"
echo ""

echo "✅ Teardown Complete!"
echo ""
echo "💡 To redeploy, run: ./deploy.sh"
echo ""
