import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const API_KEY = 'defenddos-secret-key-123';
const BASE_URL = 'http://localhost:8082';

// Smoke test - minimal load to verify system works
export const options = {
    vus: 5,               // 5 virtual users
    duration: '2m',       // 2 minutes
    thresholds: {
        'http_req_duration': ['p(95)<500'],  // 95% of requests < 500ms
        'http_req_failed': ['rate<0.01'],    // Error rate < 1%
    },
};

const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': API_KEY,
};

export default function () {
    // Test 1: Health check
    const healthResponse = http.get(`${BASE_URL}/actuator/health`);
    
    check(healthResponse, {
        'health check is 200': (r) => r.status === 200,
    });
    
    sleep(1);

    // Test 2: Simple traffic ingestion
    const trafficData = {
        sourceIp: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        destinationIp: '10.0.0.1',
        packetCount: 100,
        byteCount: 50000,
        protocol: 'TCP',
    };

    const ingestResponse = http.post(
        `${BASE_URL}/api/v1/traffic/ingest`,
        JSON.stringify(trafficData),
        { headers }
    );

    const success = check(ingestResponse, {
        'ingestion status is 200': (r) => r.status === 200,
        'response has success field': (r) => {
            try {
                return JSON.parse(r.body).success === true;
            } catch (e) {
                return false;
            }
        },
    });

    errorRate.add(!success);
    sleep(2);

    // Test 3: Statistics endpoint
    const statsResponse = http.get(
        `${BASE_URL}/api/v1/statistics/realtime`,
        { headers }
    );

    check(statsResponse, {
        'statistics status is 200': (r) => r.status === 200,
    });

    sleep(1);
}

export function handleSummary(data) {
    console.log('\n=== SMOKE TEST RESULTS ===');
    console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
    console.log(`Failed Requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
    console.log(`Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
    console.log(`P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
    
    if (data.metrics.http_req_failed.values.rate < 0.01) {
        console.log('\n✅ SMOKE TEST PASSED - System is ready for load testing');
    } else {
        console.log('\n❌ SMOKE TEST FAILED - Fix issues before load testing');
    }

    return {
        'test-reports/smoke-test-summary.json': JSON.stringify(data),
    };
}
