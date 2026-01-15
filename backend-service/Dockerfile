# Use Eclipse Temurin JDK 21 (official OpenJDK distribution)
FROM eclipse-temurin:21-jdk-alpine

# Set metadata
LABEL maintainer="DefenDDoS Team"
LABEL description="DefenDDoS Backend Service - DDoS Detection and Mitigation Platform"
LABEL version="1.0.0"

# Install iptables and other required utilities (using apk for Alpine)
RUN apk add --no-cache iptables curl

# Create application directory
WORKDIR /app

# Create non-root user for security (Alpine syntax)
RUN addgroup -S defenddos && adduser -S defenddos -G defenddos

# Copy the executable JAR file to the container
COPY target/backend-service-*.jar app.jar

# Copy blocking scripts
COPY scripts/block_ip.sh /usr/local/bin/block_ip.sh
COPY scripts/unblock_ip.sh /usr/local/bin/unblock_ip.sh

# Create logs directory and set permissions
RUN mkdir -p /app/logs && \
    chmod +x /usr/local/bin/block_ip.sh && \
    chmod +x /usr/local/bin/unblock_ip.sh && \
    chown -R defenddos:defenddos /app

# NOTE: Running as root is required for iptables functionality
# In production, consider using sudo configuration or capabilities instead
# USER defenddos

# Expose port 8080 (standard) and 8081 (configured)
EXPOSE 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8081/actuator/health || exit 1

# Set JVM options for production
ENV JAVA_OPTS="-Xmx512m -Xms256m -XX:+UseG1GC -XX:+UseContainerSupport"

# Run the JAR file with JVM options
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
