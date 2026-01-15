package com.defenddos.backend_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class BackendServiceApplicationTests {

	@org.springframework.boot.test.mock.mockito.MockBean
	private com.influxdb.client.InfluxDBClient influxDBClient;

	@Test
	void contextLoads() {
	}

}
