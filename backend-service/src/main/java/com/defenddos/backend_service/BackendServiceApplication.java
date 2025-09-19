package com.defenddos.backend_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application class for DefenDDoS Backend Service.
 * 
 * This application provides DDoS detection and mitigation capabilities including:
 * - Real-time traffic monitoring and analysis
 * - Automated threat detection
 * - IP blocking and mitigation
 * - Alert notifications
 * - Comprehensive API for management
 */
@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties
public class BackendServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendServiceApplication.class, args);
	}

}
