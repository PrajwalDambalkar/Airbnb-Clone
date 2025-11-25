#!/usr/bin/env python3
"""
Generate Performance Test Graphs and Complete Report
Creates visualizations and fills in the performance report template
"""

import json
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import os

# Create screenshots directory
os.makedirs('screenshots', exist_ok=True)

# Load the performance data
with open('performance_test_data.json', 'r') as f:
    data = json.load(f)

# Extract data for plotting
overall = data['overall_metrics']
users = [m['concurrent_users'] for m in overall]
avg_response_times = [m['avg_response_time'] for m in overall]
throughputs = [m['throughput'] for m in overall]
error_rates = [m['error_rate'] for m in overall]

# Set style
plt.style.use('seaborn-v0_8-darkgrid')
colors = ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#6A994E']

# 1. Average Response Time vs Concurrent Users
plt.figure(figsize=(12, 6))
plt.plot(users, avg_response_times, marker='o', linewidth=2.5, markersize=10, color=colors[0])
plt.xlabel('Concurrent Users', fontsize=12, fontweight='bold')
plt.ylabel('Average Response Time (ms)', fontsize=12, fontweight='bold')
plt.title('Average Response Time vs Concurrent Users', fontsize=14, fontweight='bold', pad=20)
plt.grid(True, alpha=0.3)
plt.xticks(users)

# Add value labels on points
for i, (x, y) in enumerate(zip(users, avg_response_times)):
    plt.annotate(f'{y:.1f}ms', (x, y), textcoords="offset points", xytext=(0,10), ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig('screenshots/response_time_graph.png', dpi=300, bbox_inches='tight')
print("✓ Generated response_time_graph.png")
plt.close()

# 2. Throughput vs Concurrent Users
plt.figure(figsize=(12, 6))
plt.plot(users, throughputs, marker='s', linewidth=2.5, markersize=10, color=colors[1])
plt.xlabel('Concurrent Users', fontsize=12, fontweight='bold')
plt.ylabel('Throughput (requests/sec)', fontsize=12, fontweight='bold')
plt.title('Throughput vs Concurrent Users', fontsize=14, fontweight='bold', pad=20)
plt.grid(True, alpha=0.3)
plt.xticks(users)

# Add value labels
for i, (x, y) in enumerate(zip(users, throughputs)):
    plt.annotate(f'{y:.1f}', (x, y), textcoords="offset points", xytext=(0,10), ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig('screenshots/throughput_graph.png', dpi=300, bbox_inches='tight')
print("✓ Generated throughput_graph.png")
plt.close()

# 3. Error Rate vs Concurrent Users
plt.figure(figsize=(12, 6))
plt.plot(users, error_rates, marker='^', linewidth=2.5, markersize=10, color=colors[2])
plt.xlabel('Concurrent Users', fontsize=12, fontweight='bold')
plt.ylabel('Error Rate (%)', fontsize=12, fontweight='bold')
plt.title('Error Rate vs Concurrent Users', fontsize=14, fontweight='bold', pad=20)
plt.grid(True, alpha=0.3)
plt.xticks(users)
plt.ylim(0, max(error_rates) * 1.2)

# Add value labels
for i, (x, y) in enumerate(zip(users, error_rates)):
    plt.annotate(f'{y:.1f}%', (x, y), textcoords="offset points", xytext=(0,10), ha='center', fontweight='bold')

plt.tight_layout()
plt.savefig('screenshots/error_rate_graph.png', dpi=300, bbox_inches='tight')
print("✓ Generated error_rate_graph.png")
plt.close()

# 4. Combined Metrics Dashboard
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))

# Response Time
ax1.plot(users, avg_response_times, marker='o', linewidth=2, markersize=8, color=colors[0])
ax1.set_xlabel('Concurrent Users', fontweight='bold')
ax1.set_ylabel('Avg Response Time (ms)', fontweight='bold')
ax1.set_title('Response Time Trend', fontweight='bold', fontsize=12)
ax1.grid(True, alpha=0.3)
ax1.set_xticks(users)

# Throughput
ax2.plot(users, throughputs, marker='s', linewidth=2, markersize=8, color=colors[1])
ax2.set_xlabel('Concurrent Users', fontweight='bold')
ax2.set_ylabel('Throughput (req/sec)', fontweight='bold')
ax2.set_title('Throughput Scaling', fontweight='bold', fontsize=12)
ax2.grid(True, alpha=0.3)
ax2.set_xticks(users)

# Error Rate
ax3.plot(users, error_rates, marker='^', linewidth=2, markersize=8, color=colors[2])
ax3.set_xlabel('Concurrent Users', fontweight='bold')
ax3.set_ylabel('Error Rate (%)', fontweight='bold')
ax3.set_title('Error Rate Growth', fontweight='bold', fontsize=12)
ax3.grid(True, alpha=0.3)
ax3.set_xticks(users)

# Resource Utilization
resource_data = data['resource_utilization']
cpu_util = [r['cpu'] for r in resource_data]
mem_util = [r['memory'] for r in resource_data]
db_util = [r['db_connections'] for r in resource_data]

ax4.plot(users, cpu_util, marker='o', label='CPU', linewidth=2, markersize=6)
ax4.plot(users, mem_util, marker='s', label='Memory', linewidth=2, markersize=6)
ax4.plot(users, db_util, marker='^', label='DB Connections', linewidth=2, markersize=6)
ax4.set_xlabel('Concurrent Users', fontweight='bold')
ax4.set_ylabel('Utilization (%)', fontweight='bold')
ax4.set_title('Resource Utilization', fontweight='bold', fontsize=12)
ax4.legend()
ax4.grid(True, alpha=0.3)
ax4.set_xticks(users)

plt.suptitle('JMeter Performance Test Dashboard - Airbnb Clone', fontsize=16, fontweight='bold', y=0.995)
plt.tight_layout()
plt.savefig('screenshots/performance_dashboard.png', dpi=300, bbox_inches='tight')
print("✓ Generated performance_dashboard.png")
plt.close()

# 5. API Endpoint Comparison
endpoints = data['endpoint_metrics']
endpoint_names = [e['endpoint'].split()[-1] for e in endpoints]  # Shorten names
endpoint_times = [e['avg_response_time'] for e in endpoints]
endpoint_errors = [e['error_rate'] for e in endpoints]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

# Response times by endpoint
bars1 = ax1.bar(range(len(endpoint_names)), endpoint_times, color=colors[:len(endpoint_names)])
ax1.set_xlabel('API Endpoint', fontweight='bold')
ax1.set_ylabel('Avg Response Time (ms)', fontweight='bold')
ax1.set_title('Response Time by API Endpoint', fontweight='bold', fontsize=12)
ax1.set_xticks(range(len(endpoint_names)))
ax1.set_xticklabels(endpoint_names, rotation=45, ha='right')
ax1.grid(True, alpha=0.3, axis='y')

# Add value labels on bars
for i, (bar, val) in enumerate(zip(bars1, endpoint_times)):
    height = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2., height,
             f'{val:.1f}ms', ha='center', va='bottom', fontweight='bold')

# Error rates by endpoint
bars2 = ax2.bar(range(len(endpoint_names)), endpoint_errors, color=colors[:len(endpoint_names)])
ax2.set_xlabel('API Endpoint', fontweight='bold')
ax2.set_ylabel('Error Rate (%)', fontweight='bold')
ax2.set_title('Error Rate by API Endpoint', fontweight='bold', fontsize=12)
ax2.set_xticks(range(len(endpoint_names)))
ax2.set_xticklabels(endpoint_names, rotation=45, ha='right')
ax2.grid(True, alpha=0.3, axis='y')

# Add value labels on bars
for i, (bar, val) in enumerate(zip(bars2, endpoint_errors)):
    height = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2., height,
             f'{val:.2f}%', ha='center', va='bottom', fontweight='bold')

plt.tight_layout()
plt.savefig('screenshots/endpoint_comparison.png', dpi=300, bbox_inches='tight')
print("✓ Generated endpoint_comparison.png")
plt.close()

print("\n" + "="*60)
print("All graphs generated successfully!")
print("Screenshots saved in: screenshots/")
print("="*60)
