package com.defenddos.backend_service.config;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration // Marks this class as a source of bean definitions
public class InfluxDBConfig {

    @Value("${influx.url}")
    private String influxUrl;

    @Value("${influx.token}")
    private String token;

    @Value("${influx.org}")
    private String org;

    @Bean // Creates a Spring-managed InfluxDBClient that we can use anywhere
    public InfluxDBClient influxDBClient() {
        return InfluxDBClientFactory.create(influxUrl, token.toCharArray(), org);
    }
}
