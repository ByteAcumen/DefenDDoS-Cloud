import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Stress test configuration - push system to limits
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Quick ramp up
    { duration: '5m', target: 500 },   // Heavy load
    { duration: '2m', target: 1000 },  // Spike test
    { duration: '3m', target: 1000 },  // Sustained spike
    { duration: '5m', target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // More lenient thresholds
    http_req_failed: ['rate<0.2'],      // Allow 20% failure
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'your-test-token';

function generateTrafficData() {
  return {
    timestamp: new Date().toISOString(),
    sourceIp: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    destinationIp: '10.0.0.1',
    sourcePort: Math.floor(Math.random() * 65535),
    destinationPort: 80,
    protocol: 'TCP',
    packetLength: 1500,
    flowDuration: 1000,
    packetsPerSecond: 100,
    bytesPerSecond: 150000,
  };
}

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  };

  // Aggressive batch ingestion
  const batchSize = 50;
  const batchData = Array.from({ length: batchSize }, () => generateTrafficData());

  const res = http.post(
    `${BASE_URL}/api/traffic/ingest/batch`,
    JSON.stringify(batchData),
    params
  );

  const success = check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(0.1); // Minimal sleep for maximum stress
}
