#!/bin/bash

# DefenDDoS IP Blocking Script
# Usage: block_ip.sh <IP_ADDRESS> [REASON]

# Exit on error
set -e

# Check if IP address is provided
if [ -z "$1" ]; then
    echo "ERROR: IP address is required"
    echo "Usage: $0 <IP_ADDRESS> [REASON]"
    exit 1
fi

IP_ADDRESS="$1"
REASON="${2:-DDoS Protection}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/app/logs/blocked_ips.log"

# Validate IP address format
if ! echo "$IP_ADDRESS" | grep -E '^([0-9]{1,3}\.){3}[0-9]{1,3}$' > /dev/null; then
    echo "ERROR: Invalid IP address format: $IP_ADDRESS"
    exit 1
fi

# Check if IP is already blocked
if iptables -L INPUT -n | grep -q "$IP_ADDRESS" 2>/dev/null; then
    echo "INFO: IP $IP_ADDRESS is already blocked"
    exit 0
fi

# Block the IP using iptables
echo "INFO: Blocking IP $IP_ADDRESS - Reason: $REASON"

# Add iptables rule to drop packets from the IP
iptables -I INPUT -s "$IP_ADDRESS" -j DROP

# Log the action
echo "[$TIMESTAMP] BLOCKED: $IP_ADDRESS - Reason: $REASON" >> "$LOG_FILE"

# Verify the rule was added
if iptables -L INPUT -n | grep -q "$IP_ADDRESS"; then
    echo "SUCCESS: IP $IP_ADDRESS has been blocked"
    exit 0
else
    echo "ERROR: Failed to block IP $IP_ADDRESS"
    exit 1
fi