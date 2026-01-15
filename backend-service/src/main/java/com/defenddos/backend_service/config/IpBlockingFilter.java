package com.defenddos.backend_service.config;

import com.defenddos.backend_service.service.MitigationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to block requests from IPs identified as malicious by
 * MitigationService.
 * This replaces the network-layer iptables blocking for Render compatibility.
 */
@Component
public class IpBlockingFilter extends OncePerRequestFilter {

    private final MitigationService mitigationService;

    public IpBlockingFilter(MitigationService mitigationService) {
        this.mitigationService = mitigationService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = getClientIp(request);

        if (mitigationService.isIpBlocked(clientIp)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.getWriter().write("Access Denied: Your IP is blocked due to suspicious activity.");
            return; // Stop processing the request
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can be a comma-separated list, take the first one
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
