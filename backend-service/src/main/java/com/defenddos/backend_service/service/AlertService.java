package com.defenddos.backend_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for handling alert notifications in the DefenDDoS system.
 * Supports both email alerts and console logging based on configuration.
 */
@Service
public class AlertService {

    private final JavaMailSender mailSender;

    @Value("${defenddos.alerts.email.to:admin@defenddos.com}")
    private String alertEmail;

    @Value("${defenddos.alerts.email.from:no-reply@defenddos.com}")
    private String fromEmail;

    @Value("${defenddos.alerts.enabled:true}")
    private boolean alertsEnabled;

    @Value("${defenddos.alerts.mail.enabled:false}")
    private boolean emailAlertsEnabled;

    /**
     * Constructor with optional mail sender dependency
     */
    public AlertService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send threat alert for detected attacks
     */
    @Async
    public void sendThreatAlert(String sourceIp, long trafficVolume, String threatLevel) {
        if (!alertsEnabled) {
            System.out.println("[ALERT] Alert system disabled - would have sent: " + threatLevel + " threat from " + sourceIp);
            return;
        }

        if (!emailAlertsEnabled || mailSender == null) {
            System.out.printf("[ALERT] %s threat detected from %s - %,d packets in last minute%n", 
                threatLevel, sourceIp, trafficVolume);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(alertEmail);
            message.setSubject("🚨 DefenDDoS Alert: " + threatLevel + " Threat Detected");
            
            String messageText = String.format(
                "THREAT ALERT - DefenDDoS System\\n\\n" +
                "Threat Level: %s\\n" +
                "Source IP: %s\\n" +
                "Traffic Volume: %,d packets in last minute\\n" +
                "Timestamp: %s\\n\\n" +
                "This is an automated alert from your DefenDDoS protection system.\\n" +
                "Please investigate this potential security threat immediately.",
                threatLevel, sourceIp, trafficVolume, java.time.Instant.now()
            );
            
            message.setText(messageText);
            mailSender.send(message);
            
            System.out.printf("[ALERT] Email sent successfully for %s threat from %s%n", threatLevel, sourceIp);
        } catch (Exception e) {
            System.err.printf("[ALERT ERROR] Failed to send email alert: %s%n", e.getMessage());
        }
    }

    /**
     * Send custom alert message
     */
    @Async
    public void sendCustomAlert(String subject, String message) {
        if (!alertsEnabled) {
            System.out.println("[ALERT] Alert system disabled - would have sent: " + subject);
            return;
        }

        if (!emailAlertsEnabled || mailSender == null) {
            System.out.printf("[ALERT] %s - %s%n", subject, message);
            return;
        }

        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromEmail);
            mailMessage.setTo(alertEmail);
            mailMessage.setSubject("DefenDDoS Alert: " + subject);
            mailMessage.setText(message);
            
            mailSender.send(mailMessage);
            System.out.println("[ALERT] Custom alert sent: " + subject);
        } catch (Exception e) {
            System.err.printf("[ALERT ERROR] Failed to send custom alert: %s%n", e.getMessage());
        }
    }

    /**
     * Test the alert system
     */
    public String testAlert() {
        try {
            sendCustomAlert("System Test", 
                "This is a test alert from your DefenDDoS system. " +
                "Alert system is functioning properly at " + java.time.Instant.now());
            
            if (mailSender == null) {
                return "Test alert logged to console - mail service not configured";
            } else {
                return "Test alert sent successfully";
            }
        } catch (Exception e) {
            return "Failed to send test alert: " + e.getMessage();
        }
    }
}
