#!/bin/bash

# DefenDDoS IP Unblocking Script
# Usage: unblock_ip.sh <IP_ADDRESS>

# Exit on error
set -e

# Check if IP address is provided
if [ -z "$1" ]; then
    echo "ERROR: IP address is required"
    echo "Usage: $0 <IP_ADDRESS>"
    exit 1
fi

IP_ADDRESS="$1"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="/app/logs/blocked_ips.log"

# Validate IP address format
if ! echo "$IP_ADDRESS" | grep -E '^([0-9]{1,3}\.){3}[0-9]{1,3}$' > /dev/null; then
    echo "ERROR: Invalid IP address format: $IP_ADDRESS"
    exit 1
fi

# Check if IP is currently blocked
if ! iptables -L INPUT -n | grep -q "$IP_ADDRESS" 2>/dev/null; then
    echo "INFO: IP $IP_ADDRESS is not currently blocked"
    exit 0
fi

# Remove the iptables rule
echo "INFO: Unblocking IP $IP_ADDRESS"

# Remove iptables rule that drops packets from the IP
iptables -D INPUT -s "$IP_ADDRESS" -j DROP

# Log the action
echo "[$TIMESTAMP] UNBLOCKED: $IP_ADDRESS" >> "$LOG_FILE"

# Verify the rule was removed
if ! iptables -L INPUT -n | grep -q "$IP_ADDRESS"; then
    echo "SUCCESS: IP $IP_ADDRESS has been unblocked"
    exit 0
else
    echo "ERROR: Failed to unblock IP $IP_ADDRESS"
    exit 1
fi