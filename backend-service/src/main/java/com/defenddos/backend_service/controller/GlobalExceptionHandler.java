package com.defenddos.backend_service.controller;

import com.influxdb.exceptions.InfluxException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for centralized error management
 * Provides consistent error responses across all endpoints
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle InfluxDB related exceptions
     */
    @ExceptionHandler(InfluxException.class)
    public ResponseEntity<Map<String, Object>> handleInfluxDbException(InfluxException ex) {
        logger.error("InfluxDB operation failed: {}", ex.getMessage(), ex);
        
        Map<String, Object> errorResponse = createErrorResponse(
            "DATABASE_ERROR",
            "Database operation failed",
            "Could not connect to or write to the time-series database. Please try again later.",
            HttpStatus.SERVICE_UNAVAILABLE
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.SERVICE_UNAVAILABLE);
    }

    /**
     * Handle security/authentication related exceptions
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex) {
        logger.warn("Access denied: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = createErrorResponse(
            "ACCESS_DENIED",
            "Access denied",
            "You do not have permission to access this resource.",
            HttpStatus.FORBIDDEN
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    /**
     * Handle validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        logger.warn("Validation error: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = createErrorResponse(
            "VALIDATION_ERROR",
            "Invalid input data",
            "The provided data is invalid. Please check your input and try again.",
            HttpStatus.BAD_REQUEST
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle type mismatch errors (e.g., invalid path parameters)
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatchException(MethodArgumentTypeMismatchException ex) {
        logger.warn("Type mismatch error: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = createErrorResponse(
            "INVALID_PARAMETER",
            "Invalid parameter type",
            "The provided parameter format is invalid. Expected: " + ex.getRequiredType().getSimpleName(),
            HttpStatus.BAD_REQUEST
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle illegal argument exceptions
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        logger.warn("Illegal argument: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = createErrorResponse(
            "INVALID_ARGUMENT",
            "Invalid argument",
            ex.getMessage(),
            HttpStatus.BAD_REQUEST
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle any other generic exception
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        logger.error("Unexpected error occurred: {}", ex.getMessage(), ex);
        
        Map<String, Object> errorResponse = createErrorResponse(
            "INTERNAL_ERROR",
            "An unexpected error occurred",
            "The system encountered an unexpected error. Please try again later or contact support.",
            HttpStatus.INTERNAL_SERVER_ERROR
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Create a standardized error response
     */
    private Map<String, Object> createErrorResponse(String errorCode, String error, String message, HttpStatus status) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", status.value());
        errorResponse.put("errorCode", errorCode);
        errorResponse.put("error", error);
        errorResponse.put("message", message);
        errorResponse.put("path", ""); // This could be enhanced to include request path
        
        return errorResponse;
    }
}
