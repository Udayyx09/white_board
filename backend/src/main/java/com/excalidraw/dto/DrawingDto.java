package com.excalidraw.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public class DrawingDto {

    private String id;

    private String title;
    private String elementsJson;

    private String appStateJson;
    private String thumbnail;

    @JsonProperty("isPublic")
    private Boolean isPublic = false;
    private Instant createdAt;
    private Instant updatedAt;
    private Long ownerId;
    private String ownerUsername;

    public DrawingDto() {}

    public DrawingDto(String id, String title, String elementsJson, String appStateJson, String thumbnail, boolean isPublic, Instant createdAt, Instant updatedAt, Long ownerId, String ownerUsername) {
        this.id = id;
        this.title = title;
        this.elementsJson = elementsJson;
        this.appStateJson = appStateJson;
        this.thumbnail = thumbnail;
        this.isPublic = isPublic;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.ownerId = ownerId;
        this.ownerUsername = ownerUsername;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getElementsJson() { return elementsJson; }
    public void setElementsJson(String elementsJson) { this.elementsJson = elementsJson; }

    public String getAppStateJson() { return appStateJson; }
    public void setAppStateJson(String appStateJson) { this.appStateJson = appStateJson; }

    public String getThumbnail() { return thumbnail; }
    public void setThumbnail(String thumbnail) { this.thumbnail = thumbnail; }

    @JsonProperty("isPublic")
    public Boolean getIsPublic() { return isPublic != null ? isPublic : false; }

    @JsonProperty("isPublic")
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public boolean isPublic() { return isPublic != null && isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }

    public static class Builder {
        private String id;
        private String title;
        private String elementsJson;
        private String appStateJson;
        private String thumbnail;
        private boolean isPublic;
        private Instant createdAt;
        private Instant updatedAt;
        private Long ownerId;
        private String ownerUsername;

        public Builder id(String id) { this.id = id; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder elementsJson(String elementsJson) { this.elementsJson = elementsJson; return this; }
        public Builder appStateJson(String appStateJson) { this.appStateJson = appStateJson; return this; }
        public Builder thumbnail(String thumbnail) { this.thumbnail = thumbnail; return this; }
        public Builder isPublic(boolean isPublic) { this.isPublic = isPublic; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder ownerId(Long ownerId) { this.ownerId = ownerId; return this; }
        public Builder ownerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; return this; }

        public DrawingDto build() {
            return new DrawingDto(id, title, elementsJson, appStateJson, thumbnail, isPublic, createdAt, updatedAt, ownerId, ownerUsername);
        }
    }
}
