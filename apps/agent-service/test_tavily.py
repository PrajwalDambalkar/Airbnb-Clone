#!/usr/bin/env python3
"""Test script to verify Tavily API is working"""

import os
import sys

# Load environment variables from .env file
env_file = '.env'
if os.path.exists(env_file):
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

api_key = os.getenv('TAVILY_API_KEY')

if not api_key:
    print('❌ No TAVILY_API_KEY found in .env file')
    sys.exit(1)

print(f'✓ API Key loaded: {api_key[:10]}...{api_key[-4:]}')

# Test Tavily
try:
    from tavily import TavilyClient
    
    client = TavilyClient(api_key=api_key)
    print('✓ Tavily client initialized')
    
    # Test search
    print('\n🔍 Testing Tavily search for weather...')
    result = client.search(
        query='weather forecast Los Angeles California',
        search_depth='basic',
        max_results=3
    )
    
    print('✅ Tavily API is working!')
    print(f'\n📊 Found {len(result.get("results", []))} results')
    
    if result.get('results'):
        for i, res in enumerate(result['results'][:2], 1):
            print(f'\n--- Result {i} ---')
            print(f'Title: {res.get("title", "N/A")}')
            print(f'URL: {res.get("url", "N/A")}')
            print(f'Content: {res.get("content", "")[:250]}...')
            
    print('\n✅ Test completed successfully!')
        
except Exception as e:
    print(f'\n❌ Error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
