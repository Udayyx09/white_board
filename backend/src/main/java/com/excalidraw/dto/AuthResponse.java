package com.excalidraw.dto;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String email;
    private String name;

    public AuthResponse() {}

    public AuthResponse(String token, String tokenType, Long userId, String username, String email, String name) {
        this.token = token;
        this.tokenType = tokenType != null ? tokenType : "Bearer";
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.name = name;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getAccessToken() { return token; }
    public void setAccessToken(String accessToken) { this.token = accessToken; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public static class Builder {
        private String token;
        private String tokenType = "Bearer";
        private Long userId;
        private String username;
        private String email;
        private String name;

        public Builder token(String token) { this.token = token; return this; }
        public Builder tokenType(String tokenType) { this.tokenType = tokenType; return this; }
        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder name(String name) { this.name = name; return this; }

        public AuthResponse build() {
            return new AuthResponse(token, tokenType, userId, username, email, name);
        }
    }
}
