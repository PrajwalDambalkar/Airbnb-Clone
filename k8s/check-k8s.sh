#!/bin/bash

# Quick Kubernetes verification script

echo "🔍 Checking Kubernetes setup..."
echo ""

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found"
    exit 1
fi
echo "✅ kubectl installed"

# Check cluster
if kubectl cluster-info &> /dev/null; then
    echo "✅ Kubernetes cluster is running"
    echo ""
    echo "Cluster info:"
    kubectl cluster-info | head -2
    echo ""
    echo "Nodes:"
    kubectl get nodes
    echo ""
    echo "🎉 Ready to deploy! Run: cd k8s && ./deploy.sh"
else
    echo "❌ Kubernetes cluster not running"
    echo ""
    echo "📝 To enable:"
    echo "1. Open Docker Desktop"
    echo "2. Settings → Kubernetes"
    echo "3. Check 'Enable Kubernetes'"
    echo "4. Apply & Restart"
    echo "5. Wait 2-3 minutes"
    echo ""
    echo "Then run this script again: ./check-k8s.sh"
fi
