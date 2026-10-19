package com.excalidraw.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class DrawingSummaryDto {

    private String id;
    private String title;
    private String thumbnail;

    @JsonProperty("isPublic")
    private Boolean isPublic = false;
    private Instant createdAt;
    private Instant updatedAt;

    public DrawingSummaryDto() {}

    public DrawingSummaryDto(String id, String title, String thumbnail, boolean isPublic, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.title = title;
        this.thumbnail = thumbnail;
        this.isPublic = isPublic;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

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

    public static class Builder {
        private String id;
        private String title;
        private String thumbnail;
        private boolean isPublic;
        private Instant createdAt;
        private Instant updatedAt;

        public Builder id(String id) { this.id = id; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder thumbnail(String thumbnail) { this.thumbnail = thumbnail; return this; }
        public Builder isPublic(boolean isPublic) { this.isPublic = isPublic; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }

        public DrawingSummaryDto build() {
            return new DrawingSummaryDto(id, title, thumbnail, isPublic, createdAt, updatedAt);
        }
    }
}
