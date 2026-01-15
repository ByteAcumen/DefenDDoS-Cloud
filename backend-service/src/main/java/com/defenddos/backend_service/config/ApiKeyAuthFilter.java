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

        // Skip auth for public endpoints (Swagger, Health, etc.) -> Handled by
        // SecurityConfig Matchers
        // But we can also check here if we want strictly filter-based logic.
        // For now, we rely on SecurityConfig to insert this filter in the chain.

        String requestApiKey = request.getHeader("X-API-KEY");

        if (requestApiKey != null && !requestApiKey.isEmpty()) {
            if (validApiKey.equals(requestApiKey)) {
                // Create an Authentication object and set it in the SecurityContext
                Authentication authentication = new UsernamePasswordAuthenticationToken("api-user", null,
                        java.util.Collections.emptyList()); // Changed to fully qualified name
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                // Invalid Key logic - or simply do nothing and let downstream (SecurityConfig)
                // handle permitAll vs authenticated
                // If we want to strictly fail here for requests sending BAD keys:
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                response.getWriter().write("Invalid API Key");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
