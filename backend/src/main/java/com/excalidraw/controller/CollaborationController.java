package com.excalidraw.controller;

import com.excalidraw.dto.CollaborationMessage;
import com.excalidraw.repository.DrawingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class CollaborationController {

    private static final Logger logger = LoggerFactory.getLogger(CollaborationController.class);
    private final DrawingRepository drawingRepository;

    public CollaborationController(DrawingRepository drawingRepository) {
        this.drawingRepository = drawingRepository;
    }

    @MessageMapping("/drawings/{drawingId}/cursor")
    @SendTo("/topic/drawings/{drawingId}/cursor")
    public CollaborationMessage broadcastCursor(
            @DestinationVariable String drawingId,
            CollaborationMessage message
    ) {
        message.setDrawingId(drawingId);
        message.setTimestamp(System.currentTimeMillis());
        return message;
    }

    @MessageMapping("/drawings/{drawingId}/elements")
    @SendTo("/topic/drawings/{drawingId}/elements")
    public CollaborationMessage broadcastElements(
            @DestinationVariable String drawingId,
            CollaborationMessage message
    ) {
        message.setDrawingId(drawingId);
        message.setTimestamp(System.currentTimeMillis());

        // Optional non-blocking persistence if drawing is in database
        try {
            if (message.getElementsJson() != null && !message.getElementsJson().isBlank()) {
                drawingRepository.findById(drawingId).ifPresent(drawing -> {
                    drawing.setElementsJson(message.getElementsJson());
                    drawingRepository.save(drawing);
                });
            }
        } catch (Exception ex) {
            logger.warn("Could not auto-save collaborated elements for drawing {}: {}", drawingId, ex.getMessage());
        }

        return message;
    }

    @MessageMapping("/drawings/{drawingId}/laser")
    @SendTo("/topic/drawings/{drawingId}/laser")
    public CollaborationMessage broadcastLaser(
            @DestinationVariable String drawingId,
            CollaborationMessage message
    ) {
        message.setDrawingId(drawingId);
        message.setTimestamp(System.currentTimeMillis());
        return message;
    }

    @MessageMapping("/drawings/{drawingId}/presence")
    @SendTo("/topic/drawings/{drawingId}/presence")
    public CollaborationMessage broadcastPresence(
            @DestinationVariable String drawingId,
            CollaborationMessage message
    ) {
        message.setDrawingId(drawingId);
        message.setTimestamp(System.currentTimeMillis());
        return message;
    }
}
