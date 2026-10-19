package com.excalidraw.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "drawings")
@EntityListeners(AuditingEntityListener.class)
public class Drawing {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "elements_json", nullable = false, columnDefinition = "TEXT")
    private String elementsJson;

    @Column(name = "app_state_json", columnDefinition = "TEXT")
    private String appStateJson;

    @Column(name = "thumbnail", columnDefinition = "TEXT")
    private String thumbnail;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    public Drawing() {}

    public Drawing(String id, String title, String elementsJson, String appStateJson, String thumbnail, boolean isPublic, User user) {
        this.id = id;
        this.title = title;
        this.elementsJson = elementsJson;
        this.appStateJson = appStateJson;
        this.thumbnail = thumbnail;
        this.isPublic = isPublic;
        this.user = user;
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

    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public static class Builder {
        private String id;
        private String title;
        private String elementsJson;
        private String appStateJson;
        private String thumbnail;
        private boolean isPublic = false;
        private User user;

        public Builder id(String id) { this.id = id; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder elementsJson(String elementsJson) { this.elementsJson = elementsJson; return this; }
        public Builder appStateJson(String appStateJson) { this.appStateJson = appStateJson; return this; }
        public Builder thumbnail(String thumbnail) { this.thumbnail = thumbnail; return this; }
        public Builder isPublic(boolean isPublic) { this.isPublic = isPublic; return this; }
        public Builder user(User user) { this.user = user; return this; }

        public Drawing build() {
            return new Drawing(id, title, elementsJson, appStateJson, thumbnail, isPublic, user);
        }
    }
}
