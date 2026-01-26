package com.defenddos.backend_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

        private final ApiKeyAuthFilter apiKeyAuthFilter;
        private final IpBlockingFilter ipBlockingFilter;

        public SecurityConfig(ApiKeyAuthFilter apiKeyAuthFilter, IpBlockingFilter ipBlockingFilter) {
                this.apiKeyAuthFilter = apiKeyAuthFilter;
                this.ipBlockingFilter = ipBlockingFilter;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless REST API
                                .sessionManagement(session -> session.sessionCreationPolicy(
                                                org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(authz -> authz
                                                // Public health check only
                                                .requestMatchers("/actuator/health").permitAll()
                                                .requestMatchers("/actuator/health/liveness").permitAll()
                                                .requestMatchers("/actuator/health/readiness").permitAll()

                                                // Auth endpoints are public (handled by ApiKeyAuthFilter)
                                                .requestMatchers("/api/v1/auth/**").permitAll()

                                                // Public API endpoints (if any)
                                                .requestMatchers("/api/v1/public/**").permitAll()

                                                // Secure all other actuator endpoints
                                                .requestMatchers("/actuator/**").authenticated()

                                                // All other API endpoints require authentication (via API key)
                                                .requestMatchers("/api/**").authenticated()

                                                // Default: permit all (filters will handle security)
                                                .anyRequest().permitAll())
                                .addFilterBefore(apiKeyAuthFilter,
                                                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(ipBlockingFilter, ApiKeyAuthFilter.class);
                return http.build();
        }
}
