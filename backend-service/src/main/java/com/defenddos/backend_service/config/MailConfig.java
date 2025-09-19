package com.defenddos.backend_service.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Mail configuration for DefenDDoS alert system.
 * Provides conditional JavaMailSender bean based on configuration.
 */
@Configuration
public class MailConfig {

    /**
     * Creates JavaMailSender bean only when email alerts are enabled.
     * This prevents startup issues when mail configuration is not available.
     */
    @Bean
    @ConditionalOnProperty(
        prefix = "defenddos.alerts.email", 
        name = "enabled", 
        havingValue = "true", 
        matchIfMissing = false
    )
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        // Basic configuration - should be overridden by application properties
        mailSender.setHost("localhost");
        mailSender.setPort(25);
        
        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "false");
        props.put("mail.smtp.starttls.enable", "false");
        props.put("mail.debug", "false");
        
        return mailSender;
    }
    
    /**
     * Creates a dummy JavaMailSender when email is disabled.
     * This prevents dependency injection failures.
     */
    @Bean
    @ConditionalOnProperty(
        prefix = "defenddos.alerts.email", 
        name = "enabled", 
        havingValue = "false", 
        matchIfMissing = true
    )
    public JavaMailSender dummyMailSender() {
        return new JavaMailSenderImpl(); // Minimal implementation
    }
}