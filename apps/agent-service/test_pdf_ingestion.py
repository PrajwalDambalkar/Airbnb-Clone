#!/usr/bin/env python3
"""
Test script to verify PDF policy ingestion
"""
import sys
from pathlib import Path

# Add the parent directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from rag.policy_loader import policy_loader

def main():
    print("=" * 60)
    print("🧪 Testing PDF Policy Ingestion")
    print("=" * 60)
    
    # Check if policies directory exists
    policies_dir = Path(__file__).parent / "policies"
    if not policies_dir.exists():
        print(f"❌ Policies directory not found: {policies_dir}")
        return
    
    # List policy files
    policy_files = list(policies_dir.glob("*.pdf")) + \
                  list(policies_dir.glob("*.md")) + \
                  list(policies_dir.glob("*.txt"))
    
    print(f"\n📂 Found {len(policy_files)} policy file(s):")
    for pf in policy_files:
        print(f"   • {pf.name} ({pf.suffix})")
    
    # Test ingestion
    print("\n" + "=" * 60)
    print("📚 Starting Policy Ingestion...")
    print("=" * 60)
    
    policy_loader.ingest_policies()
    
    # Test search
    print("\n" + "=" * 60)
    print("🔍 Testing Policy Search...")
    print("=" * 60)
    
    test_queries = [
        "What is the cancellation policy?",
        "Can I get a refund?",
        "What if the host cancels?",
        "How do I modify my booking?"
    ]
    
    for query in test_queries:
        print(f"\n❓ Query: '{query}'")
        results = policy_loader.search_policies(query, n_results=2)
        
        if results:
            print(f"   ✅ Found {len(results)} results:")
            for i, result in enumerate(results, 1):
                print(f"\n   [{i}] Policy: {result['metadata'].get('policy_type', 'Unknown')}")
                print(f"       Source: {result['metadata'].get('filename', 'Unknown')}")
                print(f"       Similarity: {1 - result['distance']:.3f}")
                print(f"       Content: {result['content'][:150]}...")
        else:
            print("   ❌ No results found")
    
    print("\n" + "=" * 60)
    print("✅ Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()

