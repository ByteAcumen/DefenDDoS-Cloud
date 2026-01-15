#!/usr/bin/env python3
"""
DefenDDoS ML Model Testing Script
Tests both Random Forest and LSTM models with various traffic patterns
"""

import requests
import json
import time
from typing import Dict, List
import statistics

# Configuration
BACKEND_URL = "http://localhost:8082"
ML_SERVICE_URL = "http://localhost:8000"

# ANSI color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text: str):
    """Print formatted header"""
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*80}")
    print(f"{text:^80}")
    print(f"{'='*80}{Colors.END}\n")

def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def print_info(text: str):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ {text}{Colors.END}")

# Test traffic patterns
TRAFFIC_PATTERNS = {
    "benign_normal": {
        "name": "Normal Benign Traffic",
        "sourceIp": "192.168.1.100",
        "destinationIp": "10.0.0.1",
        "packetCount": 150,
        "byteCount": 75000,
        "expected": "BENIGN"
    },
    "syn_flood": {
        "name": "SYN Flood Attack",
        "sourceIp": "203.0.113.50",
        "destinationIp": "10.0.0.1",
        "packetCount": 50000,
        "byteCount": 2000000,
        "expected": "ATTACK"
    },
    "udp_flood": {
        "name": "UDP Flood Attack",
        "sourceIp": "198.51.100.25",
        "destinationIp": "10.0.0.1",
        "packetCount": 30000,
        "byteCount": 4500000,
        "expected": "ATTACK"
    },
    "http_flood": {
        "name": "HTTP Flood Attack",
        "sourceIp": "185.220.101.50",
        "destinationIp": "10.0.0.1",
        "packetCount": 5000,
        "byteCount": 25000000,
        "expected": "ATTACK"
    },
    "icmp_flood": {
        "name": "ICMP Flood (Ping of Death)",
        "sourceIp": "45.142.120.10",
        "destinationIp": "10.0.0.1",
        "packetCount": 100000,
        "byteCount": 500000,
        "expected": "ATTACK"
    },
    "dns_amplification": {
        "name": "DNS Amplification Attack",
        "sourceIp": "91.203.45.80",
        "destinationIp": "10.0.0.1",
        "packetCount": 8000,
        "byteCount": 80000000,
        "expected": "ATTACK"
    },
    "benign_heavy": {
        "name": "Heavy Legitimate Traffic",
        "sourceIp": "10.0.0.150",
        "destinationIp": "10.0.0.1",
        "packetCount": 800,
        "byteCount": 450000,
        "expected": "BENIGN"
    }
}

def check_services():
    """Check if all services are running"""
    print_header("Checking Service Health")
    
    all_healthy = True
    
    # Check Backend
    try:
        response = requests.get(f"{BACKEND_URL}/actuator/health", timeout=5)
        if response.status_code == 200 and response.json().get("status") == "UP":
            print_success(f"Backend API is UP ({BACKEND_URL})")
        else:
            print_error("Backend API is DOWN or unhealthy")
            all_healthy = False
    except Exception as e:
        print_error(f"Cannot connect to Backend API: {e}")
        all_healthy = False
    
    # Check ML Service
    try:
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print_success(f"ML Service is UP ({ML_SERVICE_URL})")
                print_info(f"  - Random Forest: {'Loaded' if data.get('rf_model_loaded') else 'Not Loaded'}")
                print_info(f"  - LSTM Model: {'Loaded' if data.get('lstm_model_loaded') else 'Not Loaded'}")
            else:
                print_error("ML Service is unhealthy")
                all_healthy = False
        else:
            print_error("ML Service returned non-200 status")
            all_healthy = False
    except Exception as e:
        print_error(f"Cannot connect to ML Service: {e}")
        all_healthy = False
    
    if not all_healthy:
        print_warning("\n⚠️  Some services are not running. Please start all services:")
        print_info("  1. Backend: cd backend-service && .\\mvnw.cmd spring-boot:run")
        print_info("  2. ML Service: cd backend-service/ml-service && python main.py")
        print_info("  3. InfluxDB: cd backend-service && docker-compose up -d influxdb")
        return False
    
    return True

def test_traffic_pattern(pattern_key: str, pattern: Dict):
    """Test a single traffic pattern"""
    print(f"\n{Colors.BOLD}Testing: {pattern['name']}{Colors.END}")
    print(f"  Source IP: {pattern['sourceIp']}")
    print(f"  Packets: {pattern['packetCount']:,} | Bytes: {pattern['byteCount']:,}")
    
    traffic_data = {
        "sourceIp": pattern["sourceIp"],
        "destinationIp": pattern["destinationIp"],
        "packetCount": pattern["packetCount"],
        "byteCount": pattern["byteCount"]
    }
    
    try:
        # Send to backend for ML prediction
        start_time = time.time()
        response = requests.post(
            f"{BACKEND_URL}/api/v1/traffic/predict-attack",
            json=traffic_data,
            timeout=10
        )
        latency = (time.time() - start_time) * 1000  # Convert to milliseconds
        
        if response.status_code in [200, 201]:
            result = response.json()
            
            if result.get("success"):
                data = result.get("data", {})
                is_attack = data.get("is_attack", False)
                attack_type = data.get("attack_type", "UNKNOWN")
                confidence = data.get("confidence", 0.0)
                severity = data.get("severity", "UNKNOWN")
                model_used = data.get("model_used", "UNKNOWN")
                
                # Check if prediction matches expected
                predicted = "ATTACK" if is_attack else "BENIGN"
                is_correct = predicted == pattern["expected"]
                
                # Print results
                if is_correct:
                    print_success(f"  ✓ Correct Prediction: {predicted}")
                else:
                    print_error(f"  ✗ Wrong Prediction: {predicted} (Expected: {pattern['expected']})")
                
                print(f"  {Colors.WHITE}├─ Attack Type: {Colors.BOLD}{attack_type}{Colors.END}")
                print(f"  {Colors.WHITE}├─ Confidence: {Colors.BOLD}{confidence*100:.2f}%{Colors.END}")
                print(f"  {Colors.WHITE}├─ Severity: {Colors.BOLD}{severity}{Colors.END}")
                print(f"  {Colors.WHITE}├─ Model Used: {Colors.BOLD}{model_used}{Colors.END}")
                print(f"  {Colors.WHITE}└─ Latency: {Colors.BOLD}{latency:.2f}ms{Colors.END}")
                
                return {
                    "success": True,
                    "correct": is_correct,
                    "latency": latency,
                    "confidence": confidence,
                    "severity": severity
                }
            else:
                print_error(f"  Prediction failed: {result.get('message')}")
                return {"success": False, "correct": False, "latency": latency}
        else:
            print_error(f"  HTTP Error: {response.status_code}")
            return {"success": False, "correct": False, "latency": 0}
            
    except Exception as e:
        print_error(f"  Exception: {e}")
        return {"success": False, "correct": False, "latency": 0}

def run_performance_benchmark(num_requests: int = 100):
    """Run performance benchmark"""
    print_header(f"Performance Benchmark ({num_requests} requests)")
    
    test_data = {
        "sourceIp": "203.0.113.100",
        "destinationIp": "10.0.0.1",
        "packetCount": 50000,
        "byteCount": 2000000
    }
    
    latencies = []
    successful = 0
    failed = 0
    
    print(f"Sending {num_requests} prediction requests...")
    
    for i in range(num_requests):
        try:
            start_time = time.time()
            response = requests.post(
                f"{BACKEND_URL}/api/v1/traffic/predict-attack",
                json=test_data,
                timeout=10
            )
            latency = (time.time() - start_time) * 1000
            
            if response.status_code in [200, 201]:
                latencies.append(latency)
                successful += 1
            else:
                failed += 1
                
            # Progress indicator
            if (i + 1) % 10 == 0:
                print(f"  Progress: {i+1}/{num_requests} ({(i+1)/num_requests*100:.1f}%)")
                
        except Exception as e:
            failed += 1
    
    if latencies:
        print(f"\n{Colors.BOLD}Benchmark Results:{Colors.END}")
        print(f"  {Colors.GREEN}├─ Successful Requests: {successful}/{num_requests} ({successful/num_requests*100:.1f}%){Colors.END}")
        print(f"  {Colors.RED}├─ Failed Requests: {failed}{Colors.END}")
        print(f"  {Colors.CYAN}├─ Average Latency: {statistics.mean(latencies):.2f}ms{Colors.END}")
        print(f"  {Colors.CYAN}├─ Median Latency: {statistics.median(latencies):.2f}ms{Colors.END}")
        print(f"  {Colors.CYAN}├─ Min Latency: {min(latencies):.2f}ms{Colors.END}")
        print(f"  {Colors.CYAN}├─ Max Latency: {max(latencies):.2f}ms{Colors.END}")
        print(f"  {Colors.CYAN}├─ 95th Percentile: {sorted(latencies)[int(len(latencies)*0.95)]:.2f}ms{Colors.END}")
        print(f"  {Colors.CYAN}└─ Throughput: {1000/statistics.mean(latencies):.2f} requests/second{Colors.END}")
    else:
        print_error("No successful requests to calculate benchmarks")

def main():
    """Main test execution"""
    print_header("DefenDDoS ML Model Testing Suite")
    print(f"{Colors.WHITE}Testing dual ML models: Random Forest + LSTM Autoencoder{Colors.END}")
    
    # Check services
    if not check_services():
        return
    
    # Test all traffic patterns
    print_header("Testing Traffic Patterns")
    
    results = {}
    total_tests = 0
    correct_predictions = 0
    total_latency = 0
    
    for pattern_key, pattern in TRAFFIC_PATTERNS.items():
        result = test_traffic_pattern(pattern_key, pattern)
        results[pattern_key] = result
        
        if result["success"]:
            total_tests += 1
            if result["correct"]:
                correct_predictions += 1
            total_latency += result["latency"]
    
    # Summary
    print_header("Test Summary")
    
    if total_tests > 0:
        accuracy = (correct_predictions / total_tests) * 100
        avg_latency = total_latency / total_tests
        
        print(f"{Colors.BOLD}Detection Accuracy:{Colors.END}")
        print(f"  ├─ Total Tests: {total_tests}")
        print(f"  ├─ Correct Predictions: {correct_predictions}")
        print(f"  ├─ Wrong Predictions: {total_tests - correct_predictions}")
        print(f"  └─ Accuracy: {Colors.GREEN}{Colors.BOLD}{accuracy:.1f}%{Colors.END}")
        
        print(f"\n{Colors.BOLD}Performance:{Colors.END}")
        print(f"  └─ Average Latency: {Colors.CYAN}{Colors.BOLD}{avg_latency:.2f}ms{Colors.END}")
        
        # Attack breakdown
        print(f"\n{Colors.BOLD}Pattern Results:{Colors.END}")
        for pattern_key, result in results.items():
            if result["success"]:
                pattern = TRAFFIC_PATTERNS[pattern_key]
                status = "✓" if result["correct"] else "✗"
                color = Colors.GREEN if result["correct"] else Colors.RED
                print(f"  {color}{status} {pattern['name']}: {result['confidence']*100:.1f}% confidence{Colors.END}")
    else:
        print_error("No tests completed successfully")
    
    # Optional: Run performance benchmark
    print()
    run_benchmark = input(f"{Colors.YELLOW}Run performance benchmark (100 requests)? [y/N]: {Colors.END}").lower()
    if run_benchmark == 'y':
        run_performance_benchmark(100)
    
    print_header("Testing Complete")
    print(f"{Colors.GREEN}{Colors.BOLD}All ML model tests finished!{Colors.END}")
    print(f"{Colors.WHITE}Check the DefenDDoS dashboard at http://localhost:3000 for real-time results{Colors.END}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Testing interrupted by user{Colors.END}")
    except Exception as e:
        print(f"\n\n{Colors.RED}Fatal error: {e}{Colors.END}")
