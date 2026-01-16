package com.defenddos.backend_service.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ ElementType.PARAMETER, ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IdValidator.class)
@Documented
public @interface ValidId {
    String message() default "Invalid ID format";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
