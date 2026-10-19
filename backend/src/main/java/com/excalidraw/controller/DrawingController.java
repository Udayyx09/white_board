package com.excalidraw.controller;

import com.excalidraw.dto.ApiResponse;
import com.excalidraw.dto.DrawingDto;
import com.excalidraw.dto.DrawingSummaryDto;
import com.excalidraw.security.UserPrincipal;
import com.excalidraw.service.DrawingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drawings")
public class DrawingController {

    private final DrawingService drawingService;

    public DrawingController(DrawingService drawingService) {
        this.drawingService = drawingService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DrawingSummaryDto>>> getUserDrawings(
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        List<DrawingSummaryDto> drawings = drawingService.getUserDrawings(currentUser);
        return ResponseEntity.ok(ApiResponse.ok(drawings));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DrawingDto>> saveDrawing(
            @Valid @RequestBody DrawingDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DrawingDto saved = drawingService.saveDrawing(dto, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Drawing saved successfully", saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DrawingDto>> getDrawing(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DrawingDto drawing = drawingService.getDrawingById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok(drawing));
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<ApiResponse<DrawingDto>> getPublicDrawing(
            @PathVariable String id
    ) {
        DrawingDto drawing = drawingService.getDrawingById(id, null);
        return ResponseEntity.ok(ApiResponse.ok(drawing));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DrawingDto>> updateDrawing(
            @PathVariable String id,
            @Valid @RequestBody DrawingDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        DrawingDto updated = drawingService.updateDrawing(id, dto, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Drawing updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDrawing(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        drawingService.deleteDrawing(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Drawing deleted successfully", null));
    }
}
