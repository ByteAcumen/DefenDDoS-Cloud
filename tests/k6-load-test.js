import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const trafficIngested = new Counter('traffic_ingested');

// Configuration
const API_KEY = 'defenddos-secret-key-123';
const BASE_URL = 'http://localhost:8082';

// Test configuration
export const options = {
    stages: [
        { duration: '1m', target: 10 },   // Ramp-up to 10 users
        { duration: '3m', target: 50 },   // Ramp-up to 50 users
        { duration: '5m', target: 100 },  // Ramp-up to 100 users
        { duration: '3m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 50 },   // Ramp-down to 50
        { duration: '1m', target: 0 },    // Ramp-down to 0
    ],
    thresholds: {
        'http_req_duration': ['p(95)<1000', 'p(99)<2000'], // 95% < 1s, 99% < 2s
        'http_req_failed': ['rate<0.01'],                   // Error rate < 1%
        'errors': ['rate<0.05'],                            // Custom error rate < 5%
    },
};

// Headers
const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': API_KEY,
};

// Traffic patterns
const trafficPatterns = [
    // Legitimate traffic
    {
        sourceIp: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        destinationIp: '10.0.0.1',
        packetCount: Math.floor(Math.random() * 1000) + 100,
        byteCount: Math.floor(Math.random() * 500000) + 50000,
        protocol: 'TCP',
    },
    // Bot traffic
    {
        sourceIp: `203.0.113.${Math.floor(Math.random() * 254) + 1}`,
        destinationIp: '10.0.0.1',
        packetCount: Math.floor(Math.random() * 5000) + 1000,
        byteCount: Math.floor(Math.random() * 2000000) + 500000,
        protocol: 'HTTP',
    },
    // Potential attack traffic
    {
        sourceIp: `198.51.100.${Math.floor(Math.random() * 254) + 1}`,
        destinationIp: '10.0.0.1',
        packetCount: Math.floor(Math.random() * 20000) + 10000,
        byteCount: Math.floor(Math.random() * 10000000) + 5000000,
        protocol: 'SYN',
    },
];

export default function () {
    // Select random traffic pattern (60% legitimate, 20% bot, 20% attack)
    const rand = Math.random();
    let pattern;
    if (rand < 0.6) {
        pattern = trafficPatterns[0];
    } else if (rand < 0.8) {
        pattern = trafficPatterns[1];
    } else {
        pattern = trafficPatterns[2];
    }

    // Generate unique traffic data
    const trafficData = {
        sourceIp: `${pattern.sourceIp.split('.').slice(0, 3).join('.')}.${Math.floor(Math.random() * 254) + 1}`,
        destinationIp: pattern.destinationIp,
        packetCount: pattern.packetCount + Math.floor(Math.random() * 1000),
        byteCount: pattern.byteCount + Math.floor(Math.random() * 100000),
        protocol: pattern.protocol,
    };

    // Test 1: Traffic Ingestion
    const ingestResponse = http.post(
        `${BASE_URL}/api/v1/traffic/ingest`,
        JSON.stringify(trafficData),
        { headers }
    );

    const ingestSuccess = check(ingestResponse, {
        'ingestion status is 200': (r) => r.status === 200,
        'ingestion has success field': (r) => JSON.parse(r.body).success === true,
    });

    errorRate.add(!ingestSuccess);
    responseTime.add(ingestResponse.timings.duration);
    if (ingestSuccess) {
        trafficIngested.add(1);
    }

    sleep(0.1);

    // Test 2: Statistics (20% of requests)
    if (Math.random() < 0.2) {
        const statsResponse = http.get(
            `${BASE_URL}/api/v1/statistics/realtime`,
            { headers }
        );

        check(statsResponse, {
            'statistics status is 200': (r) => r.status === 200,
            'statistics has data': (r) => {
                try {
                    const data = JSON.parse(r.body);
                    return data.success === true && data.data !== null;
                } catch (e) {
                    return false;
                }
            },
        });

        errorRate.add(statsResponse.status !== 200);
        sleep(0.1);
    }

    // Test 3: Security Dashboard (10% of requests)
    if (Math.random() < 0.1) {
        const securityResponse = http.get(
            `${BASE_URL}/api/v1/security/dashboard`,
            { headers }
        );

        check(securityResponse, {
            'security dashboard status is 200': (r) => r.status === 200,
            'security has threat count': (r) => {
                try {
                    const data = JSON.parse(r.body);
                    return data.activeThreats !== undefined;
                } catch (e) {
                    return false;
                }
            },
        });

        errorRate.add(securityResponse.status !== 200);
        sleep(0.1);
    }

    // Test 4: IP Check (5% of requests)
    if (Math.random() < 0.05) {
        const checkIpResponse = http.get(
            `${BASE_URL}/api/v1/mitigation/check/${trafficData.sourceIp}`,
            { headers }
        );

        check(checkIpResponse, {
            'IP check status is 200': (r) => r.status === 200,
        });

        errorRate.add(checkIpResponse.status !== 200);
        sleep(0.1);
    }

    sleep(Math.random() * 2); // Random sleep 0-2 seconds
}

export function handleSummary(data) {
    return {
        'test-reports/load-test-summary.json': JSON.stringify(data),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, options) {
    const indent = options.indent || '';
    const colors = options.enableColors;

    let summary = `\n${indent}Load Test Summary\n`;
    summary += `${indent}${'='.repeat(50)}\n\n`;

    // HTTP metrics
    summary += `${indent}HTTP Metrics:\n`;
    summary += `${indent}  Total Requests: ${data.metrics.http_reqs.values.count}\n`;
    summary += `${indent}  Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
    summary += `${indent}  Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}\n`;
    summary += `${indent}  Response Time (p95): ${data.metrics.http_req_duration.values['p(95)']}ms\n`;
    summary += `${indent}  Response Time (p99): ${data.metrics.http_req_duration.values['p(99)']}ms\n\n`;

    // Custom metrics
    summary += `${indent}Custom Metrics:\n`;
    summary += `${indent}  Traffic Ingested: ${data.metrics.traffic_ingested.values.count}\n`;
    summary += `${indent}  Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n\n`;

    // VUs
    summary += `${indent}Virtual Users:\n`;
    summary += `${indent}  Max VUs: ${data.metrics.vus_max.values.max}\n`;
    summary += `${indent}  Active VUs: ${data.metrics.vus.values.value}\n\n`;

    return summary;
}
