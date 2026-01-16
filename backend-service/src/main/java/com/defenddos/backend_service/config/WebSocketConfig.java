package com.defenddos.backend_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration for Real-Time Visualization
 * 
 * Configures STOMP protocol over WebSocket for bi-directional communication.
 * Enables frontend to subscribe to real-time data streams.
 * 
 * Endpoints:
 * - /ws - WebSocket connection endpoint
 * 
 * Topics (subscriptions):
 * - /topic/metrics - Traffic metrics updates (1s interval)
 * - /topic/attacks - Attack events
 * - /topic/map - Geographic attack visualization
 * - /topic/threats - Threat intelligence feed (5s interval)
 * - /topic/performance - System performance metrics (2s interval)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for broadcasting to clients
        config.enableSimpleBroker("/topic");
        
        // Prefix for messages from clients
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:3000", "http://localhost:3001") // Frontend URLs
                .withSockJS(); // Fallback for browsers without WebSocket support
    }
}
