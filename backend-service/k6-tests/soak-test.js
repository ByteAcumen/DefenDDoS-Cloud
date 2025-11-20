import http from 'k6/http';
import { check, sleep } from 'k6';

// Soak test - sustained load over extended period
export const options = {
  stages: [
    { duration: '5m', target: 100 },    // Ramp up
    { duration: '4h', target: 100 },    // Sustained load for 4 hours
    { duration: '5m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
    http_reqs: ['rate>50'], // At least 50 req/s
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'your-test-token';

function generateTrafficData() {
  return {
    timestamp: new Date().toISOString(),
    sourceIp: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    destinationIp: '10.0.0.1',
    sourcePort: Math.floor(Math.random() * 65535),
    destinationPort: 80,
    protocol: 'TCP',
    packetLength: 1200,
    flowDuration: 1500,
    packetsPerSecond: 80,
    bytesPerSecond: 96000,
  };
}

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  };

  // Mix of operations
  if (Math.random() < 0.7) {
    // 70% ingestion
    const trafficData = generateTrafficData();
    http.post(
      `${BASE_URL}/api/traffic/ingest`,
      JSON.stringify(trafficData),
      params
    );
  } else {
    // 30% queries
    const endpoint = Math.random() < 0.5 
      ? '/api/traffic/recent?limit=10'
      : '/api/statistics';
    
    http.get(`${BASE_URL}${endpoint}`, params);
  }

  sleep(2 + Math.random() * 3); // 2-5 seconds between requests
}
