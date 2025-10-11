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

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disable CSRF for stateless REST API
            .authorizeHttpRequests(authz -> authz
                // Allow all API requests for development/testing
                .requestMatchers("/api/v1/**").permitAll()
                // Actuator endpoints can be public for monitoring
                .requestMatchers("/actuator/**").permitAll()
                // Any other request can be permitted
                .anyRequest().permitAll()
            )
            .httpBasic(withDefaults()); // Enable HTTP Basic Authentication (optional)
        return http.build();
    }
}
