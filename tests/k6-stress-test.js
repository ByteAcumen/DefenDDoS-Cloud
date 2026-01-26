import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const API_KEY = 'defenddos-secret-key-123';
const BASE_URL = 'http://localhost:8082';

// Stress test - find the breaking point
export const options = {
    stages: [
        { duration: '2m', target: 50 },    // Ramp-up to 50
        { duration: '5m', target: 100 },   // Ramp-up to 100
        { duration: '5m', target: 200 },   // Ramp-up to 200
        { duration: '5m', target: 300 },   // Ramp-up to 300
        { duration: '5m', target: 400 },   // Ramp-up to 400
        { duration: '3m', target: 500 },   // Ramp-up to 500 (stress)
        { duration: '5m', target: 0 },     // Ramp-down to 0 (recovery)
    ],
    thresholds: {
        'http_req_duration': ['p(95)<3000'],  // Allow higher response times
        'errors': ['rate<0.1'],                // Allow 10% error rate at peak
    },
};

const headers = {
    'Content-Type': 'application/json',
    'X-API-KEY': API_KEY,
};

export default function () {
    // Heavy attack traffic simulation
    const attackData = {
        sourceIp: `198.51.100.${Math.floor(Math.random() * 254) + 1}`,
        destinationIp: '10.0.0.1',
        packetCount: Math.floor(Math.random() * 50000) + 20000,
        byteCount: Math.floor(Math.random() * 25000000) + 10000000,
        protocol: 'SYN_FLOOD',
    };

    const start = Date.now();
    const response = http.post(
        `${BASE_URL}/api/v1/traffic/ingest`,
        JSON.stringify(attackData),
        { headers }
    );
    const duration = Date.now() - start;

    const success = check(response, {
        'status is 200 or 429': (r) => r.status === 200 || r.status === 429, // Allow rate limiting
        'response time < 5s': () => duration < 5000,
    });

    errorRate.add(!success);
    responseTime.add(duration);

    // Very short sleep to maintain high load
    sleep(0.01);
}

export function handleSummary(data) {
    const maxVUs = data.metrics.vus_max.values.max;
    const errorRateValue = data.metrics.errors.values.rate;
    const p95 = data.metrics.http_req_duration.values['p(95)'];
    const totalRequests = data.metrics.http_reqs.values.count;

    console.log('\n=== STRESS TEST RESULTS ===');
    console.log(`Max Virtual Users: ${maxVUs}`);
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Error Rate: ${(errorRateValue * 100).toFixed(2)}%`);
    console.log(`P95 Response Time: ${p95.toFixed(2)}ms`);
    console.log(`Requests/sec (avg): ${data.metrics.http_reqs.values.rate.toFixed(2)}`);

    // Determine breaking point
    let breakingPoint = 'Not reached';
    if (errorRateValue > 0.05) {
        breakingPoint = `~${maxVUs} concurrent users (${(errorRateValue * 100).toFixed(1)}% error rate)`;
    }

    console.log(`\n🔥 Breaking Point: ${breakingPoint}`);
    console.log(`💡 System handled max ${totalRequests} requests`);

    return {
        'test-reports/stress-test-summary.json': JSON.stringify(data),
        'test-reports/stress-test-report.html': htmlReport(data, breakingPoint),
    };
}

function htmlReport(data, breakingPoint) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Stress Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        .metric { display: inline-block; width: 30%; margin: 10px 1%; padding: 20px; background: #f8f9fa; border-left: 4px solid #007bff; border-radius: 5px; }
        .metric-value { font-size: 32px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 14px; color: #666; text-transform: uppercase; }
        .breaking-point { background: #fff3cd; border-left-color: #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .status-good { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-bad { color: #dc3545; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #007bff; color: white; }
        tr:hover { background: #f5f5f5; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 DefenDDoS Stress Test Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <div class="breaking-point">
            <h3>🎯 Breaking Point Analysis</h3>
            <p style="font-size: 18px;"><strong>${breakingPoint}</strong></p>
        </div>

        <h2>📊 Key Metrics</h2>
        <div>
            <div class="metric">
                <div class="metric-label">Max Virtual Users</div>
                <div class="metric-value">${data.metrics.vus_max.values.max}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Total Requests</div>
                <div class="metric-value">${data.metrics.http_reqs.values.count}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Error Rate</div>
                <div class="metric-value ${data.metrics.errors.values.rate > 0.05 ? 'status-bad' : 'status-good'}">${(data.metrics.errors.values.rate * 100).toFixed(2)}%</div>
            </div>
            <div class="metric">
                <div class="metric-label">Avg Requests/sec</div>
                <div class="metric-value">${data.metrics.http_reqs.values.rate.toFixed(2)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">P95 Response Time</div>
                <div class="metric-value ${data.metrics.http_req_duration.values['p(95)'] > 2000 ? 'status-warning' : 'status-good'}">${data.metrics.http_req_duration.values['p(95)'].toFixed(0)}ms</div>
            </div>
            <div class="metric">
                <div class="metric-label">P99 Response Time</div>
                <div class="metric-value">${data.metrics.http_req_duration.values['p(99)'].toFixed(0)}ms</div>
            </div>
        </div>

        <h2>📈 Response Time Distribution</h2>
        <table>
            <tr>
                <th>Percentile</th>
                <th>Response Time</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>p(50) - Median</td>
                <td>${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms</td>
                <td class="${data.metrics.http_req_duration.values['p(50)'] < 500 ? 'status-good' : 'status-warning'}">
                    ${data.metrics.http_req_duration.values['p(50)'] < 500 ? '✅ Excellent' : '⚠️ Acceptable'}
                </td>
            </tr>
            <tr>
                <td>p(90)</td>
                <td>${data.metrics.http_req_duration.values['p(90)'].toFixed(2)}ms</td>
                <td class="${data.metrics.http_req_duration.values['p(90)'] < 1000 ? 'status-good' : 'status-warning'}">
                    ${data.metrics.http_req_duration.values['p(90)'] < 1000 ? '✅ Good' : '⚠️ Monitor'}
                </td>
            </tr>
            <tr>
                <td>p(95)</td>
                <td>${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms</td>
                <td class="${data.metrics.http_req_duration.values['p(95)'] < 2000 ? 'status-good' : 'status-bad'}">
                    ${data.metrics.http_req_duration.values['p(95)'] < 2000 ? '✅ Acceptable' : '🔴 Slow'}
                </td>
            </tr>
            <tr>
                <td>p(99)</td>
                <td>${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms</td>
                <td class="${data.metrics.http_req_duration.values['p(99)'] < 3000 ? 'status-good' : 'status-bad'}">
                    ${data.metrics.http_req_duration.values['p(99)'] < 3000 ? '✅ Within limits' : '🔴 Very slow'}
                </td>
            </tr>
        </table>

        <h2>💡 Recommendations</h2>
        <ul>
            ${data.metrics.errors.values.rate > 0.05 ? '<li>❗ Error rate exceeds 5% - investigate rate limiting, database connection pooling, and memory usage</li>' : '<li>✅ Error rate within acceptable limits</li>'}
            ${data.metrics.http_req_duration.values['p(95)'] > 2000 ? '<li>⚠️ 95th percentile response time > 2s - optimize slow endpoints and database queries</li>' : '<li>✅ Response times are acceptable</li>'}
            ${data.metrics.http_reqs.values.rate < 100 ? '<li>💡 System throughput is below 100 req/s - consider horizontal scaling</li>' : '<li>✅ Good throughput achieved</li>'}
        </ul>
    </div>
</body>
</html>
    `;
}
