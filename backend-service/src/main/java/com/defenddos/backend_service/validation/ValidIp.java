package com.defenddos.backend_service.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ ElementType.PARAMETER, ElementType.FIELD })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IpAddressValidator.class)
@Documented
public @interface ValidIp {
    String message() default "Invalid IP address format";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
