#!/usr/bin/env python3
"""
OWASP ZAP Security Test Runner
Automates security testing for DefenDDoS API
"""

import subprocess
import sys
import os
import time
from pathlib import Path

# Configuration
ZAP_PORT = 8090
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:8080')
ZAP_CONFIG = 'security-tests/zap-automation.yaml'
REPORT_DIR = 'security-tests/reports'

def check_zap_installed():
    """Check if OWASP ZAP is installed"""
    try:
        result = subprocess.run(['zap.sh', '-version'], 
                              capture_output=True, text=True, timeout=10)
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False

def start_api_server():
    """Start the API server if not already running"""
    print("🚀 Checking if API server is running...")
    try:
        import requests
        response = requests.get(f'{API_BASE_URL}/actuator/health', timeout=5)
        if response.status_code == 200:
            print("✅ API server is running")
            return True
    except:
        print("⚠️  API server not running. Please start it first.")
        return False

def create_report_directory():
    """Create reports directory if it doesn't exist"""
    Path(REPORT_DIR).mkdir(parents=True, exist_ok=True)

def run_baseline_scan():
    """Run ZAP baseline scan"""
    print("\n" + "="*60)
    print("🔒 Running OWASP ZAP Baseline Scan")
    print("="*60 + "\n")
    
    cmd = [
        'zap-baseline.py',
        '-t', API_BASE_URL,
        '-r', f'{REPORT_DIR}/baseline-report.html',
        '-J', f'{REPORT_DIR}/baseline-report.json',
        '-w', f'{REPORT_DIR}/baseline-report.md',
        '-d',  # Debug mode
        '-a',  # Include alpha rules
    ]
    
    try:
        result = subprocess.run(cmd, timeout=600)  # 10 minute timeout
        return result.returncode
    except subprocess.TimeoutExpired:
        print("❌ Baseline scan timed out")
        return 1

def run_full_scan():
    """Run ZAP full scan"""
    print("\n" + "="*60)
    print("🔒 Running OWASP ZAP Full Scan")
    print("="*60 + "\n")
    
    cmd = [
        'zap-full-scan.py',
        '-t', API_BASE_URL,
        '-r', f'{REPORT_DIR}/full-report.html',
        '-J', f'{REPORT_DIR}/full-report.json',
        '-w', f'{REPORT_DIR}/full-report.md',
        '-d',  # Debug mode
        '-a',  # Include alpha rules
    ]
    
    try:
        result = subprocess.run(cmd, timeout=3600)  # 1 hour timeout
        return result.returncode
    except subprocess.TimeoutExpired:
        print("❌ Full scan timed out")
        return 1

def run_automation_scan():
    """Run ZAP automation framework scan"""
    print("\n" + "="*60)
    print("🔒 Running OWASP ZAP Automation Scan")
    print("="*60 + "\n")
    
    if not os.path.exists(ZAP_CONFIG):
        print(f"❌ Configuration file not found: {ZAP_CONFIG}")
        return 1
    
    cmd = [
        'zap.sh',
        '-cmd',
        '-autorun', ZAP_CONFIG,
    ]
    
    try:
        result = subprocess.run(cmd, timeout=3600)
        return result.returncode
    except subprocess.TimeoutExpired:
        print("❌ Automation scan timed out")
        return 1

def run_api_scan():
    """Run ZAP API scan using OpenAPI specification"""
    print("\n" + "="*60)
    print("🔒 Running OWASP ZAP API Scan")
    print("="*60 + "\n")
    
    # Check if OpenAPI spec exists
    openapi_spec = '../docs/openapi.yaml'
    if not os.path.exists(openapi_spec):
        print(f"⚠️  OpenAPI spec not found at {openapi_spec}")
        print("   Skipping API scan")
        return 0
    
    cmd = [
        'zap-api-scan.py',
        '-t', openapi_spec,
        '-f', 'openapi',
        '-r', f'{REPORT_DIR}/api-report.html',
        '-J', f'{REPORT_DIR}/api-report.json',
        '-w', f'{REPORT_DIR}/api-report.md',
    ]
    
    try:
        result = subprocess.run(cmd, timeout=1800)  # 30 minute timeout
        return result.returncode
    except subprocess.TimeoutExpired:
        print("❌ API scan timed out")
        return 1

def print_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("📊 Security Test Summary")
    print("="*60)
    
    print(f"\n📁 Reports saved in: {REPORT_DIR}/")
    print("\n📄 Generated reports:")
    
    report_files = list(Path(REPORT_DIR).glob('*'))
    for report in report_files:
        print(f"   - {report.name}")
    
    print("\n⚠️  Review the reports for security vulnerabilities")
    print("   Pay special attention to HIGH and CRITICAL severity issues")

def main():
    """Main execution function"""
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║         OWASP ZAP Security Test Runner                   ║
    ║         DefenDDoS-Cloud Project                          ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    # Check prerequisites
    if not check_zap_installed():
        print("❌ OWASP ZAP is not installed or not in PATH")
        print("\n📖 Installation instructions:")
        print("   https://www.zaproxy.org/download/")
        sys.exit(1)
    
    if not start_api_server():
        sys.exit(1)
    
    create_report_directory()
    
    # Run scans based on command line argument
    scan_type = sys.argv[1] if len(sys.argv) > 1 else 'baseline'
    
    exit_code = 0
    
    if scan_type == 'baseline':
        exit_code = run_baseline_scan()
    elif scan_type == 'full':
        exit_code = run_full_scan()
    elif scan_type == 'automation':
        exit_code = run_automation_scan()
    elif scan_type == 'api':
        exit_code = run_api_scan()
    elif scan_type == 'all':
        exit_code = run_baseline_scan()
        if exit_code == 0:
            exit_code = run_api_scan()
    else:
        print(f"❌ Unknown scan type: {scan_type}")
        print("   Valid options: baseline, full, automation, api, all")
        sys.exit(1)
    
    print_summary()
    
    if exit_code == 0:
        print("\n✅ Security scan completed successfully")
    else:
        print("\n⚠️  Security scan completed with warnings")
    
    sys.exit(exit_code)

if __name__ == '__main__':
    main()
