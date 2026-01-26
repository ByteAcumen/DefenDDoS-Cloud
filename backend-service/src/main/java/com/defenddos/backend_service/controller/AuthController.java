package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.dto.AuthResponse;
import com.defenddos.backend_service.dto.LoginRequest;
import com.defenddos.backend_service.dto.RegisterRequest;
import com.defenddos.backend_service.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for authentication operations.
 * Provides endpoints for login, register, validate, and logout.
 */
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = { "http://localhost:3000", "http://127.0.0.1:3000" }, allowCredentials = "true")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Login with email and password
     * POST /api/v1/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    /**
     * Register a new user
     * POST /api/v1/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);

        if (response.isSuccess()) {
            return ResponseEntity.status(201).body(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Social Login (Google/GitHub)
     * POST /api/v1/auth/social
     */
    @PostMapping("/social")
    public ResponseEntity<AuthResponse> socialLogin(
            @RequestBody com.defenddos.backend_service.dto.SocialLoginRequest request) {
        AuthResponse response = authService.socialLogin(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GitHub Login (Code Exchange Flow)
     * POST /api/v1/auth/github
     */
    @PostMapping("/github")
    public ResponseEntity<AuthResponse> githubLogin(@RequestBody java.util.Map<String, String> payload) {
        String code = payload.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().body(new AuthResponse(false, "Missing code"));
        }
        AuthResponse response = authService.exchangeGithubCode(code);
        return ResponseEntity.ok(response);
    }

    /**
     * Validate current token and get user info
     * GET /api/v1/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String token) {
        AuthResponse response = authService.validateToken(token);

        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body(response);
        }
    }

    /**
     * Logout - invalidate token
     * POST /api/v1/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(
            @RequestHeader(value = "Authorization", required = false) String token) {
        AuthResponse response = authService.logout(token);
        return ResponseEntity.ok(response);
    }

    /**
     * Health check for auth service
     * GET /api/v1/auth/health
     */
    @GetMapping("/health")
    public ResponseEntity<AuthResponse> health() {
        return ResponseEntity.ok(new AuthResponse(true, "Auth service is running"));
    }
}
