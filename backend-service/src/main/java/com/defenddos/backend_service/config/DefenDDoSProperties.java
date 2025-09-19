package com.defenddos.backend_service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for DefenDDoS application.
 * Maps custom application properties to strongly-typed configuration objects.
 */
@Configuration
@ConfigurationProperties(prefix = "defenddos")
public class DefenDDoSProperties {

    private final InfluxDb influxDb = new InfluxDb();
    private final Detection detection = new Detection();
    private final Mitigation mitigation = new Mitigation();
    private final Alerts alerts = new Alerts();

    // Getters
    public InfluxDb getInfluxDb() { return influxDb; }
    public Detection getDetection() { return detection; }
    public Mitigation getMitigation() { return mitigation; }
    public Alerts getAlerts() { return alerts; }

    /**
     * InfluxDB connection properties
     */
    public static class InfluxDb {
        private String url = "http://localhost:8086";
        private String token;
        private String org = "defenddos-org";
        private String bucket = "ddos-bucket";

        // Getters and setters
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getOrg() { return org; }
        public void setOrg(String org) { this.org = org; }
        public String getBucket() { return bucket; }
        public void setBucket(String bucket) { this.bucket = bucket; }
    }

    /**
     * Detection service configuration
     */
    public static class Detection {
        private boolean enabled = true;
        private int packetThreshold = 1000;
        private String timeWindow = "-5m";

        // Getters and setters
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public int getPacketThreshold() { return packetThreshold; }
        public void setPacketThreshold(int packetThreshold) { this.packetThreshold = packetThreshold; }
        public String getTimeWindow() { return timeWindow; }
        public void setTimeWindow(String timeWindow) { this.timeWindow = timeWindow; }
    }

    /**
     * Mitigation service configuration
     */
    public static class Mitigation {
        private boolean enabled = true;
        private boolean dryRun = true;
        private boolean autoBlock = true;
        private String blockScriptPath = "/usr/local/bin/block_ip.sh";
        private String unblockScriptPath = "/usr/local/bin/unblock_ip.sh";
        private int maxBlockedIps = 100;
        private int autoUnblockHours = 24;

        // Getters and setters
        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public boolean isDryRun() { return dryRun; }
        public void setDryRun(boolean dryRun) { this.dryRun = dryRun; }
        public boolean isAutoBlock() { return autoBlock; }
        public void setAutoBlock(boolean autoBlock) { this.autoBlock = autoBlock; }
        public String getBlockScriptPath() { return blockScriptPath; }
        public void setBlockScriptPath(String blockScriptPath) { this.blockScriptPath = blockScriptPath; }
        public String getUnblockScriptPath() { return unblockScriptPath; }
        public void setUnblockScriptPath(String unblockScriptPath) { this.unblockScriptPath = unblockScriptPath; }
        public int getMaxBlockedIps() { return maxBlockedIps; }
        public void setMaxBlockedIps(int maxBlockedIps) { this.maxBlockedIps = maxBlockedIps; }
        public int getAutoUnblockHours() { return autoUnblockHours; }
        public void setAutoUnblockHours(int autoUnblockHours) { this.autoUnblockHours = autoUnblockHours; }
    }

    /**
     * Alert service configuration
     */
    public static class Alerts {
        private boolean enabled = true;
        private final Email email = new Email();

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public Email getEmail() { return email; }

        public static class Email {
            private boolean enabled = false;
            private String to = "admin@defenddos.com";
            private String from = "defenddos@noreply.com";
            private String subject = "DefenDDoS Alert";

            // Getters and setters
            public boolean isEnabled() { return enabled; }
            public void setEnabled(boolean enabled) { this.enabled = enabled; }
            public String getTo() { return to; }
            public void setTo(String to) { this.to = to; }
            public String getFrom() { return from; }
            public void setFrom(String from) { this.from = from; }
            public String getSubject() { return subject; }
            public void setSubject(String subject) { this.subject = subject; }
        }
    }
}