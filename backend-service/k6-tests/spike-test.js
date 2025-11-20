import http from 'k6/http';
import { check, sleep } from 'k6';

// Spike test - sudden traffic surge
export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Normal load
    { duration: '30s', target: 1000 }, // Sudden spike
    { duration: '2m', target: 1000 },  // Sustained spike
    { duration: '1m', target: 50 },    // Back to normal
    { duration: '30s', target: 2000 }, // Another bigger spike
    { duration: '2m', target: 2000 },  // Sustained
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.3'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'your-test-token';

function generateTrafficData() {
  return {
    timestamp: new Date().toISOString(),
    sourceIp: `203.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    destinationIp: '10.0.0.1',
    sourcePort: Math.floor(Math.random() * 65535),
    destinationPort: 443,
    protocol: 'TCP',
    packetLength: 2000,
    flowDuration: 2000,
    packetsPerSecond: 200,
    bytesPerSecond: 400000,
  };
}

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  };

  const trafficData = generateTrafficData();
  const res = http.post(
    `${BASE_URL}/api/traffic/ingest`,
    JSON.stringify(trafficData),
    params
  );

  check(res, {
    'status is 200, 429, or 503': (r) => 
      r.status === 200 || r.status === 429 || r.status === 503,
  });

  sleep(0.5);
}
