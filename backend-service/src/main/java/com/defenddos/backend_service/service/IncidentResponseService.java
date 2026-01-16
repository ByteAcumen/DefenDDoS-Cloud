package com.defenddos.backend_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Automated Incident Response Playbooks Service
 * 
 * SOAR (Security Orchestration, Automation, and Response) implementation
 * for zero-touch incident handling and threat mitigation.
 * 
 * Features:
 * 1. Rule-based automatic response triggers
 * 2. Multi-channel alerting (Email, Slack, PagerDuty, Webhook)
 * 3. Automated mitigation actions (IP blocking, rate limiting, traffic rerouting)
 * 4. Incident escalation workflows
 * 5. Playbook versioning and audit trail
 * 6. Custom playbook builder
 * 
 * Use Cases:
 * - DDoS attacks: Auto-block IPs, enable rate limiting, notify SOC
 * - Anomaly detection: Alert security team, gather forensics
 * - Brute force: Temporary IP ban, CAPTCHA enforcement
 * - Zero-day exploits: Emergency patching, traffic diversion
 */
@Service
@Slf4j
public class IncidentResponseService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    private final RestTemplate restTemplate;
    private final Map<String, Playbook> playbooks;
    private final Map<String, IncidentRecord> activeIncidents;

    @Value("${incident.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${incident.slack.webhook:}")
    private String slackWebhook;

    @Value("${incident.pagerduty.key:}")
    private String pagerDutyKey;

    @Value("${incident.kafka.topic:security-incidents}")
    private String kafkaTopic;

    public IncidentResponseService() {
        this.restTemplate = new RestTemplate();
        this.playbooks = new ConcurrentHashMap<>();
        this.activeIncidents = new ConcurrentHashMap<>();
        
        // Initialize default playbooks
        initializeDefaultPlaybooks();
    }

    /**
     * Initialize pre-configured playbooks for common attack types
     */
    private void initializeDefaultPlaybooks() {
        // DDoS Attack Playbook
        Playbook ddosPlaybook = Playbook.builder()
            .id("PLAYBOOK_DDOS_001")
            .name("DDoS Attack Response")
            .description("Automated response for detected DDoS attacks")
            .severity(Severity.CRITICAL)
            .enabled(true)
            .triggers(List.of(
                Trigger.builder()
                    .condition("traffic_rate > 10000")
                    .metric("requests_per_second")
                    .threshold(10000.0)
                    .build(),
                Trigger.builder()
                    .condition("anomaly_score > 0.8")
                    .metric("ml_anomaly_score")
                    .threshold(0.8)
                    .build()
            ))
            .actions(List.of(
                Action.builder()
                    .type(ActionType.BLOCK_IP)
                    .description("Block attacking IPs")
                    .parameters(Map.of("duration", "3600", "scope", "global"))
                    .build(),
                Action.builder()
                    .type(ActionType.ENABLE_RATE_LIMIT)
                    .description("Enable aggressive rate limiting")
                    .parameters(Map.of("limit", "10", "window", "60"))
                    .build(),
                Action.builder()
                    .type(ActionType.ALERT_EMAIL)
                    .description("Email security team")
                    .parameters(Map.of("priority", "high"))
                    .build(),
                Action.builder()
                    .type(ActionType.ALERT_SLACK)
                    .description("Post to #security-alerts")
                    .parameters(Map.of("channel", "#security-alerts"))
                    .build()
            ))
            .build();

        // Brute Force Playbook
        Playbook bruteForcePlaybook = Playbook.builder()
            .id("PLAYBOOK_BRUTE_002")
            .name("Brute Force Attack Response")
            .description("Response for credential stuffing and brute force attempts")
            .severity(Severity.HIGH)
            .enabled(true)
            .triggers(List.of(
                Trigger.builder()
                    .condition("failed_login_attempts > 5")
                    .metric("authentication_failures")
                    .threshold(5.0)
                    .build()
            ))
            .actions(List.of(
                Action.builder()
                    .type(ActionType.TEMPORARY_BAN)
                    .description("Temporary IP ban for 15 minutes")
                    .parameters(Map.of("duration", "900"))
                    .build(),
                Action.builder()
                    .type(ActionType.ENABLE_CAPTCHA)
                    .description("Require CAPTCHA verification")
                    .parameters(Map.of("threshold", "3"))
                    .build(),
                Action.builder()
                    .type(ActionType.ALERT_EMAIL)
                    .description("Notify security team")
                    .parameters(Map.of("priority", "medium"))
                    .build()
            ))
            .build();

        // Anomaly Detection Playbook
        Playbook anomalyPlaybook = Playbook.builder()
            .id("PLAYBOOK_ANOMALY_003")
            .name("Traffic Anomaly Response")
            .description("Response for unusual traffic patterns")
            .severity(Severity.MEDIUM)
            .enabled(true)
            .triggers(List.of(
                Trigger.builder()
                    .condition("prediction_confidence > 0.75")
                    .metric("attack_probability")
                    .threshold(0.75)
                    .build()
            ))
            .actions(List.of(
                Action.builder()
                    .type(ActionType.ENABLE_MONITORING)
                    .description("Increase monitoring frequency")
                    .parameters(Map.of("interval", "30"))
                    .build(),
                Action.builder()
                    .type(ActionType.COLLECT_FORENSICS)
                    .description("Capture traffic samples")
                    .parameters(Map.of("duration", "300", "samples", "1000"))
                    .build(),
                Action.builder()
                    .type(ActionType.ALERT_SLACK)
                    .description("Notify monitoring channel")
                    .parameters(Map.of("channel", "#monitoring"))
                    .build()
            ))
            .build();

        // Application Layer Attack Playbook
        Playbook appLayerPlaybook = Playbook.builder()
            .id("PLAYBOOK_APP_004")
            .name("Application Layer Attack Response")
            .description("Response for HTTP floods and slowloris attacks")
            .severity(Severity.HIGH)
            .enabled(true)
            .triggers(List.of(
                Trigger.builder()
                    .condition("slow_requests > 100")
                    .metric("connection_duration")
                    .threshold(100.0)
                    .build()
            ))
            .actions(List.of(
                Action.builder()
                    .type(ActionType.CLOSE_SLOW_CONNECTIONS)
                    .description("Terminate slow/idle connections")
                    .parameters(Map.of("timeout", "30"))
                    .build(),
                Action.builder()
                    .type(ActionType.ENABLE_RATE_LIMIT)
                    .description("Per-IP rate limiting")
                    .parameters(Map.of("limit", "50", "window", "60"))
                    .build(),
                Action.builder()
                    .type(ActionType.ALERT_PAGERDUTY)
                    .description("Page on-call engineer")
                    .parameters(Map.of("severity", "high"))
                    .build()
            ))
            .build();

        playbooks.put(ddosPlaybook.getId(), ddosPlaybook);
        playbooks.put(bruteForcePlaybook.getId(), bruteForcePlaybook);
        playbooks.put(anomalyPlaybook.getId(), anomalyPlaybook);
        playbooks.put(appLayerPlaybook.getId(), appLayerPlaybook);

        log.info("Initialized {} default playbooks", playbooks.size());
    }

    /**
     * Execute playbook based on incident details
     */
    @Async
    public void executePlaybook(String playbookId, IncidentContext context) {
        Playbook playbook = playbooks.get(playbookId);
        if (playbook == null || !playbook.isEnabled()) {
            log.warn("Playbook {} not found or disabled", playbookId);
            return;
        }

        log.info("Executing playbook: {} for incident: {}", 
            playbook.getName(), context.getIncidentId());

        // Create incident record
        IncidentRecord incident = IncidentRecord.builder()
            .incidentId(context.getIncidentId())
            .playbookId(playbookId)
            .severity(playbook.getSeverity())
            .startTime(Instant.now())
            .status(IncidentStatus.IN_PROGRESS)
            .context(context)
            .executedActions(new ArrayList<>())
            .build();

        activeIncidents.put(context.getIncidentId(), incident);

        try {
            // Execute each action in sequence
            for (Action action : playbook.getActions()) {
                executeAction(action, context, incident);
            }

            incident.setStatus(IncidentStatus.RESOLVED);
            incident.setEndTime(Instant.now());
            log.info("Playbook {} completed successfully", playbookId);

        } catch (Exception e) {
            log.error("Error executing playbook {}", playbookId, e);
            incident.setStatus(IncidentStatus.FAILED);
            incident.setErrorMessage(e.getMessage());
            
            // Escalate on failure
            escalateIncident(incident);
        }
    }

    /**
     * Execute individual action
     */
    private void executeAction(Action action, IncidentContext context, IncidentRecord incident) {
        log.debug("Executing action: {} - {}", action.getType(), action.getDescription());

        ActionResult result = ActionResult.builder()
            .action(action)
            .startTime(Instant.now())
            .build();

        try {
            switch (action.getType()) {
                case BLOCK_IP:
                    blockIP(context, action.getParameters());
                    break;
                case TEMPORARY_BAN:
                    temporaryBan(context, action.getParameters());
                    break;
                case ENABLE_RATE_LIMIT:
                    enableRateLimit(context, action.getParameters());
                    break;
                case ENABLE_CAPTCHA:
                    enableCaptcha(context, action.getParameters());
                    break;
                case CLOSE_SLOW_CONNECTIONS:
                    closeSlowConnections(context, action.getParameters());
                    break;
                case ENABLE_MONITORING:
                    enableEnhancedMonitoring(context, action.getParameters());
                    break;
                case COLLECT_FORENSICS:
                    collectForensics(context, action.getParameters());
                    break;
                case ALERT_EMAIL:
                    sendEmailAlert(context, action.getParameters());
                    break;
                case ALERT_SLACK:
                    sendSlackAlert(context, action.getParameters());
                    break;
                case ALERT_PAGERDUTY:
                    sendPagerDutyAlert(context, action.getParameters());
                    break;
                case WEBHOOK:
                    callWebhook(context, action.getParameters());
                    break;
                default:
                    log.warn("Unknown action type: {}", action.getType());
            }

            result.setSuccess(true);
            result.setEndTime(Instant.now());
            incident.getExecutedActions().add(result);

        } catch (Exception e) {
            log.error("Action execution failed: {}", action.getType(), e);
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
            result.setEndTime(Instant.now());
            incident.getExecutedActions().add(result);
            throw new RuntimeException("Action failed: " + action.getType(), e);
        }
    }

    // Action implementations
    private void blockIP(IncidentContext context, Map<String, String> params) {
        String ip = context.getSourceIp();
        int duration = Integer.parseInt(params.getOrDefault("duration", "3600"));
        
        log.info("Blocking IP: {} for {} seconds", ip, duration);
        // Integration with firewall/iptables would go here
        publishToKafka("ip-blocking", Map.of("ip", ip, "duration", duration));
    }

    private void temporaryBan(IncidentContext context, Map<String, String> params) {
        String ip = context.getSourceIp();
        int duration = Integer.parseInt(params.getOrDefault("duration", "900"));
        
        log.info("Temporary ban for IP: {} for {} seconds", ip, duration);
        publishToKafka("temp-ban", Map.of("ip", ip, "duration", duration));
    }

    private void enableRateLimit(IncidentContext context, Map<String, String> params) {
        int limit = Integer.parseInt(params.getOrDefault("limit", "10"));
        int window = Integer.parseInt(params.getOrDefault("window", "60"));
        
        log.info("Enabling rate limit: {} requests per {} seconds", limit, window);
        publishToKafka("rate-limit", Map.of("limit", limit, "window", window));
    }

    private void enableCaptcha(IncidentContext context, Map<String, String> params) {
        log.info("Enabling CAPTCHA verification");
        publishToKafka("enable-captcha", Map.of("ip", context.getSourceIp()));
    }

    private void closeSlowConnections(IncidentContext context, Map<String, String> params) {
        int timeout = Integer.parseInt(params.getOrDefault("timeout", "30"));
        log.info("Closing connections slower than {} seconds", timeout);
        publishToKafka("close-slow-conn", Map.of("timeout", timeout));
    }

    private void enableEnhancedMonitoring(IncidentContext context, Map<String, String> params) {
        int interval = Integer.parseInt(params.getOrDefault("interval", "30"));
        log.info("Enabling enhanced monitoring (interval: {}s)", interval);
        publishToKafka("enhanced-monitoring", Map.of("interval", interval));
    }

    private void collectForensics(IncidentContext context, Map<String, String> params) {
        int duration = Integer.parseInt(params.getOrDefault("duration", "300"));
        int samples = Integer.parseInt(params.getOrDefault("samples", "1000"));
        
        log.info("Collecting forensics: {} samples over {} seconds", samples, duration);
        publishToKafka("collect-forensics", Map.of(
            "duration", duration,
            "samples", samples,
            "incident_id", context.getIncidentId()
        ));
    }

    private void sendEmailAlert(IncidentContext context, Map<String, String> params) {
        if (!emailEnabled || mailSender == null) {
            log.warn("Email alerting not configured");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo("security@defenddos.com"); // Configure via properties
            message.setSubject("[" + params.getOrDefault("priority", "medium").toUpperCase() + 
                             "] Security Incident: " + context.getIncidentType());
            message.setText(buildEmailBody(context));
            
            mailSender.send(message);
            log.info("Email alert sent");
        } catch (Exception e) {
            log.error("Failed to send email alert", e);
        }
    }

    private void sendSlackAlert(IncidentContext context, Map<String, String> params) {
        if (slackWebhook == null || slackWebhook.isEmpty()) {
            log.warn("Slack webhook not configured");
            return;
        }

        try {
            String channel = params.getOrDefault("channel", "#security-alerts");
            Map<String, Object> payload = Map.of(
                "channel", channel,
                "username", "DefenDDoS Security",
                "text", buildSlackMessage(context),
                "icon_emoji", ":shield:"
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            restTemplate.postForEntity(slackWebhook, request, String.class);
            log.info("Slack alert sent to {}", channel);
        } catch (Exception e) {
            log.error("Failed to send Slack alert", e);
        }
    }

    private void sendPagerDutyAlert(IncidentContext context, Map<String, String> params) {
        if (pagerDutyKey == null || pagerDutyKey.isEmpty()) {
            log.warn("PagerDuty key not configured");
            return;
        }

        try {
            String severity = params.getOrDefault("severity", "high");
            Map<String, Object> event = Map.of(
                "routing_key", pagerDutyKey,
                "event_action", "trigger",
                "payload", Map.of(
                    "summary", context.getIncidentType() + " detected",
                    "severity", severity,
                    "source", "DefenDDoS",
                    "custom_details", context.getMetadata()
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(event, headers);
            
            restTemplate.postForEntity("https://events.pagerduty.com/v2/enqueue", 
                request, String.class);
            log.info("PagerDuty alert sent");
        } catch (Exception e) {
            log.error("Failed to send PagerDuty alert", e);
        }
    }

    private void callWebhook(IncidentContext context, Map<String, String> params) {
        String webhookUrl = params.get("url");
        if (webhookUrl == null) {
            log.warn("Webhook URL not specified");
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<IncidentContext> request = new HttpEntity<>(context, headers);
            
            restTemplate.postForEntity(webhookUrl, request, String.class);
            log.info("Webhook called: {}", webhookUrl);
        } catch (Exception e) {
            log.error("Failed to call webhook", e);
        }
    }

    private void publishToKafka(String actionType, Map<String, Object> data) {
        if (kafkaTemplate == null) {
            log.warn("Kafka not configured");
            return;
        }

        try {
            Map<String, Object> message = new HashMap<>(data);
            message.put("action", actionType);
            message.put("timestamp", Instant.now().toString());
            
            kafkaTemplate.send(kafkaTopic, new com.fasterxml.jackson.databind.ObjectMapper()
                .writeValueAsString(message));
        } catch (Exception e) {
            log.error("Failed to publish to Kafka", e);
        }
    }

    private void escalateIncident(IncidentRecord incident) {
        log.warn("Escalating incident: {}", incident.getIncidentId());
        
        // Send critical alerts
        IncidentContext context = incident.getContext();
        sendEmailAlert(context, Map.of("priority", "critical"));
        sendPagerDutyAlert(context, Map.of("severity", "critical"));
    }

    private String buildEmailBody(IncidentContext context) {
        return String.format("""
            Security Incident Alert
            
            Incident ID: %s
            Type: %s
            Severity: %s
            Source IP: %s
            Timestamp: %s
            
            Details:
            %s
            
            Automated response has been triggered.
            
            --
            DefenDDoS Security System
            """,
            context.getIncidentId(),
            context.getIncidentType(),
            context.getSeverity(),
            context.getSourceIp(),
            context.getTimestamp(),
            context.getDescription()
        );
    }

    private String buildSlackMessage(IncidentContext context) {
        return String.format(":rotating_light: *%s Detected* :rotating_light:\n" +
            "• **Incident ID:** %s\n" +
            "• **Source IP:** `%s`\n" +
            "• **Severity:** %s\n" +
            "• **Time:** %s\n" +
            "• **Description:** %s",
            context.getIncidentType(),
            context.getIncidentId(),
            context.getSourceIp(),
            context.getSeverity(),
            context.getTimestamp(),
            context.getDescription()
        );
    }

    // Playbook management
    public void createPlaybook(Playbook playbook) {
        playbooks.put(playbook.getId(), playbook);
        log.info("Created playbook: {}", playbook.getName());
    }

    public List<Playbook> getAllPlaybooks() {
        return new ArrayList<>(playbooks.values());
    }

    public Playbook getPlaybook(String id) {
        return playbooks.get(id);
    }

    public List<IncidentRecord> getActiveIncidents() {
        return activeIncidents.values().stream()
            .filter(i -> i.getStatus() == IncidentStatus.IN_PROGRESS)
            .collect(Collectors.toList());
    }

    // Inner classes
    @lombok.Data
    @lombok.Builder
    public static class Playbook {
        private String id;
        private String name;
        private String description;
        private Severity severity;
        private boolean enabled;
        private List<Trigger> triggers;
        private List<Action> actions;
    }

    @lombok.Data
    @lombok.Builder
    public static class Trigger {
        private String condition;
        private String metric;
        private double threshold;
    }

    @lombok.Data
    @lombok.Builder
    public static class Action {
        private ActionType type;
        private String description;
        private Map<String, String> parameters;
    }

    public enum ActionType {
        BLOCK_IP, TEMPORARY_BAN, ENABLE_RATE_LIMIT, ENABLE_CAPTCHA,
        CLOSE_SLOW_CONNECTIONS, ENABLE_MONITORING, COLLECT_FORENSICS,
        ALERT_EMAIL, ALERT_SLACK, ALERT_PAGERDUTY, WEBHOOK
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum IncidentStatus {
        IN_PROGRESS, RESOLVED, FAILED
    }

    @lombok.Data
    @lombok.Builder
    public static class IncidentContext {
        private String incidentId;
        private String incidentType;
        private Severity severity;
        private String sourceIp;
        private String description;
        private Instant timestamp;
        private Map<String, Object> metadata;
    }

    @lombok.Data
    @lombok.Builder
    public static class IncidentRecord {
        private String incidentId;
        private String playbookId;
        private Severity severity;
        private IncidentStatus status;
        private Instant startTime;
        private Instant endTime;
        private IncidentContext context;
        private List<ActionResult> executedActions;
        private String errorMessage;
    }

    @lombok.Data
    @lombok.Builder
    public static class ActionResult {
        private Action action;
        private boolean success;
        private Instant startTime;
        private Instant endTime;
        private String errorMessage;
    }
}
