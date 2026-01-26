package com.defenddos.backend_service.service;

import com.defenddos.backend_service.dto.AuthResponse;
import com.defenddos.backend_service.dto.LoginRequest;
import com.defenddos.backend_service.dto.RegisterRequest;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service for handling authentication operations.
 * This is a simplified implementation for demo purposes.
 * In production, use Spring Security with proper JWT library.
 */
@Service
public class AuthService {

    // In-memory user store (for demo - use database in production)
    private final Map<String, UserRecord> users = new ConcurrentHashMap<>();

    // Rate limiting store
    private final Map<String, RateLimitInfo> rateLimits = new ConcurrentHashMap<>();

    // Token store (for demo - use Redis/database in production)
    private final Map<String, TokenInfo> tokens = new ConcurrentHashMap<>();

    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final long RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    private static final long TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

    public AuthService() {
        // Add demo user
        String hashedPassword = hashPassword("demo123");
        users.put("demo@defenddos.com", new UserRecord(
                UUID.randomUUID().toString(),
                "Demo User",
                "demo@defenddos.com",
                hashedPassword,
                "admin"));
    }

    /**
     * Authenticate user with email and password
     */
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check rate limiting
        RateLimitInfo rateLimit = rateLimits.get(email);
        if (rateLimit != null && rateLimit.isBlocked()) {
            long remainingSeconds = (rateLimit.blockUntil - System.currentTimeMillis()) / 1000;
            return new AuthResponse(false,
                    "Too many failed attempts. Try again in " + (remainingSeconds / 60) + " minutes.");
        }

        // Find user
        UserRecord user = users.get(email);
        if (user == null) {
            incrementFailedAttempts(email);
            return new AuthResponse(false, "Invalid email or password");
        }

        // Verify password
        String hashedInput = hashPassword(request.getPassword());
        if (!hashedInput.equals(user.passwordHash)) {
            incrementFailedAttempts(email);
            return new AuthResponse(false, "Invalid email or password");
        }

        // Success - clear rate limit and generate token
        rateLimits.remove(email);
        String token = generateToken(user.id, request.isRememberMe());

        return new AuthResponse(
                true,
                "Login successful",
                token,
                new AuthResponse.UserInfo(user.id, user.name, user.email, user.role));
    }

    /**
     * Register a new user
     */
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Check if email already exists
        if (users.containsKey(email)) {
            return new AuthResponse(false, "Email already registered");
        }

        // Validate password strength
        if (request.getPassword().length() < 6) {
            return new AuthResponse(false, "Password must be at least 6 characters");
        }

        // Create new user
        String userId = UUID.randomUUID().toString();
        String hashedPassword = hashPassword(request.getPassword());
        UserRecord newUser = new UserRecord(
                userId,
                request.getName().trim(),
                email,
                hashedPassword,
                "user");
        users.put(email, newUser);

        // Generate token
        String token = generateToken(userId, false);

        return new AuthResponse(
                true,
                "Registration successful",
                token,
                new AuthResponse.UserInfo(userId, newUser.name, email, "user"));
    }

    /**
     * Social Login (Google/GitHub)
     * Creates user if not exists, otherwise logs them in.
     */
    public AuthResponse socialLogin(com.defenddos.backend_service.dto.SocialLoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        // Find or create user
        UserRecord user = users.get(email);
        if (user == null) {
            // Register new social user
            String userId = UUID.randomUUID().toString();
            user = new UserRecord(
                    userId,
                    request.getName(),
                    email,
                    "SOCIAL_USER", // No password
                    "user");
            users.put(email, user);
        }

        // Generate token
        String token = generateToken(user.id, true);

        return new AuthResponse(
                true,
                "Login successful",
                token,
                new AuthResponse.UserInfo(user.id, user.name, user.email, user.role));
    }

    /**
     * Validate a token and return user info
     */
    public AuthResponse validateToken(String token) {
        if (token == null || token.isEmpty()) {
            return new AuthResponse(false, "No token provided");
        }

        // Remove "Bearer " prefix if present
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        TokenInfo tokenInfo = tokens.get(token);
        if (tokenInfo == null) {
            return new AuthResponse(false, "Invalid token");
        }

        if (tokenInfo.expiresAt < System.currentTimeMillis()) {
            tokens.remove(token);
            return new AuthResponse(false, "Token expired");
        }

        // Find user
        for (UserRecord user : users.values()) {
            if (user.id.equals(tokenInfo.userId)) {
                return new AuthResponse(
                        true,
                        "Token valid",
                        token,
                        new AuthResponse.UserInfo(user.id, user.name, user.email, user.role));
            }
        }

        return new AuthResponse(false, "User not found");
    }

    /**
     * Exchange GitHub Code for Token and Login
     */
    public AuthResponse exchangeGithubCode(String code) {
        try {
            // 1. Exchange Code for Token
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            // Explicitly reading properties mainly for demo simplicity
            String clientId = "Ov23liglrz9RXjWHU91X";
            String clientSecret = "734e12c2584ce5ef71ab7775f39235f67139cf7d";

            String tokenUrl = "https://github.com/login/oauth/access_token";
            Map<String, String> tokenRequest = new java.util.HashMap<>();
            tokenRequest.put("client_id", clientId);
            tokenRequest.put("client_secret", clientSecret);
            tokenRequest.put("code", code);

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setAccept(java.util.Collections.singletonList(org.springframework.http.MediaType.APPLICATION_JSON));
            org.springframework.http.HttpEntity<Map<String, String>> entity = new org.springframework.http.HttpEntity<>(
                    tokenRequest, headers);

            @SuppressWarnings("rawtypes")
            org.springframework.http.ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, entity,
                    Map.class);

            if (response.getBody() == null || !response.getBody().containsKey("access_token")) {
                return new AuthResponse(false, "Failed to exchange GitHub code");
            }

            String accessToken = (String) response.getBody().get("access_token");

            // 2. Get User Info
            org.springframework.http.HttpHeaders authHeaders = new org.springframework.http.HttpHeaders();
            authHeaders.setBearerAuth(accessToken);
            org.springframework.http.HttpEntity<Void> authEntity = new org.springframework.http.HttpEntity<>(
                    authHeaders);

            @SuppressWarnings("rawtypes")
            org.springframework.http.ResponseEntity<Map> userResponse = restTemplate.exchange(
                    "https://api.github.com/user",
                    org.springframework.http.HttpMethod.GET,
                    authEntity,
                    Map.class);

            if (userResponse.getBody() == null) {
                return new AuthResponse(false, "Failed to fetch GitHub user info");
            }

            Map userData = userResponse.getBody();
            String email = (String) userData.get("email");
            String name = (String) userData.get("name");
            String login = (String) userData.get("login"); // Username
            String avatarUrl = (String) userData.get("avatar_url");
            String githubId = String.valueOf(userData.get("id"));

            // If email is private/null, try to fetch it
            if (email == null) {
                try {
                    @SuppressWarnings("rawtypes")
                    org.springframework.http.ResponseEntity<java.util.List> emailsResponse = restTemplate.exchange(
                            "https://api.github.com/user/emails",
                            org.springframework.http.HttpMethod.GET,
                            authEntity,
                            java.util.List.class);
                    if (emailsResponse.getBody() != null && !emailsResponse.getBody().isEmpty()) {
                        // Just grab first email for now or logic to find primary
                        @SuppressWarnings("rawtypes")
                        Map firstEmail = (Map) emailsResponse.getBody().get(0);
                        email = (String) firstEmail.get("email");
                    }
                } catch (Exception e) {
                    // Ignore
                }
            }

            if (email == null) {
                // Fallback to pseudo-email
                email = login + "@github.com";
            }

            // Reuse social login logic
            com.defenddos.backend_service.dto.SocialLoginRequest socialRequest = new com.defenddos.backend_service.dto.SocialLoginRequest(
                    email,
                    name != null ? name : login,
                    "github",
                    githubId,
                    avatarUrl);

            return socialLogin(socialRequest);

        } catch (Exception e) {
            e.printStackTrace();
            return new AuthResponse(false, "GitHub auth error: " + e.getMessage());
        }
    }

    /**
     * Logout - invalidate token
     */
    public AuthResponse logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        tokens.remove(token);
        return new AuthResponse(true, "Logged out successfully");
    }

    // ============ Helper Methods ============

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String generateToken(String userId, boolean rememberMe) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        long expiry = rememberMe ? 7 * 24 * 60 * 60 * 1000L : TOKEN_EXPIRY_MS;
        tokens.put(token, new TokenInfo(userId, System.currentTimeMillis() + expiry));

        return token;
    }

    private void incrementFailedAttempts(String email) {
        RateLimitInfo info = rateLimits.computeIfAbsent(email, k -> new RateLimitInfo());
        info.attempts++;
        info.lastAttempt = System.currentTimeMillis();

        if (info.attempts >= MAX_LOGIN_ATTEMPTS) {
            info.blockUntil = System.currentTimeMillis() + RATE_LIMIT_WINDOW_MS;
        }
    }

    // ============ Inner Classes ============

    private static class UserRecord {
        String id;
        String name;
        String email;
        String passwordHash;
        String role;

        UserRecord(String id, String name, String email, String passwordHash, String role) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.passwordHash = passwordHash;
            this.role = role;
        }
    }

    private static class RateLimitInfo {
        int attempts = 0;
        long lastAttempt = 0;
        long blockUntil = 0;

        boolean isBlocked() {
            if (blockUntil > System.currentTimeMillis()) {
                return true;
            }
            // Reset if window expired
            if (lastAttempt > 0 && System.currentTimeMillis() - lastAttempt > RATE_LIMIT_WINDOW_MS) {
                attempts = 0;
                blockUntil = 0;
            }
            return false;
        }
    }

    private static class TokenInfo {
        String userId;
        long expiresAt;

        TokenInfo(String userId, long expiresAt) {
            this.userId = userId;
            this.expiresAt = expiresAt;
        }
    }
}
