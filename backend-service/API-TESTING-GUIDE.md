# DefenDDoS Backend API Testing Guide

## Overview
This guide provides comprehensive instructions for testing the DefenDDoS backend service using the clean HTTP request files.

## Prerequisites
- Backend service running on `http://localhost:8081`
- Authentication: `admin:SecurePassword123` (Base64: `YWRtaW46U2VjdXJlUGFzc3dvcmQxMjM=`)
- VS Code with REST Client extension OR any HTTP client (Postman, curl, etc.)

## Test Files
- `requests-clean.http` - Complete, organized test suite
- `requests.http` - Legacy test file (comprehensive but unorganized)

## Testing Categories

### 1. Health & Monitoring Tests 🏥
**Purpose**: Verify system status and monitoring capabilities
- Health check endpoint
- Application info and build details  
- Prometheus metrics for monitoring
- General system metrics

**Expected Results**: 
- Health: `UP` status
- Metrics: Prometheus format data
- Info: Application metadata

### 2. Traffic Data Management 📊
**Purpose**: Test traffic ingestion and querying
- Normal traffic patterns (150 packets/min)
- Medium traffic (1,500 packets/min) → LOW alert
- High traffic (8,000 packets/min) → MEDIUM alert  
- Critical traffic (20,000 packets/min) → HIGH alert + auto-block
- Extreme traffic (60,000+ packets/min) → CRITICAL alert + immediate block

**Expected Results**:
- Successful ingestion with proper logging
- Alert generation at appropriate thresholds
- Automatic mitigation for HIGH/CRITICAL threats

### 3. Security & Threat Detection 🛡️
**Purpose**: Validate detection algorithms and security features
- Security dashboard overview
- IP behavior analysis
- Alert system testing
- Threat classification verification

**Expected Results**:
- Dashboard shows current threat levels
- IP analysis provides detailed behavior metrics
- Alerts sent successfully via configured channels

### 4. IP Mitigation & Blocking 🚫
**Purpose**: Test automated and manual IP management
- Mitigation service status
- Blocked IP management
- Manual blocking/unblocking
- Bulk operations
- Emergency procedures

**Expected Results**:
- IPs blocked automatically on HIGH/CRITICAL threats
- Manual blocking/unblocking works correctly
- Bulk operations process all IPs
- Blocked IP tracking accurate

## Test Execution Order

### Quick Validation Sequence
1. **Health Check**: `GET /actuator/health`
2. **Security Dashboard**: `GET /api/v1/security/dashboard` 
3. **Mitigation Status**: `GET /api/v1/mitigation/status`
4. **Normal Traffic**: POST low-volume traffic data
5. **System Status**: Re-check dashboard for changes

### Complete Threat Simulation
1. **Baseline**: Check all status endpoints
2. **Escalation**: Send increasingly severe traffic
3. **Monitoring**: Watch alerts and auto-mitigation
4. **Verification**: Confirm IPs blocked appropriately
5. **Recovery**: Test unblocking and system reset

### Rate Limiting Validation
1. **Rapid Requests**: Send multiple requests quickly
2. **Monitor**: Check for 429 (Too Many Requests) responses
3. **Recovery**: Wait for rate limit reset

## Alert Thresholds

| Threat Level | Packets/Min | Expected Action |
|-------------|-------------|-----------------|
| NORMAL      | < 1,000     | No action       |
| LOW         | 1,000+      | Log alert       |
| MEDIUM      | 5,000+      | Email alert     |  
| HIGH        | 15,000+     | Auto-block IP   |
| CRITICAL    | 50,000+     | Immediate block |

## Expected Log Output

### Normal Operation
```
INFO  - Successfully ingested traffic data from source IP: 192.168.1.100, bytes: 65000, packets: 150
DEBUG - Starting anomaly detection scan...
```

### Threat Detection
```
WARN  - [THREAT DETECTED] HIGH level threat from IP: 198.51.100.42. Packets in last minute: 20000
INFO  - Successfully applied mitigation for IP: 198.51.100.42 (HIGH)
INFO  - [SIMULATION] iptables -A INPUT -s 198.51.100.42 -j DROP
```

### Mitigation Actions
```
INFO  - Blocking IP: 203.0.113.88 for reason: Manual block - suspicious activity detected
INFO  - Successfully blocked IP: 203.0.113.88. Total blocked IPs: 1
```

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Check authentication credentials
2. **503 Service Unavailable**: InfluxDB connection issues
3. **429 Too Many Requests**: Rate limiting active
4. **500 Internal Server Error**: Check logs for exceptions

### Debugging Steps
1. Check service logs: `tail -f logs/defenddos-backend.log`
2. Verify InfluxDB connectivity: `curl http://localhost:8086/ping`
3. Test authentication: Use correct Base64 encoding
4. Monitor resource usage: Check memory/CPU consumption

## Production Considerations

### Security Notes
- Change default credentials before production deployment
- Configure real SMTP server for alert notifications
- Set up proper SSL/TLS certificates
- Implement network-level security controls

### Performance Tuning
- Adjust detection thresholds based on normal traffic patterns
- Configure rate limiting per your requirements
- Set appropriate log levels for production
- Monitor system resources under load

## API Response Examples

### Successful Traffic Ingestion
```json
{
  "success": true,
  "message": "Traffic data ingested successfully",
  "timestamp": 1725960600000
}
```

### Security Dashboard
```json
{
  "activeThreats": 2,
  "lastScan": "2025-09-10T11:30:00Z",
  "systemHealth": "healthy",
  "detectionEnabled": true,
  "alertsEnabled": true,
  "status": "operational"
}
```

### Mitigation Status
```json
{
  "enabled": true,
  "dryRunMode": true,
  "blockedCount": 3,
  "maxBlockedIps": 100,
  "blockScriptPath": "/usr/local/bin/block_ip.sh",
  "unblockScriptPath": "/usr/local/bin/unblock_ip.sh"
}
```

## Next Steps
After testing the backend thoroughly:
1. Set up monitoring dashboards (Grafana + Prometheus)
2. Deploy frontend dashboard for visual management
3. Configure production environment with real SMTP
4. Implement additional security layers
5. Set up automated deployment pipelines
