package com.defenddos.backend_service.util;

import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    /**
     * Sanitize error messages to prevent XSS
     */
    public static String sanitizeErrorMessage(String message) {
        if (message == null || message.isEmpty()) {
            return "An error occurred";
        }

        // Remove HTML tags
        message = message.replaceAll("<[^>]*>", "");

        // Escape special HTML characters
        message = message.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;")
                .replace("/", "&#x2F;");

        // Limit length to prevent log flooding
        if (message.length() > 200) {
            message = message.substring(0, 200) + "...";
        }

        return message;
    }

    /**
     * Sanitize user input (IP addresses, usernames, etc.)
     */
    public static String sanitizeInput(String input) {
        if (input == null) {
            return "";
        }

        // Remove control characters
        input = input.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "");

        // Trim whitespace
        input = input.trim();

        return input;
    }

    /**
     * Check if string contains potential XSS patterns
     */
    public static boolean containsXss(String input) {
        if (input == null) {
            return false;
        }

        String lowerInput = input.toLowerCase();
        return lowerInput.contains("<script") ||
                lowerInput.contains("javascript:") ||
                lowerInput.contains("onerror=") ||
                lowerInput.contains("onclick=") ||
                lowerInput.contains("onload=");
    }
}
