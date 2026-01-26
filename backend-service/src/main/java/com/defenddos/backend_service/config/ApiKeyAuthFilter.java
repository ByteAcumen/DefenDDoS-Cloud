package com.defenddos.backend_service.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Filter to check for valid X-API-KEY header in requests.
 */
@Component
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    @Value("${defenddos.security.api-key:defenddos-secret-key-123}")
    private String validApiKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // 1. Skip check for health check (public)
        if (path.startsWith("/actuator/health")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Skip check for explicity public API endpoints and Auth endpoints
        if (path.startsWith("/api/v1/public/") || path.startsWith("/api/v1/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. For all other /api/ and /actuator/ paths, enforce API Key
        // If it's not api or actuator (e.g. static files, error), let it pass
        // (SecurityConfig will handle if needed)
        if (!path.startsWith("/api/") && !path.startsWith("/actuator/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestApiKey = request.getHeader("X-API-KEY");

        if (requestApiKey == null || requestApiKey.isEmpty()) {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.getWriter().write("Missing API Key");
            return;
        }

        if (validApiKey.equals(requestApiKey)) {
            // Create an Authentication object and set it in the SecurityContext
            Authentication authentication = new UsernamePasswordAuthenticationToken("api-user", null,
                    java.util.Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } else {
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.getWriter().write("Invalid API Key");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
