package com.defenddos.backend_service.config;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.InfluxDBClientFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * InfluxDB configuration for time-series data storage.
 * Creates and configures the InfluxDB client connection.
 */
@Configuration
public class InfluxDBConfig {

    private final DefenDDoSProperties properties;

    public InfluxDBConfig(DefenDDoSProperties properties) {
        this.properties = properties;
    }

    /**
     * Creates the InfluxDB client bean for dependency injection.
     * 
     * @return Configured InfluxDB client
     */
    @Bean
    public InfluxDBClient influxDBClient() {
        DefenDDoSProperties.InfluxDb influxConfig = properties.getInfluxDb();
        return InfluxDBClientFactory.create(
            influxConfig.getUrl(), 
            influxConfig.getToken().toCharArray(), 
            influxConfig.getOrg()
        );
    }
}
