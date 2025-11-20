package com.defenddos.backend_service.service;

import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.crypto.digests.SHA256Digest;
import org.springframework.stereotype.Service;
import ua_parser.Client;
import ua_parser.Parser;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Advanced Traffic Fingerprinting Service
 * 
 * Identifies attackers beyond IP addresses using multiple fingerprinting techniques.
 * Bypasses VPNs, proxies, and IP rotation used by sophisticated attackers.
 * 
 * Fingerprinting Methods:
 * 1. TLS Fingerprinting (JA3/JA3S) - SSL/TLS handshake analysis
 * 2. HTTP/2 Fingerprinting - HTTP/2 settings and frame analysis
 * 3. TCP Fingerprinting - TCP options, window size, TTL
 * 4. User-Agent Fingerprinting - Browser/device identification
 * 5. Behavioral Fingerprinting - Request patterns, timing, sequences
 * 
 * Use Cases:
 * - Identify bot networks despite IP rotation
 * - Detect coordinated attacks from different IPs
 * - Track persistent attackers across sessions
 * - Distinguish legitimate users from bots
 */
@Service
@Slf4j
public class AdvancedFingerprintingService {

    private final Parser userAgentParser;
    private final Map<String, DeviceFingerprint> fingerprintCache;
    private final Map<String, Set<String>> fingerprintToIPs;

    public AdvancedFingerprintingService() {
        this.userAgentParser = new Parser();
        this.fingerprintCache = new ConcurrentHashMap<>();
        this.fingerprintToIPs = new ConcurrentHashMap<>();
    }

    /**
     * Generate comprehensive fingerprint for traffic
     */
    public TrafficFingerprint generateFingerprint(FingerprintRequest request) {
        log.debug("Generating fingerprint for IP: {}", request.getSourceIp());

        try {
            // Generate individual fingerprints
            String tlsFingerprint = generateTLSFingerprint(request);
            String http2Fingerprint = generateHTTP2Fingerprint(request);
            String tcpFingerprint = generateTCPFingerprint(request);
            String userAgentFingerprint = generateUserAgentFingerprint(request);
            String behavioralFingerprint = generateBehavioralFingerprint(request);

            // Combine into composite fingerprint
            String compositeFingerprint = generateCompositeFingerprint(
                tlsFingerprint,
                http2Fingerprint,
                tcpFingerprint,
                userAgentFingerprint,
                behavioralFingerprint
            );

            // Detect device type and capabilities
            DeviceInfo deviceInfo = detectDevice(request);

            // Calculate anomaly score
            double anomalyScore = calculateAnomalyScore(request, deviceInfo);

            // Check if fingerprint matches known bot patterns
            boolean isSuspicious = detectBotPatterns(
                tlsFingerprint,
                userAgentFingerprint,
                deviceInfo
            );

            TrafficFingerprint fingerprint = TrafficFingerprint.builder()
                .compositeFingerprint(compositeFingerprint)
                .tlsFingerprint(tlsFingerprint)
                .http2Fingerprint(http2Fingerprint)
                .tcpFingerprint(tcpFingerprint)
                .userAgentFingerprint(userAgentFingerprint)
                .behavioralFingerprint(behavioralFingerprint)
                .deviceInfo(deviceInfo)
                .anomalyScore(anomalyScore)
                .isSuspicious(isSuspicious)
                .timestamp(java.time.Instant.now())
                .build();

            // Track fingerprint-to-IP mapping
            trackFingerprint(compositeFingerprint, request.getSourceIp());

            return fingerprint;

        } catch (Exception e) {
            log.error("Error generating fingerprint", e);
            return TrafficFingerprint.error();
        }
    }

    /**
     * Generate JA3 TLS Fingerprint
     * Based on: SSLVersion, Cipher Suites, Extensions, Elliptic Curves, EC Point Formats
     */
    private String generateTLSFingerprint(FingerprintRequest request) {
        if (request.getTlsVersion() == null) {
            return "NO_TLS";
        }

        try {
            StringBuilder ja3String = new StringBuilder();

            // TLS Version (e.g., 771 for TLS 1.2)
            ja3String.append(request.getTlsVersion()).append(",");

            // Cipher Suites (comma-separated)
            if (request.getCipherSuites() != null && !request.getCipherSuites().isEmpty()) {
                ja3String.append(String.join("-", request.getCipherSuites()));
            }
            ja3String.append(",");

            // Extensions (comma-separated IDs)
            if (request.getTlsExtensions() != null && !request.getTlsExtensions().isEmpty()) {
                ja3String.append(String.join("-", request.getTlsExtensions()));
            }
            ja3String.append(",");

            // Elliptic Curves
            if (request.getEllipticCurves() != null && !request.getEllipticCurves().isEmpty()) {
                ja3String.append(String.join("-", request.getEllipticCurves()));
            }
            ja3String.append(",");

            // EC Point Formats
            if (request.getEcPointFormats() != null && !request.getEcPointFormats().isEmpty()) {
                ja3String.append(String.join("-", request.getEcPointFormats()));
            }

            // Generate MD5 hash of JA3 string
            return generateMD5Hash(ja3String.toString());

        } catch (Exception e) {
            log.error("Error generating TLS fingerprint", e);
            return "TLS_ERROR";
        }
    }

    /**
     * Generate HTTP/2 Fingerprint
     * Based on: SETTINGS frame parameters, WINDOW_UPDATE, PRIORITY frames
     */
    private String generateHTTP2Fingerprint(FingerprintRequest request) {
        if (!request.isHttp2()) {
            return "HTTP1";
        }

        try {
            StringBuilder h2Fingerprint = new StringBuilder();

            // HTTP/2 SETTINGS parameters
            Map<String, String> settings = request.getHttp2Settings();
            if (settings != null) {
                settings.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(e -> h2Fingerprint.append(e.getKey())
                        .append(":")
                        .append(e.getValue())
                        .append(";"));
            }

            // Initial window size
            h2Fingerprint.append("|WIN:")
                .append(request.getHttp2WindowSize())
                .append("|");

            // Stream priority settings
            if (request.getHttp2StreamPriority() != null) {
                h2Fingerprint.append("PRI:")
                    .append(request.getHttp2StreamPriority());
            }

            return generateMD5Hash(h2Fingerprint.toString());

        } catch (Exception e) {
            log.error("Error generating HTTP/2 fingerprint", e);
            return "H2_ERROR";
        }
    }

    /**
     * Generate TCP Fingerprint
     * Based on: Window Size, TTL, TCP Options, MSS, etc.
     */
    private String generateTCPFingerprint(FingerprintRequest request) {
        try {
            StringBuilder tcpFp = new StringBuilder();

            // Window size
            tcpFp.append("WIN:").append(request.getTcpWindowSize()).append("|");

            // TTL (Time To Live)
            tcpFp.append("TTL:").append(request.getTtl()).append("|");

            // TCP Options (e.g., MSS, SACK, Timestamps)
            if (request.getTcpOptions() != null) {
                tcpFp.append("OPT:").append(String.join(",", request.getTcpOptions()));
            }

            return generateMD5Hash(tcpFp.toString());

        } catch (Exception e) {
            log.error("Error generating TCP fingerprint", e);
            return "TCP_ERROR";
        }
    }

    /**
     * Generate User-Agent Fingerprint
     * Parse and extract browser, OS, device details
     */
    private String generateUserAgentFingerprint(FingerprintRequest request) {
        if (request.getUserAgent() == null || request.getUserAgent().isEmpty()) {
            return "NO_UA";
        }

        try {
            Client client = userAgentParser.parse(request.getUserAgent());

            StringBuilder uaFp = new StringBuilder();
            uaFp.append(client.userAgent.family).append("|")
                .append(client.userAgent.major).append(".")
                .append(client.userAgent.minor).append("|")
                .append(client.os.family).append("|")
                .append(client.device.family);

            return generateMD5Hash(uaFp.toString());

        } catch (Exception e) {
            log.error("Error parsing user agent", e);
            return generateMD5Hash(request.getUserAgent());
        }
    }

    /**
     * Generate Behavioral Fingerprint
     * Based on: Request timing, patterns, sequences, headers
     */
    private String generateBehavioralFingerprint(FingerprintRequest request) {
        try {
            StringBuilder behavioral = new StringBuilder();

            // Request timing pattern
            if (request.getRequestTimings() != null && !request.getRequestTimings().isEmpty()) {
                List<Long> timings = request.getRequestTimings();
                // Calculate intervals between requests
                for (int i = 1; i < timings.size(); i++) {
                    long interval = timings.get(i) - timings.get(i - 1);
                    behavioral.append(interval).append(",");
                }
                behavioral.append("|");
            }

            // Header order and presence
            if (request.getHeaderOrder() != null) {
                behavioral.append("HDR:").append(String.join(",", request.getHeaderOrder()))
                    .append("|");
            }

            // Request path pattern
            if (request.getRequestPaths() != null) {
                behavioral.append("PATH:").append(request.getRequestPaths().size());
            }

            return generateMD5Hash(behavioral.toString());

        } catch (Exception e) {
            log.error("Error generating behavioral fingerprint", e);
            return "BEH_ERROR";
        }
    }

    /**
     * Generate composite fingerprint combining all methods
     */
    private String generateCompositeFingerprint(String... fingerprints) {
        String combined = String.join("|", fingerprints);
        return generateSHA256Hash(combined);
    }

    /**
     * Detect device type and capabilities
     */
    private DeviceInfo detectDevice(FingerprintRequest request) {
        if (request.getUserAgent() == null) {
            return DeviceInfo.unknown();
        }

        try {
            Client client = userAgentParser.parse(request.getUserAgent());

            String deviceType = determineDeviceType(client.device.family);
            String browser = client.userAgent.family;
            String browserVersion = client.userAgent.major + "." + client.userAgent.minor;
            String os = client.os.family;
            String osVersion = client.os.major + "." + client.os.minor;

            boolean isHeadless = detectHeadlessBrowser(request.getUserAgent());
            boolean isBot = detectBotUserAgent(request.getUserAgent());
            boolean isAutomation = detectAutomationTools(request.getUserAgent());

            return DeviceInfo.builder()
                .deviceType(deviceType)
                .browser(browser)
                .browserVersion(browserVersion)
                .os(os)
                .osVersion(osVersion)
                .isHeadless(isHeadless)
                .isBot(isBot)
                .isAutomation(isAutomation)
                .build();

        } catch (Exception e) {
            log.error("Error detecting device", e);
            return DeviceInfo.unknown();
        }
    }

    private String determineDeviceType(String deviceFamily) {
        String lower = deviceFamily.toLowerCase();
        if (lower.contains("spider") || lower.contains("bot")) return "BOT";
        if (lower.contains("mobile") || lower.contains("iphone") || lower.contains("android")) return "MOBILE";
        if (lower.contains("tablet") || lower.contains("ipad")) return "TABLET";
        return "DESKTOP";
    }

    private boolean detectHeadlessBrowser(String ua) {
        String lower = ua.toLowerCase();
        return lower.contains("headless") || 
               lower.contains("phantomjs") || 
               lower.contains("selenium");
    }

    private boolean detectBotUserAgent(String ua) {
        String lower = ua.toLowerCase();
        return lower.contains("bot") || 
               lower.contains("crawler") || 
               lower.contains("spider") ||
               lower.contains("scraper");
    }

    private boolean detectAutomationTools(String ua) {
        String lower = ua.toLowerCase();
        return lower.contains("selenium") || 
               lower.contains("puppeteer") || 
               lower.contains("playwright") ||
               lower.contains("cypress");
    }

    /**
     * Calculate anomaly score based on fingerprint analysis
     */
    private double calculateAnomalyScore(FingerprintRequest request, DeviceInfo deviceInfo) {
        double score = 0.0;

        // Check for automation indicators
        if (deviceInfo.isBot() || deviceInfo.isAutomation()) score += 0.4;
        if (deviceInfo.isHeadless()) score += 0.3;

        // Check for missing or suspicious headers
        if (request.getUserAgent() == null || request.getUserAgent().isEmpty()) score += 0.2;
        if (request.getHeaderOrder() == null || request.getHeaderOrder().isEmpty()) score += 0.1;

        // Check for unusual TLS configuration
        if (request.getTlsVersion() != null && !isCommonTLSVersion(request.getTlsVersion())) {
            score += 0.15;
        }

        // Check for rapid requests (potential bot)
        if (request.getRequestTimings() != null && request.getRequestTimings().size() > 1) {
            long avgInterval = calculateAverageInterval(request.getRequestTimings());
            if (avgInterval < 100) score += 0.25; // Less than 100ms between requests
        }

        return Math.min(1.0, score);
    }

    private boolean isCommonTLSVersion(String version) {
        return version.equals("771") ||  // TLS 1.2
               version.equals("772");    // TLS 1.3
    }

    private long calculateAverageInterval(List<Long> timings) {
        if (timings.size() < 2) return 0;
        
        long totalInterval = 0;
        for (int i = 1; i < timings.size(); i++) {
            totalInterval += timings.get(i) - timings.get(i - 1);
        }
        return totalInterval / (timings.size() - 1);
    }

    /**
     * Detect known bot patterns
     */
    private boolean detectBotPatterns(String tlsFp, String uaFp, DeviceInfo device) {
        // Check device info
        if (device.isBot() || device.isAutomation() || device.isHeadless()) {
            return true;
        }

        // Check for known bot TLS fingerprints
        Set<String> knownBotTLSFingerprints = Set.of(
            // Add known bot TLS fingerprints here
        );
        if (knownBotTLSFingerprints.contains(tlsFp)) {
            return true;
        }

        return false;
    }

    /**
     * Track fingerprint to IP mapping for correlation
     */
    private void trackFingerprint(String fingerprint, String ip) {
        fingerprintToIPs.computeIfAbsent(fingerprint, k -> ConcurrentHashMap.newKeySet()).add(ip);
    }

    /**
     * Get all IPs associated with a fingerprint
     */
    public Set<String> getIPsForFingerprint(String fingerprint) {
        return fingerprintToIPs.getOrDefault(fingerprint, Collections.emptySet());
    }

    /**
     * Detect if multiple IPs share the same fingerprint (bot network)
     */
    public boolean isPotentialBotNetwork(String fingerprint) {
        Set<String> ips = getIPsForFingerprint(fingerprint);
        return ips.size() >= 5; // Threshold: 5+ IPs with same fingerprint
    }

    // Utility methods
    private String generateMD5Hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    private String generateSHA256Hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    // Inner classes
    @lombok.Data
    @lombok.Builder
    public static class FingerprintRequest {
        private String sourceIp;
        private String userAgent;
        
        // TLS data
        private String tlsVersion;
        private List<String> cipherSuites;
        private List<String> tlsExtensions;
        private List<String> ellipticCurves;
        private List<String> ecPointFormats;
        
        // HTTP/2 data
        private boolean http2;
        private Map<String, String> http2Settings;
        private Integer http2WindowSize;
        private String http2StreamPriority;
        
        // TCP data
        private Integer tcpWindowSize;
        private Integer ttl;
        private List<String> tcpOptions;
        
        // Behavioral data
        private List<Long> requestTimings;
        private List<String> headerOrder;
        private List<String> requestPaths;
    }

    @lombok.Data
    @lombok.Builder
    public static class TrafficFingerprint {
        private String compositeFingerprint;
        private String tlsFingerprint;
        private String http2Fingerprint;
        private String tcpFingerprint;
        private String userAgentFingerprint;
        private String behavioralFingerprint;
        private DeviceInfo deviceInfo;
        private double anomalyScore;
        private boolean isSuspicious;
        private java.time.Instant timestamp;

        public static TrafficFingerprint error() {
            return TrafficFingerprint.builder()
                .compositeFingerprint("ERROR")
                .anomalyScore(0.5)
                .isSuspicious(false)
                .timestamp(java.time.Instant.now())
                .build();
        }
    }

    @lombok.Data
    @lombok.Builder
    public static class DeviceInfo {
        private String deviceType;
        private String browser;
        private String browserVersion;
        private String os;
        private String osVersion;
        private boolean isHeadless;
        private boolean isBot;
        private boolean isAutomation;

        public static DeviceInfo unknown() {
            return DeviceInfo.builder()
                .deviceType("UNKNOWN")
                .browser("Unknown")
                .browserVersion("0.0")
                .os("Unknown")
                .osVersion("0.0")
                .isHeadless(false)
                .isBot(false)
                .isAutomation(false)
                .build();
        }
    }
}
