package com.excalidraw.service;

import com.excalidraw.dto.DrawingDto;
import com.excalidraw.dto.DrawingSummaryDto;
import com.excalidraw.exception.BadRequestException;
import com.excalidraw.exception.ResourceNotFoundException;
import com.excalidraw.model.Drawing;
import com.excalidraw.model.User;
import com.excalidraw.repository.DrawingRepository;
import com.excalidraw.repository.UserRepository;
import com.excalidraw.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DrawingService {

    private final DrawingRepository drawingRepository;
    private final UserRepository userRepository;

    public DrawingService(DrawingRepository drawingRepository, UserRepository userRepository) {
        this.drawingRepository = drawingRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public DrawingDto saveDrawing(DrawingDto dto, UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));

        String drawingId = (dto.getId() != null && !dto.getId().isBlank()) ? dto.getId().trim() : UUID.randomUUID().toString();

        Drawing drawing = drawingRepository.findById(drawingId).orElse(null);

        if (drawing != null) {
            // Check ownership
            if (!drawing.getUser().getId().equals(user.getId())) {
                throw new BadRequestException("You do not have permission to modify this drawing.");
            }
            if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
                drawing.setTitle(dto.getTitle());
            }
            if (dto.getElementsJson() != null) {
                drawing.setElementsJson(dto.getElementsJson());
            }
            if (dto.getAppStateJson() != null) {
                drawing.setAppStateJson(dto.getAppStateJson());
            }
            if (dto.getThumbnail() != null) {
                drawing.setThumbnail(dto.getThumbnail());
            }
            if (dto.getIsPublic() != null) {
                drawing.setPublic(dto.getIsPublic());
            }
        } else {
            drawing = Drawing.builder()
                    .id(drawingId)
                    .title(dto.getTitle() != null && !dto.getTitle().isBlank() ? dto.getTitle() : "Untitled Drawing")
                    .elementsJson(dto.getElementsJson() != null ? dto.getElementsJson() : "[]")
                    .appStateJson(dto.getAppStateJson() != null ? dto.getAppStateJson() : "{}")
                    .thumbnail(dto.getThumbnail())
                    .isPublic(dto.isPublic())
                    .user(user)
                    .build();
        }

        Drawing saved = drawingRepository.save(drawing);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<DrawingSummaryDto> getUserDrawings(UserPrincipal currentUser) {
        List<Drawing> drawings = drawingRepository.findByUserIdOrderByUpdatedAtDesc(currentUser.getId());
        return drawings.stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DrawingDto getDrawingById(String id, UserPrincipal currentUser) {
        Drawing drawing;
        if (currentUser != null) {
            drawing = drawingRepository.findByIdAccessibleByUser(id, currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Drawing not found or access denied for ID: " + id));
        } else {
            drawing = drawingRepository.findById(id)
                    .filter(Drawing::isPublic)
                    .orElseThrow(() -> new ResourceNotFoundException("Public drawing not found with ID: " + id));
        }

        return mapToDto(drawing);
    }

    @Transactional
    public DrawingDto updateDrawing(String id, DrawingDto dto, UserPrincipal currentUser) {
        Drawing drawing = drawingRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Drawing not found with ID: " + id));

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            drawing.setTitle(dto.getTitle());
        }
        if (dto.getElementsJson() != null) {
            drawing.setElementsJson(dto.getElementsJson());
        }
        if (dto.getAppStateJson() != null) {
            drawing.setAppStateJson(dto.getAppStateJson());
        }
        if (dto.getThumbnail() != null) {
            drawing.setThumbnail(dto.getThumbnail());
        }
        if (dto.getIsPublic() != null) {
            drawing.setPublic(dto.getIsPublic());
        }

        Drawing saved = drawingRepository.save(drawing);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteDrawing(String id, UserPrincipal currentUser) {
        Drawing drawing = drawingRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Drawing not found with ID: " + id));

        drawingRepository.delete(drawing);
    }

    private DrawingDto mapToDto(Drawing d) {
        return DrawingDto.builder()
                .id(d.getId())
                .title(d.getTitle())
                .elementsJson(d.getElementsJson())
                .appStateJson(d.getAppStateJson())
                .thumbnail(d.getThumbnail())
                .isPublic(d.isPublic())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .ownerId(d.getUser() != null ? d.getUser().getId() : null)
                .ownerUsername(d.getUser() != null ? d.getUser().getUsername() : null)
                .build();
    }

    private DrawingSummaryDto mapToSummaryDto(Drawing d) {
        return DrawingSummaryDto.builder()
                .id(d.getId())
                .title(d.getTitle())
                .thumbnail(d.getThumbnail())
                .isPublic(d.isPublic())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
