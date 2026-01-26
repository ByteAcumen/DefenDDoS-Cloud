package com.defenddos.backend_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.data.redis.core.RedisTemplate;

@SpringBootTest
@ActiveProfiles("test")
class BackendServiceApplicationTests {

	@MockitoBean
	private com.influxdb.client.InfluxDBClient influxDBClient;

	@MockitoBean
	private RedisTemplate<String, String> redisTemplate;

	@Test
	void contextLoads() {
	}

}
