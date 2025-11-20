import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const trafficIngestTrend = new Trend('traffic_ingest_duration');
const queryTrend = new Trend('query_duration');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Spike to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '5m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms, 99% under 1s
    http_req_failed: ['rate<0.1'],                   // Error rate under 10%
    errors: ['rate<0.1'],
    successful_requests: ['count>10000'],            // At least 10,000 successful requests
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'your-test-token';

// Sample traffic data
function generateTrafficData() {
  const protocols = ['TCP', 'UDP', 'ICMP'];
  const sourceIps = [
    '192.168.1.100',
    '192.168.1.101',
    '192.168.1.102',
    '10.0.0.1',
    '10.0.0.2',
  ];

  return {
    timestamp: new Date().toISOString(),
    sourceIp: sourceIps[Math.floor(Math.random() * sourceIps.length)],
    destinationIp: '10.0.0.1',
    sourcePort: Math.floor(Math.random() * 65535),
    destinationPort: 80,
    protocol: protocols[Math.floor(Math.random() * protocols.length)],
    packetLength: 1000 + Math.floor(Math.random() * 1000),
    flowDuration: 1000 + Math.floor(Math.random() * 5000),
    packetsPerSecond: 50 + Math.random() * 150,
    bytesPerSecond: 100000 + Math.random() * 100000,
  };
}

// Test scenarios
export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
    },
  };

  group('Traffic Ingestion API', () => {
    // Single traffic ingestion
    const trafficData = generateTrafficData();
    const ingestRes = http.post(
      `${BASE_URL}/api/traffic/ingest`,
      JSON.stringify(trafficData),
      params
    );

    const ingestSuccess = check(ingestRes, {
      'ingest status is 200': (r) => r.status === 200,
      'ingest response time < 500ms': (r) => r.timings.duration < 500,
      'ingest has success status': (r) => r.json('status') === 'success',
    });

    if (ingestSuccess) {
      successfulRequests.add(1);
      trafficIngestTrend.add(ingestRes.timings.duration);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
  });

  group('Batch Traffic Ingestion', () => {
    // Batch ingestion (10 records)
    const batchData = Array.from({ length: 10 }, () => generateTrafficData());
    const batchRes = http.post(
      `${BASE_URL}/api/traffic/ingest/batch`,
      JSON.stringify(batchData),
      params
    );

    const batchSuccess = check(batchRes, {
      'batch ingest status is 200': (r) => r.status === 200,
      'batch ingest response time < 1000ms': (r) => r.timings.duration < 1000,
      'batch ingested correct count': (r) => r.json('ingested') === 10,
    });

    if (batchSuccess) {
      successfulRequests.add(1);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }
  });

  group('Query APIs', () => {
    // Get recent traffic
    const recentRes = http.get(`${BASE_URL}/api/traffic/recent?limit=10`, params);

    const querySuccess = check(recentRes, {
      'recent traffic status is 200': (r) => r.status === 200,
      'recent traffic response time < 300ms': (r) => r.timings.duration < 300,
      'recent traffic returns array': (r) => Array.isArray(r.json()),
    });

    if (querySuccess) {
      successfulRequests.add(1);
      queryTrend.add(recentRes.timings.duration);
    } else {
      failedRequests.add(1);
      errorRate.add(1);
    }

    // Get traffic by source IP
    const sourceIpRes = http.get(
      `${BASE_URL}/api/traffic/source/192.168.1.100`,
      params
    );

    check(sourceIpRes, {
      'source IP query status is 200': (r) => r.status === 200,
      'source IP query response time < 400ms': (r) => r.timings.duration < 400,
    });
  });

  group('Statistics API', () => {
    const statsRes = http.get(`${BASE_URL}/api/statistics`, params);

    check(statsRes, {
      'statistics status is 200': (r) => r.status === 200,
      'statistics has required fields': (r) => {
        const data = r.json();
        return (
          data.hasOwnProperty('totalRequests') &&
          data.hasOwnProperty('attacksBlocked') &&
          data.hasOwnProperty('activeConnections')
        );
      },
    });
  });

  group('Threat Detection API', () => {
    const detectionsRes = http.get(`${BASE_URL}/api/threat-detections`, params);

    check(detectionsRes, {
      'threat detections status is 200': (r) => r.status === 200,
      'threat detections returns array': (r) => Array.isArray(r.json()),
    });
  });

  // Think time between requests
  sleep(Math.random() * 3);
}

// Setup function (runs once per VU)
export function setup() {
  console.log('Starting load test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test will simulate realistic traffic patterns`);
}

// Teardown function (runs once after test)
export function teardown(data) {
  console.log('Load test completed');
}
