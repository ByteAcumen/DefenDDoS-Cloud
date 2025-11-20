package com.defenddos.backend_service.integration;

import com.defenddos.backend_service.model.TrafficPoint;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Traffic API Integration Tests")
class TrafficAPIIntegrationTest {

    @LocalServerPort
    private int port;

    private static String authToken;
    private static TrafficPoint testTrafficPoint;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "http://localhost";
        RestAssured.basePath = "/api";

        testTrafficPoint = createTestTrafficPoint();
    }

    @Test
    @Order(1)
    @DisplayName("Should authenticate user and get token")
    void testAuthentication() {
        authToken = given()
                .contentType(ContentType.JSON)
                .body("{ \"username\": \"admin\", \"password\": \"admin123\" }")
                .when()
                .post("/auth/login")
                .then()
                .statusCode(200)
                .body("token", notNullValue())
                .extract()
                .path("token");
    }

    @Test
    @Order(2)
    @DisplayName("Should successfully ingest traffic data")
    void testIngestTraffic_Success() {
        given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(testTrafficPoint)
                .when()
                .post("/traffic/ingest")
                .then()
                .statusCode(200)
                .body("status", equalTo("success"))
                .body("message", containsString("ingested successfully"))
                .time(lessThan(2000L)); // Response within 2 seconds
    }

    @Test
    @Order(3)
    @DisplayName("Should successfully ingest batch traffic data")
    void testIngestBatchTraffic_Success() {
        List<TrafficPoint> batch = Arrays.asList(
                createTestTrafficPoint(),
                createTestTrafficPoint(),
                createTestTrafficPoint()
        );

        given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(batch)
                .when()
                .post("/traffic/ingest/batch")
                .then()
                .statusCode(200)
                .body("status", equalTo("success"))
                .body("ingested", equalTo(3))
                .time(lessThan(3000L));
    }

    @Test
    @Order(4)
    @DisplayName("Should retrieve recent traffic with limit")
    void testGetRecentTraffic() {
        given()
                .header("Authorization", "Bearer " + authToken)
                .queryParam("limit", 10)
                .when()
                .get("/traffic/recent")
                .then()
                .statusCode(200)
                .body("$", hasSize(lessThanOrEqualTo(10)))
                .body("[0].sourceIp", notNullValue())
                .body("[0].timestamp", notNullValue());
    }

    @Test
    @Order(5)
    @DisplayName("Should retrieve traffic by time range")
    void testGetTrafficByTimeRange() {
        Instant end = Instant.now();
        Instant start = end.minusSeconds(3600); // Last hour

        given()
                .header("Authorization", "Bearer " + authToken)
                .queryParam("start", start.toString())
                .queryParam("end", end.toString())
                .when()
                .get("/traffic/range")
                .then()
                .statusCode(200)
                .body("$", isA(List.class));
    }

    @Test
    @Order(6)
    @DisplayName("Should retrieve traffic by source IP")
    void testGetTrafficBySourceIp() {
        given()
                .header("Authorization", "Bearer " + authToken)
                .pathParam("sourceIp", "192.168.1.100")
                .when()
                .get("/traffic/source/{sourceIp}")
                .then()
                .statusCode(200)
                .body("$", isA(List.class));
    }

    @Test
    @DisplayName("Should reject unauthorized requests")
    void testUnauthorizedAccess() {
        given()
                .contentType(ContentType.JSON)
                .body(testTrafficPoint)
                .when()
                .post("/traffic/ingest")
                .then()
                .statusCode(401);
    }

    @Test
    @DisplayName("Should validate required fields")
    void testValidation_MissingFields() {
        TrafficPoint invalidPoint = new TrafficPoint();

        given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(invalidPoint)
                .when()
                .post("/traffic/ingest")
                .then()
                .statusCode(400)
                .body("errors", notNullValue());
    }

    @Test
    @DisplayName("Should enforce rate limiting")
    void testRateLimiting() {
        // Make 70 requests (rate limit is 60/min)
        int successCount = 0;
        int rateLimitCount = 0;

        for (int i = 0; i < 70; i++) {
            int statusCode = given()
                    .header("Authorization", "Bearer " + authToken)
                    .contentType(ContentType.JSON)
                    .body(testTrafficPoint)
                    .when()
                    .post("/traffic/ingest")
                    .getStatusCode();

            if (statusCode == 200) {
                successCount++;
            } else if (statusCode == 429) {
                rateLimitCount++;
            }
        }

        Assertions.assertTrue(rateLimitCount > 0, "Rate limiting should be enforced");
        Assertions.assertTrue(successCount >= 60, "At least 60 requests should succeed");
    }

    @Test
    @DisplayName("Should return proper error response for invalid IP")
    void testValidation_InvalidIP() {
        testTrafficPoint.setSourceIp("invalid-ip-address");

        given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(testTrafficPoint)
                .when()
                .post("/traffic/ingest")
                .then()
                .statusCode(400)
                .body("errors", hasItem(containsString("IP")));
    }

    @Test
    @DisplayName("Should handle large batch efficiently")
    void testLargeBatchIngestion() {
        TrafficPoint[] largeBatch = new TrafficPoint[100];
        for (int i = 0; i < 100; i++) {
            largeBatch[i] = createTestTrafficPoint();
        }

        given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(largeBatch)
                .when()
                .post("/traffic/ingest/batch")
                .then()
                .statusCode(200)
                .body("ingested", equalTo(100))
                .time(lessThan(5000L)); // Should handle 100 records within 5 seconds
    }

    @Test
    @DisplayName("Should validate JSON schema")
    void testJSONSchemaValidation() {
        String invalidJson = "{ \"invalid\": \"structure\" }";

        given()
                .header("Authorization", "Bearer " + authToken)
                .contentType(ContentType.JSON)
                .body(invalidJson)
                .when()
                .post("/traffic/ingest")
                .then()
                .statusCode(400);
    }

    @Test
    @DisplayName("Should support CORS headers")
    void testCORSHeaders() {
        given()
                .header("Origin", "http://localhost:3000")
                .header("Authorization", "Bearer " + authToken)
                .when()
                .get("/traffic/recent")
                .then()
                .header("Access-Control-Allow-Origin", notNullValue());
    }

    @Test
    @DisplayName("Should enrich traffic with ML predictions")
    void testMLEnrichment() {
        given()
                .header("Authorization", "Bearer " + authToken)
                .queryParam("limit", 1)
                .when()
                .get("/traffic/recent")
                .then()
                .statusCode(200)
                .body("[0].predictionLabel", notNullValue())
                .body("[0].confidence", notNullValue())
                .body("[0].threatLevel", notNullValue());
    }

    @Test
    @DisplayName("Should handle concurrent requests")
    void testConcurrentRequests() throws InterruptedException {
        Thread[] threads = new Thread[10];

        for (int i = 0; i < 10; i++) {
            threads[i] = new Thread(() -> {
                given()
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(ContentType.JSON)
                        .body(createTestTrafficPoint())
                        .when()
                        .post("/traffic/ingest")
                        .then()
                        .statusCode(anyOf(equalTo(200), equalTo(429)));
            });
            threads[i].start();
        }

        for (Thread thread : threads) {
            thread.join();
        }
    }

    private static TrafficPoint createTestTrafficPoint() {
        TrafficPoint point = new TrafficPoint();
        point.setTimestamp(Instant.now().toString());
        point.setSourceIp("192.168.1." + (int) (Math.random() * 255));
        point.setDestinationIp("10.0.0.1");
        point.setSourcePort((int) (Math.random() * 65535));
        point.setDestinationPort(80);
        point.setProtocol("TCP");
        point.setPacketLength(1500);
        point.setFlowDuration(1000L);
        point.setPacketsPerSecond(100.0);
        point.setBytesPerSecond(150000.0);
        return point;
    }
}
