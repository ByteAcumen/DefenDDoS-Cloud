import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const attackRate = new Rate('attack_blocked');
const legitimateRate = new Rate('legitimate_served');

// DDoS simulation configuration
export const options = {
    scenarios: {
        // Scenario 1: DDoS Attack (HTTP Flood)
        ddos_flood: {
            executor: 'constant-arrival-rate',
            rate: 1000, // 1000 requests per second
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 500,
            maxVUs: 1000,
        },
        // Scenario 2: Legitimate Users (should still work)
        legitimate_users: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '1m', target: 50 },
                { duration: '3m', target: 50 },
                { duration: '1m', target: 0 },
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        // DDoS should be blocked
        'attack_blocked': ['rate>0.8'], // 80% of attacks should be blocked
        // Legit users should work
        'legitimate_served': ['rate>0.95'], // 95% of legit requests should work
    },
};

const BASE_URL = 'http://localhost:8081/api/v1';

// Generate random IP for DDoS simulation
function randomIP() {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

export default function () {
    const scenario = __ENV.SCENARIO || 'ddos_flood';

    if (scenario === 'ddos_flood') {
        // DDoS Attack Pattern
        const attackPatterns = [
            // Pattern 1: Rapid GET requests
            () => {
                const res = http.get(`${BASE_URL}/traffic/stats`, {
                    headers: {
                        'X-Forwarded-For': randomIP(),
                        'User-Agent': 'AttackBot',
                    },
                });

                // Check if attack was blocked (429 Too Many Requests or 403 Forbidden)
                if (res.status === 429 || res.status === 403) {
                    attackRate.add(1); // Attack blocked ✅
                } else {
                    attackRate.add(0); // Attack went through ❌
                }
            },

            // Pattern 2: Invalid endpoints
            () => {
                const res = http.get(`${BASE_URL}/invalid/endpoint/${Math.random()}`, {
                    headers: {
                        'X-Forwarded-For': randomIP(),
                    },
                });

                if (res.status === 404 || res.status === 429) {
                    attackRate.add(1);
                } else {
                    attackRate.add(0);
                }
            },

            // Pattern 3: Malformed requests
            () => {
                const res = http.post(`${BASE_URL}/auth/login`, '{"invalid":json', {
                    headers: {
                        'X-Forwarded-For': randomIP(),
                        'Content-Type': 'application/json',
                    },
                });

                if (res.status === 400 || res.status === 429) {
                    attackRate.add(1);
                } else {
                    attackRate.add(0);
                }
            },
        ];

        // Execute random attack pattern
        const pattern = attackPatterns[Math.floor(Math.random() * attackPatterns.length)];
        pattern();

    } else if (scenario === 'legitimate_users') {
        // Legitimate User Pattern

        // Test 1: Login
        let res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
            email: 'legituser@defenddos.com',
            password: 'SecurePass123!',
        }), {
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': '10.0.0.1', // Whitelisted IP
            },
        });

        const loginSuccess = check(res, {
            'legit login status 200': (r) => r.status === 200,
        });

        if (loginSuccess) {
            legitimateRate.add(1); // Legitimate user served ✅

            const token = JSON.parse(res.body).token;

            sleep(2);

            // Test 2: Access protected resource
            res = http.get(`${BASE_URL}/traffic/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Forwarded-For': '10.0.0.1',
                },
            });

            check(res, {
                'legit stats access 200': (r) => r.status === 200,
            });

            sleep(3);
        } else {
            legitimateRate.add(0); // Legitimate user blocked ❌ (bad!)
        }
    }
}

// Setup
export function setup() {
    console.log('🔴 Starting DDoS Simulation...');
    console.log('⚔️  Attack: HTTP Flood (1000 req/s)');
    console.log('✅ Legitimate Users: 50 concurrent');
    console.log('🎯 Goal: Block attacks, serve legit users');
}

// Teardown
export function teardown(data) {
    console.log('✅ DDoS Simulation Complete!');
    console.log('Check metrics for attack_blocked and legitimate_served rates.');
}
