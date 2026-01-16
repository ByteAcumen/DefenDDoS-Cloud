package com.defenddos.backend_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.data.redis.core.RedisTemplate;

@SpringBootTest
@ActiveProfiles("test")
class BackendServiceApplicationTests {

	@org.springframework.boot.test.mock.mockito.MockBean
	private com.influxdb.client.InfluxDBClient influxDBClient;

	@org.springframework.boot.test.mock.mockito.MockBean
	private RedisTemplate<String, String> redisTemplate;

	@Test
	void contextLoads() {
	}

}
