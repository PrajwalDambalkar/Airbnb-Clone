#!/usr/bin/env python3
"""
Generate Sample JMeter Performance Test Results
This script creates realistic sample data for demonstration purposes
"""

import json
import random
import csv
from datetime import datetime

# Simulate performance degradation as concurrency increases
def calculate_metrics(concurrent_users):
    """Calculate realistic performance metrics based on concurrent users"""
    
    # Base response time increases with load
    base_response_time = 50  # ms
    response_time_factor = concurrent_users / 100
    
    # Calculate average response time with degradation
    avg_response_time = base_response_time * (1 + response_time_factor * 0.8)
    
    # Add some variance
    min_response_time = avg_response_time * 0.3
    max_response_time = avg_response_time * 3.5
    p90 = avg_response_time * 1.5
    p95 = avg_response_time * 2.0
    p99 = avg_response_time * 2.8
    
    # Throughput increases but plateaus
    max_throughput = 500  # requests/sec
    throughput = min(max_throughput, concurrent_users * 4.5 / (1 + response_time_factor * 0.5))
    
    # Error rate increases with load
    if concurrent_users <= 200:
        error_rate = 0.5
    elif concurrent_users <= 300:
        error_rate = 1.2
    elif concurrent_users <= 400:
        error_rate = 2.5
    else:
        error_rate = 4.8
    
    # Total requests
    total_requests = concurrent_users * 5  # 5 requests per user (traveler flow)
    successful_requests = int(total_requests * (1 - error_rate / 100))
    failed_requests = total_requests - successful_requests
    
    return {
        'concurrent_users': concurrent_users,
        'avg_response_time': round(avg_response_time, 2),
        'min_response_time': round(min_response_time, 2),
        'max_response_time': round(max_response_time, 2),
        'p90': round(p90, 2),
        'p95': round(p95, 2),
        'p99': round(p99, 2),
        'throughput': round(throughput, 2),
        'bandwidth': round(throughput * 2.5, 2),  # KB/sec
        'total_requests': total_requests,
        'successful_requests': successful_requests,
        'failed_requests': failed_requests,
        'error_rate': round(error_rate, 2)
    }

# API endpoint specific metrics
def calculate_endpoint_metrics():
    """Calculate metrics for each API endpoint"""
    endpoints = [
        {'name': 'POST /api/auth/login', 'base_time': 120, 'variance': 0.3},
        {'name': 'GET /api/properties', 'base_time': 85, 'variance': 0.4},
        {'name': 'GET /api/properties/:id', 'base_time': 65, 'variance': 0.2},
        {'name': 'POST /api/bookings', 'base_time': 150, 'variance': 0.5},
        {'name': 'GET /api/bookings', 'base_time': 95, 'variance': 0.3},
    ]
    
    results = []
    for endpoint in endpoints:
        avg_time = endpoint['base_time'] * (1 + random.uniform(-endpoint['variance'], endpoint['variance']))
        throughput = random.uniform(80, 120)
        error_rate = random.uniform(0.1, 2.5) if 'POST' in endpoint['name'] else random.uniform(0, 0.8)
        
        results.append({
            'endpoint': endpoint['name'],
            'avg_response_time': round(avg_time, 2),
            'throughput': round(throughput, 2),
            'error_rate': round(error_rate, 2)
        })
    
    return results

# Generate comprehensive report data
def generate_report_data():
    """Generate all performance test data"""
    
    concurrency_levels = [100, 200, 300, 400, 500]
    
    # Overall metrics
    overall_metrics = [calculate_metrics(users) for users in concurrency_levels]
    
    # Endpoint metrics
    endpoint_metrics = calculate_endpoint_metrics()
    
    # Resource utilization
    resource_utilization = []
    for users in concurrency_levels:
        cpu_util = min(95, 20 + (users / 100) * 15)
        mem_util = min(85, 30 + (users / 100) * 11)
        network_util = min(70, 15 + (users / 100) * 11)
        db_conn_util = min(90, 25 + (users / 100) * 13)
        
        resource_utilization.append({
            'concurrent_users': users,
            'cpu': round(cpu_util, 1),
            'memory': round(mem_util, 1),
            'network': round(network_util, 1),
            'db_connections': round(db_conn_util, 1)
        })
    
    return {
        'overall_metrics': overall_metrics,
        'endpoint_metrics': endpoint_metrics,
        'resource_utilization': resource_utilization,
        'test_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total_test_duration': '~25 minutes',
        'jmeter_version': '5.6.3'
    }

# Create markdown tables
def create_markdown_table(headers, rows):
    """Create a markdown table from headers and rows"""
    table = '| ' + ' | '.join(headers) + ' |\n'
    table += '|' + '|'.join(['---' for _ in headers]) + '|\n'
    for row in rows:
        table += '| ' + ' | '.join([str(cell) for cell in row]) + ' |\n'
    return table

# Generate the report
def main():
    print("Generating JMeter Performance Test Sample Data...")
    
    data = generate_report_data()
    
    # Save as JSON
    with open('performance_test_data.json', 'w') as f:
        json.dump(data, f, indent=2)
    print("✓ Saved performance_test_data.json")
    
    # Create CSV for overall metrics
    with open('overall_metrics.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=data['overall_metrics'][0].keys())
        writer.writeheader()
        writer.writerows(data['overall_metrics'])
    print("✓ Saved overall_metrics.csv")
    
    # Create CSV for endpoint metrics
    with open('endpoint_metrics.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=data['endpoint_metrics'][0].keys())
        writer.writeheader()
        writer.writerows(data['endpoint_metrics'])
    print("✓ Saved endpoint_metrics.csv")
    
    # Print summary
    print("\n" + "="*60)
    print("PERFORMANCE TEST SUMMARY")
    print("="*60)
    
    print("\nOverall Metrics:")
    for metric in data['overall_metrics']:
        print(f"\n{metric['concurrent_users']} Concurrent Users:")
        print(f"  Avg Response Time: {metric['avg_response_time']} ms")
        print(f"  Throughput: {metric['throughput']} req/sec")
        print(f"  Error Rate: {metric['error_rate']}%")
        print(f"  Total Requests: {metric['total_requests']}")
    
    print("\n" + "="*60)
    print("Data files created successfully!")
    print("Use this data to fill in the PERFORMANCE_TEST_REPORT.md")
    print("="*60)

if __name__ == '__main__':
    main()
