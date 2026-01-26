package com.defenddos.backend_service.dto;

/**
 * DTO for social login requests (Google/GitHub)
 */
public class SocialLoginRequest {
    private String email;
    private String name;
    private String provider; // "google" or "github"
    private String providerId;
    private String avatarUrl;

    public SocialLoginRequest() {
    }

    public SocialLoginRequest(String email, String name, String provider, String providerId, String avatarUrl) {
        this.email = email;
        this.name = name;
        this.provider = provider;
        this.providerId = providerId;
        this.avatarUrl = avatarUrl;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
