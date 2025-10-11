package com.defenddos.backend_service.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Configuration for WebClient used to communicate with ML service.
 * Provides connection pooling, timeouts, and retry logic.
 */
@Configuration
public class WebClientConfig {

    private final DefenDDoSProperties properties;

    public WebClientConfig(DefenDDoSProperties properties) {
        this.properties = properties;
    }

    @Bean
    public WebClient mlServiceWebClient() {
        // Get timeout from configuration (in seconds)
        int timeoutSeconds = properties.getMlService().getTimeoutSeconds();

        // Configure HTTP client with timeouts and connection settings
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, timeoutSeconds * 1000)
                .responseTimeout(Duration.ofSeconds(timeoutSeconds))
                .doOnConnected(conn -> 
                    conn.addHandlerLast(new ReadTimeoutHandler(timeoutSeconds, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(timeoutSeconds, TimeUnit.SECONDS))
                );

        return WebClient.builder()
                .baseUrl(properties.getMlService().getUrl())
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Accept", "application/json")
                .build();
    }
}
