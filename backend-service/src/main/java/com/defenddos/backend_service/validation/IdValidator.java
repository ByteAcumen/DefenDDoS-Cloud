package com.defenddos.backend_service.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class IdValidator implements ConstraintValidator<ValidId, String> {

    @Override
    public boolean isValid(String id, ConstraintValidatorContext context) {
        if (id == null || id.isEmpty()) {
            return false;
        }

        // Allow alphanumeric, hyphens, underscores (max 50 chars)
        return id.matches("^[a-zA-Z0-9_-]{1,50}$");
    }
}
