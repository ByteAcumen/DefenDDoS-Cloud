import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
    stages: [
        { duration: '2m', target: 10 },   // Warm up
        { duration: '5m', target: 100 },  // Normal load
        { duration: '2m', target: 200 },  // Peak load
        { duration: '3m', target: 100 },  // Scale down
        { duration: '2m', target: 0 },    // Cool down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% requests under 500ms
        http_req_failed: ['rate<0.01'],   // Error rate under 1%
        errors: ['rate<0.05'],             // Custom error rate under 5%
    },
};

const BASE_URL = 'http://localhost:8081/api/v1';

// Test data
const testUsers = [
    { email: 'user1@test.com', password: 'Test123!@#' },
    { email: 'user2@test.com', password: 'Test456!@#' },
    { email: 'user3@test.com', password: 'Test789!@#' },
];

export default function () {
    // Select random user
    const user = testUsers[Math.floor(Math.random() * testUsers.length)];

    // Test 1: Health check
    let res = http.get(`${BASE_URL}/health`);
    check(res, {
        'health check status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);

    // Test 2: Login
    res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email: user.email,
        password: user.password,
    }), {
        headers: { 'Content-Type': 'application/json' },
    });

    const loginSuccess = check(res, {
        'login status 200': (r) => r.status === 200,
        'has token': (r) => JSON.parse(r.body).token !== undefined,
    });

    if (!loginSuccess) {
        errorRate.add(1);
        return;
    }

    const token = JSON.parse(res.body).token;

    sleep(2);

    // Test 3: Get traffic stats
    res = http.get(`${BASE_URL}/traffic/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    check(res, {
        'stats status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);

    // Test 4: Get mitigation status
    res = http.get(`${BASE_URL}/mitigation/status`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    check(res, {
        'mitigation status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(2);

    // Test 5: Create traffic event
    res = http.post(`${BASE_URL}/data/events`, JSON.stringify({
        source_ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        request_type: 'GET',
        timestamp: new Date().toISOString(),
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    check(res, {
        'event creation status 201': (r) => r.status === 201 || r.status === 200,
    }) || errorRate.add(1);

    sleep(1);
}

// Optional: Setup function runs once at start
export function setup() {
    console.log('🚀 Starting load test...');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Test users: ${testUsers.length}`);
}

// Optional: Teardown function runs once at end
export function teardown(data) {
    console.log('✅ Load test completed!');
}
