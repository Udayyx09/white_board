package com.excalidraw.dto;

public class CollaborationMessage {

    public enum Type {
        CURSOR,
        ELEMENTS_CHANGE,
        LASER,
        PRESENCE_JOIN,
        PRESENCE_LEAVE
    }

    private Type type;
    private String drawingId;
    private String userId;
    private String username;
    private String userColor;
    private Double x;
    private Double y;
    private String elementsJson;
    private String laserPointsJson;
    private Long timestamp;

    public CollaborationMessage() {}

    public CollaborationMessage(Type type, String drawingId, String userId, String username, String userColor, Double x, Double y, String elementsJson, String laserPointsJson, Long timestamp) {
        this.type = type;
        this.drawingId = drawingId;
        this.userId = userId;
        this.username = username;
        this.userColor = userColor;
        this.x = x;
        this.y = y;
        this.elementsJson = elementsJson;
        this.laserPointsJson = laserPointsJson;
        this.timestamp = timestamp;
    }

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }

    public String getDrawingId() { return drawingId; }
    public void setDrawingId(String drawingId) { this.drawingId = drawingId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getUserColor() { return userColor; }
    public void setUserColor(String userColor) { this.userColor = userColor; }

    public Double getX() { return x; }
    public void setX(Double x) { this.x = x; }

    public Double getY() { return y; }
    public void setY(Double y) { this.y = y; }

    public String getElementsJson() { return elementsJson; }
    public void setElementsJson(String elementsJson) { this.elementsJson = elementsJson; }

    public String getLaserPointsJson() { return laserPointsJson; }
    public void setLaserPointsJson(String laserPointsJson) { this.laserPointsJson = laserPointsJson; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
}
