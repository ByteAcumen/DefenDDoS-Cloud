import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const API_KEY = 'defenddos-secret-key-123';
const BASE_URL = 'http://localhost:8082';

// Spike test - sudden traffic surges
export const options = {
    stages: [
        { duration: '30s', target: 50 },   // Normal load
        { duration: '30s', target: 500 },  // SPIKE!
        { duration: '1m', target: 50 },    // Return to normal
        { duration: '30s', target: 800 },  // BIGGER SPIKE!
        { duration: '1m', target: 50 },    // Return to normal
        { duration: '30s', target: 0 },    // Cooldown
    ],
    thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'errors': ['rate<0.05'],
    },
};

const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': API_KEY,
};

export default function () {
    const trafficData = {
        sourceIp: `203.0.113.${Math.floor(Math.random() * 254) + 1}`,
        destinationIp: '10.0.0.1',
        packetCount: Math.floor(Math.random() * 30000) + 5000,
        byteCount: Math.floor(Math.random() * 15000000) + 2500000,
        protocol: 'TCP',
    };

    const response = http.post(
        `${BASE_URL}/api/v1/traffic/ingest`,
        JSON.stringify(trafficData),
        { headers }
    );

    const success = check(response, {
        'spike handling status OK': (r) => r.status === 200 || r.status === 429,
    });

    errorRate.add(!success);
    sleep(0.05);
}

export function handleSummary(data) {
    console.log('\n=== SPIKE TEST RESULTS ===');
    console.log(`Max VUs: ${data.metrics.vus_max.values.max}`);
    console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
    console.log(`Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%`);
    console.log(`Peak Req/s: ${data.metrics.http_reqs.values.rate.toFixed(2)}`);
    
    if (data.metrics.errors.values.rate < 0.05) {
        console.log('\n✅ System handled traffic spikes well');
    } else {
        console.log('\n⚠️ System struggled with traffic spikes');
    }

    return {
        'test-reports/spike-test-summary.json': JSON.stringify(data),
    };
}
