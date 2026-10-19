package com.excalidraw;

import com.excalidraw.dto.AuthRequest;
import com.excalidraw.dto.AuthResponse;
import com.excalidraw.dto.DrawingDto;
import com.excalidraw.dto.RegisterRequest;
import com.excalidraw.service.AuthService;
import com.excalidraw.service.DrawingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class AuthAndDrawingIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private DrawingService drawingService;

    @Test
    void testRegisterLoginAndDrawingWorkflow() {
        // 1. Register User
        RegisterRequest registerRequest = new RegisterRequest(
                "tester",
                "tester@example.com",
                "secret123",
                "Test User"
        );
        AuthResponse registerResponse = authService.register(registerRequest);

        assertNotNull(registerResponse.getToken());
        assertEquals("tester", registerResponse.getUsername());

        // 2. Login User
        AuthRequest loginRequest = new AuthRequest("tester", "secret123");
        AuthResponse loginResponse = authService.login(loginRequest);

        assertNotNull(loginResponse.getToken());
        assertEquals(registerResponse.getUserId(), loginResponse.getUserId());

        // 3. Save Drawing
        com.excalidraw.security.UserPrincipal principal =
                new com.excalidraw.security.UserPrincipal(
                        loginResponse.getUserId(),
                        loginResponse.getUsername(),
                        loginResponse.getEmail(),
                        loginResponse.getName(),
                        "",
                        java.util.Collections.emptyList()
                );

        DrawingDto drawingDto = DrawingDto.builder()
                .title("System Architecture Diagram")
                .elementsJson("[{\"id\":\"1\",\"type\":\"rectangle\",\"x\":100,\"y\":100,\"width\":200,\"height\":150}]")
                .appStateJson("{\"zoom\":1,\"scrollX\":0,\"scrollY\":0}")
                .thumbnail("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")
                .isPublic(true)
                .build();

        DrawingDto savedDrawing = drawingService.saveDrawing(drawingDto, principal);

        assertNotNull(savedDrawing.getId());
        assertEquals("System Architecture Diagram", savedDrawing.getTitle());

        // 4. Retrieve Drawing
        DrawingDto fetched = drawingService.getDrawingById(savedDrawing.getId(), principal);
        assertNotNull(fetched);
        assertEquals(savedDrawing.getId(), fetched.getId());

        // 5. List Drawings
        var userDrawings = drawingService.getUserDrawings(principal);
        assertFalse(userDrawings.isEmpty());
        assertEquals(1, userDrawings.size());

        // 6. Delete Drawing
        drawingService.deleteDrawing(savedDrawing.getId(), principal);
        var afterDelete = drawingService.getUserDrawings(principal);
        assertTrue(afterDelete.isEmpty());
    }
}
