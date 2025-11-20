package com.defenddos.backend_service.controller;

import com.defenddos.backend_service.service.IncidentResponseService;
import com.defenddos.backend_service.service.IncidentResponseService.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST API Controller for Automated Incident Response
 * 
 * Endpoints:
 * - POST /api/incidents/execute - Execute playbook for incident
 * - GET /api/playbooks - List all available playbooks
 * - GET /api/playbooks/{id} - Get playbook details
 * - POST /api/playbooks - Create custom playbook
 * - GET /api/incidents/active - Get active incidents
 * - GET /api/incidents/{id} - Get incident details
 */
@RestController
@RequestMapping("/api/incidents")
@Slf4j
public class IncidentResponseController {

    @Autowired
    private IncidentResponseService incidentResponseService;

    /**
     * Execute playbook for incident
     * 
     * POST /api/incidents/execute
     * 
     * Body:
     * {
     *   "playbookId": "PLAYBOOK_DDOS_001",
     *   "incidentType": "DDoS Attack",
     *   "severity": "CRITICAL",
     *   "sourceIp": "192.168.1.100",
     *   "description": "Large-scale DDoS attack detected",
     *   "metadata": { ... }
     * }
     */
    @PostMapping("/execute")
    public ResponseEntity<ExecutionResponse> executePlaybook(
            @RequestBody ExecutePlaybookRequest request) {
        
        log.info("Executing playbook: {} for incident type: {}", 
            request.getPlaybookId(), request.getIncidentType());
        
        try {
            String incidentId = UUID.randomUUID().toString();
            
            IncidentContext context = IncidentContext.builder()
                .incidentId(incidentId)
                .incidentType(request.getIncidentType())
                .severity(request.getSeverity())
                .sourceIp(request.getSourceIp())
                .description(request.getDescription())
                .timestamp(Instant.now())
                .metadata(request.getMetadata())
                .build();

            // Execute playbook asynchronously
            incidentResponseService.executePlaybook(request.getPlaybookId(), context);
            
            ExecutionResponse response = new ExecutionResponse(
                true,
                "Playbook execution started",
                incidentId
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error executing playbook", e);
            ExecutionResponse response = new ExecutionResponse(
                false,
                "Failed to execute playbook: " + e.getMessage(),
                null
            );
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get all available playbooks
     * 
     * GET /api/playbooks
     * 
     * Response:
     * [
     *   {
     *     "id": "PLAYBOOK_DDOS_001",
     *     "name": "DDoS Attack Response",
     *     "description": "Automated response for detected DDoS attacks",
     *     "severity": "CRITICAL",
     *     "enabled": true,
     *     "triggers": [...],
     *     "actions": [...]
     *   },
     *   ...
     * ]
     */
    @GetMapping("/playbooks")
    public ResponseEntity<List<Playbook>> getAllPlaybooks() {
        log.info("Fetching all playbooks");
        
        try {
            List<Playbook> playbooks = incidentResponseService.getAllPlaybooks();
            return ResponseEntity.ok(playbooks);
            
        } catch (Exception e) {
            log.error("Error fetching playbooks", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get specific playbook details
     * 
     * GET /api/playbooks/PLAYBOOK_DDOS_001
     */
    @GetMapping("/playbooks/{id}")
    public ResponseEntity<Playbook> getPlaybook(@PathVariable String id) {
        log.info("Fetching playbook: {}", id);
        
        try {
            Playbook playbook = incidentResponseService.getPlaybook(id);
            
            if (playbook == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(playbook);
            
        } catch (Exception e) {
            log.error("Error fetching playbook: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Create custom playbook
     * 
     * POST /api/playbooks
     * 
     * Body:
     * {
     *   "name": "Custom DDoS Response",
     *   "description": "Custom playbook for specific attack pattern",
     *   "severity": "HIGH",
     *   "enabled": true,
     *   "triggers": [...],
     *   "actions": [...]
     * }
     */
    @PostMapping("/playbooks")
    public ResponseEntity<Playbook> createPlaybook(
            @RequestBody CreatePlaybookRequest request) {
        
        log.info("Creating custom playbook: {}", request.getName());
        
        try {
            Playbook playbook = Playbook.builder()
                .id("PLAYBOOK_CUSTOM_" + UUID.randomUUID().toString().substring(0, 8))
                .name(request.getName())
                .description(request.getDescription())
                .severity(request.getSeverity())
                .enabled(request.isEnabled())
                .triggers(request.getTriggers())
                .actions(request.getActions())
                .build();

            incidentResponseService.createPlaybook(playbook);
            
            return ResponseEntity.ok(playbook);
            
        } catch (Exception e) {
            log.error("Error creating playbook", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get active incidents
     * 
     * GET /api/incidents/active
     * 
     * Returns list of currently executing incident responses
     */
    @GetMapping("/active")
    public ResponseEntity<List<IncidentRecord>> getActiveIncidents() {
        log.info("Fetching active incidents");
        
        try {
            List<IncidentRecord> incidents = incidentResponseService.getActiveIncidents();
            return ResponseEntity.ok(incidents);
            
        } catch (Exception e) {
            log.error("Error fetching active incidents", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Test playbook execution (dry run)
     * 
     * POST /api/incidents/test
     * 
     * Tests playbook without actually executing actions
     */
    @PostMapping("/test")
    public ResponseEntity<TestResponse> testPlaybook(
            @RequestBody ExecutePlaybookRequest request) {
        
        log.info("Testing playbook: {}", request.getPlaybookId());
        
        try {
            Playbook playbook = incidentResponseService.getPlaybook(request.getPlaybookId());
            
            if (playbook == null) {
                return ResponseEntity.notFound().build();
            }
            
            TestResponse response = new TestResponse(
                true,
                "Playbook validation successful",
                playbook.getActions().size(),
                playbook.getActions().stream()
                    .map(a -> a.getType().toString() + ": " + a.getDescription())
                    .toList()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error testing playbook", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // DTOs
    @lombok.Data
    private static class ExecutePlaybookRequest {
        private String playbookId;
        private String incidentType;
        private Severity severity;
        private String sourceIp;
        private String description;
        private Map<String, Object> metadata;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class ExecutionResponse {
        private boolean success;
        private String message;
        private String incidentId;
    }

    @lombok.Data
    private static class CreatePlaybookRequest {
        private String name;
        private String description;
        private Severity severity;
        private boolean enabled;
        private List<Trigger> triggers;
        private List<Action> actions;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class TestResponse {
        private boolean valid;
        private String message;
        private int actionCount;
        private List<String> actions;
    }
}
